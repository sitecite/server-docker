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

const signIn = async (req, res) => {
    // handle a sign in request

    // fetch the yaml config
    const { username, password } = req.body;
    const yamlConfig = await fs.readFileSync("./config.yaml", 'utf8')

    // check if username accounts are enabled
    const username_accounts = yaml.parse(yamlConfig).username_accounts
    
    if (username_accounts === false) {
        // signing in with username and password is disabled
        res.status(401).json({
            success: false,
            message: "Signing in with username and password is disabled."
        })
        return
    }

    if (!username || !password) {
        res.status(400).json({
            success: false,
            message: "No username and/or password provided.",
            data: {}
        })
        return
    }

    // check if whitelisted
    const whitelist = yaml.parse(yamlConfig).whitelist
    if (whitelist === true) {
        if (!permittedAccounts.general.includes(username)) {
            // block unwanted accounts from signing up
            res.status(403).json({
                success: false,
                message: "Your account is not whitelisted! Contact the webmaster if you believe this to be a mistake."
            })

            logger.log("[WHITELIST] User tried to sign up/sign in with username, but is not whitelisted. Username:", username)
            return
        }
    }
    // hash and salt!
    const passwordSalt = password + username
    const passwordHash = crypto.createHash('sha256').update(passwordSalt).digest('hex').slice(0, 128)

    // try and see if username and password exists
    const user = await exec_mysql.executeQuery(null, `
            SELECT id FROM users WHERE username = ? AND password = ?   
        `, [username, passwordHash], pool)

    // it does not if the return array is 0 long
    if(!user.length) {
        res.status(401).json({
            success: false,
            message: "Invalid username or password.",
            data: {}
        })
        return
    }

    // create token
    const cookieExpire = Math.round(Date.now() / 1000) + 3600
    // now + 1 hour 
    const randomString = crypto.randomBytes(32).toString('hex').slice(0, 32);
    const randomStringHash = crypto.createHash('sha256').update(randomString).digest('hex')
    // store token
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

    logger.log("[ACCOUNT] User signed in using username. IP:", req.ip, "Account ID:", user[0].id)

    res.status(200).json({
        success: true,
        message: "Signed in!",
    })
    return

}

const signUp = async (req, res) => {
    // handle sign up request
    const { username, password } = req.body;

    const yamlConfig = await fs.readFileSync("./config.yaml", 'utf8')
    const username_accounts = yaml.parse(yamlConfig).username_accounts

    if (username_accounts === false) {
        // signing in with username and password is disabled
        res.status(401).json({
            success: false,
            message: "Signing in with username and password is disabled."
        })
        return
    }

    if (!username || !password) {
        res.status(400).json({
            success: false,
            message: "No username and/or password provided.",
            data: {}
        })
        return
    }

    const usernameRegex = /[^A-z0-9_-]/
    if (usernameRegex.test(username)) {
        // contains unwanted characters
        messageDiv.textContent = "Username can only contain letters A-Z, numbers, _ and -."
        res.status(400).json({
            success: false,
            message: "Username can only contain letters A-Z, numbers, _ and -.",
            data: {}
        })
        return
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,128}$/

    if (!passwordRegex.test(password)) {
        // password is not in strict requirements
        res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters long and must contain one uppercase letter, one lowercase letter, one number and one special character.",
            data: {}
        })
        return
    } 

    // check if whitelisted
    if (whitelist === true) {
        if (!permittedAccounts.general.includes(username)) {
            // block unwanted accounts from signing up
            res.status(403).json({
                success: false,
                message: "Your account is not whitelisted! Contact the webmaster if you believe this to be a mistake."
            })
            logger.log("[WHITELIST] User tried to sign up/sign in with username, but is not whitelisted. Username:", username)
            return
        }
    }

    // check if user already existst
    const userCheck = await exec_mysql.executeQuery(
        null, 
        `SELECT id FROM users WHERE username = ?`, 
        [username],
        pool
    )

    if (userCheck.length) {
        // user already existst!
        res.status(400).json({
            success: false,
            message: "A user with this name already exists.",
            data: {}
        })
        return
    }

    // create actual user in db as everything seems to be fine
    const passwordSalt = password + username
    const passwordHash = crypto.createHash('sha256').update(passwordSalt).digest('hex').slice(0, 128)

    // make sql request
    await exec_mysql.executeQuery(null, `
			INSERT INTO users (username, password, creation_date)
            VALUES (?, ?, ?)
		`, [username, passwordHash, Math.round(Date.now() / 1000)], pool)

    // get user id of newly created account
    const user = await exec_mysql.executeQuery(null, `
            SELECT id FROM users WHERE username = ?    
        `, [username], pool)

    // create token
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

    logger.log("[ACCOUNT] User created an account and signed in using username. IP:", req.ip, "Account ID:", user[0].id)
    
    res.status(200).json({
        success: true,
        message: "signed in!",
    })
    return
}

module.exports = { signIn, signUp }
