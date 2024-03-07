const Percentage = require('../model/funtest.model');
const router = require('express').Router();
const auth = require('../middelware/auth');
const multer = require('multer');
const path = require('path');
const Jimp = require('jimp');
const adminRole = require('../middelware/checkRole');
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');



// router.post("/add-single-frame", auth, adminRole, upload.single('frame'), async (req, res) => {

//     console.log(req.body)
//     let { question, frame_size, coordinates, questionDifLang } = req.body;

//     if (questionDifLang) {
//         questionDifLang = JSON.parse(questionDifLang);
//     }

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

//             console.log("Image resized successfully!");
//         } catch (error) {
//             console.error("Error:", error);
//         }

//     } else {

//         return res.status(404).send({ message: "No file found" });
//     }

//     let frameUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;

//     try {
//         const ress = await Percentage.create({ question, questionDifLang, frame: { frameUrl, path: req.file.path, coordinates, frame_size } });
//         res.send(ress);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send(error.message);
//     }

// });


const cpUpload = uploadFile.fields([{ name: 'frame', maxCount: 2 }, { name: "thumbnail", maxCount: 1 }]);
router.post("/add-frame", auth, adminRole, cpUpload, async (req, res) => {

    let range = req.body.range;

    let type = req.body.type;

    if (range) {
        range = JSON.stringify(range)
    }

    try {
        console.log(req.body);
        let { question, frames, description } = req.body;

        if (frames) {
            frames = JSON.parse(frames);
        }

        if (!req.files || !req.files['frame']) {
            return res.status(404).send({ message: "No file found" });
        }

        const framePromises = req.files['frame'].map(async (frame1, i) => {

            console.log(frame1);

            let frameUrl = await uploadAndGetFirebaseUrl(frame1)
            frames[i]['frameUrl'] = frameUrl;
            console.log(frames[i]['frameUrl'])

        });
        if (!req.files["thumbnail"]) {
            return res.status(404).send({ message: "No file found" });

        }



        let thumbnail = await uploadAndGetFirebaseUrl(req.files['thumbnail'][0]);

        await Promise.all(framePromises);

        const ress = await Percentage.create({ question, frames, range, description: "asfdgh", thumbnail, category: "single percentage", user: req.user.id });
        console.log(ress);
        res.send(ress);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }

});


// router.get('/get-all', async (req, res) => {
//     try {
//         const lang = req.query.lang;

//         const result = await Percentage.find().populate('comments.user');
//         if (lang && lang.toLowerCase() !== "english") {
//             let ress = await result.filter(p => {
//                 const question = p.questionDifLang.find(tit => tit.lang === lang);

//                 if (question) {

//                     p.question = question.text;
//                     return p;
//                 } else {
//                     return false;
//                 }
//             });

//             res.json(ress);
//         } else {

//             res.json(result);
//         }
//     } catch (error) {

//         res.status(500).send(error.message);
//     }
// });




router.post('/:postId/like', auth, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id; // Assuming user is authenticated and user ID is available in request

        // Check if the post is already liked by the user
        const post = await Percentage.findById(postId);
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


// router.get('/genarate-single/:id', async (req, res) => {

//     try {
//         const ress = await Percentage.findById(req.params.id);

//         const randomNumber = `${Math.floor(Math.random() * 100 + 1)}%`;
//         const baseImage = path.join(__dirname, `../${await ress.frame[0].path}`);
//         const coord = await ress.frame[0].coordinates;
//         const outputPath = path.join(__dirname, `../uploads/${req.params.id}.png`);

//         await applyMask(baseImage, outputPath, randomNumber, coord);
//         res.send({ _id: req.params.id, result: `${req.protocol}://${req.get('host')}/${`${req.params.id}.png`}` });
//     } catch (error) {

//         res.status(500).send(error.message);
//     }

// });


router.get('/single-percentage/:id', async (req, res) => {
    try {
        const re = await Percentage.findById(req.params.id);

        const randomNumber = Math.floor(Math.random() * 100 + 1);
        const baseImage = await re.frame[0].frameUrl;
        const coord = await re.frame[0].coordinates;
        const outputPath = path.join(__dirname, `../uploads/${req.params.id + await frame._id}.png`);


        // await the result of applyMask
        let ress = await applyMask(baseImage, outputPath, randomNumber, coord);


        res.send({ _id: req.params.id, result: ress });
    } catch (error) {
        res.status(500).send(error.message);
    }
})

router.get('/genarate/:id', async (req, res) => {

    try {
        const ress = await Percentage.findById(req.params.id);

        const result = await Promise.all(ress.frames.map(async (frame, i) => {
            const randomNumber = `${Math.floor(Math.random() * 100 + 1)}%`;
            const baseImage = await frame.frameUrl;
            const coord = await frame.coordinates;
            const outputPath = path.join(__dirname, `../uploads/${req.params.id + await frame._id}.png`);

            // await the result of applyMask
            let ress = await applyMask(baseImage, outputPath, randomNumber, coord);

            return {
                result1: ress
            };
        }));

        res.send({ _id: req.params.id, result });
    } catch (error) {
        res.status(500).send(error.message);
    }

});

router.get('/percentage-range/:id', async (req, res) => {
    try {
        const re = await Percentage.findById(req.params.id);

        const randomNumber = Math.floor(Math.random() * 100 + 1);

        const number = re.range.find(r => r.maxRange >= randomNumber && r.minRange <= randomNumber);

        const baseImage = await re.frame[0].frameUrl;
        const coord = await re.frame[0].coordinates;
        const outputPath = path.join(__dirname, `../uploads/${req.params.id + await frame._id}.png`);


        // await the result of applyMask
        let ress = await applyMask(baseImage, outputPath, number.value, coord);


        res.send({ _id: req.params.id, result: ress });
    } catch (error) {
        res.status(500).send(error.message);
    }
})


router.post('/share', async (req, res) => {
    try {
        const response = await Percentage.findByIdAndUpdate(req.body.id, { $inc: { shares: 1 } })

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.id) res.status(404).json({ message: 'id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await Percentage.findByIdAndUpdate(req.body.id, { $push: { comments: { text: req.body.comment, user: req.user.id } } })
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


        await Percentage.deleteOne({ _id: req.params.id });

        res.send({ message: "deleted successfully" });
    } catch (error) {
        res.status(500).send({ message: "internal error: " + error.message })
    }
});

const cpUpload1 = uploadFile.fields([{ name: 'frame', maxCount: 2 }]);

router.put('/update', cpUpload1, async (req, res) => {

    try {
        console.log(req.body);
        let { question, frames, questionDifLang, id } = req.body;

        if (frames) {
            frames = JSON.parse(frames);
        }

        if (questionDifLang) {
            questionDifLang = JSON.parse(questionDifLang);
        }
        let framePromises;
        if (req.files['frame']) {
            framePromises = req.files['frame'].map(async (frame1, i) => {
                let frameUrl = `${req.protocol}://${req.get('host')}/${frame1.filename}`;
                frames[i]['frameUrl'] = frameUrl;
                console.log(frames[i]['frameUrl'])
                frames[i]['path'] = frame1.path;

                try {
                    let pathF = path.join(__dirname, `../${frame1.path}`);
                    const image = await Jimp.read(pathF);
                    await image.resize(frames[i].frame_size.width, frames[i].frame_size.height);
                    await image.writeAsync(pathF);
                    console.log("Image resized successfully!");
                } catch (error) {
                    console.error("Error:", error);
                }
            });

            await Promise.all(framePromises);
        }



        const ress = await Percentage.findByIdAndUpdate(id, { $set: { question, questionDifLang, frames } });
        res.send(ress);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }


})

async function applyMask(baseImagePath, text, coordinates) {
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

        // Convert the modified image to a data URL
        const imageData = await image.getBase64Async(Jimp.AUTO);

        console.log("Text overlay added successfully.");

        return imageData; // Return the data URL
    } catch (error) {
        console.error("Error:", error);
        throw error; // Throw the error to handle it externally
    }
}

module.exports = router;