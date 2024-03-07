const RandImg = require('../model/funtest.model');
const router = require('express').Router();
const auth = require('../middelware/auth');
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');
const adminRole = require('../middelware/checkRole');
const Jimp = require('jimp');


const path = require('path');
const cpUpload1 = uploadFile.fields([{ name: 'frame', maxCount: 1 },
{ name: "thumbnail", maxCount: 1 },
{ name: "referenceImage", maxCount: 1 }
]);

router.post("/upload-frame", auth, adminRole, cpUpload1, async (req, res) => {


    let { description, coordinates, frame_size, textCoordinates } = req.body;

    if (!coordinates) {
        res.status(404).send({ message: "frame coordinates not found" });
    }

    if (!frame_size) {
        res.status(404).send({ message: "frame size not found" });

    }

    if (textCoordinates) {
        textCoordinates = JSON.parse(textCoordinates);
    }

    coordinates = JSON.parse(coordinates)
    frame_size = JSON.parse(frame_size);

    if (!req.files["frame"]) {
        res.status(404).send({ menubar: 'frame is not found' });
    }

    if (!req.files["thumbnail"]) {
        return res.status(404).send({ message: "No tumbnail file found" });

    }

    let thumbnail = await uploadAndGetFirebaseUrl(req.files["thumbnail"][0]);
    let referenceImage = await uploadAndGetFirebaseUrl(req.files["referenceImage"][0]);


    const frameUrl = await uploadAndGetFirebaseUrl(req.files["frame"][0])

    try {

        const frames = [{
            frameUrl, textCoordinates: textCoordinates, coordinates, frame_size,
        }]


        const frame = await RandImg.create({ frames, description, thumbnail, referenceImage, category: "random image", user: req.user.id });
        res.send(frame);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }

});


// router.get('/get-all', async (req, res) => {

//     const lang = req.query.lang;

//     try {

//         const ress = RandImg.find({ language: lang }).populate('user', 'comments.user');
//         res.send(ress);

//     } catch (error) {
//         res.status(500).send({ success: false, error: error.message });
//     }
// });


const cpUpload = uploadFile.fields([{ name: 'image', maxCount: 10 }]);

router.post("/random-image/generate-image", auth, cpUpload, async (req, res) => {

    try {
        const { id, name } = req.body;

        const rees = await RandImg.findById(id);

        const frame = rees.frames[0];

        const ll = req.files['image'].map(async (file, i) => {
            try {
                const image = await uploadAndGetFirebaseUrl(file);

                const baseImage = frame.frameUrl;
                const maskImage = image;
                const outputPath = path.join(__dirname, "../uploads/name" + i + ".png");

                await applyMask(baseImage, maskImage, outputPath, frame.coordinates, frame.frame_size.height, frame.frame_size.width);
            } catch (error) {
                console.error("Error processing image:", error);
                throw error;
            }
        });

        await Promise.all(ll);

        res.send({ message: "Images processed successfully" });

        res.send()

    } catch (error) {
        console.error("Error in image processing:", error);
        res.status(500).json({ error: true, message: "Internal server error" });
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




router.get('/:id', async (req, res) => {
    try {
        const frame = await RandImg.findById(req.params.id);
        res.send(frame);
    } catch (error) {

        res.status(500).send(error.message);
    }
});

router.post('/:postId/like', auth, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id; // Assuming user is authenticated and user ID is available in request

        // Check if the post is already liked by the user
        const post = await RandImg.findById(postId);
        const isLiked = post.likes.includes(userId);

        // Update like status based on current state
        if (isLiked) {
            // If already liked, unlike the post
            post.likes.pull(userId);
        } else {
            // If not liked, like the post
            post.likes.push(userId);
        }

        // Save the updated post
        await post.save();

        res.status(200).json({ success: true, message: 'Post liked/unliked successfully.' });
    } catch (error) {
        console.error('Error liking/unliking post:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request.' });
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


router.delete('/delete/:id', auth, adminRole, async (req, res) => {
    try {

        const ress = await RandImg.findById(req.params.id)

        if (!!ress)
            await RandImg.deleteOne({ _id: req.params.id });
        res.send({ message: "deleted successfully" });
    } catch (error) {
        res.status(500).send({ message: "internal error: " + error.message })
    }
});


router.put('/update', auth, adminRole, uploadFile.single('frame'), async (req, res) => {

    let { frameName, frameUrl, id } = req.body;


    if (req.file) {
        frameUrl = await uploadAndGetFirebaseUrl(req);
    }

    try {
        const updatedFrame = await RandImg.findByIdAndUpdate(id, { $set: { frameUrl, frameName } });
        res.send({ success: true, message: "updated successfully" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }

})



async function applyMask(baseImagePath, maskImages, outputPath, coordinate, baseH, baseW) {
    try {
        const baseImage = await Jimp.read(baseImagePath);


        const { x, y, width, height } = coordinate[0];
        console.log(x)

        const maskImage = await Jimp.read(maskImages);
        maskImage.resize(+width, +height);
        baseImage.resize(+baseW, +baseH);
        baseImage.composite(maskImage, +x, +y, {
            mode: Jimp.BLEND_DESTINATION_OVER
        });


        await baseImage.writeAsync(outputPath);


        console.log('Mask applied successfully.');
    } catch (error) {

        console.error('An error occurred:', error);
    }
}



module.exports = router;