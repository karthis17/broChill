const router = require('express').Router();
const Quizzes = require('../model/funQuizzes.model');


router.post('/add-question', async (req, res) => {

    let { question, optionDifLang, answer, questionDifLang } = req.body;


    if (!question) {
        return res.status(404).json({ error: "question not found" });
    }


    try {
        const ress = await Quizzes.create({ question, optionDifLang, options: [], answer, questionDifLang });

        res.json(ress);
    } catch (error) {

        res.status(500).json({ error: error.message });

    }
});



router.get('/get-all', async (req, res) => {

    const lang = req.query.lang;

    try {
        const questions = await Quizzes.find();
        if (lang && lang.toLowerCase() !== "english") {
            let result = await questions.filter(p => {
                const question = p.questionDifLang.find(tit => tit.lang === lang);

                if (question) {

                    p.question = question.text;
                    return p;
                } else {
                    return false;
                }
            });

            res.json(result);
        } else {

            res.json(questions);
        }
    } catch (error) {

        res.status(500).json(error);

    }

});


router.post('/get-by-id/:id', async (req, res) => {
    const lang = req.query.lang;


    try {
        const questions = await Quizzes.findById(req.params.id);
        if (lang) {
            const question = questions.questionDifLang.find(tit => tit.lang === lang);

            questions.question = question ? question.text : questions.question;

        }
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
