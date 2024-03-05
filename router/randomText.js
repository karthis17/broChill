const randomText = require('../model/randomeText.model');
const router = require('express').Router();
const auth = require('../middelware/auth'); const multer = require('multer');
const path = require('path');
const Jimp = require('jimp');
const deleteImage = require('../commonFunc/delete.image');
const adminRole = require('../middelware/checkRole');
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');




const cpUpload1 = uploadFile.fields([{ name: 'frame', maxCount: 1 }
    , { name: "thumbnail", maxCount: 1 }
    , { name: "referenceImage", maxCount: 1 }
]);

router.post("/add-question", auth, adminRole, cpUpload1, async (req, res) => {


    let { question, texts, frame_size, coordinates, } = req.body;

    if (frame_size) {
        frame_size = JSON.parse(frame_size);
    }

    if (coordinates) {
        coordinates = JSON.parse(coordinates);
    }

    if (!req.files["frame"]) {
        res.status(404).send({ menubar: 'frame is not found' });
    }

    if (!req.files["thumbnail"]) {
        return res.status(404).send({ message: "No tumbnail file found" });

    }
    if (!req.files["referenceImage"]) {
        return res.status(404).send({ message: "No tumbnail file found" });

    }

    let thumbnail = await uploadAndGetFirebaseUrl(req.files["thumbnail"][0]);
    let referenceImage = await uploadAndGetFirebaseUrl(req.files["referenceImage"][0]);


    const frameUrl = await uploadAndGetFirebaseUrl(req.files["frame"][0])





    try {
        const ress = await randomText.create({ question, texts, frameUrl, path: req.file.path, coordinates, frame_size, thumbnail, referenceImage });
        res.send(ress);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }

});


router.get('/genarate/:id', async (req, res) => {

    try {
        const ress = await randomText.findById(req.params.id);

        const randomNumber = Math.floor(Math.random() * await ress.texts.length);
        const text = await ress.texts[randomNumber];
        const baseImage = path.join(__dirname, `../${await ress.path}`);
        const coord = await ress.coordinates[0];
        const outputPath = path.join(__dirname, `../uploads/${req.params.id}.png`);

        await applyMask(baseImage, outputPath, text, coord);
        res.send({ _id: req.params.id, result: `${req.protocol}://${req.get('host')}/${`${req.params.id}.png`}` });
    } catch (error) {

        res.status(500).send(error.message);
    }

});


router.get('/get-all', async (req, res) => {
    try {
        const result = await randomText.find().populate('comments.user');
        res.send(result);
    } catch (error) {

        res.status(500).send(error.message);
    }
});

// router.post('/result', async (req, res) => {

//     const { range, id } = req.body;

//     try {
//         const document = await randomText.findById(id);
//         if (!document) {
//             res.status(404).send({ message: "No document found with the provided ID." });
//         }

//         const result = document.result.find(item => {
//             return item.rangeFrom < range && item.rangeTo > range;
//         });

//         if (result) {
//             res.send({ text: result.text, _id: id });
//         } else {
//             res.status(404).send({ message: "No text found for the given range." });
//         }
//     } catch (err) {
//         console.error(err);
//         throw err;
//     }
// });
router.post('/:postId/like', auth, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id; // Assuming user is authenticated and user ID is available in request

        // Check if the post is already liked by the user
        const post = await randomText.findById(postId);
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
        const response = await randomText.findByIdAndUpdate(req.body.id, { $inc: { shares: 1 } })


        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.id) res.status(404).json({ message: 'id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await randomText.findByIdAndUpdate(req.body.id, { $push: { comments: { text: req.body.comment, user: req.user.id } } })
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
        const response = await randomText.findById(req.params.id)


        deleteImage(path.join(__dirname, `../${await response.path}`));
        await randomText.deleteOne({ _id: req.params.id });

        res.send({ message: "deleted successfully" });
    } catch (error) {
        res.status(500).send({ message: "internal error: " + error.message })
    }
});


// router.put('/update', auth, adminRole, upload.single('frame'), async (req, res) => {

//     let { question, texts, frame_size, coordinates, frameUrl, framePath, id } = req.body;

//     if (frame_size) {
//         frame_size = JSON.parse(frame_size);
//     }

//     if (coordinates) {
//         coordinates = JSON.parse(coordinates);
//     }

//     if (req.file) {

//         try {
//             let pathF = path.join(__dirname, `../${req.file.path}`);
//             const image = await Jimp.read(pathF);

//             await image.resize(frame_size.width, frame_size.height);

//             await image.writeAsync(pathF);

//             frameUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;

//             framePath = req.file.path;

//             console.log("Image resized successfully!");
//         } catch (error) {
//             console.error("Error:", error);
//         }

//     }




//     try {
//         const ress = await randomText.findByIdAndUpdate(id, { $set: { question, texts, frameUrl, path: framePath, coordinates, frame_size } });

//         res.send(ress);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send(error.message);
//     }

// });


async function applyMask(baseImagePath, outputPath, text, coordinates) {
    try {
        const image = await Jimp.read(baseImagePath);

        // Define the text properties
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK); // Load black font
        const { x, y, width, height } = coordinates;

        // Calculate the center coordinates within the specified region
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        // Measure text width and height
        const textWidth = Jimp.measureText(font, text);
        const textHeight = Jimp.measureTextHeight(font, text);

        // Calculate the starting position of the text to achieve center alignment
        const textX = centerX - textWidth / 2;
        const textY = centerY - textHeight / 2;

        // Print the text in the center of the region
        image.print(font, textX, textY, text);

        // Save the modified image
        await image.writeAsync(outputPath);

        console.log("Text overlay added successfully.");
    } catch (error) {
        console.error("Error:", error);
    }
}


module.exports = router;