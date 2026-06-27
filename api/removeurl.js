const exec_mysql = require("../gen_functions/exec_mysql");
const pool = require("../db/pool")
const crypto = require('crypto');

const removeLink = async (req, res) => {
    // removes a generated url

    // check if a code was provided
    if (!req.body || !req.body.code) {
        res.status(400).json({
            success: false,
            message: "No code provided",
            data: {}
        })
        return
    }

    const id = req.userId
    const code = req.body.code

    const codeSearch = await exec_mysql.executeQuery(null, `SELECT user_id FROM links WHERE code = ?`, [code], pool)
    if (!codeSearch.length || codeSearch[0].user_id != id) {
        // code is invalid (none of that in existance) or it is not made by the author
        res.status(400).json({
            success: false,
            message: "Invalid code provided",
            data: {}
        })
        return
    }

    // remove code with id (also user id check for extra safety)
    await exec_mysql.executeQuery(null, `DELETE FROM links WHERE code = ? AND user_id = ?`, [code, id], pool)

    res.status(200).json({
        success: true,
        message: "Code removed",
        data: {
            code: code
        }
    })
    return
};

module.exports = { removeLink }
