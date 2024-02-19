const feeds = require('../model/feed.model');
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middelware/auth');
const Follow = require('../model/follow.model');

const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/upload-feed', auth, upload.single('feed'), async (req, res) => {
    console.log(req.body)
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log(req.file)

        const { description, category, title } = req.body;


        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }


        const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
        const reel = await feeds.create({ category, title, imageUrl, description, user: req.user.id, });
        console.log(reel);

        res.status(201).json(reel);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

});



router.get('/get-reel/:id', async (req, res) => {

    try {
        const reel = await feeds.findById(req.params.id);
        res.send(reel)
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', err: error.message });
    }

});

router.get("/get-all", async (req, res) => {
    try {
        const ress = await feeds.find();
        res.json(ress);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/like', auth, async (req, res) => {
    try {
        const feedId = req.body.feedId;
        const userId = req.user.id;

        // Check if the user has already liked the post
        const feed = await feeds.findById(feedId);
        if (!feed) {
            return res.status(404).json({ message: 'feed not found' });
        }

        if (feed.likes.includes(userId)) {
            return res.status(400).json({ message: 'You have already liked this feed' });
        }

        // Add user's ID to the likes array and save the feed
        feed.likes.push(userId);
        await feed.save();

        res.status(200).json({ message: 'feed liked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});




router.get('/shares', auth, async (req, res) => {
    try {
        const response = await feeds.findByIdAndUpdate(req.user.id, { $inc: { shares: 1 } })

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