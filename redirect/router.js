const express = require('express');
const exec_mysql = require('../gen_functions/exec_mysql');
const crypto = require("crypto")
const pool = require("../db/pool");

const router = express.Router();

// discord invite
router.get('/discord', function (req, res) {
    res.status(301).redirect("https://discord.gg/rPBE2B7dng")
}) 

// firefox extension
router.get('/firefox', function (req, res) {
    res.status(301).redirect("https://addons.mozilla.org/en-GB/firefox/addon/sitecite/")
}) 

// chrome extension
router.get('/chrome', function (req, res) {
    res.status(301).redirect("https://chromewebstore.google.com/detail/sitecite/nhadodoajmnpakkgidheifkfibphlghm")
}) 


module.exports = router
