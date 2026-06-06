const logOut = (req, res) => {
    res.clearCookie("token", {
        signed: true,
        httpOnly: true,
        path: "/"
    })

    res.status(303).redirect("../")
    return
}

module.exports = logOut