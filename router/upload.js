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

        const { description, user } = req.body;

        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
        const image = await Image.create({ filename: req.file.filename, originalFilename: req.file.originalname, path: imageUrl, description, username: user });
        console.log(image);

        res.status(201).json(image);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

});

module.exports = router;