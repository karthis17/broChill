const Flames = require('../model/flames.model');
const router = require('express').Router();
const auth = require('../middelware/auth');
const multer = require('multer');
const path = require('path');
const deleteImage = require('../commonFunc/delete.image');


const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


router.post('/add-image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(404).send({ message: "No file found" });
    }
    let imageUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
    let imagePath = req.file.path;


    try {
        const result = await Flames.create({ imageUrl, flamesWord: req.body.word, imagePath });
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

router.put("/update", upload.single('image'), async (req, res) => {

    let imageUrl = req.body.image;
    let imagePath = req.body.imagePath;

    if (req.file) {
        if (deleteImage(path.join(__dirname, `../${imagePath}`))) {

            imageUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`
        }

        imagePath = req.file.path;
    }


    try {
        const result = await Flames.findByIdAndUpdate(req.body.id, { imageUrl, flamesWord: req.body.word, imagePath });
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