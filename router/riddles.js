const router = require('express').Router();
const riddles = require('../model/riddles.model');
const auth = require('../middelware/auth');

const adminRole = require('../middelware/checkRole');


router.post("/add-riddle", auth, adminRole, async (req, res) => {

    const { question, answer, questionDifLang, answerDifLang } = req.body;



    if (!question || !answer) {
        return res.status(404).json({ error: " Please provide a question or answer." });
    }

    try {
        const ress = await riddles.create({ question, answer, questionDifLang, answerDifLang })
        res.json(ress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});


router.get('/get-all', async (req, res) => {

    const lang = "kannada";

    try {
        const ridles = await riddles.find().populate('comments.user');
        if (lang && lang.toLowerCase() !== "english") {

            const result = ridles.filter(ridle => {

                const question = ridle.questionDifLang.find(tit => tit.lang === lang);
                const answer = ridle.answerDifLang.find(dis => dis.lang === lang);

                if (question && answer) {
                    ridle.question = question.text
                    ridle.answer = answer.text

                    return ridle;
                }
                else {
                    return false;
                }

            })



            res.json(result);
        } else {

            res.json(ridles);
        }
    } catch (error) {

        res.status(500).json(error);

    }

});


router.post('/get-by-id/:id', async (req, res) => {


    try {
        const riddle = await riddles.findById(req.params.id).populate('comments.user');
        if (lang) {
            const question = riddle.questionDifLang.find(tit => tit.lang === lang);
            const answer = riddle.answerDifLang.find(dis => dis.lang === lang);

            riddle.question = question ? question.text : riddle.question;
            riddle.answer = answer ? answer.text : riddle.answer;


            res.json(riddle);
        } else {

            res.json(riddle);
        }
    } catch (error) {

        res.status(500).json(error);

    }

});

router.post('/answer', async (req, res) => {

    const { userAnswer, riddle_id } = req.body;

    if (!userAnswer || !riddle_id) {
        res.status(404).json({
            error: 'Please provide a selected option and question id'
        });
    }

    try {
        const result = await riddles.findById(riddle_id);

        let checkDifLang = result.answerDifLang.find(answer => { userAnswer === answer.text })

        if (result.answer === userAnswer || checkDifLang.length) {
            res.send({ answer: true });

        } else {

            res.send({ answer: false });
        }
    } catch (error) {

        res.status(500).send(error.message);

    }

});


router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.riddle_id) res.status(404).json({ message: 'riddle id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await riddles.findByIdAndUpdate(req.body.riddle_id, { $push: { comments: { text: req.body.comment, user: req.user.id } } })
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

router.put('/update', auth, adminRole, async (req, res) => {

    const { question, answer, riddle_id } = req.body;


    if (!question || !answer) {
        return res.status(404).json({ error: " Please provide a question or answer." });
    }

    try {
        const ress = await riddles.findByIdAndUpdate(riddle_id, { $set: { question, answer } })
        res.json(ress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});

module.exports = router;
