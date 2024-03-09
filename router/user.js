const express = require("express");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../model/user.model");
const Follow = require("../model/follow.model");
const auth = require("../middelware/auth");
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');



router.post(
    "/signup",
    uploadFile.single('avatar'),
    [
        check("username", "Please Enter a Valid Username")
            .not()
            .isEmpty(),
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter a valid password").isLength({
            min: 6
        })
    ],

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        const { username, email, password } = req.body;


        try {
            let user = await User.findOne({
                email
            });
            if (user) {
                return res.status(400).json({
                    msg: "User Already Exists"
                });
            }

            let avatar = '';
            if (req.file) {

                avatar = await uploadAndGetFirebaseUrl(req);
            }

            user = new User({
                username,
                email,
                password,
                avatar
            });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            const payload = {
                user: {
                    id: user.id
                }
            };

            jwt.sign(
                payload,
                "randomString",
                {
                    expiresIn: '30d'
                },
                (err, token) => {
                    if (err) throw err;
                    res.status(200).json({
                        token
                    });
                }
            );

        } catch (err) {
            console.log(err.message);
            res.status(500).send({ message: err.message });
        }
    }
);




router.post(
    "/login",

    [
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter a valid password").isLength({
            min: 6
        })
    ],

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        try {
            let user = await User.findOne({
                email
            });

            if (!user)
                return res.status(400).json({
                    message: "User Not Exist"
                });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch)
                return res.status(400).json({
                    message: "Incorrect Password !"
                });

            const payload = {
                user: {
                    id: user.id
                }
            };

            jwt.sign(
                payload,
                "randomString",
                {
                    expiresIn: '30d'
                },
                (err, token) => {
                    if (err) throw err;
                    res.status(200).json({
                        token
                    });
                }
            );

        }

        catch (e) {
            console.error(e);
            res.status(500).send({ message: e.message });
        }
    }
);






router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('username', 'email');
        res.json(user);
    }
    catch (e) {
        res.status(500).send({ message: e.message });
    }
});



router.post("/follow", auth, async (req, res) => {
    try {
        const { following_id } = req.body;
        if (!following_id) {
            return res.status(400).json({ message: 'Following ID is required' });
        }

        const existingFollow = await Follow.findOne({ follower: req.user.id, following: following_id });
        if (existingFollow) {
            return res.status(400).json({ message: 'You are already following this user' });
        }

        const response = await Follow.create({ follower: req.user.id, following: following_id });
        res.status(201).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get("/followers", auth, async (req, res) => {
    try {
        const followers = await Follow.find({ following: req.user.id }).populate('follower', 'username');
        res.status(200).json(followers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get("/following", auth, async (req, res) => {
    try {
        const following = await Follow.find({ follower: req.user.id }).populate('following', 'username');
        res.status(200).json(following);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



module.exports = router;