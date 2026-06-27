const exec_mysql = require("../gen_functions/exec_mysql")
const pool = require("../db/pool")
const { createCanvas, registerFont } = require('canvas')
const { fontList } = require("./fontlist")

// load fonts
fontList.forEach(font => {
    registerFont(`./fonts/${font.file_regular}`, { family: font.name })
    registerFont(`./fonts/${font.file_italic}`, { family: font.name, style: "italic" })
})

// default styles
const DEFAULT_STYLE = {
    font: "Atkinson Hyperlegible Next",
    color: "000000",
    bg_color: "f6f6f6",
}

// init canvast function
const initCanvas = (ctx, width, height, background = "#fff") => {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width, height)
}

// dry image generation
const sendErrorImage = (res, message) => {
    const canvas = createCanvas(500, 300)
    const ctx = canvas.getContext('2d')

    initCanvas(ctx, canvas.width, canvas.height)

    drawCenteredText(ctx, message, canvas.width, canvas.height, {
        font: '22px Atkinson Hyperlegible Next',
        fillStyle: '#000',
        maxWidth: 400,
        blockAlign: 'left',
        lineAlign: 'left',
    })

    res.setHeader('Content-Type', 'image/png')
    res.send(canvas.toBuffer('image/png'))
}

// try get hostname
const safeGetHostname = (urlString) => {
    try {
        return new URL(urlString).hostname
    } catch (e) {
        return "unknown source"
    }
}

// * route handlers

const createImage = async (req, res) => {
    if (!req.params || !req.params.code) {
        return sendErrorImage(res, "No code provided.")
    }

    const code = req.params.code

    if (code.length < 5 || code.length > 8) {
        return sendErrorImage(res, `Invalid code.`)
    }

    const query = `
        SELECT l.user_id, l.link, l.text, u.bg_color, u.color, u.font
        FROM links l
        LEFT JOIN user_customisation u ON l.user_id = u.user_id
        WHERE l.code = ?
    `
    const linkReq = await exec_mysql.executeQuery(null, query, [code], pool)

    if (!linkReq.length) {
        return sendErrorImage(res, `Invalid code. The quote you are looking for may have been deleted.`)
    }

    const data = linkReq[0]

    // Determine style
    const style = (data.font && data.color && data.bg_color)
        ? { font: data.font, color: data.color, bg_color: data.bg_color }
        : DEFAULT_STYLE

    const host = safeGetHostname(data.link)
    const text = data.text.replace(/\n/g, "") // Regex to replace all newlines if multiple exist

    // CRITICAL FIX: Create isolated canvas per request
    const canvas = createCanvas(500, 300)
    const ctx = canvas.getContext('2d')

    initCanvas(ctx, canvas.width, canvas.height, "#" + style.bg_color)

    drawCenteredText(ctx, text, canvas.width, canvas.height, {
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
    })

    res.setHeader('Content-Type', 'image/png')
    res.send(canvas.toBuffer('image/png'))
}

const createImageFromText = async (req, res) => {
    if (!req.body || !req.body.text || !req.body.url) {
        return res.status(400).json({
            success: false,
            message: "No text and/or URL parsed",
        })
    }

    const { url } = req.body
    let text = req.body.text.replace(/\n/g, "")
    const user_id = req.userId

    const styleReq = await exec_mysql.executeQuery(null, `
        SELECT bg_color, color, font
        FROM user_customisation
        WHERE user_id = ?    
    `, [user_id], pool)

    const style = (styleReq.length && styleReq[0].font && styleReq[0].color && styleReq[0].bg_color)
        ? styleReq[0]
        : DEFAULT_STYLE

    const host = safeGetHostname(url)

    // CRITICAL FIX: Create isolated canvas per request
    const canvas = createCanvas(500, 300)
    const ctx = canvas.getContext('2d')

    initCanvas(ctx, canvas.width, canvas.height, "#" + style.bg_color)

    drawCenteredText(ctx, text, canvas.width, canvas.height, {
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
    })

    res.setHeader('Content-Type', 'image/png')
    res.send(canvas.toBuffer('image/png'))
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
    if (canvasWidth === undefined) canvasWidth = ctx.canvas.width
    if (canvasHeight === undefined) canvasHeight = ctx.canvas.height

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
    } = options

    // ---------- Helper: word‑wrap a string using a given font ----------
    const wrapText = (str, contextFont, contextMaxWidth) => {
        ctx.save()
        ctx.font = contextFont
        const paragraphs = str.split('\n')
        const wrapped = []

        for (const para of paragraphs) {
            if (para === '') {
                wrapped.push('')
                continue
            }

            const words = para.split(' ')
            let line = ''

            for (let i = 0; i < words.length; i++) {
                const word = words[i]
                let testLine = line ? `${line} ${word}` : word

                // if the word fits on the current line, add it
                if (ctx.measureText(testLine).width <= contextMaxWidth) {
                    line = testLine
                } else {
                    // it doesn't fit. If the line already has words, push the line and start fresh.
                    if (line !== '') {
                        wrapped.push(line)
                        line = ''
                        testLine = word
                    }

                    // check if the word on its own is wider than the max width
                    if (ctx.measureText(word).width > contextMaxWidth) {
                        // word is too wide: break it down character-by-character
                        let tempWord = word
                        while (tempWord.length > 0) {
                            let charLine = ''
                            let j = 0

                            // build a line letter by letter until it hits the max width
                            while (j < tempWord.length && ctx.measureText(charLine + tempWord[j]).width <= contextMaxWidth) {
                                charLine += tempWord[j]
                                j++
                            }

                            // if canvas is too narrow for even 1 char, force 1 char
                            if (j === 0) {
                                charLine = tempWord[0]
                                j = 1
                            }

                            if (j < tempWord.length) {
                                // still more of the long word left, push this chunk and keep looping
                                wrapped.push(charLine)
                                tempWord = tempWord.slice(j)
                            } else {
                                // reached the end of the long word, keep remainder for the next normal word
                                line = charLine
                                break
                            }
                        }
                    } else {
                        // word fits on its own new line
                        line = word
                    }
                }
            }
            // push any remaining text at the end of the paragraph
            if (line !== '') wrapped.push(line)
        }

        ctx.restore()
        return wrapped
    }

    // ---------- Helper: truncate a line with ellipsis to fit a width ----------
    const truncateLineWithEllipsis = (line, contextFont, contextMaxWidth) => {
        ctx.save()
        ctx.font = contextFont

        const ellipsis = '...'
        const ellWidth = ctx.measureText(ellipsis).width

        // If even "..." is too wide, use a single dot as a last resort
        const fallback = ellWidth <= contextMaxWidth ? ellipsis : '.'
        const fallbackWidth = ctx.measureText(fallback).width

        if (fallbackWidth > contextMaxWidth) {
            ctx.restore()
            return ''   // truly nothing fits (canvas too narrow)
        }

        // If the line already fits (plus fallback), return it as is
        if (ctx.measureText(line).width <= contextMaxWidth) {
            ctx.restore()
            return line
        }

        // Binary search for the longest prefix that still fits with fallback
        let low = 0, high = line.length, best = fallback
        while (low <= high) {
            const mid = Math.floor((low + high) / 2)
            const candidate = line.slice(0, mid) + fallback
            if (ctx.measureText(candidate).width <= contextMaxWidth) {
                best = candidate
                low = mid + 1
            } else {
                high = mid - 1
            }
        }
        ctx.restore()
        return best
    }

    // ---------- Helper: parse pixel size from a CSS font string ----------
    const parseFontSize = (f) => {
        const match = f.match(/\b(\d+(?:\.\d+)?)px\b/)
        return match ? parseFloat(match[1]) : null
    }

    // ---------- Helper: replace pixel size in a font string ----------
    const setFontSize = (f, newSize) => {
        return f.replace(/\b\d+(?:\.\d+)?px\b/, `${Math.round(newSize)}px`)
    }

    // ---------- Default label configuration ----------
    let labelFont = font   // fallback
    let labelFillStyle = fillStyle
    let labelMarginBottom = 10
    let labelLineHeight = null
    let labelText = ''

    if (topLabel && topLabel.text) {
        labelText = topLabel.text
        if (topLabel.font) {
            labelFont = topLabel.font
        } else {
            const mainSize = parseFontSize(font)
            if (mainSize !== null) {
                labelFont = setFontSize(font, mainSize * 0.8)
            }
        }
        labelFillStyle = topLabel.fillStyle || fillStyle
        if (topLabel.marginBottom !== undefined) labelMarginBottom = topLabel.marginBottom
        if (topLabel.lineHeight !== undefined) labelLineHeight = topLabel.lineHeight
    }

    // ---------- Auto‑fit logic ----------
    let effectiveMainFont = font
    let effectiveLabelFont = labelFont
    let finalMainLineH, finalLabelLineH
    let mainLines, labelLines

    if (autoFit && autoFit.enabled) {
        const minMain = autoFit.minFontSizeMain ?? 10
        const minLabel = autoFit.minFontSizeLabel ?? 10
        const step = autoFit.step ?? 0.05

        const initialMainSize = parseFontSize(font) || 16
        const initialLabelSize = labelText ? (parseFontSize(labelFont) || initialMainSize * 0.8) : initialMainSize

        let factor = 1.0
        let fitted = false

        // Loop down from 1 until we fit or hit both minima
        while (factor > 0) {
            const curMainSize = Math.max(initialMainSize * factor, minMain)
            const curLabelSize = labelText ? Math.max(initialLabelSize * factor, minLabel) : curMainSize

            effectiveMainFont = setFontSize(font, curMainSize)
            effectiveLabelFont = setFontSize(labelFont, curLabelSize)

            const curMainLineH = lineHeight ?? (curMainSize * 1.2)
            const curLabelLineH = labelLineHeight ?? (curLabelSize * 1.2)

            // Wrap lines with current fonts
            const curMainLines = wrapText(text, effectiveMainFont, maxWidth)
            const curLabelLines = labelText ? wrapText(labelText, effectiveLabelFont, maxWidth) : []

            const mainTotalH = curMainLines.length * curMainLineH
            const labelTotalH = curLabelLines.length * curLabelLineH
            const gap = (curLabelLines.length > 0 && curMainLines.length > 0) ? labelMarginBottom : 0
            const totalH = labelTotalH + gap + mainTotalH

            if (totalH <= canvasHeight) {
                // Fits!
                mainLines = curMainLines
                labelLines = curLabelLines
                finalMainLineH = curMainLineH
                finalLabelLineH = curLabelLineH
                fitted = true
                break
            }

            // Check if both fonts are already at their minima
            if (curMainSize <= minMain && curLabelSize <= minLabel) {
                // Even at min sizes we don't fit → need truncation later
                mainLines = curMainLines
                labelLines = curLabelLines
                finalMainLineH = curMainLineH
                finalLabelLineH = curLabelLineH
                break
            }

            factor -= step
        }

        // If we never fitted (fitted == false), we are at min sizes and must truncate
        if (!fitted) {
            // Calculate available height for main lines
            const labelTotalH = labelLines.length * finalLabelLineH
            const gap = (labelLines.length > 0 && mainLines.length > 0) ? labelMarginBottom : 0
            const availMainH = canvasHeight - labelTotalH - gap

            if (availMainH > 0 && mainLines.length > 0) {
                const maxMainLines = Math.max(1, Math.floor(availMainH / finalMainLineH))
                const visibleCount = Math.min(mainLines.length, maxMainLines)
                const truncated = mainLines.slice(0, visibleCount)

                // If we actually cut some lines, add ellipsis
                if (visibleCount < mainLines.length) {
                    // Find the last non-empty line in the visible set
                    let idx = visibleCount - 1
                    while (idx >= 0 && truncated[idx] === '') {
                        idx--
                    }

                    if (idx >= 0) {
                        // Truncate that line with ellipsis
                        truncated[idx] = truncateLineWithEllipsis(
                            truncated[idx],
                            effectiveMainFont,
                            maxWidth
                        )
                    }
                    // If all visible lines are empty (unlikely), no ellipsis
                }
                mainLines = truncated
            } else {
                mainLines = []  // no room for even one line
            }
        }
    } else {
        // Standard behaviour (no auto‑fit) – use provided fonts & heights
        effectiveMainFont = font
        effectiveLabelFont = labelFont
        mainLines = wrapText(text, font, maxWidth)
        labelLines = labelText ? wrapText(labelText, labelFont, maxWidth) : []

        const mainSize = parseFontSize(font) || 16
        const labelSize = labelText ? (parseFontSize(labelFont) || mainSize * 0.8) : mainSize
        finalMainLineH = lineHeight ?? (mainSize * 1.2)
        finalLabelLineH = labelLineHeight ?? (labelSize * 1.2)
    }

    // ---------- Measure line widths (for block positioning) ----------
    ctx.save()
    ctx.font = effectiveMainFont
    const mainWidths = mainLines.map(l => (l === '' ? 0 : ctx.measureText(l).width))
    ctx.restore()

    ctx.save()
    ctx.font = effectiveLabelFont
    const labelWidths = labelLines.map(l => (l === '' ? 0 : ctx.measureText(l).width))
    ctx.restore()

    const maxBlockWidth = Math.max(...mainWidths, ...labelWidths, 0)

    // ---------- Horizontal block positioning ----------
    let blockLeft
    if (blockAlign === 'center') {
        blockLeft = (canvasWidth - maxBlockWidth) / 2
    } else if (blockAlign === 'left') {
        blockLeft = margin
    } else if (blockAlign === 'right') {
        blockLeft = canvasWidth - maxBlockWidth - margin
    } else {
        blockLeft = (canvasWidth - maxBlockWidth) / 2
    }
    const blockCenterX = blockLeft + maxBlockWidth / 2

    // ---------- Vertical centering of the whole composite ----------
    const labelTotalH = labelLines.length * finalLabelLineH
    const gap = (labelLines.length > 0 && mainLines.length > 0) ? labelMarginBottom : 0
    const mainTotalH = mainLines.length * finalMainLineH
    const totalCompositeH = labelTotalH + gap + mainTotalH

    let currentY = (canvasHeight - totalCompositeH) / 2

    // ---------- Draw top label ----------
    if (labelLines.length > 0) {
        ctx.save()
        ctx.font = effectiveLabelFont
        ctx.fillStyle = labelFillStyle
        ctx.textAlign = 'center'      // label always centered over the block
        ctx.textBaseline = 'middle'
        for (let i = 0; i < labelLines.length; i++) {
            const y = currentY + i * finalLabelLineH + finalLabelLineH / 2
            ctx.fillText(labelLines[i], blockCenterX, y)
        }
        ctx.restore()
        currentY += labelTotalH + gap
    }

    // ---------- Draw main text block ----------
    if (mainLines.length > 0) {
        ctx.save()
        ctx.font = effectiveMainFont
        ctx.fillStyle = fillStyle
        ctx.textBaseline = 'middle'

        let drawX
        if (lineAlign === 'left') {
            ctx.textAlign = 'left'
            drawX = blockLeft
        } else if (lineAlign === 'right') {
            ctx.textAlign = 'right'
            drawX = blockLeft + maxBlockWidth
        } else { // center
            ctx.textAlign = 'center'
            drawX = blockCenterX
        }

        for (let i = 0; i < mainLines.length; i++) {
            const y = currentY + i * finalMainLineH + finalMainLineH / 2
            ctx.fillText(mainLines[i], drawX, y)
        }
        ctx.restore()
    }
}
