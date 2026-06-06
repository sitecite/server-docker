const exec_mysql = require("../gen_functions/exec_mysql");
const { fontList } = require("../api/fontlist")
const pool = require("../server")
const crypto = require('crypto');

const getStyle = async (req, res) => {
    try {
        req.signedCookies.token || req.headers.authorization.replace("Bearer ", "")
    } catch(e) {
        console.log(e)
        res.status(401).json({
            success: false,
            message: "No token provided via a signed cookie or Authorization header.",
            data: {}
        })
        return
    }
    const token = req.signedCookies.token || req.headers.authorization.replace("Bearer ", "")
    if (!token) {
        res.status(401).json({
            success: false,
            message: "No token provided via a signed cookie or Authorization header.",
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

            UNION ALL

            SELECT user_id 
            FROM user_ext_tokens 
            WHERE token = ? AND expire > ?
        `, [tokenHash, Math.round(Date.now() / 1000), tokenHash, Math.round(Date.now() / 1000)], pool)

    if (!tokenSearch.length) {
        // no matching tokens found, user is not signed in
        // maybe ext token tho?
        res.status(401).json({
            success: false,
            message: "Invalid token. Maybe it expired?",
            data: {}
        })
        return
    }

    const id = tokenSearch[0].user_id

    const style = await exec_mysql.executeQuery(null, `
            SELECT bg_color, color, font
            FROM user_customisation
            WHERE user_id = ?    
        `, [id], pool)
    
    // console.log(style)
    if (!style.length || !style[0].font || !style[0].color || !style[0].bg_color) {
        // default style
        res.status(200).json({
            success: true,
            message: "",
            data: {
                font: "Atkinson Hyperlegible Next",
                color: "000000",
                bg_color: "f6f6f6",
            }
        })
        return
    }

    // custom style
    res.status(200).json({
        success: true,
        message: "",
        data: style[0]
    })
    return
}

const postStyle = async (req, res) => {
    const token = req.signedCookies.token
    if (!token) {
        res.status(401).json({
            success: false,
            message: "No token provided via a signed cookie.",
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
        })
        return
    }

    const id = tokenSearch[0].user_id

    const textColor = req.body.color
    const backgroundColor = req.body.backgroundColor
    const font = req.body.font

    if (!font || !backgroundColor || !textColor) {
        // if any of these unset, request is invalid which means dont process
        res.status(400).json({
            success: false,
            message: "Malformed form data. (one or more fields are missing.)"
        })
        return
    }

    // validate actual values (check if valid hex)
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if(!hexRegex.test(backgroundColor) || !hexRegex.test(textColor)) {
        res.status(400).json({
            success: false,
            message: "Malformed form data. (invalid hex color provided. is the \# included?)"
        })
        return
    }

    // console.log(fontList)
    if(!fontList.some(e => e.name == font)) {
        // font does not exist
        res.status(400).json({
            success: false,
            message: "Malformed form data. (invalid font provided; check /api/fontlist for a list.)"
        })
        return
    }

    // add to database if not exists
    await exec_mysql.executeQuery(null, `
        INSERT INTO user_customisation (user_id)
        VALUES (?)
        ON DUPLICATE KEY UPDATE user_id = ?`, [id, id], pool)

    await exec_mysql.executeQuery(null, `
        UPDATE user_customisation
        SET bg_color = ?, color = ?, font = ?
        WHERE user_id = ?
    `, [backgroundColor.replace("#", ""), textColor.replace("#", ""), font, id], pool)


    // custom style
    res.status(200).json({
        success: true,
        message: "wow you did it!!!",
        data: id
    })
    return
}

module.exports = { getStyle, postStyle }