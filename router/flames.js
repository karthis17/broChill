const Flames = require('../model/flames.model');
const router = require('express').Router();
const auth = require('../middelware/auth');
const multer = require('multer');
const path = require('path');



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
    let image = `${req.protocol}://${req.get('host')}/${req.file.filename}`;


    try {
        const result = await Flames.create({ imageUrl: image, flamesWord: req.body.word });
        res.send(result)
    } catch (error) {
        res.status(500).send({ message: "Error creating image", error: error.message });
    }
});


router.get('/get-all-flames', async (req, res) => {
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

function calculateFLAMES(name1, name2) {
    const flames = ['Friends', 'Love', 'Affection', 'Marriage', 'Enmity', 'Sibling'];
    const commonLetters = [...new Set(name1.toLowerCase())].filter(letter => name2.toLowerCase().includes(letter));
    const resultIndex = (commonLetters.length - 1) % flames.length;

    return flames[resultIndex];
}

module.exports = router;