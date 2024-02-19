const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const Image = require('../model/image.model');
const auth = require('../middelware/auth');
const Like = require('../model/like.model');
const Follow = require('../model/follow.model');

const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/upload', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log(req.file)

        const { description, category, sub_category } = req.body;



        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
        const image = await Image.create({ category, sub_category, imageUrl, description, user: req.user.id });
        console.log(image);

        res.status(201).json(image);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

});

router.get('/get-post', async (req, res) => {

    try {
        let posts = '';
        console.log(req.query)
        if (req.query.sub_category === 'null' && req.query.category !== 'null') {
            console.log(req.query.category)
            posts = await Image.find({ category: req.query.category })
        } else if (req.query.category !== 'null') {
            posts = await Image.find({ category: req.query.category, sub_category: req.query.sub_category })
        }
        else {

            posts = await Image.find();
        }
        console.log(posts);
        res.send(posts);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', err: error.message });
    }

});

router.post('/likes', auth, async (req, res) => {
    try {
        const postId = req.body.postId;
        const userId = req.user.id;

        // Check if the user has already liked the post
        const post = await Image.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.likes.includes(userId)) {
            return res.status(400).json({ message: 'You have already liked this post' });
        }

        // Add user's ID to the likes array and save the post
        post.likes.push(userId);
        await post.save();

        res.status(200).json({ message: 'Post liked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



router.get('/shares', auth, async (req, res) => {
    try {
        const response = await Image.findByIdAndUpdate(req.user.id, { $inc: { shares: 1 } })

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.postId) res.status(404).json({ message: 'Poll id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await Poll.findByIdAndUpdate(req.body.postId, { $push: { comment: { text: req.body.comment, user: req.user.id } } })
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