const express = require('express');
const exec_mysql = require('../gen_functions/exec_mysql');
const crypto = require("crypto")
const pool = require('../server');
const path = require('path');
const fs = require('fs');
const yaml = require('yaml');
require('dotenv').config()

async function redirectUser(req, res) {
    if(!req.params) {
        const filePath = path.join(process.cwd(), '/public/404.html');
        let content = await fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.status(404).send(content);

        return
    }

    const code = req.params.code

    if (code.length < 5 || code.length > 8) {
        const filePath = path.join(process.cwd(), '/public/404.html');
        let content = await fs.readFileSync(filePath, 'utf8');        
        res.setHeader('Content-Type', 'text/html');
        res.status(404).send(content);

        return
    }

    const linkReq = await exec_mysql.executeQuery(null, `
        SELECT link, text FROM links WHERE code = ?
    `, [code], pool)

    if(!linkReq.length) {
        const filePath = path.join(process.cwd(), '/public/404.html');
        let content = await fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.status(404).send(content);

        return
    }

    const url = linkReq[0].link
        
    const filePath = path.join(process.cwd(), '/link/link.html');
    let content = await fs.readFileSync(filePath, "utf8");
    
    const host = new URL(url).hostname

    const yamlConfig = await fs.readFileSync("./config.yaml", 'utf8')
    const siteciteHost = yaml.parse(yamlConfig).host
    
    content = content.replace(/\{code\}/g, code);
    content = content.replace(/\{baseUrl\}/g, siteciteHost);
    content = content.replace(/\{url\}/g, url);
    content = content.replace(/\{host\}/g, host);
    content = content.replace(/\{text\}/g, linkReq[0].text);
    
    if (process.env.ABUSE_CH_KEY.length > 5) {
        // clearly there's a valid urlhaus key
        try {
            // try and see if we can screen it
            const data = new URLSearchParams();
            data.append('url', url);

            const urlHausReq = await fetch("https://urlhaus-api.abuse.ch/v1/url/", {
                method: "post",
                headers: {
                    "Auth-Key": process.env.ABUSE_CH_KEY,
                },
                body: data
            })
            
            const urlHaus = await urlHausReq.json()

            if(urlHaus.query_status !== "no_results") {
                // oh god! results for a possible threat!!!!
                content = content.replace(/\{refresh\}/g, `<script>document.documentElement.style.setProperty('--background', "#e33d3d"); document.documentElement.style.setProperty('--color', "#fff");</script>`);
                // change background color to something scary
                content = content.replace(/\{titleText\}/g, "WARNING! Possible malicious site ahead!");
                content = content.replace(/\{description\}/g, "The following URL: "+url+", has been marked as dangerous by <a href='https://urlhaus.abuse.ch/' target='_blank' rel='noopener noreferrer'>URLhaus</a>. Visiting this site could bring harm to you or your computer.");
                content = content.replace(/\{linkText\}/g, "Accept the potential risk and continue.");
            }
        } catch(e)  {
            console.error("Could not check URLHaus!", e)
        }
    }

    // apparently its all fun and games!
    content = content.replace(/\{refresh\}/g, `<meta http-equiv='Refresh' content='0; url=${url}' />`);
    content = content.replace(/\{titleText\}/g, "Redirecting!");
    content = content.replace(/\{description\}/g, "Not working?");
    content = content.replace(/\{linkText\}/g, "Click here to redirect manually.");

    // 3. Send the modified content as HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(content);
    // await linkFile.body.replace("{var}", ":)")

    // res.sendFile(linkFile.blob)
}

module.exports = { redirectUser }
