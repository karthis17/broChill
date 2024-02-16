const router = require('express').Router();
const riddles = require('../model/riddles.model');
const auth = require('../middelware/auth');



router.post("/add-riddle", async (req, res) => {

    const { question, answer } = req.body;


    if (!question || !answer) {
        return res.status(404).json({ error: " Please provide a question or answer." });
    }

    try {
        const ress = await riddles.create({ question, answer })
        res.json(ress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});


router.get('/get-all', async (req, res) => {


    try {
        const ridles = await riddles.find();
        res.json(ridles);
    } catch (error) {

        res.status(500).json(error);

    }

});


router.post('/get-by-id/:id', async (req, res) => {


    try {
        const riddle = await riddles.findById(req.params.id);
        res.json(riddle);
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
        if (result.answer === userAnswer) {
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



module.exports = router;
