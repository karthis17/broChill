const auth = require('../middelware/auth');
const { nameFact, nameMeaning } = require('../model/nameMeaning.model');
const router = require('express').Router();
const adminRole = require('../middelware/checkRole');


router.post('/add-name-meaning', auth, adminRole, async (req, res) => {
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

router.post('/add-name-fact', auth, adminRole, async (req, res) => {

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

router.get('/name-meaning/get-all', async (req, res) => {
    try {
        const ress = await nameMeaning.find();
        res.send(ress);
    } catch (error) {

        res.status(500).send({ error: error.message });

    }
});

router.get('/name-fact/get-all', async (req, res) => {
    try {
        const ress = await nameFact.find();
        res.send(ress);
    } catch (error) {

        res.status(500).send({ error: error.message });

    }
});

router.delete("/name-meaning/delete/:id", auth, adminRole, async function (req, res) {

    try {
        await nameMeaning.deleteOne({ _id: req.params.id })
        res.status(200).json({ message: "Deleted successfully", success: true });
    } catch (error) {
        res.status(200).json({ message: error.message, success: false });

    }

});

router.delete("/name-fact/delete/:id", auth, adminRole, async function (req, res) {

    try {
        await nameFact.deleteOne({ _id: req.params.id })
        res.status(200).json({ message: "Deleted successfully", success: true });
    } catch (error) {
        res.status(200).json({ message: error.message, success: false });

    }

});

router.put("/name-meaning/update", auth, adminRole, async function (req, res) {

    const { letter, meaning, id } = req.body;

    console.log(letter)
    if (!letter || !meaning) {
        res.status(400).send({ error: "please provide a letter and meaning" });
    }

    try {
        const result = await nameMeaning.findByIdAndUpdate(id, { $set: { letter, meaning } });
        res.send(result);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }

})

router.put("/name-fact/update", auth, adminRole, async function (req, res) {

    const { name, fact, id } = req.body;

    if (!name || !fact) {
        res.status(400).send({ error: "please provide a fact and name" });
    }

    try {
        const result = await nameFact.findByIdAndUpdate(id, { $set: { name, fact } });
        res.send(result);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }

})

module.exports = router;