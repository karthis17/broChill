const router = require('express').Router();
const Quizzes = require('../model/fanQuizzes.model');
const auth = require('../middelware/auth');
const adminRole = require('../middelware/checkRole');
const { uploadFile, uploadAndGetFirebaseUrl, bucket } = require('../commonFunc/firebase');
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


router.get("/all", async (req, res) => {
    try {
        const result = await Quizzes.find();
        res.send(result)
    } catch (error) {
        res.status(500).send(error.message)
    }
})

router.post('/add-quizze', auth, adminRole, cpUpload, async (req, res) => {

    let { questions, results, description, language, category, subCategory, isActive } = req.body;

    console.log(req.body)

    questions = JSON.parse(questions)
    results = JSON.parse(results)


    let i = 0;
    let j = 0;

    for (let k = 0; k < questions.length; k++) {
        const question = questions[k];

        if (question.questionType === 'image' || question.questionType === 'both') {
            questions[k]["imageQuestion"] = await uploadAndGetFirebaseUrl(req.files["question"][i++]);
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


    try {
        let referencesImage = await uploadAndGetFirebaseUrl(req.files["referencesImage"][0]);

        const qu = await Quizzes.create({ questions, results, description, referenceImage: referencesImage, category, subCategory, isActive, language, user: req.user.id });
        const Language = await Category.findById(qu.language);
        if (!Language) {
            return res.status(404).send({ success: false, error: 'Language not found' });
        }
        Language.data.fanQuizzes.push(qu._id);
        const savedLanguage = await Language.save();



        res.send(qu);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }

});




router.get('/get-all', async (req, res) => {

    let lang = req.query.lang;
    try {
        const fanquizzes = await Quizzes.find({ language: lang, isActive: true }).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: ['-password', '-post']

            }
        });
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


router.get('/get/:id', async (req, res) => {

    if (!req.params.id) {
        res.status(404).json({ message: 'Missing quizze id' });
    }
    const lang = req.query.lang;

    try {
        const con = await Quizzes.find({ subCategory: req.params.id, language: lang, isActive: true }).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: '-password'
            }
        });
        res.json(con);
    } catch (error) {
        res.status(500).json(error.message);
    }
});


router.post('/get-result', async (req, res) => {
    let { score, quizze_id, image, username } = req.body;

    try {

        const response = await Quizzes.findById(quizze_id);

        const result1 = await response.results.find(result => result.minScore <= score && result.maxScore >= score);

        const baseImage = result1.resultImg;
        const squareCoord = result1.coordinates;
        const name = result1.nameCoord;

        const date = Date.now();

        if (squareCoord) {
            // await Promise.all(squareCoord.map(async (sq, i) => {

            if (!image) {
                image = `${req.protocol}://${req.get('host')}/pro.webp`;
            }

            squareCoord["path"] = await image;
        }

        const scoreCoord = result1.scorePosition;

        const outputPath = path.join(__dirname, `../uploads//${req.body.quizze_id}-${date}.png`);

        await applyMask(baseImage, squareCoord, outputPath, `${score}`, scoreCoord, username, name, result1.frame_size.width, result1.frame_size.height)
        res.send({ result: `${req.protocol}://${req.get('host')}/${req.body.quizze_id}-${date}.png` })


    } catch (error) {
        res.status(500).json(error.message);
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


        // Update like status based on current state
        if (isLiked) {

            // If already liked, unlike the post
            post.likes.pull(userId);
        } else {
            // If not liked, like the post
            post.likes.push(userId);
            like = true;

        }

        // Save the updated post
        await post.save();

        res.status(200).json({ success: true, like, message: 'Post liked/unliked successfully.' });
    } catch (error) {
        console.error('Error liking/unliking post:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request.' });
    }
});





router.get('/share/:id', async (req, res) => {
    try {
        const response = await Quizzes.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } }, { new: true })


        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment/:id', auth, async (req, res) => {
    // if (!req.body.id) res.status(404).json({ message: 'id is required' });
    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await Quizzes.findByIdAndUpdate(req.params.id, { $push: { comments: { text: req.body.comment, user: req.user.id } } }, { new: true }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: ['-password', '-post']
            }
        });
        res.status(200).json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});



async function applyMask(baseImagePath, maskImages, outputPath, texts, scoreCoord, name, namePos, baseW, baseH) {
    try {
        const baseImage = await Jimp.read(baseImagePath);
        console.log(texts, "sad");

        console.log(baseImagePath, maskImages, outputPath);

        baseImage.resize(+baseW, +baseH);
        if (maskImages) {
            const { path, x, y, width, height } = maskImages;
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

        baseImage.print(font, parseInt(x), parseInt(y), {
            text: text,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        }, parseInt(width), parseInt(height));


        if (namePos) {
            const { x, y, width, height } = namePos;

            baseImage.print(font, parseInt(x), parseInt(y), {
                text: name,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
            }, parseInt(width), parseInt(height));

        }


        await baseImage.writeAsync(outputPath);


        console.log('Mask applied successfully.');
    } catch (error) {
        console.error('An error occurred:', error);
    }
}


router.get('/view/:id', async (req, res) => {
    try {
        const response = await Quizzes.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

const cpUpload1 = uploadFile.fields([
    { name: 'question', maxCount: 20 },
    { name: 'option', maxCount: 50 },
    { name: 'answer', maxCount: 20 },
    { name: 'referencesImage', maxCount: 2 }
]);



router.put('/update', auth, adminRole, cpUpload1, async (req, res) => {


    let { questions, results, description, language, category, subCategory, referencesImage, id, isActive } = req.body;

    if (!questions) {
        res.status(404).send({ message: "questions not found", success: false });
    }


    questions = JSON.parse(questions);

    if (results) {

        results = JSON.parse(results)
    }


    let i = 0;
    let j = 0;
    for (let k = 0; k < questions.length; k++) {
        const question = questions[k];
        console.log(question);
        if ((question.questionType === 'image' || question.questionType === 'both') && (typeof question.imageQuestion === 'object' && Object.keys(question.imageQuestion).length === 0)) {


            questions[k]["imageQuestion"] = await uploadAndGetFirebaseUrl(req.files["question"][i++]);
        }

        if (question.optionType === 'image') {
            // Sequentially process options
            for (let n = 0; n < question.options.length; n++) {
                const option = question.options[n];
                if (typeof option.option === 'object' && Object.keys(option.option).length === 0) {

                    questions[k]["options"][n].option = await uploadAndGetFirebaseUrl(req.files["option"][j++]);
                }
            }
        }
    }

    // Sequentially process results
    if (results) {
        for (let m = 0; m < results.length; m++) {
            if (typeof results[m].resultImg === 'object' && Object.keys(results[m].resultImg).length === 0) {

                results[m].resultImg = await uploadAndGetFirebaseUrl(req.files["answer"][m]);
            }
        }

    }
    try {

        referencesImage = await uploadAndGetFirebaseUrl(req.files["referencesImage"][0]);
    } catch (e) {
        console.log(e, "sdfs")
    }

    try {
        const ress = await Quizzes.findByIdAndUpdate(id, { $set: { questions, results, description, language, category, isActive, subCategory, referenceImage: referencesImage } });

        res.json(ress);
    } catch (error) {

        res.status(500).json({ error: error.message });

    }
});


router.get('/publish/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await Quizzes.findByIdAndUpdate(postId, { $set: { isActive: true } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});

router.get('/draft/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await Quizzes.findByIdAndUpdate(postId, { $set: { isActive: false } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});






router.delete('/delete/:id', auth, adminRole, async (req, res) => {

    const id = req.params.id;

    const cont = await Quizzes.findById(id);

    if (!cont) {
        return res.status(404).json({ message: 'cont not found' });
    }

    try {
        // Delete the file from Firebase Storage
        const fileUrl = cont.referenceImage;
        const encodedFileName = fileUrl.split('/').pop().split('?')[0];
        const fileName = decodeURIComponent(encodedFileName);
        console.log("Attempting to delete file:", fileName);
        try {

            await bucket.file(fileName).delete();
            console.log(fileName, "deleted");
        } catch (e) {
            console.log("Error deleting file", e.message);
        }
        await Promise.all(cont.questions.map(async (question) => {
            if ((question.questionType === 'image' || question.questionType === 'both') && question.imageQuestion) {

                const fileUrl = question.imageQuestion;
                const encodedFileName = fileUrl.split('/').pop().split('?')[0];
                const fileName = decodeURIComponent(encodedFileName);
                console.log("Attempting to delete question image:", fileName);
                try {
                    await bucket.file(fileName).delete();
                    console.log(fileName, "deleted");
                } catch (err) {
                    console.error("Error deleting question image:", err);
                    // Skip to the next iteration of the loop
                }
            }

            console.log("Number of options:", question.options.length); // Log the length of question.options

            if (question.optionType == 'image' && question.options.length > 0) {
                // Use Promise.all() for option deletions
                await Promise.all(question.options.map(async (option) => {

                    const fileUrl = option.option;
                    const encodedFileName = fileUrl.split('/').pop().split('?')[0];
                    const fileName = decodeURIComponent(encodedFileName);
                    console.log("Attempting to delete option image:", fileName);
                    try {
                        await bucket.file(fileName).delete();
                        console.log(fileName, "deleted");
                    } catch (err) {
                        console.log("Error deleting option image:", err);
                        // Skip to the next iteration of the loop
                    }

                }));
            } else {
                console.log("No options found for this question.");
            }
        }));

        // Continue with the deletion of cont.results...

        // Continue with the deletion of cont.results...


        if (cont.results) {
            await Promise.all(cont.results.map(async (ress) => {
                const fileUrl = ress.resultImg;
                const encodedFileName = fileUrl.split('/').pop().split('?')[0];
                const fileName = decodeURIComponent(encodedFileName);
                console.log("Attempting to delete file:", fileName);
                try {
                    await bucket.file(fileName).delete();
                    console.log(fileName, "deleted");
                } catch (err) {
                    console.log("Error deleting file:");
                    // Skip to the next iteration of the loop

                }
            }));
        }

        // Delete the feed from the database
        await Quizzes.deleteOne({ _id: id });

        res.send({ message: 'File deleted successfully', success: true });
    } catch (err) {
        res.status(500).send({ message: err.message, success: false });
    }

});



module.exports = router;
