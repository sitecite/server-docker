const exec_mysql = require("../gen_functions/exec_mysql");
const pool = require("../db/pool")
const crypto = require('crypto');
const permittedAccounts = require("../whitelist");
const fs = require('fs');
const yaml = require("yaml");
const logger = require("../gen_functions/logger")
require('dotenv').config({ quiet: true})

const yamlConfig = yaml.parse(fs.readFileSync("./config.yaml", 'utf8'));
const whitelist = yamlConfig.whitelist

const oAuthDiscord = async (req, res) => {
    // first, fetch .env variables
    // this is to check if credentials are filled and can be used to decide whether or not this endpoint is enabled

    const clientId = process.env.DISCORD_ID
    const clientSecret = process.env.DISCORD_SECRET
    const redirectUrl = process.env.DISCORD_URL
    const authUrl = process.env.DISCORD_AUTH_URL

    if (
        !clientId
        && !clientSecret
        && !redirectUrl
        && !authUrl
    ) {
        // signing in with discord is disabled
        res.status(401).json({
            success: false,
            message: "Signing in with Discord is disabled."
        })   
        return
    }

    // check if discord appended ?error= as a url param
    // if this is the case, most likely the user pressed "cancel"
    const discordError = req.query["error"]
    if(discordError) {
        // we should redirect the user to the homepage when cancel is pressed
        res.status(303).redirect("../")
        return
    }

    // when doing oauth, discord appends ?code= as a url param, but only when it is complete
    // if this hasn't been appended, this means that the user needs to be redirected to discord
    const code = req.query["code"]
    if (!code) {
        res.status(303).redirect(authUrl)
        return
    }

    // if there is a code though, we need to send a response to discord to get some data back
    const form_data = new URLSearchParams()
    form_data.append('grant_type', 'authorization_code');
    form_data.append('code', encodeURI(code));
    form_data.append('redirect_uri', encodeURI(redirectUrl));

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // fetch a token from discord
    oauthdata = await fetch(`https://discord.com/api/oauth2/token`, {
        method: "POST",
        body: form_data,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "Authorization": `Basic ${credentials}`
        }
    })

    // check if everything went alright
    if (oauthdata.ok == false) {
        logger.error("[DISCORD OAUTH2] An error occured during Discord OAuth 2:", await oauthdata, req)
        res.status(500).json({ success: false, message: "Something went wrong during OAuth2." })
        return
    }

    // convert to json so we can use it
    oauthdatajson = await oauthdata.json()
    const accessToken = oauthdatajson.access_token

    // okay, we got the token, now we can use this to fetch info about the user at the @me endpoint
    const userReq = await fetch(`https://discord.com/api/users/@me`, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${accessToken}`
        }

    })

    // something has gone wrong?
    if (userReq.ok == false) {
        logger.error("[DISCORD OAUTH2] Something went wrong retrieving user data", await userReq, req)
        res.status(500).json({ success: false, message: "Something went wrong while retrieving your data." })
        return
    }

    // convert to json
    const userFull = await userReq.json()

    // check if user is on whitelist using the config file
    if (whitelist === true) {
        if (!permittedAccounts.discord.includes(userFull.id)) {
            // if the whitelist doesn't include the id by the user, we should send a basic html page
            // on top of that, we should include it in the console
            res.status(403).send(`
                <h1>Your account is not whitelisted! Please contact the webmaster if you believe this to be a mistake!</h1>
                <p>Discord ID: ${userFull.id}</p>
            `);
            logger.log("[WHITELIST] User tried to sign up/log in, but is not whitelisted. Discord ID:", userFull.id)
            return
        }
    }

    // create account if it does not exist
    await exec_mysql.executeQuery(null, `
			INSERT INTO users (discord_id, creation_date)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE discord_id = ?;
		`, [userFull.id, Math.round(Date.now() / 1000), userFull.id], pool)

    // get the user id of the account that was just created (or not)
    const user = await exec_mysql.executeQuery(null, `
            SELECT id FROM users WHERE discord_id = ?    
        `, [userFull.id], pool)

    // set expiration date for cookie
    const cookieExpire = Math.round(Date.now() / 1000)+3600
    // now + 1 hour 

    // generate random string to function as a token
    const randomString = crypto.randomBytes(32).toString('hex').slice(0, 32);
    
    // hash this token. it's a bit overkill, but if the database is breached, no accounts should be compromised.
    // the attacker only has one hour maximum though, seeing as they expire so quickly
    const randomStringHash = crypto.createHash('sha256').update(randomString).digest('hex')
    // store said token
    await exec_mysql.executeQuery(null, `
            INSERT INTO user_web_tokens (user_id, token, expire)
            VALUES (?, ?, ?)
    `, [user[0].id, randomStringHash, cookieExpire], pool)

    // send the cookie to the user
    res.cookie("token", randomString, {
        signed: true,
        httpOnly: true,
        maxAge: 60 * 60 * 1000
        // 1 hour
    });

    logger.log("[ACCOUNT] User signed in using Discord. IP:", req.ip, "Account ID:", user[0].id)

    // redirect to homepage
    res.status(303).redirect("../")
    return
}
module.exports = oAuthDiscord;
