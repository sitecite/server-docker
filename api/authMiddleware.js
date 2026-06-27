const exec_mysql = require("../gen_functions/exec_mysql");
const pool = require("../db/pool")
const crypto = require('crypto');

/**
 * Checks in the database if a token exists
 * @param {string} token the token you wish to check
 * @param {*} tableName where to check for the token (user_web_tokens or user_ext_tokens?)
 * @returns null or the user_id and result of a token
 */
async function verifyTokenInTable(token, tableName) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = Math.round(Date.now() / 1000);
    const [row] = await exec_mysql.executeQuery(null,
        `SELECT user_id, expire FROM ${tableName} WHERE token = ? AND expire > ?`,
        [tokenHash, now], pool
    );
    return row || null;

}

// authenticte in cases where only cookie token is acceptable
const authenticateCookie = async (req, res, next) => {
    // check if token exists in signed cookie
    const token = req.signedCookies.token
    if (!token) {
        return res.status(400).json({ success: false, message: 'No token provided' })
    }

    const result = await verifyTokenInTable(token, "user_web_tokens")
    if (!result) {
        // no matching tokens found, user is not signed in
        res.status(401).json({
            success: false,
            message: "Invalid/Expired token",
        })
        return
    }

    // parse user_id to next functions
    req.userId = result.user_id
    req.expire = result.expire
    next()
};

// authenticate in cases where only an api token is acceptable
const authenticateToken = async (req, res, next) => {
    // check if token exists in auth header
    if (!req.headers.authorization) {
        return res.status(403).json({
            success: false,
            message: "No credentials sent. (empty authorization headers?)"
        });
        return
    }

    const token = req.headers.authorization.replace("Bearer ", "")
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const result = await verifyTokenInTable(token, "user_ext_tokens")

    if (!result) {
        // no matching tokens found, user is not signed in
        return res.status(401).json({
            success: false,
            message: "Invalid/Expired token",
        })
    }
    // parse user_id to next functions
    req.userId = result.user_id
    req.expire = result.expire
    next()
};

// authenticate in cases where either a cookie or an api token is fine
const authenticateCookieToken = async (req, res, next) => {
    // get token from cookie
    let token = req.signedCookies.token;
    let checkWebFirst = true; // default: cookie came from web

    if (!token && req.headers.authorization) {
        // if there is no token but there is auth header, we need to check auth header first
        token = req.headers.authorization.replace("Bearer ", "");
        checkWebFirst = false; // header came from external
    }

    if (!token) {
        return res.status(400).json({
            success: false,
            message: "No token provided"
        });
    }

    // hash token and fetch date only once
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = Math.round(Date.now() / 1000);

    // determine order
    const tables = checkWebFirst
        ? ['user_web_tokens', 'user_ext_tokens']
        : ['user_ext_tokens', 'user_web_tokens'];

    let result = null;
    for (const table of tables) {
        const [row] = await exec_mysql.executeQuery(null,
            `SELECT user_id, expire FROM ${table} WHERE token = ? AND expire > ?`,
            [tokenHash, now], pool
        );
        if (row) {
            result = row;
            break; // stop as soon valid token is found
        }
    }

    if (!result) {
        return res.status(401).json({
            success: false,
            message: "Invalid/expired token."
        });
    }

    req.userId = result.user_id;
    req.expire = result.expire;
    next();
};
module.exports = { authenticateCookie, authenticateToken, authenticateCookieToken }