const router = require('express').Router();
const riddles = require('../model/riddles.model');
const auth = require('../middelware/auth');

const adminRole = require('../middelware/checkRole');
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');
const path = require('path');
const Category = require('../model/categoryModel');


const cpUpload = uploadFile.fields([
    { name: 'question', maxCount: 20 },
    { name: 'option', maxCount: 50 },
    { name: 'answer', maxCount: 20 },
    { name: 'referencesImage', maxCount: 2 }
]);
router.post("/add-riddle", auth, adminRole, cpUpload, async (req, res) => {


    let { questions, description, language, category, subCategory, isActive } = req.body;

    console.log(req.body)

    if (questions) {

        questions = JSON.parse(questions)
        console.log(questions)
    }



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


    let referencesImage = await uploadAndGetFirebaseUrl(req.files["referencesImage"][0]);


    try {
        const qu = await riddles.create({ questions, description, referenceImage: referencesImage, isActive, category, subCategory, language, user: req.user.id });
        const Language = await Category.findById(qu.language);
        if (!Language) {
            return res.status(404).send({ success: false, error: 'Language not found' });
        }
        Language.data.riddles.push(qu._id);
        const savedCategory = await Language.save();



        res.send(qu);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }

});



router.get('/get-all', async (req, res) => {

    let lang = req.query.lang;
    try {
        const quizzes = await riddles.find({ language: lang }).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: '-password'
            }
        }).populate({
            path: 'questions',
            populate: {
                path: 'user',
                select: '-password'
            }
        });
        console.log(quizzes);
        res.json(quizzes);
    } catch (error) {
        res.status(500).json(error.message);

    }
});


router.get('/all', async (req, res) => {
    try {
        const result = await riddles.find();
        res.json(result);
    } catch (error) {
        res.status(500).json(error.message);
    }
});



// router.post('/get-by-id/:id', async (req, res) => {


//     try {
//         const riddle = await riddles.findById(req.params.id).populate('comments.user');
//         if (lang) {
//             const question = riddle.questionDifLang.find(tit => tit.lang === lang);
//             const answer = riddle.answerDifLang.find(dis => dis.lang === lang);

//             riddle.question = question ? question.text : riddle.question;
//             riddle.answer = answer ? answer.text : riddle.answer;


//             res.json(riddle);
//         } else {

//             res.json(riddle);
//         }
//     } catch (error) {

//         res.status(500).json(error);

//     }

// });


router.post("/add/questions-comment", auth, async (req, res) => {
    const { postId, comment, questionId } = req.body;

    try {
        const response = await riddles.findById(postId);
        console.log(response)
        const question = response.questions.find(question => question._id.toString() === questionId);

        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        question.comments.push({ text: comment });

        await response.save();

        res.status(200).json({
            message: "Comment added successfully",
            data: response
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }

});


router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.riddle_id) res.status(404).json({ message: 'riddle id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await riddles.findByIdAndUpdate(req.body.riddle_id, { $push: { comments: { text: req.body.comment, user: req.user.id } } }, { new: true })
        res.status(200).json({
            message: "comment added successfully",
            data: response
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.delete('/delete/:id', auth, async (req, res) => {

    try {
        await riddles.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: "Deleted successfully", success: true });
    } catch (error) {
        res.status(200).json({ message: error.message, success: false });

    }

});

router.get('/share/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const response = await riddles.findByIdAndUpdate(postId, { $inc: { shares: 1 } }, { new: true })
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/view/:id', async (req, res) => {

    const id = req.params.id;

    try {
        const response = await riddles.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
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

    let { questions, description, language, category, subCategory, id, isActive } = req.body;

    console.log(req.body)

    if (questions) {

        questions = JSON.parse(questions)
        console.log(questions)
    }



    let i = 0;
    let j = 0;
    for (let k = 0; k < questions.length; k++) {
        const question = questions[k];
        console.log(question);
        if (question.questionType === 'image' && (typeof question.question === 'object' && Object.keys(question.question).length === 0)) {

            questions[k]["question"] = await uploadAndGetFirebaseUrl(req.files["question"][i++]);
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


    let referencesImage = req.body.referenceImage

    try {

        referencesImage = await uploadAndGetFirebaseUrl(req.files["referencesImage"][0]);
    } catch (e) {
        console.log(e)
    }


    try {
        const qu = await riddles.create({ questions, description, referenceImage: referencesImage, category, subCategory, language, user: req.user.id });
        const Language = await Category.findById(qu.language);
        if (!Language) {
            return res.status(404).send({ success: false, error: 'Language not found' });
        }
        Language.data.riddles.push(qu._id);
        const savedCategory = await Language.save();



        res.send(qu);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }


});

router.get('/publish/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await riddles.findByIdAndUpdate(postId, { $set: { isActive: true } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});

router.get('/draft/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await riddles.findByIdAndUpdate(postId, { $set: { isActive: false } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});

module.exports = router;
