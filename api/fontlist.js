const fontList = [
    {
        name: "Atkinson Hyperlegible Next",
        credit: "Designed by Braille Institute, Applied Design Works, Elliott Scott, Megan Eiswerth, Letters From Sweden. Download from Google Fonts.",
        file_regular: "atkinson_next.ttf",
        file_italic: "atkinson_next_italic.ttf",
        type: "sans-serif"
    },
    {
        name: "Atkinson Hyperlegible Mono",
        credit: "Designed by Braille Institute, Applied Design Works, Elliott Scott, Megan Eiswerth, Letters From Sweden. Download from Google Fonts.",
        file_regular: "atkinson_mono.ttf",
        file_italic: "atkinson_mono_italic.ttf",
        type: "monospace"
    },
    {
        name: "Merriweather",
        credit: "Designed by Sorkin Type. Download from Google Fonts.",
        file_regular: "merriweather.ttf",
        file_italic: "merriweather_italic.ttf",
        type: "serif"
    },
    {
        name: "Impact",
        credit: "Designed by Geoffrey Lee. Download from deefont.com. Suggestion by @andrewpeacock.",
        file_regular: "impact.ttf",
        file_italic: "impact.ttf",
        type: "sans-serif"
    }
]

const getFonts = async (req, res) => {
    res.status(200).json({
        success: true,
        message: "Thanks to all these wonderful people who made the fonts! <3",
        data: {
            fontList: fontList
        }
    })
    return
};

module.exports = { getFonts, fontList }
