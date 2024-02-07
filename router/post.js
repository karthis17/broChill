const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const Image = require('../model/image.model');
const auth = require('../middelware/auth');

// Set up multer for handling file uploads
const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Handle file upload
router.post('/upload', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

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
        const response = await Image.findByIdAndUpdate(req.body.postId, { likes: { $push: req.user.id } })

        res.json(response);
    } catch (error) {
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

module.exports = router;