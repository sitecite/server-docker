const express = require('express');
const exec_mysql = require('../gen_functions/exec_mysql');
const crypto = require("crypto")
const pool = require("../db/pool");

const router = express.Router();

const { authenticateCookie, authenticateToken, authenticateCookieToken } = require("./authMiddleware")

router.use('/hello', function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader("Access-Control-Allow-Headers", "*");
    next()
});
const { getHello } = require("./hello")
router.get('/hello', getHello);

const getStatus = require("./status")
router.get('/status', authenticateCookie, getStatus);

// allow cors request but only for GET
router.use('/style', function (req, res, next) {
    if (req.method === "GET" || req.method === "OPTIONS") {
        // an options request might be sent by the browser to check if everything is okay?
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader("Access-Control-Allow-Headers", "*, Authorization");
    }
    next();

});
const { getStyle, postStyle} = require("./style")
router.get('/style', authenticateCookieToken, getStyle);
router.post('/style', authenticateCookie, postStyle);

router.use('/image', function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader("Access-Control-Allow-Headers", "*, Authorization");
    next()
});
const { createImage, createImageFromText } = require("./image")
router.get('/image/:code', createImage);
router.post('/image', authenticateToken, createImageFromText);

router.use('/fontlist', function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader("Access-Control-Allow-Headers", "*");
    next()
});
const { getFonts }  = require("./fontlist")
router.get('/fontlist', getFonts);

// test.js
router.use('/test', function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader("Access-Control-Allow-Headers", "*");
    next()
});

router.get('/test', (req, res) => {
    // endpoint ios d
    res.status(299).json({
        message: "Endpoint deprecated - avoid usage.",
        success: true,
        data: {
            newUrl: "/api/hello"
        }
    })
});

// get recently generated urls
const { getLinks }  = require("./fetchlink")
router.get('/getlinks', authenticateCookie, getLinks);

// remove a specific url
const { removeLink }  = require("./removeurl")
router.post('/removeurl', authenticateCookie, removeLink);

// allow cors requests since theyre from the extension
router.use('/token', function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader("Access-Control-Allow-Headers", "Authorization, *");
    next()
});
const { createToken, validateToken } = require("./token")
router.post("/token/create", authenticateCookie, createToken)
router.get("/token/validate", authenticateToken, validateToken)

router.use('/shorten', function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader("Access-Control-Allow-Headers", "Authorization, *");
    next()
});
const { shortenUrl } = require("./shorten")
router.post("/shorten", authenticateToken, shortenUrl)

module.exports = router;
