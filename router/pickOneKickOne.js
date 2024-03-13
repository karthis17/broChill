const auth = require('../middelware/auth');
const router = require('express').Router();

const pickAndKick = require('../model/pickOneKickOne.model');
const { uploadFile, uploadAndGetFirebaseUrl, bucket } = require('../commonFunc/firebase');
const adminRole = require('../middelware/checkRole');

const mongoose = require('mongoose');
const Category = require('../model/categoryModel');

const cpUplad = uploadFile.fields([{
    name: 'option', maxCount: 50
},
{
    name: 'question', maxCount: 30
},
{
    name: 'referencesImage', maxCount: 1
}])

router.post('/add-question', auth, adminRole, cpUplad, async (req, res) => {

    let { questions, isActive, language, subCategory, category, description } = req.body;

    if (questions) {
        questions = JSON.parse(questions)
    }

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


    // const  = [{ option: option1, point: point1 }, { option: option2, point: point2 }];
    console.log(questions)

    try {
        console.log(req.files["referencesImage"])
        let referencesImage = await uploadAndGetFirebaseUrl(req.files['referencesImage'][0])

        const result = await pickAndKick.create({ questions, thumbnail: referencesImage, subCategory, category, isActive, language, description, user: req.user.id });
        const Language = await Category.findById(result.language);
        if (!Language) {
            return res.status(404).send({ success: false, error: 'Language not found' });
        }
        Language.data.pickOneKickOne.push(result._id);
        const savedCategory = await Language.save();

        res.json(result);

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });

    }
});

router.get('/get/:id', async (req, res) => {
    let lang = req.query.lang
    try {
        const pick = await pickAndKick.findById(req.params.id).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: '-password'
            }
        });


        res.send(pick);
    } catch (error) {

        res.json({ error: error.message });
    }
});


router.get('/get-all', async (req, res) => {
    try {
        let lang = req.query.lang
        const pick = await pickAndKick.find({ language: lang, isActive: true }).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: '-password'
            }
        });

        res.send(pick);



    } catch (error) {

        res.status(500).json({ error: error.message });
    }
});


router.post('/:postId/vote', auth, async (req, res) => {

    let pollId = req.params.postId;

    const { questionId, optionId } = req.body;


    try {
        // Find the poll by ID
        const poll = await pickAndKick.findById(pollId);
        if (!poll) {
            return res.status(404).json({ error: "Poll not found" });
        }

        // Find the question in the poll
        const question = poll.questions.find(qu => qu._id.equals(new mongoose.Types.ObjectId(questionId)));
        if (!question) {
            return res.status(404).json({ error: "Question not found in the poll" });
        }

        // Check if the option exists in the question
        const option = question.options.find(opt => opt._id.equals(new mongoose.Types.ObjectId(optionId)));
        if (!option) {
            return res.status(404).json({ error: "Option not found in the question" });
        }

        // Add user ID to votedUsers array
        option.votedUsers.push(req.user.id);

        // Update the vote count for the selected option
        option.vote = option.vote ? parseInt(option.vote) + 1 : 1;

        // Increment the total votes for the question
        question.totalVotes = (question.totalVotes || 0) + 1;

        // Calculate the percentage of votes for each option
        question.options.forEach(opt => {
            opt.percentage = ((opt.vote || 0) / question.totalVotes) * 100;
        });

        // Save the updated poll
        await poll.save();

        res.status(200).json({ message: "Vote recorded successfully", Poll: poll });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.delete('/delete/:id', auth, adminRole, async (req, res) => {

    const id = req.params.id;

    const cont = await pickAndKick.findById(id);

    if (!cont) {
        return res.status(404).json({ message: 'cont not found' });
    }

    try {
        // Delete the file from Firebase Storage
        const fileUrl = cont.thumbnail;
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



        // Delete the feed from the database
        await pickAndKick.deleteOne({ _id: id });

        res.send({ message: 'File deleted successfully', success: true });
    } catch (err) {
        res.status(500).send({ message: err.message, success: false });
    }

});

router.get('/share/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const response = await pickAndKick.findByIdAndUpdate(postId, { $inc: { shares: 1 } }, { new: true })
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/view/:id', async (req, res) => {

    const id = req.params.id;

    try {
        const response = await pickAndKick.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.riddle_id) res.status(404).json({ message: 'riddle id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await pickAndKick.findByIdAndUpdate(req.body.riddle_id, { $push: { comments: { text: req.body.comment, user: req.user.id } } }, { new: true })
        res.status(200).json({
            message: "comment added successfully",
            data: response
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


const cpUpload1 = uploadFile.fields([
    { name: 'question', maxCount: 20 },
    { name: 'option', maxCount: 50 },
    { name: 'answer', maxCount: 20 },
    { name: 'referencesImage', maxCount: 2 }
]);



router.put('/update', auth, adminRole, cpUpload1, async (req, res) => {


    let { questions, description, language, category, subCategory, referencesImage, id, isActive } = req.body;

    if (!questions) {
        res.status(404).send({ message: "questions not found", success: false });
    }


    questions = JSON.parse(questions);

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

    try {

        referencesImage = await uploadAndGetFirebaseUrl(req.files["referencesImage"][0]);
    } catch (e) {
        console.log(e)
    }

    try {
        const ress = await pickAndKick.findByIdAndUpdate(id, { $set: { questions, description, language, category, isActive, subCategory, referencesImage } }, { new: true });

        res.json(ress);
    } catch (error) {

        console.log(error)

        res.status(500).json({ error: error.message });

    }
});


router.get("/all", async (req, res) => {
    try {
        const ress = await pickAndKick.find();

        res.send(ress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.get('/publish/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await pickAndKick.findByIdAndUpdate(postId, { $set: { isActive: true } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});

router.get('/draft/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await pickAndKick.findByIdAndUpdate(postId, { $set: { isActive: false } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});


module.exports = router;