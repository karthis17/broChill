const auth = require('../middelware/auth');
const multer = require('multer');
const router = require('express').Router();
const path = require('path');
const pickAndKick = require('../model/pickOneKickOne.model');
const deleteImage = require('../commonFunc/delete.image');


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
    let filePath;

    if (req.file) {
        question = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
        filePath = req.file.path;

    } else {
        question = req.body.question;
    }

    const options = [{ option: option1, point: point1 }, { option: option2, point: point2 }];
    console.log(options, question)

    try {

        const result = await pickAndKick.create({ question, options, filePath });

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

router.delete("/delete/:id", auth, async function (req, res) {

    try {
        const pk = await pickAndKick.findById(req.params.id);

        if (await deleteImage(pk.filePath)) {

            await pickAndKick.deleteOne({ _id: req.params.id })
        } else {
            return res.status(404).json({ message: "error while deleting" });
        }
        res.status(200).json({ message: "Deleted successfully", success: true });
    } catch (error) {
        res.status(200).json({ message: error.message, success: false });

    }

});

router.put("/update", auth, upload.single('question'), async (req, res) => {
    let { option1, point1, option2, point2, id, filePath } = req.body;
    let question;

    if (req.file) {
        question = `${req.protocol}://${req.get('host')}/${req.file.filename}`;

        if (deleteImage(path.join(__dirname, `../${filePath}`))) {

            filePath = req.file.path;
        } else {
            return res.status(404).send({ message: "Error while deleting image" })
        }


    } else {
        question = req.body.question;
    }

    const options = [{ option: option1, point: point1 }, { option: option2, point: point2 }];
    console.log(options, question)

    try {

        const result = await pickAndKick.findByIdAndUpdate(id, { $set: { question, options, filePath } });

        res.json(result);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }
});

module.exports = router;