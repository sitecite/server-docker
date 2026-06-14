const express = require('express');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const fetch = require("node-fetch");
const mysql = require("mysql2/promise");
const { styleText } = require('node:util');
const fs = require('fs');
const refresh = require("./gen_functions/refresh")
const crypto = require('crypto');
const yaml = require("yaml")

const dbSetup = require("./db-setup.cjs")

const app = express();
const http = require('http').createServer(app);


require('dotenv').config()

async function refreshSimple() {
    await pool
    refresh.tokenRefresh(pool)
}
// run once at server start; otherwise it takes 15 mins and thats boring
// refreshSimple()
// Run the refresh code every 15 mins (delete old tokens; cleans up database)
setInterval(async function () {
    refreshSimple()
}, 60_000 * 15)
// repeat every 15 minutes

async function main() {
    // init everything, in order

    // set up database first
    await dbSetup.setup()

    console.log(styleText("green", `Connected to MySQL database at ${process.env.MYSQL_HOST}:${process.env.MYSQL_PORT} as ${process.env.MYSQL_USER}`))

    // various endpoints
    // secret cookies yum
    if(process.env.COOKIE_SECRET) {
        // use a preset cookie secret if there is one
        app.use(cookieParser(process.env.COOKIE_SECRET));
    } else {
        // no preset cookie
        // generate a random string as a secret
        const randomString = crypto.randomBytes(32).toString('hex').slice(0, 32);
        const randomStringHash = crypto.createHash('sha256').update(randomString).digest('hex')
        app.use(cookieParser(randomStringHash));
    }

    // public directory
    app.use(express.static(__dirname + '/public', { extensions: ['html'] }));
    app.use(express.json()); // Parse JSON request bodies

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/public/index.html');
    });

    // fonts
    app.use('/fonts', function (req, res, next) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader("Access-Control-Allow-Headers", "*");
        next()
    });
    app.use("/fonts", express.static(__dirname + '/fonts'));
    app.use(express.json()); // Parse JSON request bodies

    const limiter = rateLimit({
        windowMs: 6000,
        limit: 10,
        handler: (req, res) => {
            res.status(429).json({ success: false, message: "You have been rate limited" });
            console.warn("User got ratelimited.")
            return
            // throw new Error("You have been rate limited!")
        },
        legacyHeaders: false,
        standardHeaders: true,
    });

    // Defining limits for each endpoint
    app.use(limiter)
    // app.use("/account", limiter)

    //* Directory routers
    const accountManager = require('./account/router.js');
    app.use('/account/', accountManager);

    const apiManager = require('./api/router.js');
    app.use('/api/', apiManager);

    const linkManager = require('./link/router.js');
    app.use('/l/', linkManager);

    //* Middleware 

    // 404 page
    app.use((req, res, next) => {
        res.status(404).sendFile(__dirname + "/public/404.html")
    });

    // Error handling
    const errorHandler = require('./errorHandler');
    app.use(errorHandler);

    const yamlConfig = await fs.readFileSync("./config.yaml", 'utf8')
    const port = yaml.parse(yamlConfig).port

    http.listen(port, async () => {
        console.log("\n" + styleText("bgGreen", `Server is listening on port ${port}`));
    });
}

// if program exits, run this
// its nicer if i actually properly close connection
process.on("exit", function () {
    pool.end((err) => {
        if (err) console.error('Error closing pool:', err)
    })
    console.log("Connection to database closed")
    console.log("\n" + styleText("bgRed", "Webserver terminated") + "\n")
});

// catching signals and do something before exit
['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
    'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
].forEach(function (sig) {
    process.on(sig, function () {
        terminator(sig);
        console.log('signal: ' + sig);
    });
});

function terminator(sig) {
    if (typeof sig === "string") {
        // if any async functions need to be done, they can be done here
        // if not, call clean exit
        console.log('\n' + styleText('red', `Received ${sig} - terminating webserver`) + "\n");
        process.exit(1);
    }
}

// create new mysql pool for connections
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

main()
