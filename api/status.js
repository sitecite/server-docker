const exec_mysql = require("../gen_functions/exec_mysql");
const pool = require("../server")
const crypto = require('crypto');

const getStatus = async (req, res) => {
    // check if a user is signed in or not
    const token = req.signedCookies.token
    if (!token) {
        res.status(401).json({
            success: false,
            message: "No token provided via a signed cookie.",
            data: {}
        })
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
    return
};

module.exports = getStatus