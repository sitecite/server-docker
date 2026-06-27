const express = require('express');
const exec_mysql = require('../gen_functions/exec_mysql');
const crypto = require("crypto")
const pool = require("../db/pool");
const path = require('path');
const fs = require('fs');
const yaml = require('yaml');
const logger = require("../gen_functions/logger")
const he = require("he")
require('dotenv').config({ quiet: true })

const LINK_TEMPLATE = fs.readFileSync(path.join(process.cwd(), '/link/link.html'), 'utf8');
const NOT_FOUND_TEMPLATE = fs.readFileSync(path.join(process.cwd(), '/public/404.html'), 'utf8');
const CONFIG = yaml.parse(fs.readFileSync("./config.yaml", 'utf8'));
const SITECITE_HOST = CONFIG.host;

async function redirectUser(req, res) {
    const code = req.params.code

    if (!code || code.length < 5 || code.length > 8) {
        return res.status(404).set('Content-Type', 'text/html').send(NOT_FOUND_TEMPLATE);
    }

    const [linkReq] = await exec_mysql.executeQuery(null, `
        SELECT l.user_id, l.link, l.text, uc.bg_color
        FROM links l
        LEFT JOIN user_customisation uc ON l.user_id = uc.user_id
        WHERE l.code = ?
    `, [code], pool)

    if (!linkReq) {
        return res.status(404).set('Content-Type', 'text/html').send(NOT_FOUND_TEMPLATE);
    }

    const targetURL = linkReq.link
    const targetHost = new URL(targetURL).hostname

    let content = LINK_TEMPLATE
    content = content.replace(/\{code\}/g, code);
    content = content.replace(/\{baseUrl\}/g, SITECITE_HOST);
    content = content.replace(/\{url\}/g, he.encode(targetURL));
    content = content.replace(/\{host\}/g, targetHost);
    content = content.replace(/\{text\}/g, he.encode(linkReq.text));
    content = content.replace(/\{background\}/g, "#" + linkReq.bg_color);

    if (process.env.ABUSE_CH_KEY.length > 5) {
        // clearly there's a valid urlhaus key
        try {
            // try and see if we can screen it
            const data = new URLSearchParams();
            data.append('url', targetURL);

            const urlHausReq = await fetch("https://urlhaus-api.abuse.ch/v1/url/", {
                method: "post",
                headers: {
                    "Auth-Key": process.env.ABUSE_CH_KEY,
                },
                body: data,
                signal: AbortSignal.timeout(2000)
            })

            const urlHaus = await urlHausReq.json()

            if (urlHaus.query_status !== "no_results") {
                // oh god! results for a possible threat!!!!
                content = content.replace(/\{refresh\}/g, `<script>document.documentElement.style.setProperty('--background', "#e33d3d"); document.documentElement.style.setProperty('--color', "#fff");</script>`);
                // change background color to something scary
                content = content.replace(/\{titleText\}/g, "WARNING! Possible malicious site ahead!");
                content = content.replace(/\{description\}/g, "The following URL: " + he.encode(targetURL) + ", has been marked as dangerous by <a href='https://urlhaus.abuse.ch/' target='_blank' rel='noopener noreferrer'>URLhaus</a>. Visiting this site could bring harm to you or your computer.");
                content = content.replace(/\{linkText\}/g, "Accept the potential risk and continue.");
            }
        } catch (e) {
            logger.error("Could not check URLHaus!", e)
        }
    }

    // apparently its all fun and games!
    content = content.replace(/\{refresh\}/g, `<meta http-equiv='Refresh' content='0; url=${he.encode(targetURL)}' />`);
    content = content.replace(/\{titleText\}/g, "Redirecting!");
    content = content.replace(/\{description\}/g, "Not working?");
    content = content.replace(/\{linkText\}/g, "Click here to redirect manually.");

    res.setHeader('Content-Type', 'text/html');
    res.send(content);
}

module.exports = { redirectUser }