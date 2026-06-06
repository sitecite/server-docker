const exec_mysql = require("../gen_functions/exec_mysql");
const pool = require("../server")
const { createCanvas, loadImage, registerFont } = require('canvas')
const crypto = require('crypto');
const { fontList } = require("./fontlist");

// load fonts
fontList.forEach(font => {
    registerFont(`./fonts/${font.file_regular}`, { family: font.name })
    registerFont(`./fonts/${font.file_italic}`, { family: font.name, style: "italic" })
});

// canvas stuff
const canvas = createCanvas(500, 300)
const ctx = canvas.getContext('2d')

const width = 500
const fontSize = "30px"

const createImage = async (req, res) => {
    initCanvas()
    if (!req.params) {
        drawCenteredText(
            ctx,
            `No code provided.`,
            canvas.width,
            canvas.height,
            {
                font: '22px Atkinson Hyperlegible Next',
                fillStyle: '#000',
                maxWidth: 400,
                blockAlign: 'left',
                lineAlign: 'left',
            }
        );

        res.setHeader('Content-Type', 'image/png');
        const buffer = canvas.toBuffer('image/png');
        res.send(buffer);
        return
    }

    const code = req.params.code

    if (code.length < 5 || code.length > 8) {
        drawCenteredText(
            ctx,
            `Invalid code.`,
            canvas.width,
            canvas.height,
            {
                font: '22px Atkinson Hyperlegible Next',
                fillStyle: '#000',
                maxWidth: 400,
                blockAlign: 'left',
                lineAlign: 'left',
            }
        );

        res.setHeader('Content-Type', 'image/png');
        const buffer = canvas.toBuffer('image/png');
        res.send(buffer);
        return
    }

    const linkReq = await exec_mysql.executeQuery(null, `
        SELECT user_id, link, text FROM links WHERE code = ?
    `, [code], pool)

    if (!linkReq.length) {
        drawCenteredText(
            ctx,
            `Invalid code. The quote you are looking for may have been deleted.`,
            canvas.width,
            canvas.height,
            {
                font: '22px Atkinson Hyperlegible Next',
                fillStyle: '#000',
                maxWidth: 400,
                blockAlign: 'left',
                lineAlign: 'left',
            }
        );

        res.setHeader('Content-Type', 'image/png');
        const buffer = canvas.toBuffer('image/png');
        res.send(buffer);
        return
    }

    // fetch style
    const user_id = linkReq[0].user_id
    var style

    const styleReq = await exec_mysql.executeQuery(null, `
            SELECT bg_color, color, font
            FROM user_customisation
            WHERE user_id = ?    
        `, [user_id], pool)

    // console.log(style)
    if (!styleReq.length || !styleReq[0].font || !styleReq[0].color || !styleReq[0].bg_color) {
        // default style
        style = {
            font: "Atkinson Hyperlegible Next",
            color: "000000",
            bg_color: "f6f6f6",
        }
    } else {
        style = styleReq[0]
    }

    const url = linkReq[0].link
    const host = new URL(url).hostname
    const text = linkReq[0].text.replace("\n", "")

    initCanvas("#" + style.bg_color)

    drawCenteredText(
        ctx,
        text,   // main quote
        canvas.width,
        canvas.height,
        {
            font: '22px ' + style.font,
            fillStyle: "#" + style.color,
            maxWidth: 400,
            blockAlign: 'center',
            lineAlign: 'left',
            topLabel: {
                text: `from ${host}:`,
                font: 'italic 16px ' + style.font,
                fillStyle: "#" + style.color,
                marginBottom: 8
            },
            autoFit: {
                enabled: true,
                minFontSizeMain: 12,
                minFontSizeLabel: 10,
                step: 0.05
            }

        }
    );


    // ctx.strokeStyle = 'rgba(0,0,0,0.5)'

    res.setHeader('Content-Type', 'image/png');
    const buffer = canvas.toBuffer('image/png');
    res.send(buffer);

};

const createImageFromText = async (req, res) => {
    if (!req.headers.authorization) {
        return res.status(401).json({
            success: false,
            message: "No credentials sent. (empty authorization headers?)"
        });
        return
    }
    if (!req.body || !req.body.text || !req.body.url) {
        res.status(400).json({
            success: false,
            message: "No text and/or URL parsed",
        })
        return
    }

    // the parsed selection text and url
    var text = req.body.text
    const url = req.body.url

    // check if token is valid
    const token = req.headers.authorization.replace("Bearer ", "")
    console.log(token)
    // hash it to check if its in database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const tokenSearch = await exec_mysql.executeQuery(null, `
            SELECT user_id, expire 
            FROM user_ext_tokens
            WHERE token = ? AND expire > ?
        `, [tokenHash, Math.round(Date.now() / 1000)], pool)

    if (!tokenSearch.length) {
        // no matching tokens found, user is not signed in
        res.status(401).json({
            success: false,
            message: "Invalid token. Maybe it expired?",
        })
        return
    }

    const user_id = tokenSearch[0].user_id
    
    initCanvas()
    
    // fetch style
    var style

    const styleReq = await exec_mysql.executeQuery(null, `
            SELECT bg_color, color, font
            FROM user_customisation
            WHERE user_id = ?    
        `, [user_id], pool)

    if (!styleReq.length || !styleReq[0].font || !styleReq[0].color || !styleReq[0].bg_color) {
        // default style
        style = {
            font: "Atkinson Hyperlegible Next",
            color: "000000",
            bg_color: "f6f6f6",
        }
    } else {
        style = styleReq[0]
    }

    const host = new URL(url).hostname
    text = text.replace("\n", "")

    initCanvas("#" + style.bg_color)

    drawCenteredText(
        ctx,
        text,   // main quote
        canvas.width,
        canvas.height,
        {
            font: '22px ' + style.font,
            fillStyle: "#" + style.color,
            maxWidth: 400,
            blockAlign: 'center',
            lineAlign: 'left',
            topLabel: {
                text: `from ${host}:`,
                font: 'italic 16px ' + style.font,
                fillStyle: "#" + style.color,
                marginBottom: 8
            },
            autoFit: {
                enabled: true,
                minFontSizeMain: 12,
                minFontSizeLabel: 10,
                step: 0.05
            }

        }
    );

    // output the image
    res.setHeader('Content-Type', 'image/png');
    const buffer = canvas.toBuffer('image/png');
    res.send(buffer);
}

module.exports = { createImage, createImageFromText }

/**
 * Draws vertically centered text on a canvas with wrapping, \n support,
 * alignment, a top label, and optional auto‑sizing / truncation.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text - Main text (supports \n)
 * @param {number} [canvasWidth] - Defaults to canvas width
 * @param {number} [canvasHeight] - Defaults to canvas height
 * @param {object} [options]
 * @param {string} [options.font] - Main text CSS font
 * @param {string} [options.fillStyle] - Main text color
 * @param {number} [options.maxWidth] - Wrap width (defaults to canvasWidth)
 * @param {number} [options.lineHeight] - Line spacing (defaults to font size * 1.2)
 * @param {string} [options.blockAlign] - 'center', 'left', 'right'
 * @param {string} [options.lineAlign] - 'center', 'left', 'right'
 * @param {number} [options.margin] - Margin from edge when blockAlign = 'left'/'right'
 * @param {object} [options.topLabel] - Label above main text
 * @param {string} options.topLabel.text - Label text (can include \n)
 * @param {string} [options.topLabel.font] - CSS font (defaults to 80% of main font size)
 * @param {string} [options.topLabel.fillStyle] - Label color (defaults to main fillStyle)
 * @param {number} [options.topLabel.marginBottom] - Gap below label (defaults to 10)
 * @param {number} [options.topLabel.lineHeight] - Label line spacing
 * @param {object} [options.autoFit] - Auto‑size to fit canvas
 * @param {boolean} [options.autoFit.enabled] - Enable auto‑fit (default false)
 * @param {number} [options.autoFit.minFontSizeMain] - Minimum main font size (px, default 10)
 * @param {number} [options.autoFit.minFontSizeLabel] - Minimum label font size (px, default 10)
 * @param {number} [options.autoFit.step] - Scaling step (default 0.05)
 */
function drawCenteredText(ctx, text, canvasWidth, canvasHeight, options = {}) {
    if (canvasWidth === undefined) canvasWidth = ctx.canvas.width;
    if (canvasHeight === undefined) canvasHeight = ctx.canvas.height;

    const {
        font = ctx.font,
        fillStyle = ctx.fillStyle,
        maxWidth = canvasWidth,
        lineHeight = null,
        blockAlign = 'center',
        lineAlign = 'center',
        margin = 10,
        topLabel = null,
        autoFit = null
    } = options;

    // ---------- Helper: word‑wrap a string using a given font ----------
    const wrapText = (str, contextFont, contextMaxWidth) => {
        ctx.save();
        ctx.font = contextFont;
        const paragraphs = str.split('\n');
        const wrapped = [];
        for (const para of paragraphs) {
            if (para === '') {
                wrapped.push('');
                continue;
            }
            const words = para.split(' ');
            let line = '';
            for (const word of words) {
                const test = line ? `${line} ${word}` : word;
                if (ctx.measureText(test).width > contextMaxWidth && line !== '') {
                    wrapped.push(line);
                    line = word;
                } else {
                    line = test;
                }
            }
            if (line !== '' || wrapped.length === 0) wrapped.push(line);
        }
        ctx.restore();
        return wrapped;
    };

    // ---------- Helper: truncate a line with ellipsis to fit a width ----------
    const truncateLineWithEllipsis = (line, contextFont, contextMaxWidth) => {
        ctx.save();
        ctx.font = contextFont;

        const ellipsis = '...';
        const ellWidth = ctx.measureText(ellipsis).width;

        // If even "..." is too wide, use a single dot as a last resort
        const fallback = ellWidth <= contextMaxWidth ? ellipsis : '.';
        const fallbackWidth = ctx.measureText(fallback).width;

        if (fallbackWidth > contextMaxWidth) {
            ctx.restore();
            return '';   // truly nothing fits (canvas too narrow)
        }

        // If the line already fits (plus fallback), return it as is
        if (ctx.measureText(line).width <= contextMaxWidth) {
            ctx.restore();
            return line;
        }

        // Binary search for the longest prefix that still fits with fallback
        let low = 0, high = line.length, best = fallback;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const candidate = line.slice(0, mid) + fallback;
            if (ctx.measureText(candidate).width <= contextMaxWidth) {
                best = candidate;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        ctx.restore();
        return best;
    };

    // ---------- Helper: parse pixel size from a CSS font string ----------
    const parseFontSize = (f) => {
        const match = f.match(/\b(\d+(?:\.\d+)?)px\b/);
        return match ? parseFloat(match[1]) : null;
    };

    // ---------- Helper: replace pixel size in a font string ----------
    const setFontSize = (f, newSize) => {
        return f.replace(/\b\d+(?:\.\d+)?px\b/, `${Math.round(newSize)}px`);
    };

    // ---------- Default label configuration ----------
    let labelFont = font;   // fallback
    let labelFillStyle = fillStyle;
    let labelMarginBottom = 10;
    let labelLineHeight = null;
    let labelText = '';

    if (topLabel && topLabel.text) {
        labelText = topLabel.text;
        if (topLabel.font) {
            labelFont = topLabel.font;
        } else {
            const mainSize = parseFontSize(font);
            if (mainSize !== null) {
                labelFont = setFontSize(font, mainSize * 0.8);
            }
        }
        labelFillStyle = topLabel.fillStyle || fillStyle;
        if (topLabel.marginBottom !== undefined) labelMarginBottom = topLabel.marginBottom;
        if (topLabel.lineHeight !== undefined) labelLineHeight = topLabel.lineHeight;
    }

    // ---------- Auto‑fit logic ----------
    let effectiveMainFont = font;
    let effectiveLabelFont = labelFont;
    let finalMainLineH, finalLabelLineH;
    let mainLines, labelLines;

    if (autoFit && autoFit.enabled) {
        const minMain = autoFit.minFontSizeMain ?? 10;
        const minLabel = autoFit.minFontSizeLabel ?? 10;
        const step = autoFit.step ?? 0.05;

        const initialMainSize = parseFontSize(font) || 16;
        const initialLabelSize = labelText ? (parseFontSize(labelFont) || initialMainSize * 0.8) : initialMainSize;

        let factor = 1.0;
        let fitted = false;

        // Loop down from 1 until we fit or hit both minima
        while (factor > 0) {
            const curMainSize = Math.max(initialMainSize * factor, minMain);
            const curLabelSize = labelText ? Math.max(initialLabelSize * factor, minLabel) : curMainSize;

            effectiveMainFont = setFontSize(font, curMainSize);
            effectiveLabelFont = setFontSize(labelFont, curLabelSize);

            const curMainLineH = lineHeight ?? (curMainSize * 1.2);
            const curLabelLineH = labelLineHeight ?? (curLabelSize * 1.2);

            // Wrap lines with current fonts
            const curMainLines = wrapText(text, effectiveMainFont, maxWidth);
            const curLabelLines = labelText ? wrapText(labelText, effectiveLabelFont, maxWidth) : [];

            const mainTotalH = curMainLines.length * curMainLineH;
            const labelTotalH = curLabelLines.length * curLabelLineH;
            const gap = (curLabelLines.length > 0 && curMainLines.length > 0) ? labelMarginBottom : 0;
            const totalH = labelTotalH + gap + mainTotalH;

            if (totalH <= canvasHeight) {
                // Fits!
                mainLines = curMainLines;
                labelLines = curLabelLines;
                finalMainLineH = curMainLineH;
                finalLabelLineH = curLabelLineH;
                fitted = true;
                break;
            }

            // Check if both fonts are already at their minima
            if (curMainSize <= minMain && curLabelSize <= minLabel) {
                // Even at min sizes we don't fit → need truncation later
                mainLines = curMainLines;
                labelLines = curLabelLines;
                finalMainLineH = curMainLineH;
                finalLabelLineH = curLabelLineH;
                break;
            }

            factor -= step;
        }

        // If we never fitted (fitted == false), we are at min sizes and must truncate
        if (!fitted) {
            // Calculate available height for main lines
            const labelTotalH = labelLines.length * finalLabelLineH;
            const gap = (labelLines.length > 0 && mainLines.length > 0) ? labelMarginBottom : 0;
            const availMainH = canvasHeight - labelTotalH - gap;

            if (availMainH > 0 && mainLines.length > 0) {
                const maxMainLines = Math.max(1, Math.floor(availMainH / finalMainLineH));
                const visibleCount = Math.min(mainLines.length, maxMainLines);
                const truncated = mainLines.slice(0, visibleCount);

                // If we actually cut some lines, add ellipsis
                if (visibleCount < mainLines.length) {
                    // Find the last non-empty line in the visible set
                    let idx = visibleCount - 1;
                    while (idx >= 0 && truncated[idx] === '') {
                        idx--;
                    }

                    if (idx >= 0) {
                        // Truncate that line with ellipsis
                        truncated[idx] = truncateLineWithEllipsis(
                            truncated[idx],
                            effectiveMainFont,
                            maxWidth
                        );
                    }
                    // If all visible lines are empty (unlikely), no ellipsis
                }
                mainLines = truncated;
            } else {
                mainLines = [];  // no room for even one line
            }
        }
    } else {
        // Standard behaviour (no auto‑fit) – use provided fonts & heights
        effectiveMainFont = font;
        effectiveLabelFont = labelFont;
        mainLines = wrapText(text, font, maxWidth);
        labelLines = labelText ? wrapText(labelText, labelFont, maxWidth) : [];

        const mainSize = parseFontSize(font) || 16;
        const labelSize = labelText ? (parseFontSize(labelFont) || mainSize * 0.8) : mainSize;
        finalMainLineH = lineHeight ?? (mainSize * 1.2);
        finalLabelLineH = labelLineHeight ?? (labelSize * 1.2);
    }

    // ---------- Measure line widths (for block positioning) ----------
    ctx.save();
    ctx.font = effectiveMainFont;
    const mainWidths = mainLines.map(l => (l === '' ? 0 : ctx.measureText(l).width));
    ctx.restore();

    ctx.save();
    ctx.font = effectiveLabelFont;
    const labelWidths = labelLines.map(l => (l === '' ? 0 : ctx.measureText(l).width));
    ctx.restore();

    const maxBlockWidth = Math.max(...mainWidths, ...labelWidths, 0);

    // ---------- Horizontal block positioning ----------
    let blockLeft;
    if (blockAlign === 'center') {
        blockLeft = (canvasWidth - maxBlockWidth) / 2;
    } else if (blockAlign === 'left') {
        blockLeft = margin;
    } else if (blockAlign === 'right') {
        blockLeft = canvasWidth - maxBlockWidth - margin;
    } else {
        blockLeft = (canvasWidth - maxBlockWidth) / 2;
    }
    const blockCenterX = blockLeft + maxBlockWidth / 2;

    // ---------- Vertical centering of the whole composite ----------
    const labelTotalH = labelLines.length * finalLabelLineH;
    const gap = (labelLines.length > 0 && mainLines.length > 0) ? labelMarginBottom : 0;
    const mainTotalH = mainLines.length * finalMainLineH;
    const totalCompositeH = labelTotalH + gap + mainTotalH;

    let currentY = (canvasHeight - totalCompositeH) / 2;

    // ---------- Draw top label ----------
    if (labelLines.length > 0) {
        ctx.save();
        ctx.font = effectiveLabelFont;
        ctx.fillStyle = labelFillStyle;
        ctx.textAlign = 'center';      // label always centered over the block
        ctx.textBaseline = 'middle';
        for (let i = 0; i < labelLines.length; i++) {
            const y = currentY + i * finalLabelLineH + finalLabelLineH / 2;
            ctx.fillText(labelLines[i], blockCenterX, y);
        }
        ctx.restore();
        currentY += labelTotalH + gap;
    }

    // ---------- Draw main text block ----------
    if (mainLines.length > 0) {
        ctx.save();
        ctx.font = effectiveMainFont;
        ctx.fillStyle = fillStyle;
        ctx.textBaseline = 'middle';

        let drawX;
        if (lineAlign === 'left') {
            ctx.textAlign = 'left';
            drawX = blockLeft;
        } else if (lineAlign === 'right') {
            ctx.textAlign = 'right';
            drawX = blockLeft + maxBlockWidth;
        } else { // center
            ctx.textAlign = 'center';
            drawX = blockCenterX;
        }

        for (let i = 0; i < mainLines.length; i++) {
            const y = currentY + i * finalMainLineH + finalMainLineH / 2;
            ctx.fillText(mainLines[i], drawX, y);
        }
        ctx.restore();
    }
}

function initCanvas(background = "#fff") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
