const exec_mysql = require("../gen_functions/exec_mysql");
const pool = require("../db/pool")
const crypto = require('crypto');

const getStatus = async (req, res) => {
    // check if a user is signed in or not
    res.status(200).json({
        success: true,
        message: "Signed in.",
        data: {
            id: req.userId,
            expire: req.expire
        }
    })
    return
};

module.exports = getStatus