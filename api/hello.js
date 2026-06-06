const fs = require('fs');
const yaml = require('yaml');

require('dotenv').config()

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

    const yamlConfig = await fs.readFileSync("./config.yaml", 'utf8')
    const username_accounts = yaml.parse(yamlConfig).username_accounts

    const helloJSON = {
        google: false,
        discord: discordEnabled,
        username: username_accounts
    }

    res.status(200).json({
        success: true,
        message: "hii! :3",
        data: helloJSON
    })
    return
};

module.exports = { getHello }