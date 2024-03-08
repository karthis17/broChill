const auth = require('../middelware/auth');
const router = require('express').Router();

const pickAndKick = require('../model/pickOneKickOne.model');
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');
const adminRole = require('../middelware/checkRole');

const mongoose = require('mongoose');

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

    let { questions, language, description } = req.body;

    if (questions) {
        questions = JSON.parse(questions)
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


    // const  = [{ option: option1, point: point1 }, { option: option2, point: point2 }];
    console.log(questions)

    try {
        console.log(req.files["referencesImage"])
        let referencesImage = await uploadAndGetFirebaseUrl(req.files['referencesImage'][0])

        const result = await pickAndKick.create({ questions, thumbnail: referencesImage, language, description, user: req.user.id });

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
        const pick = await pickAndKick.find({ language: lang }).populate({
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


router.delete("/delete/:id", auth, adminRole, async function (req, res) {

    try {

        await pickAndKick.deleteOne({ _id: req.params.id })

        res.status(200).json({ message: "Deleted successfully", success: true });
    } catch (error) {
        res.status(200).json({ message: error.message, success: false });

    }

});

router.put("/update", auth, adminRole, uploadFile.single('question'), async (req, res) => {
    let { option1, point1, option2, point2, id } = req.body;
    let question;

    if (req.file) {
        question = await uploadAndGetFirebaseUrl(req);


    } else {
        question = req.body.question;
    }

    const options = [{ option: option1, point: point1 }, { option: option2, point: point2 }];
    console.log(options, question)

    try {

        const result = await pickAndKick.findByIdAndUpdate(id, { $set: { question, options } });

        res.json(result);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }
});

module.exports = router;