const Frames = require('../model/frames.model');
const auth = require('../middelware/auth');
const multer = require('multer');
const router = require('express').Router();
const path = require('path');
const Jimp = require('jimp');

const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + new Date().getMilliseconds() + '-' + Date.now() + path.extname(file.originalname));
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


    let { frameName, frame_size, coordinates } = req.body;

    console.log('Framesize:', JSON.parse(frame_size));
    console.log('Coordinates:', JSON.parse(coordinates));

    frame_size = JSON.parse(frame_size);
    coordinates = JSON.parse(coordinates);

    if (!req.file) {
        return res.status(404).send({ message: "No file found" });
    }

    let frameUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;

    try {
        const results = await Frames.create({ frameName, frameUrl, frame_size, coordinates, path: req.file.path });


        res.send(results);
    } catch (error) {

        res.status(500).send("internal error: " + error.message);

    }
});


const cpUpload = upload.fields([
    { name: 'image', maxCount: 5 },
]);

router.post('/upload-image', auth, cpUpload, async (req, res) => {

    if (!req.files) {
        return res.status(404).send({ message: "No file found" });
    }

    if (!req.body.frame_id) return res.status(404).send({ message: "frame id is required" });


    let image = `${req.protocol}://${req.get('host')}/${req.files['image'][0].filename}`;

    try {
        const results = await Frames.findByIdAndUpdate(req.body.frame_id);


        console.log(results);

        const baseImagePath = path.join(__dirname, `../${results.path}`);
        const outputPath = path.join(__dirname, `../${req.files['image'][0].path}`);
        const corrdinates = await results.coordinates;

        const maskImage = corrdinates.map((coordinate, i) => {
            return {
                path: path.join(__dirname, `../${req.files['image'][i].path}`),
                width: coordinate.width,
                height: coordinate.height,
                x: coordinate.x,
                y: coordinate.y
            };
        });
        await applyMask(baseImagePath, maskImage, outputPath, results.frame_size.width, results.frame_size.height)


        await results.uploads.push({ image, user: req.user.id });

        await results.save();

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



async function applyMask(baseImagePath, maskImages, outputPath, baseW, baseH) {
    try {
        // Load images
        const baseImage = await Jimp.read(baseImagePath);

        console.log(baseImagePath, maskImages, outputPath);

        // Apply each mask image onto the base image
        for (let i = 0; i < maskImages.length; i++) {
            const { path, x, y, width, height } = maskImages[i];
            console.log(path, x, y, width, height);
            const maskImage = await Jimp.read(path);
            maskImage.resize(+width, +height);
            baseImage.resize(+baseW, +baseH);
            baseImage.composite(maskImage, x, y, {
                mode: Jimp.BLEND_DESTINATION_OVER
            });
        }

        // Save the resulting image
        await baseImage.writeAsync(outputPath);



        console.log('Mask applied successfully.');
    } catch (error) {
        console.error('An error occurred:', error);
    }
}


module.exports = router;