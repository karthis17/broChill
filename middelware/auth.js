const jwt = require("jsonwebtoken");
const User = require("../model/user.model");
const Admin = require("../model/admin.model");
require('dotenv').config();


const authMiddleware = function (req, res, next) {
    const token = req.header("Authorization");

    if (!token) return res.status(401).json({ message: "Auth Error" });

    try {
        const decoded = jwt.verify(token.split(' ')[1], process.env.SECRET_KEY);

        // Check if the user exists in the user collection
        User.findById(decoded.user.id).then((user) => {
            if (user) {
                req.user = decoded.user;
                req.role = "user"; // Set role to user
                next(); // Continue to the next middleware or route handler
            } else {
                // Check if the user exists in the admin collection
                Admin.findById(decoded.user.id).then((admin) => {
                    if (!admin) {
                        return res.status(401).json({ message: "Auth Error" });
                    }

                    req.user = decoded.user;
                    req.role = "admin"; // Set role to admin
                    next();
                }).catch((error) => {
                    res.status(401).json({ message: "Auth Error" });
                });
            }
        }).catch((error) => {
            res.status(401).json({ message: "Auth Error" });
        });
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: "Invalid Token" });
    }
};


module.exports = authMiddleware;
