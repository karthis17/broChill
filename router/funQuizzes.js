const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const Quizzes = require('../model/funQuizzes.model');
const auth = require('../middelware/auth');


router.post('/add-question', async (req, res) => {

    const { question, options } = req.body;
    if (!question) {
        return res.status(404).json({ error: "question not found" });
    }

    if (!Array.isArray(options)) {
        return res.status(404).json({ error: "option must be array with contain option and answer object" });

    }

    try {
        const ress = await Quizzes.create({ question, options });

        res.json(ress);
    } catch (error) {

        res.status(500).json({ error: error.message });

    }
});



router.get('/get-all', async (req, res) => {


    try {
        const questions = await Quizzes.find();
        res.json(questions);
    } catch (error) {

        res.status(500).json(error);

    }

});


router.post('/get-by-id/:id', async (req, res) => {


    try {
        const questions = await Quizzes.findById(req.params.id);
        res.json(questions);
    } catch (error) {

        res.status(500).json(error);

    }

});

router.post('/answer', async (req, res) => {

    const { selectedOption_id, question_id } = req.body;

    if (!selectedOption_id || !question_id) {
        res.status(404).json({
            error: 'Please provide a selected option and question id'
        });
    }

    try {
        const result = await Quizzes.findById(question_id);
        const answer = result.options.find(option => option._id === selectedOption_id);

        res.send(answer);
    } catch (error) {

        res.status(500).send(error.message);

    }

});

router.delete('/delete/:id', async (req, res) => {
    try {
        await Quizzes.deleteOne({ _id: req.params.id });
        res.status(200).send({ message: "record deletd successfully." });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }

});

router.put('/update', async (req, res) => {
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
