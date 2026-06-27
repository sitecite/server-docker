const express = require('express');
const exec_mysql = require('../gen_functions/exec_mysql');
const crypto = require("crypto")
const pool = require("../db/pool");

const router = express.Router();

const { redirectUser } = require("./redirect")
router.get('/:code', redirectUser);

module.exports = router;
