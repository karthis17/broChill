const Frames = require('../model/frames.model');
const auth = require('../middelware/auth');
const multer = require('multer');
const router = require('express').Router();
const path = require('path');


const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


router.get('/get-frames', async (req, res) => {
    try {
        const response = await Frames.find()
        res.send(response);

    } catch (error) {

        res.status(500).send({ message: "Internal Server Error", err: error.message });

    }
});


router.post('/upload-frame', upload.single('frame'), async (req, res) => {

    if (!req.file) {
        return res.status(404).send({ message: "No file found" });
    }

    let frame = `${req.protocol}://${req.get('host')}/${req.file.filename}`;

    try {
        const results = await Frames.create({ frameName: req.body.frameName, frameUrl: frame });

        res.send(results);
    } catch (error) {

        res.status(500).send("internal error: " + error.message);

    }
});


router.post('/upload-image', auth, upload.single('image'), async (req, res) => {

    if (!req.file) {
        return res.status(404).send({ message: "No file found" });
    }

    if (!req.body.frame_id) return res.status(404).send({ message: "frame id is required" });


    let image = `${req.protocol}://${req.get('host')}/${req.file.filename}`;

    try {
        const results = await Frames.findByIdAndUpdate(req.body.frame_id, { $push: { uploads: { user: req.user.id, image: image } } });

        res.send(results);
    } catch (error) {

        res.status(500).send("internal error: " + error.message);

    }

});

router.post('/likes', auth, async (req, res) => {

    if (!req.body.frame_id) res.status(404).json({ message: 'frame id is required' });

    try {
        const response = await Frames.findByIdAndUpdate(req.body.frame_id, { $push: { like: req.user.id } });
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.frame_id) res.status(404).json({ message: 'frame id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await Frames.findByIdAndUpdate(req.body.frame_id, { $push: { comments: { text: req.body.comment, user: req.user.id } } })
        res.status(200).json({
            message: "comment added successfully",
            data: response
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/share', auth, async (req, res) => {

    if (!req.body.frame_id) res.status(404).json({ message: 'Poll id is required' });

    try {
        const response = await Frames.findByIdAndUpdate(req.body.frame_id, { $push: { share: req.user.id } });
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get('get/:id', async (req, res) => {

    try {
        const response = await Frames.findById(req.params.id);
        res.send(response);
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }

})

module.exports = router;