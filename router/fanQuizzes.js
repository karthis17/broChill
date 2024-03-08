const router = require('express').Router();
const Quizzes = require('../model/fanQuizzes.model');
const auth = require('../middelware/auth');
const adminRole = require('../middelware/checkRole');
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');
const Jimp = require('jimp');


// const multer = require('multer');
const path = require('path');
const Category = require('../model/categoryModel');


const cpUpload = uploadFile.fields([
    { name: 'question', maxCount: 20 },
    { name: 'option', maxCount: 50 },
    { name: 'answer', maxCount: 20 },
    { name: 'referencesImage', maxCount: 2 }
]);


router.post('/add-quizze', auth, adminRole, cpUpload, async (req, res) => {

    let { questions, results, description, language, category, subCategory } = req.body;

    console.log(req.body)

    questions = JSON.parse(questions)
    results = JSON.parse(results)


    let i = 0;
    let j = 0;

    for (let k = 0; k < questions.length; k++) {
        const question = questions[k];

        if (question.questionType === 'image') {
            questions[k]["question"] = await uploadAndGetFirebaseUrl(req.files["question"][i++]);
        }

        if (question.optionType === 'image') {
            // Sequentially process options
            for (let n = 0; n < question.options.length; n++) {
                const option = question.options[n];
                questions[k]["options"][n].option = await uploadAndGetFirebaseUrl(req.files["option"][j++]);
            }
        }
    }

    // Sequentially process results
    for (let m = 0; m < results.length; m++) {
        results[m].resultImg = await uploadAndGetFirebaseUrl(req.files["answer"][m]);
    }

    let referencesImage = await uploadAndGetFirebaseUrl(req.files["referencesImage"][0]);


    try {
        const qu = await Quizzes.create({ questions, results, description, referenceImage: referencesImage, category, subCategory, language, user: req.user.id });
        const category = await Category.findById(qu.language);
        if (!category) {
            return res.status(404).send({ success: false, error: 'Language not found' });
        }
        category.data.fanQuizzes.push(qu._id);
        const savedCategory = await category.save();



        res.send(qu);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }

});




router.get('/get-all', async (req, res) => {

    let lang = req.query.lang;
    try {
        const fanquizzes = await Quizzes.find({ language: lang }).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: '-password'
            }
        });
        console.log(fanquizzes);
        res.json(fanquizzes);
    } catch (error) {
        res.status(500).json(error.message);

    }
});

router.get('/get-fanquizze/:id', async (req, res) => {

    if (!req.params.id) {
        res.status(404).json({ message: 'Missing quizze id' });
    }

    try {
        const fanquizze = await Quizzes.findById(req.params.id);
        res.json(fanquizze);
    } catch (error) {
        res.status(500).json(error.message);
    }
});


const cpUplad = uploadFile.fields([
    { name: 'image', maxCount: 5 }
]);


router.post('/get-result', cpUplad, async (req, res) => {
    let { score, quizze_id, userText } = req.body;

    try {

        const response = await Quizzes.findById(quizze_id);

        const result1 = await response.results.find(result => result.minScore <= score && result.maxScore >= score);

        const baseImage = result1.resultImg;
        const squareCoord = result1.coordinates;
        let Images = [];
        if (squareCoord.length > 0) {
            // Upload images in parallel
            await Promise.all(squareCoord.map(async (corr, i) => {
                Images.push(await uploadAndGetFirebaseUrl(req.files['image'][i]));
            }));

            // Assign URLs to squareCoord objects
            await Promise.all(squareCoord.map(async (sq, i) => {
                squareCoord[i]["path"] = await Images[i];
            }));
        }
        const scoreCoord = result1.scorePosition;



        // let resText = [];
        // let i = 0
        // let j = 0

        // for (let test of textCoord) {
        //     if (test.noOfName.length > 0) {
        //         test.noOfName.forEach((t) => {
        //             if (!resText[j]) {
        //                 resText[j] = test.text.replace(t, userText[i++]);
        //             } else {
        //                 resText[j] = resText[j].replace(t, userText[i++]);
        //             }
        //         });
        //         j++;
        //     } else {

        //         resText.push(test.text);
        //     }
        // }

        // const texts = textCoord.map((text, i) => {
        //     return {
        //         text: resText[i],
        //         width: text.width,
        //         height: text.height,
        //         x: text.x,
        //         y: text.y
        //     };
        // });

        // scoreCoord["text"] = score;
        // texts.push(scoreCoord);

        const outputPath = path.join(__dirname, `../uploads//${req.body.quizze_id}.png`);

        await applyMask(baseImage, squareCoord, outputPath, `${score}`, scoreCoord, result1.frame_size.width, result1.frame_size.height)

        res.send({ result: `${req.protocol}://${req.get('host')}/${req.body.quizze_id}.png` })

        // text.forEach(element => {
        //     let te = element.split(' ');
        //     te.forEach(line => {
        //         line.includes('<fanme')
        //     })
        // });

        // console.log(response, result1);


    } catch (error) {
        res.status(500).json(error.message);
    }
});

router.delete("/delete/:id", auth, adminRole, async (req, res) => {

    try {
        await Quizzes.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: "Deleted successfully", success: true });
    } catch (error) {
        res.status(200).json({ message: error.message, success: false });

    }

});


router.post('/:postId/like', auth, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id; // Assuming user is authenticated and user ID is available in request

        // Check if the post is already liked by the user
        const post = await Quizzes.findById(postId);
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





router.post('/share', async (req, res) => {
    try {
        const response = await Quizzes.findByIdAndUpdate(req.body.id, { $inc: { shares: 1 } })


        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.id) res.status(404).json({ message: 'id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await Quizzes.findByIdAndUpdate(req.body.id, { $push: { comments: { text: req.body.comment, user: req.user.id } } })
        res.status(200).json({
            message: "comment added successfully",
            data: response
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});



async function applyMask(baseImagePath, maskImages, outputPath, texts, scoreCoord, baseW, baseH) {
    try {
        const baseImage = await Jimp.read(baseImagePath);
        console.log(texts, "sad");

        console.log(baseImagePath, maskImages, outputPath);

        baseImage.resize(+baseW, +baseH);
        for (let i = 0; i < maskImages.length; i++) {
            const { path, x, y, width, height } = maskImages[i];
            console.log(path, x, y, width, height);
            const maskImage = await Jimp.read(path);

            console.log(maskImage)
            maskImage.resize(+width, +height);
            baseImage.composite(maskImage, +x, +y, {
                mode: Jimp.BLEND_DESTINATION_OVER
            });
        }



        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK); // Load black font
        const { x, y, width, height } = scoreCoord;
        let text = texts;

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
        baseImage.print(font, textX, textY, text);


        await baseImage.writeAsync(outputPath);


        console.log('Mask applied successfully.');
    } catch (error) {
        console.error('An error occurred:', error);
    }
}



router.put('/update', auth, adminRole, async (req, res) => {
    const { id, question, options } = req.body;
    if (!question) {
        return res.status(404).json({ error: "question not found" });
    }

    if (!Array.isArray(options)) {
        return res.status(404).json({ error: "option must be array with contain option and answer object" });

    }

    try {
        const ress = await Quizzes.findByIdAndUpdate(id, { $set: { question, options } });

        res.json(ress);
    } catch (error) {

        res.status(500).json({ error: error.message });

    }
});

module.exports = router;
