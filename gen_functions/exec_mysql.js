const mysql = require("mysql2/promise")
const logger = require("../gen_functions/logger")
require('dotenv').config({ quiet: true})

module.exports = {
    /**
     * Executes a MySQL query and returns the results.
     * @param {object} connection The connection variable, provided by the pool. If connection is `false` or `null`, a new connection will be obtained from the pool.
     * @param {string} query The MySQL query you'd like to execute.
     * @param {Array|object} params The parameters for the query (can be array for positional params or object for named params).
     * @param {object} pool The MySQL pool. Required if `connection` is `false`/`null`.
     * @returns {Promise<object>} The results of the query.
     */
    executeQuery(connection, query, params = [], pool = null) {
        return new Promise(async (resolve, reject) => {
            const startTime = Date.now();
            let shouldReleaseConnection = false;
            let conn = connection;

            try {
                if (!conn) {
                    if (!pool) {
                        throw new Error('Pool is required when no connection is provided');
                    }

                    conn = await pool.getConnection();

                    if (!conn) {
                        throw new Error('Failed to get connection from pool');
                    }

                    shouldReleaseConnection = true;
                }

                // Use query() instead of execute() to avoid potential issues
                const [results] = await conn.query(query, params);

                const duration = Date.now() - startTime;
                if (duration > 1000) {
                    logger.warn(`Slow query (${duration}ms): ${query.substring(0, 100)}...`);
                }

                resolve(results)
                return results;

            } catch (error) {
                logger.error("Query failed:", error)
                reject(error)
                throw error;

            } finally {
                if (shouldReleaseConnection && conn && typeof conn.release === 'function') {
                    try {
                        conn.release();
                    } catch (releaseError) {
                        logger.error('Error releasing connection:', releaseError);
                    }
                }
                resolve(true)
            }
        })
    },

    /**
     * Creates a new pool. This should only really be used just once.
     * @returns {Pool} Returns a MySQL2 Pool object. Used to execute queries
     */
    async newPool() {
        return mysql.createPool({
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
        });
    }
}
