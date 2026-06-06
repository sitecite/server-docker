const exec_mysql = require('./exec_mysql');

/**
 * Removes old tokens from the token database
 * @returns 
 */
function tokenRefresh(pool) {
    // delete all expired tokens
    return new Promise(async (resolve, reject) => {
        await exec_mysql.executeQuery(null, `
             DELETE FROM user_web_tokens
             WHERE expire < ? 
        `, [Math.round(Date.now() / 1000)], pool)

        await exec_mysql.executeQuery(null, `
             DELETE FROM user_ext_tokens
             WHERE expire < ? 
        `, [Math.round(Date.now() / 1000)], pool)
        resolve(true)
    })
}

module.exports = { tokenRefresh }
