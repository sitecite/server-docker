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

const oAuthGoogle = async (req, res) => {
    if (
        !process.env.GOOGLE_ID
        && !process.env.GOOGLE_SECRET
        && !process.env.GOOGLE_URL
    ) {
        // signing in with google is disabled
        res.status(401).json({
            success: false,
            message: "Signing in with Google is disabled."
        })
        return
    }

    const clientId = process.env.GOOGLE_ID
    const clientSecret = process.env.GOOGLE_SECRET
    const redirectUrl = process.env.GOOGLE_URL

    const googleError = req.query["error"]
    if (googleError) {
        // something went wrong; could be that the user cancelled the request
        // we should redirect them home
        res.status(303).redirect("../")
        return
    }

    const code = req.query["code"]
    if (!code) {
        res.status(303)
            .redirect(`https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=${encodeURI(clientId)}&scope=openid&redirect_uri=${encodeURI(redirectUrl)}`)
        return
    }

    const form_data = new URLSearchParams()

    form_data.append('grant_type', 'authorization_code');
    form_data.append('code', encodeURI(code));
    form_data.append('redirect_uri', encodeURI(redirectUrl));

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    oauthdata = await fetch(`https://oauth2.googleapis.com/token`, {
        method: "POST",
        body: form_data,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "Authorization": `Basic ${credentials}`
        }
    })

    if (oauthdata.ok == false) {
        logger.error("[GOOGLE OAUTH2] Could not fetch token", await oauthdata, req)
        res.status(500).json({ success: false, message: "Something went wrong during OAuth2." })
        return
    }

    oauthdatajson = await oauthdata.json()

    const accessToken = oauthdatajson.access_token

    const userReq = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json`, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${accessToken}`
        }

    })

    if (userReq.ok == false) {
        logger.error("[GOOGLE OAUTH2] Could not fetch user profile", await userReq, req)
        res.status(500).json({ success: false, message: "Something went wrong while retrieving your data." })
        return
    }


    const userFull = await userReq.json()

    // check if user is on whitelist
    if (whitelist === true) {
        if (!permittedAccounts.google.includes(userFull.id)) {
            // block unwanted accounts from signing up
            res.status(403).send(`
                <h1>Your account is not whitelisted! Please contact the webmaster if you believe this to be a mistake!</h1>
                <p>Google ID: ${userFull.id}</p>
            `);

            logger.log("[WHITELIST] User tried to sign up/log in with Google, but is not whitelisted. User ID:", userFull.id)
            return
        }
    }

    await exec_mysql.executeQuery(null, `
			INSERT INTO users (google_id, creation_date)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE google_id = ?;
		`, [userFull.id, Math.round(Date.now() / 1000), userFull.id], pool)

    const user = await exec_mysql.executeQuery(null, `
            SELECT id FROM users WHERE google_id = ?    
        `, [userFull.id], pool)

    const cookieExpire = Math.round(Date.now() / 1000) + 3600
    // now + 1 hour 

    const randomString = crypto.randomBytes(32).toString('hex').slice(0, 32);
    const randomStringHash = crypto.createHash('sha256').update(randomString).digest('hex')
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

    logger.log("[ACCOUNT] User signed in using Google. IP:", req.ip, "Account ID:", user[0].id)

    res.status(303).redirect("../")
    return
}
module.exports = oAuthGoogle;
