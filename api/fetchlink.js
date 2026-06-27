const exec_mysql = require("../gen_functions/exec_mysql");
const pool = require("../db/pool")
const crypto = require('crypto');

const getLinks = async (req, res) => {
    // sooooo... echoes of wisdom?
    // anyways, fetches some urls the user has created

    // checks if user is signed in
    const id = req.userId
    let offset = parseInt(req.query.offset, 10);
    if (isNaN(offset) || offset < 0) offset = 0;
    // which items to show (0-10, or 10-20?)
    // its an optional param, we just start with no offset

    const linkQuery = await exec_mysql.executeQuery(null, `
        SELECT code, text, link, creation_date,
            COUNT(*) OVER() AS total_count
        FROM links
        WHERE user_id = ?
        ORDER BY creation_date DESC
        LIMIT 10 OFFSET ?
    `, [id, offset], pool);

    // Now total is in every row – take it from the first row
    const total = linkQuery.length ? linkQuery[0].total_count : 0;

    res.status(200).json({
        success: true,
        message: "it works!",
        data: {
            links: linkQuery,
            total: total
        }
    })
    return
};

module.exports = { getLinks }
