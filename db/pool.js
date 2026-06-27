const mysql = require("mysql2/promise")

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    port: process.env.MYSQL_PORT,
    database: process.env.MYSQL_DATABASE,
    // connectionLimit: 10,
    connectTimeout: 20000,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
})

module.exports = pool