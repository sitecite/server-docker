const express = require('express');
const exec_mysql = require('../gen_functions/exec_mysql');
const crypto = require("crypto")
const pool = require("../db/pool");
const logger = require("../gen_functions/logger")

function randomAlphanumeric(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, chars.length);
        result += chars[randomIndex];
    }
    return result;
}

async function shortenUrl(req, res) {
    const id = req.userId

    if (!req.body || !req.body.link || !req.body.text) {
        res.status(400).json({
            success: false,
            message: "Malformed request. (no link or text?)",
        })
        return
    }

    const link = req.body.link.slice(0,512)
    const text = req.body.text.slice(0,1028)
    
    var randomString = randomAlphanumeric(5).toLowerCase()
    // leaving in the possibility for eventually maybe adding uppercase
    const stringSearch = await exec_mysql.executeQuery(null, "SELECT code FROM links WHERE code = ?", [randomString], pool)
    if(stringSearch.length) {
        // somehow we created a duplicate!
        logger.warn("Duplicate key generated. It's your lucky day if you ever see this appear!")
        randomString = randomAlphanumeric(8).toLowerCase()
    }

    exec_mysql.executeQuery(null, `
        INSERT INTO links (user_id, code, text, link, creation_date)
        VALUES (?, ?, ?, ?, ?)
    `, [id, randomString, text, link, Math.round(Date.now() / 1000)], pool)

    logger.log("[LINK] Link created. IP:", req.ip, "User ID:", id, "Link ID:", randomString)

    res.status(200).json({
        success: true,
        message: "een ring om allen te regeren",
        data: {
            code: randomString
        }
    })
    return
}

module.exports = { shortenUrl }
