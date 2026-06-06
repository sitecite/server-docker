const exec_mysql = require("../gen_functions/exec_mysql");
const { fontList } = require("../api/fontlist")
const pool = require("../server")
const crypto = require('crypto');

const createToken = async (req, res) => {
    const token = req.signedCookies.token
    if (!token) {
        res.status(400).json({
            success: false,
            message: "No token provided via a signed cookie.",
            data: {}
        })
        return
    }

    // only hashes stored so we need to look for hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const tokenSearch = await exec_mysql.executeQuery(null, `
            SELECT user_id
            FROM user_web_tokens
            WHERE token = ? AND expire > ?
        `, [tokenHash, Math.round(Date.now() / 1000)], pool)

    if (!tokenSearch.length) {
        // no matching tokens found, user is not signed in
        res.status(401).json({
            success: false,
            message: "Invalid token. Maybe it expired?",
            data: {}
        })
        return
    }

    const id = tokenSearch[0].user_id

    const tokenExpire = Math.round(Date.now() / 1000) + 7_776_000
    // now + 3 months
    // 3 months = 90 days = 2160 hours = 129 600 minutes = 7 776 000 seconds
    // 3 * 30 * 24 * 60 * 60 * 60

    // generate new token string
    const randomString = crypto.randomBytes(32).toString('hex').slice(0, 32);
    const randomStringHash = crypto.createHash('sha256').update(randomString).digest('hex')
    await exec_mysql.executeQuery(null, `
            INSERT INTO user_ext_tokens (user_id, token, expire)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                token = VALUES(token),
                expire = VALUES(expire);
    `, [id, randomStringHash, tokenExpire], pool)

    res.status(200).json({
        success: true,
        message: "working!",
        data: {
            token: randomString
        }
    })
}

const validateToken = async (req, res) => {
    if (!req.headers.authorization) {
        return res.status(403).json({ 
            success: false, 
            message: "No credentials sent. (empty authorization headers?)" 
        });
        return
    }

    const token = req.headers.authorization.replace("Bearer ", "")

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const tokenSearch = await exec_mysql.executeQuery(null, `
            SELECT user_id, expire 
            FROM user_ext_tokens
            WHERE token = ? AND expire > ?
        `, [tokenHash, Math.round(Date.now() / 1000)], pool)

    if (!tokenSearch.length) {
        // no matching tokens found, user is not signed in
        res.status(401).json({
            success: false,
            message: "Invalid token. Maybe it expired?",
            data: {}
        })
        return
    }
    res.status(200).json({
        success: true,
        message: "Signed in.",
        data: {
            id: tokenSearch[0].user_id,
            expire: tokenSearch[0].expire
        }
    })
}

module.exports = { createToken, validateToken }