const Frames = require('../model/frames.model');
const auth = require('../middelware/auth');
const multer = require('multer');
const router = require('express').Router();
const path = require('path');
const Jimp = require('jimp');

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


    console.log(req.body)

    const coordinates = { x: req.body.x, y: req.body.y, width: req.body.coordinateW, height: req.body.coordinateH }
    const frame_size = { width: req.body.frameW, height: req.body.frameH }

    if (!req.file) {
        return res.status(404).send({ message: "No file found" });
    }

    let frameUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;

    try {
        const results = await Frames.create({ frameName: req.body.frameName, frameUrl, frame_size, coordinates, path: req.file.path });


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
        const results = await Frames.findByIdAndUpdate(req.body.frame_id);

        const baseImagePath = path.join(__dirname, `../${results.path}`);
        const maskImagePath = path.join(__dirname, `../${req.file.path}`);
        const outputPath = path.join(__dirname, `../${req.file.path}`);

        console.log(results);

        await applyMask(baseImagePath, maskImagePath, outputPath, results.coordinates.x, results.coordinates.y, results.frame_size.width, results.frame_size.height, results.coordinates.width, results.coordinates.height)

        res.send({ results, link: image });
    } catch (error) {

        res.status(500).send("internal error: " + error.message);

    }

});

router.post('/likes', auth, async (req, res) => {

    try {
        const frame_id = req.body.frame_id;
        const userId = req.user.id;
        console.log(req.body)

        const frame = await Frames.findById(frame_id);
        if (!frame) {
            return res.status(404).json({ message: 'frame not found' });
        }

        if (frame.likes.includes(userId)) {
            return res.status(400).json({ message: 'You have already liked this frame' });
        }

        frame.likes.push(userId);
        await frame.save();

        res.status(200).json({ message: 'frame liked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
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

router.post('/share', async (req, res) => {

    if (!req.body.frame_id) res.status(404).json({ message: 'Poll id is required' });

    try {
        const response = await Frames.findByIdAndUpdate(req.body.frame_id, { $inc: { shares: 1 } });
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

});



async function applyMask(baseImagePath, maskImagePath, outputPath, x, y, baseW, baseH, maskW, maskH) {
    try {
        // Load images
        const baseImage = await Jimp.read(baseImagePath);
        const maskImage = await Jimp.read(maskImagePath);

        console.log(+maskW, +maskH, +baseH, +baseW);
        console.log(maskW, maskH, baseH, baseW);

        maskImage.resize(+maskW, +maskH);
        baseImage.resize(+baseW, +baseH);

        baseImage.composite(maskImage, x, y, {
            mode: Jimp.BLEND_DESTINATION_OVER
        });

        // Save the resulting image
        await baseImage.writeAsync(outputPath);



        console.log('Mask applied successfully.');
    } catch (error) {
        console.error('An error occurred:', error);
    }
}


module.exports = router;