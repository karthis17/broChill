const jwt = require("jsonwebtoken");


module.exports = function (req, res, next) {
    // console.log(req.body)
    const token = req.header("Authorization");

    if (!token) return res.status(401).json({ message: "Auth Error" });

    try {
        const decoded = jwt.verify(token.split(' ')[1], "randomString");
        req.user = decoded.user;
        next();
    }

    catch (e) {
        console.error(e);
        res.status(500).send({ message: "Invalid Token" });
    }
};