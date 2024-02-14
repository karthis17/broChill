const auth = require('../middelware/auth');
const multer = require('multer');
const router = require('express').Router();
const path = require('path');
const pickAndKick = require('../model/pickOneKickOne.model');
const { options } = require('./friendship-love- calculator');


const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


router.post('/add-question', upload.single('question'), async (req, res) => {

    const { option1, point1, option2, point2 } = req.body;
    let question;

    if (req.file) {
        question = `${req.protocol}://${req.get('host')}/${req.file.filename}`;

    } else {
        question = req.body.question;
    }

    const options = [{ option: option1, point: point1 }, { option: option2, point: point2 }];
    console.log(options, question)

    try {

        const result = await pickAndKick.create({ question, options });

        res.json(result);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }
});

router.get('/get-by-id/:id', async (req, res) => {
    try {
        const pick = await pickAndKick.findById(req.params.id);
        res.send(pick);
    } catch (error) {

        res.json({ error: error.message });
    }
});


router.get('/get-all', async (req, res) => {
    try {
        const pick = await pickAndKick.find();
        res.send(pick);
    } catch (error) {

        res.status(500).json({ error: error.message });
    }
});

router.post('/play', async (req, res) => {

    const { option, questionId } = req.body;

    if (!option || !questionId) {
        res.status(404).send({ error: "Please provide a valid option and id" })
    }

    try {

        const ress = await pickAndKick.findById(questionId);
        let result;
        ress.options.forEach(element => {
            if (element.option === option) result = element;
        })

        res.json(result);

    } catch (error) {

        res.status(500).json({ error: error.message });
    }
});


module.exports = router;