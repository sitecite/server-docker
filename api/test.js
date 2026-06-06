// check if everything is okay

const getTest = async (req, res) => {
    res.status(200).json({
        message: "Everything works!",
        success: true
    })
}

module.exports = getTest
