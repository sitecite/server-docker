const fs = require('fs');
const yaml = require('yaml');
const logger = require("../gen_functions/logger")

require('dotenv').config()

const CONFIG = yaml.parse(fs.readFileSync("./config.yaml", 'utf8'));

const getHello = async (req, res) => {
    var discordEnabled = false
    if (
        process.env.DISCORD_ID 
        && process.env.DISCORD_SECRET
        && process.env.DISCORD_URL
        && process.env.DISCORD_AUTH_URL
    ) {
        discordEnabled = true
    }

    var googleEnabled = false
    if (
        process.env.GOOGLE_ID 
        && process.env.GOOGLE_SECRET
        && process.env.GOOGLE_URL
    ) {
        googleEnabled = true
    }

    const helloJSON = {
        google: googleEnabled,
        discord: discordEnabled,
        username: CONFIG.username_accounts
    }

    res.status(200).json({
        success: true,
        message: "hii! :3",
        data: helloJSON
    })
    return
};

module.exports = { getHello }
