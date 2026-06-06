const exec_mysql = require("../gen_functions/exec_mysql");
const pool = require("../server")
const crypto = require('crypto');
const permittedAccounts = require("../whitelist");
const fs = require('fs');
const yaml = require("yaml");
require('dotenv').config()

const oAuthDiscord = async (req, res) => {
    if (
        !process.env.DISCORD_ID
        && !process.env.DISCORD_SECRET
        && !process.env.DISCORD_URL
        && !process.env.DISCORD_AUTH_URL
    ) {
        // signing in with discord is disabled
        res.status(401).json({
            success: false,
            message: "Signing in with Discord is disabled."
        })   
        return
    }
    
    const clientId = process.env.DISCORD_ID
    const clientSecret = process.env.DISCORD_SECRET
    const redirectUrl = process.env.DISCORD_URL
    const authUrl = process.env.DISCORD_AUTH_URL

    const code = req.query["code"]
    if (!code) {
        res.status(303)
            // .json({ success: true, message: "Signing in. See redirect."})
            // .redirect(`https://discord.com/oauth2/authorize?response_type=code&client_id=${client_id}&scope=identify&state=123456&redirect_uri=${redirect_url}&prompt=consent`)
            .redirect(authUrl)
        return
    }

    const form_data = new URLSearchParams()
   
    form_data.append('grant_type', 'authorization_code');
    form_data.append('code', encodeURI(code));
    form_data.append('redirect_uri', encodeURI(redirectUrl));

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    oauthdata = await fetch(`https://discord.com/api/oauth2/token`, {
        method: "POST",
        body: form_data,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "Authorization": `Basic ${credentials}`
        }
    })

    if (oauthdata.ok == false) {
        console.error(await oauthdata)
        res.status(500).json({ success: false, message: "Something went wrong during OAuth2." })
        return
    }

    oauthdatajson = await oauthdata.json()

    const accessToken = oauthdatajson.access_token

    const userReq = await fetch(`https://discord.com/api/users/@me`, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${accessToken}`
        }

    })

    if (userReq.ok == false) {
        console.error(await userReq)
        res.status(500).json({ success: false, message: "Something went wrong while retrieving your data." })
        return
    }


    const userFull = await userReq.json()

    // check if user is on whitelist

    const yamlConfig = await fs.readFileSync("./config.yaml", 'utf8')
    const whitelist = yaml.parse(yamlConfig).whitelist
    if (whitelist === true) {
        if (!permittedAccounts.discord.includes(userFull.id)) {
            // block unwanted accounts from signing up
            res.status(403).send(`
                <h1>Your account is not whitelisted! Please contact the webmaster if you believe this to be a mistake!</h1>
                <p>Discord ID: ${userFull.id}</p>
            `);
            console.log("User tried to sign up with Discord, but is not whitelisted! User ID:", userFull.id)
            return
        }
    }

    await exec_mysql.executeQuery(null, `
			INSERT INTO users (discord_id, creation_date)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE discord_id = ?;
		`, [userFull.id, Math.round(Date.now() / 1000), userFull.id], pool)

    const user = await exec_mysql.executeQuery(null, `
            SELECT id FROM users WHERE discord_id = ?    
        `, [userFull.id], pool)

    const cookieExpire = Math.round(Date.now() / 1000)+3600
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

    res.status(303).redirect("../")
    return
}
module.exports = oAuthDiscord;
