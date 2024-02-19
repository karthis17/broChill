const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const reels = require('../model/reels.model');
const auth = require('../middelware/auth');
// const Like = require('../model/like.model');
const Follow = require('../model/follow.model');
const { body } = require('express-validator');

const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/upload-reel', auth, upload.single('reel'), async (req, res) => {
    console.log(req.body)
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log(req.file)

        const { description, category, hashtags, title } = req.body;

        if (!Array.isArray(hashtags)) {
            return res.status(404).json({ message: 'hashtags must be an array' });
        }


        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        const filePath = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
        const reel = await reels.create({ category, title, filePath, description, user: req.user.id, hashtags });
        console.log(reel);

        res.status(201).json(reel);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

});


router.get('/search', async (req, res) => {

    try {
        const ress = await reels.find({ hashtags: { $in: [hashtag] } });
        res.json(ress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});


router.get('/get-reel/:id', async (req, res) => {

    try {
        const reel = await reels.findById(req.params.id);
        res.send(reel)
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', err: error.message });
    }

});

router.get("/get-all", async (req, res) => {
    try {
        const ress = await reels.find();
        res.json(ress);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/like', auth, async (req, res) => {
    try {
        const response = await reels.findByIdAndUpdate(req.body.reelId, { $push: { likes: req.user.id } });
        // const response = await Like.create({ post: req.body., user: req.user.id });
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/follow", auth, async (req, res) => {
    try {
        const response = await Follow.create({ follower: req.user.id, following: req.body.following_id });
        res.send(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post("/get-followers", auth, async (req, res) => {
    try {
        const response = await Follow.find({ following: req.user.id });
        res.send(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get("/get-following", auth, async (req, res) => {
    try {
        const response = await Follow.find({ follower: req.user.id });
        res.send(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});



router.get('/shares', auth, async (req, res) => {
    try {
        const response = await reels.findByIdAndUpdate(req.user.id, { $inc: { shares: 1 } })

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.reelId) res.status(404).json({ message: 'reel id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await Poll.findByIdAndUpdate(req.body.reelId, { $push: { comment: { text: req.body.comment, user: req.user.id } } })
        res.status(200).json({
            message: "comment added successfully",
            data: response
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = router;