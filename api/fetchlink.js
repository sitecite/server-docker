const exec_mysql = require("../gen_functions/exec_mysql");
const pool = require("../server")
const crypto = require('crypto');

const getLinks = async (req, res) => {
    // sooooo... echoes of wisdom?
    // anyways, fetches some urls the user has created

    // checks if user is signed in

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

    const id = tokenSearch[0].user_id
    const offset = Number(req.query.offset) || 0
    // which items to show (0-10, or 10-20?)
    // its an optional param, we just start with no offset

    const linkQuery = await exec_mysql.executeQuery(null, 
        `SELECT code, text, link, creation_date FROM links
        WHERE user_id = ?
        ORDER BY creation_date DESC
        LIMIT 10 OFFSET ?
        `, [id, offset], pool)

    const linkCountQuery = await exec_mysql.executeQuery(null, `SELECT COUNT(code) AS link_count FROM links WHERE user_id = ?`, [id], pool)

    res.status(200).json({
        success: true,
        message: "it works!",
        data: {
            links: linkQuery,
            total: linkCountQuery[0].link_count
        }
    })
    return
};

module.exports = { getLinks }
