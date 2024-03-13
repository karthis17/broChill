const auth = require('../middelware/auth');
const Nameing = require('../model/nameing.model');
const router = require('express').Router();
const adminRole = require('../middelware/checkRole');
const { uploadFile, uploadAndGetFirebaseUrl, bucket } = require('../commonFunc/firebase');
const path = require('path');
const Jimp = require('jimp');
const Category = require('../model/categoryModel');

const cpUpload = uploadFile.fields([
    { name: 'frame', maxCount: 20 },
    { name: 'thumbnail', maxCount: 1 },
]);

router.post('/add', auth, adminRole, cpUpload, async (req, res) => {

    let { description, isActive, language, frames, percentageTexts, facts, meanings, type } = req.body;

    if (frames) {
        frames = JSON.parse(frames);
    }

    if (percentageTexts) {
        percentageTexts = JSON.parse(percentageTexts);
    }
    if (facts) {
        facts = JSON.parse(facts);
    }
    if (meanings) {
        meanings = JSON.parse(meanings);
    }



    if (!req.files["thumbnail"]) {
        return res.status(404).send({ message: "No file found" });

    }


    if (!type.includes("name")) {
        await Promise.all(frames.map(async (frame, i) => {
            frames[i].frameUrl = await uploadAndGetFirebaseUrl(req.files['frame'][i])
        }));
    }


    let thumbnail = await uploadAndGetFirebaseUrl(req.files["thumbnail"][0]);



    try {
        const result = await Nameing.create({ description, isActive, language, frames, percentageTexts, facts, meanings, category: type, user: req.user.id, thumbnail });


        const Language = await Category.findById(result.language);
        if (!Language) {
            return res.status(404).send({ success: false, error: 'Language not found' });
        }
        Language.data.nameTest.push(result._id);
        const savedCategory = await Language.save();

        res.send(result)
    } catch (error) {
        res.status(500).send({ message: "Error creating image", error: error.message });
    }
});


router.get('/get-all', async (req, res) => {

    let lang = req.query.lang;
    try {
        const result = await Nameing.find({ language: lang, isActive: true }).select(["-frames", "-percentageTexts", "-facts", "-meanings"]).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user'
            }
        });
        res.send(result);
    } catch (error) {

        res.status(500).send(error.message);
    }
});

router.post("/calculate-love/:postId", async (req, res) => {


    const { name1, name2 } = req.body;
    try {
        const result = await Nameing.findById(req.params.postId);

        const randomNumber = Math.floor(Math.random() * 100 + 1);

        const text = await result.percentageTexts.find(ress => ress.minPercentage <= randomNumber && ress.maxPercentage >= randomNumber);
        let frame = await result.frames[0];

        console.log(result.frames.length)

        if (result.frames.length > 1) {
            frame = await result.frames[Math.floor(Math.random() * result.frames.length)];
        } else {
            frame = await result.frames[0];
        }
        console.log(name1, name2, text)
        let baseImage = await frame.frameUrl;

        const width = frame.frame_size.width;
        const height = frame.frame_size.height;
        const textCoord = frame.textPosition;
        const percentageCoord = frame.percentagePosition;
        const name1Coord = frame.name1Position;
        const name2Coord = frame.name2Position;

        const outputPath = path.join(__dirname, `../uploads/${req.params.postId}.png`);

        let cood = [{

            coordinate: textCoord,
            text: text.text[Math.floor(Math.random() * text.text.length)]
        }, {

            coordinate: percentageCoord,
            text: `${randomNumber}%`
        }, {

            coordinate: name1Coord,
            text: name1
        }, {

            coordinate: name2Coord,
            text: name2
        }
        ]

        await applyMask(baseImage, outputPath, width, height, cood);

        res.send({ result: `${req.protocol}://${req.get('host')}/${req.params.postId}.png` })

    } catch (error) {
        console.error(error)
        res.status(500).send({ error: error.message });
    }

});


router.post("/calculate-friendship/:postId", async (req, res) => {


    const { name1, name2 } = req.body;
    try {
        const result = await Nameing.findById(req.params.postId);

        const randomNumber = Math.floor(Math.random() * 100 + 1);

        const text = await result.percentageTexts.find(ress => ress.minPercentage <= randomNumber && ress.maxPercentage >= randomNumber);
        let frame = await result.frames[0];

        console.log(text, "jkshd");

        if (result.frames.length > 1) {
            frame = await result.frames[Math.floor(Math.random() * result.frames.length)];
        } else {
            frame = await result.frames[0];
        }
        console.log(name1, name2, text)
        let baseImage = await frame.frameUrl;

        console.log(frame)
        const width = frame.frame_size.width;
        const height = frame.frame_size.height;
        const textCoord = frame.textPosition;
        const percentageCoord = frame.percentagePosition;
        const name1Coord = frame.name1Position;
        const name2Coord = frame.name2Position;

        const outputPath = path.join(__dirname, `../uploads/${req.params.postId}.png`);

        let cood = [{

            coordinate: textCoord,
            text: text.text[Math.floor(Math.random() * text.text.length)]
        }, {

            coordinate: percentageCoord,
            text: `${randomNumber}%`
        }, {

            coordinate: name1Coord,
            text: name1
        }, {

            coordinate: name2Coord,
            text: name2
        }
        ]

        await applyMask(baseImage, outputPath, width, height, cood);

        res.send({ result: `${req.protocol}://${req.get('host')}/${req.params.postId}.png` })

    } catch (error) {
        console.error(error)
        res.status(500).send({ error: error.message });
    }

});


router.post('/flames/:id', async (req, res) => {

    const { name1, name2 } = req.body;

    console.log(name1, name2);
    try {

        let word = await calculateFLAMES(name1, name2);

        if (!word) {

            word = "love"
        }

        console.log(word);

        const result = await Nameing.findById(req.params.id);

        let frame = await Promise.all(result.frames.filter((frame, i) => {
            console.log(frame.flame_word)
            if (frame.flame_word.toLowerCase() === word.toLowerCase()) {
                return frame;
            }
        }));

        frame = frame[0]

        console.log(frame)

        const baseImage = await frame.frameUrl;
        const outputPath = path.join(__dirname, `../uploads/${req.params.id}.png`);
        let text = await frame.textFlames.text;
        console.log(text);
        const textCord = await frame.textFlames;
        const wordCord = await frame.WordPosition;
        const width = frame.frame_size.width;
        const height = frame.frame_size.height;
        text = text.replace('<fname1>', name1);
        text = text.replace('<fname2>', name2);


        let coord = [{
            coordinate: textCord,
            text: text
        },
        {
            coordinate: wordCord,
            text: word
        }
        ]

        await applyMask(baseImage, outputPath, width, height, coord);
        res.send({
            success: true,
            result: `${req.protocol}://${req.get('host')}/${req.params.id}.png`
        })

    } catch (error) {
        console.log(error);
    }
})

async function calculateFLAMES(name1, name2) {
    const flames = ['Friends', 'Love', 'Affection', 'Marriage', 'Enmity', 'Sibling'];
    const commonLetters = [...new Set(name1.toLowerCase())].filter(letter => name2.toLowerCase().includes(letter));
    const resultIndex = (commonLetters.length - 1) % flames.length;

    return flames[resultIndex];
}

async function applyMask(baseImagePath, outputPath, bwidth, bheight, coord) {
    try {
        const image = await Jimp.read(baseImagePath);

        image.resize(+bwidth, +bheight);

        console.log(coord)
        await Promise.all((coord.map(async (co) => {
            const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK); // Load black font
            const { x, y, width, height } = co.coordinate;
            let text = co.text;

            // // Calculate the center coordinates within the specified region
            // const centerX = x + width / 2;
            // const centerY = y + height / 2;

            // // Measure text width and height
            // const textWidth = Jimp.measureText(font, text);
            // const textHeight = Jimp.measureTextHeight(font, text);

            // // Calculate the starting position of the text to achieve center alignment
            // const textX = centerX - textWidth / 2;
            // const textY = centerY - textHeight / 2;

            // // Print the text in the center of the region
            // image.print(font, textX, textY, text);

            image.print(font, parseInt(x), parseInt(y), {
                text: text,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
            }, parseInt(width), parseInt(height));

        })))

        // Define the text properties


        // Save the modified image
        await image.writeAsync(outputPath);

        console.log("Text overlay added successfully.");
    } catch (error) {
        console.error("Error:", error);
    }
}

router.post('/name-meaning/:id', async (req, res) => {
    const { name } = req.body;

    try {
        const result = await Nameing.findById(req.params.id);

        let mean = [];

        [...name.toLowerCase()].forEach(char => {
            const foundMeaning = result.meanings.find(nam => nam.letter.toLowerCase().trim() === char);
            if (foundMeaning) {
                // Shuffle the array of meanings for this character
                const shuffledMeanings = foundMeaning.meaning.sort(() => Math.random() - 0.5);
                // Pick the first meaning from the shuffled array
                mean.push({ letter: char, meaning: shuffledMeanings[0] });
            }
        });
        res.send(mean);

    } catch (error) {
        console.log("Error:", error);
        res.status(500).send(error.message);
    }

});

router.post('/name-fact/:id', async (req, res) => {
    const { name, gender } = req.body;

    try {
        const result = await Nameing.findById(req.params.id);

        let facts = result.facts.filter(f => f.gender.toLowerCase().charAt(0) === gender.toLowerCase().charAt(0));
        const randNumber = Math.floor(Math.random() * facts.length);
        let fact = facts[randNumber];

        fact = fact.fact.replace('<fname>', name);

        res.send(fact);

    } catch (error) {
        console.log(error)
    }
});


router.post('/:postId/like', auth, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id; // Assuming user is authenticated and user ID is available in request

        // Check if the post is already liked by the user
        const post = await Nameing.findById(postId);
        const isLiked = post.likes.includes(userId);

        let like = false;
        let dislike = false;

        // Update like status based on current state
        if (isLiked) {

            // If already liked, unlike the post
            post.likes.pull(userId);
            like = true;
        } else {
            // If not liked, like the post
            post.likes.push(userId);
            dislike = true;
        }

        // Save the updated post
        await post.save();

        res.status(200).json({ success: true, like, dislike, message: 'Post liked/unliked successfully.' });
    } catch (error) {
        console.error('Error liking/unliking post:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request.' });
    }
});





router.get('/share/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const response = await Nameing.findByIdAndUpdate(postId, { $inc: { shares: 1 } }, { new: true })
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/view/:id', async (req, res) => {

    const id = req.params.id;

    try {
        const response = await Nameing.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.id) res.status(404).json({ message: 'id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await Nameing.findByIdAndUpdate(req.body.id, { $push: { comments: { text: req.body.comment, user: req.user.id } } }, { new: true })
        res.status(200).json({
            message: "comment added successfully",
            data: response
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.get("/all", async (req, res) => {
    try {
        const response = await Nameing.find();
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
})


router.get('/publish/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await Nameing.findByIdAndUpdate(postId, { $set: { isActive: true } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});

router.get('/draft/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await Nameing.findByIdAndUpdate(postId, { $set: { isActive: false } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});


const cpUpload1 = uploadFile.fields([
    { name: 'frame', maxCount: 20 },
    { name: 'thumbnail', maxCount: 1 },
]);

router.post('/update', auth, adminRole, cpUpload1, async (req, res) => {

    let { description, isActive, language, frames, percentageTexts, thumbnail, facts, meanings, type, id } = req.body;

    if (frames) {
        frames = JSON.parse(frames);
    }

    if (percentageTexts) {
        percentageTexts = JSON.parse(percentageTexts);
    }
    if (facts) {
        facts = JSON.parse(facts);
    }
    if (meanings) {
        meanings = JSON.parse(meanings);
    }



    let i = 0

    if (!type.includes("name")) {
        await Promise.all(frames.map(async (frame) => {
            try {
                console.log(frame.fileUrl)
            } catch (e) {
                console.log(e.message);
                frames[i].frameUrl = await uploadAndGetFirebaseUrl(req.files['frame'][i++])
            }
        }));
    }


    if (req.files['thumbnail'])
        thumbnail = await uploadAndGetFirebaseUrl(req.files["thumbnail"][0]);



    try {
        const result = await Nameing.findByIdAndUpdate(id, { description, isActive, language, frames, percentageTexts, facts, meanings, category: type, user: req.user.id, thumbnail });


        const Language = await Category.findById(result.language);
        if (!Language) {
            return res.status(404).send({ success: false, error: 'Language not found' });
        }
        Language.data.nameTest.push(result._id);
        const savedCategory = await Language.save();

        res.send(result)
    } catch (error) {
        res.status(500).send({ message: "Error creating image", error: error.message });
    }
});


router.delete('/delete/:id', auth, adminRole, async (req, res) => {
    try {
        const ress = await Nameing.findById(req.params.id);


        let data = [ress.thumbnail, ress.frameUrl, ...ress.frames.map(f => f.frameUrl)];


        await Promise.all(data.map(async (url) => {
            if (url) {

                const fileUrl = url;
                const encodedFileName = fileUrl.split('/').pop().split('?')[0];
                const fileName = decodeURIComponent(encodedFileName);
                console.log("Attempting to delete file:", fileName);
                try {

                    await bucket.file(fileName).delete();
                    console.log(fileName, "deleted");
                } catch (e) {
                    console.log("Error deleting file", e.message);
                }
            }

        }))


        await Nameing.deleteOne({ _id: req.params.id });

        res.send({ message: "deleted successfully" });
    } catch (error) {
        res.status(500).send({ message: "internal error: " + error.message })
    }
});


module.exports = router;