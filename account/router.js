const express = require('express');
const exec_mysql = require("../gen_functions/exec_mysql");
const pool = require("../db/pool")
const crypto = require("crypto")
const router = express.Router();

// sign out user
const logOut = require("./logout")
router.get("/logout", logOut)


// check if already signed in
router.use(async (req, res, next) => {
    // does user have token cookie? if not, they need to sign in!
    const token = req.signedCookies.token
    if (!token) {
        next()
        return
    }

    // only hashes stored so we need to look for hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const tokenSearch = await exec_mysql.executeQuery(null, `
            SELECT user_id, expire 
            FROM user_web_tokens
            WHERE token = ? AND expire > ?
        `, [tokenHash, Math.round(Date.now() / 1000)], pool)

    if (!tokenSearch.length) {
        // no matching tokens found, user is not signed in
        next()
        return

    }
    // user is signed in, just send straight to homepage
    res.status(303).redirect("../")
    return

})


const oAuthDiscord = require("./discord")
router.get("/discord", oAuthDiscord)

const oAuthGoogle = require("./google")
router.get("/google", oAuthGoogle)

const { signIn, signUp }= require("./login")
router.post("/signin", signIn)
router.post("/signup", signUp)



module.exports = router;
