const Flames = require('../model/flames.model');
const router = require('express').Router();
const auth = require('../middelware/auth');
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');



router.post('/add-image', uploadFile.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(404).send({ message: "No file found" });
    }
    let imageUrl = await uploadAndGetFirebaseUrl(req);

    try {
        const result = await Flames.create({ imageUrl, flamesWord: req.body.word });
        res.send(result)
    } catch (error) {
        res.status(500).send({ message: "Error creating image", error: error.message });
    }
});


router.get('/get-all', async (req, res) => {
    try {
        const result = await Flames.find()
        res.send(result);
    }
    catch (error) {
        res.status(500).send({ message: "Error, error: " + error.message });
    }
})


router.post('/', auth, async (req, res) => {
    const { name1, name2 } = req.body;

    const result = calculateFLAMES(name1, name2);

    try {
        const response = await Flames.findOneAndUpdate({ flamesWord: { $regex: result, $options: 'i' } }, { $push: { users: { user: req.user.id, name1, name2 } } });
        res.send({ flamesFrame: response.imageUrl, result, name1, name2 });

    } catch (error) {
        res.status(500).send({ err: error.message })
    }

    // res.json({ result });
});

router.delete("/delete/:id", async (req, res) => {
    try {
        await Flames.deleteOne({ _id: req.params.id });
        res.status(200).send({ message: 'result deleted successfully' });
    } catch (error) {
        res.status(500).send({ err: error.message });
    }
});

router.put("/update", uploadFile.single('image'), async (req, res) => {

    let imageUrl = req.body.image;

    if (req.file) {
            imageUrl = await uploadAndGetFirebaseUrl(req)
    }


    try {
        const result = await Flames.findByIdAndUpdate(req.body.id, { imageUrl, flamesWord: req.body.word });
        res.send(result)
    } catch (error) {
        res.status(500).send({ message: "Error creating image", error: error.message });
    }
})

function calculateFLAMES(name1, name2) {
    const flames = ['Friends', 'Love', 'Affection', 'Marriage', 'Enmity', 'Sibling'];
    const commonLetters = [...new Set(name1.toLowerCase())].filter(letter => name2.toLowerCase().includes(letter));
    const resultIndex = (commonLetters.length - 1) % flames.length;

    return flames[resultIndex];
}

module.exports = router;