const router = require('express').Router();
const general = require('../model/general.model');
const auth = require('../middelware/auth');
const adminRole = require('../middelware/checkRole');

router.post('/add-question', auth, adminRole, async (req, res) => {

    let { question, optionDifLang, answer, questionDifLang } = req.body;


    if (!question) {
        return res.status(404).json({ error: "question not found" });
    }


    try {
        const ress = await general.create({ question, optionDifLang, options: [], answer, questionDifLang });

        res.json(ress);
    } catch (error) {

        res.status(500).json({ error: error.message });

    }
});



router.get('/get-all', async (req, res) => {

    const lang = req.query.lang ? req.query.lang : "english";

    try {
        const questions = await general.find();
        if (lang) {
            let result = await questions.filter(p => {
                const question = p.questionDifLang.find(tit => tit.lang === lang);
                const option = p.optionDifLang.find(tit => tit.lang === lang);

                p.question = question ? question.text : p.question;
                if (option) {
                    p.options = option.data;
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
    const lang = req.query.lang ? req.query.lang : "english";



    try {
        const questions = await general.findById(req.params.id);
        if (lang) {
            const question = questions.questionDifLang.find(tit => tit.lang === lang);
            const option = questions.questionDifLang.find(tit => tit.lang === lang);

            questions.question = question ? question.text : questions.question;
            question.options = option.data

        }
        res.json(questions);
    } catch (error) {

        res.status(500).json(error);

    }

});

router.post('/answer', async (req, res) => {
    const lang = req.query.lang ? req.query.lang : "english";



    const { selectedOption_id, question_id } = req.body;

    if (!selectedOption_id || !question_id) {
        res.status(404).json({
            error: 'Please provide a selected option and question id'
        });
    }

    try {
        const result = await general.findById(question_id);

        if (lang) {
            const question = result.questionDifLang.find(tit => tit.lang === lang);
            const option = result.questionDifLang.find(tit => tit.lang === lang);

            result.question = question ? question.text : result.question;
            question.options = option.data
        }

        const answer = result.options.find(option => option._id === selectedOption_id);

        res.send(answer);
    } catch (error) {

        res.status(500).send(error.message);

    }

});

router.delete('/delete/:id', auth, adminRole, async (req, res) => {
    try {
        await general.deleteOne({ _id: req.params.id });
        res.status(200).send({ message: "record deletd successfully." });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }

});

router.put('/update', auth, adminRole, async (req, res) => {
    const { id, question, options } = req.body;
    if (!question) {
        return res.status(404).json({ error: "question not found" });
    }

    if (!Array.isArray(options)) {
        return res.status(404).json({ error: "option must be array with contain option and answer object" });

    }

    try {
        const ress = await general.findByIdAndUpdate(id, { $set: { question, options } });

        res.json(ress);
    } catch (error) {

        res.status(500).json({ error: error.message });

    }
});

module.exports = router;
