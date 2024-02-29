const RandImg = require('../model/randomImage.model');
const router = require('express').Router();
const auth = require('../middelware/auth');
const multer = require('multer');
const path = require('path');
const deleteImage = require('../commonFunc/delete.image');




const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + file.originalname + new Date().getMilliseconds() + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });



router.post("/upload-frame", upload.single('frame'), async (req, res) => {


    const { frameName } = req.body;

    if (!req.file) {
        res.status(404).send({ menubar: 'frame is not found' });
    }

    let frameUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;

    const framePath = req.file.path;

    try {
        const frame = await RandImg.create({ framePath, frameUrl, frameName });
        res.send(frame);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }

});


router.get('/get-frame', async (req, res) => {

    try {
        const frames = await RandImg.find();
        const randomNum = Math.floor(Math.random() * frames.length);

        res.send(frames[randomNum]);
    } catch (error) {

        res.status(500).send(error.message);
    }

});


router.get('/get-all', async (req, res) => {
    try {
        const frames = await RandImg.find();
        res.send(frames);
    } catch (error) {

        res.status(500).send(error.message);
    }
});


router.get('/:id', async (req, res) => {
    try {
        const frame = await RandImg.findById(req.params.id);
        res.send(frame);
    } catch (error) {

        res.status(500).send(error.message);
    }
});


router.post('/likes', auth, async (req, res) => {
    try {
        const frame_id = req.body.id;
        const userId = req.user.id;

        // Check if the user has already liked the post
        const frame = await RandImg.findById(frame_id);
        if (!frame) {
            return res.status(404).json({ message: 'frame not found' });
        }

        if (frame.likes.includes(userId)) {
            return res.status(400).json({ message: 'You have already liked this frame' });
        }

        // Add user's ID to the likes array and save the frame
        frame.likes.push(userId);
        await frame.save();

        res.status(200).json({ message: 'frame liked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});




router.post('/share', async (req, res) => {
    try {
        const response = await RandImg.findByIdAndUpdate(req.body.id, { $inc: { shares: 1 } })

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.id) res.status(404).json({ message: 'feed id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await RandImg.findByIdAndUpdate(req.body.id, { $push: { comments: { text: req.body.comment, user: req.user.id } } })
        res.status(200).json({
            message: "comment added successfully",
            data: response
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.delete('/delete/:id', async (req, res) => {
    try {

        const ress = await RandImg.findById(req.params.id)

        if (deleteImage(path.join(__dirname, `../${ress.framePath}`))) {

            await RandImg.deleteOne({ _id: req.params.id });
        } else {
            res.status(404).send({ error: 'err while deleting image' });
        }
        res.send({ message: "deleted successfully" });
    } catch (error) {
        res.status(500).send({ message: "internal error: " + error.message })
    }
});


router.put('/update', upload.single('frame'), async (req, res) => {

    let { frameName, framePath, frameUrl, id } = req.body;


    if (req.file) {
        deleteImage(path.join(__dirname, `../${framePath}`));
        frameUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
        framePath = req.file.path;
    }

    try {
        const updatedFrame = await RandImg.findByIdAndUpdate(id, { $set: { frameUrl, framePath, frameName } });
        res.send({ success: true, message: "updated successfully" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }

})

module.exports = router;