

module.exports = function (req, res, next) {
    console.log(req.role)
    if (req.role === 'admin') {
        return next();
    }

    res.status(401).json({ message: "Auth Error" });

}