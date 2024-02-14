const { nameFact, nameMeaning } = require('../model/nameMeaning.model');
const router = require('express').Router();


router.post('/add-name-meaning', async (req, res) => {
    console.log(req.body)
    const { letter, meaning } = req.body;

    if (!letter || !meaning) {
        res.status(400).send({ error: "please provide a letter and meaning" });
    }

    try {
        const result = await nameMeaning.create({ letter, meaning });
        res.send(result);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.post('/add-name-fact', async (req, res) => {

    const { name, fact } = req.body;

    if (!name || !fact) {
        res.status(400).send({ error: "please provide a name and fact" });
    }

    try {
        const result = await nameFact.create({ name, fact });
        res.send(result);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.post('/get-name-meaning', async (req, res) => {

    const { name } = req.body;

    if (!name) {
        res.status(400).send({ error: "please provide a name" });
    }

    try {

        const meaning = {}

        for (let i = 0; i < name.length; i++) {
            const letter = name.charAt(i);


            const result = await nameMeaning.findOne({ letter });

            meaning[letter] = result.meaning;

        }
        res.send(meaning);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }

});


router.post('/get-name-fact', async (req, res) => {

    const { name } = req.body;

    if (!name) {
        res.status(400).send({ error: "please provide a name" });
    }

    try {

        const result = await nameFact.findOne({ name });

        res.status(200).send(result);

    } catch (error) {
        res.status(500).send({ error: error.message });
    }

});

module.exports = router;