const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const Quizzes = require('../model/quizzes.model');
const auth = require('../middelware/auth');
const deleteImage = require('../commonFunc/delete.image');


const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + file.originalname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const cpUpload = upload.fields([
    { name: 'question', maxCount: 1 },
    { name: 'state1', maxCount: 5 },
    { name: 'state2', maxCount: 5 },
    { name: 'state3', maxCount: 5 },
    { name: 'answer', maxCount: 5 }
]);

router.post('/upload', cpUpload, (req, res) => {

    res.json(req.files)

});

router.post('/add-quizze', async (req, res) => {

    let statement_1 = [];
    let statement_2 = [];
    let statement_3 = [];
    let results = [];


    const question = `${req.protocol}://${req.get('host')}/${req.body.question.filename}`;
    const questionPath = req.body.question.path;

    for (let i = 0; i < req.body.state1.length; i++) {
        statement_1.push({
            option: `${req.protocol}://${req.get('host')}/${req.body.state1[i].option.filename}`,
            point: req.body.state1[i].point,
            imagePath: req.body.state1[i].option.path
        });
        statement_2.push({
            option: `${req.protocol}://${req.get('host')}/${req.body.state2[i].option.filename}`,
            point: req.body.state2[i].point,
            imagePath: req.body.state2[i].option.path

        });
        statement_3.push({
            option: `${req.protocol}://${req.get('host')}/${req.body.state3[i].option.filename}`,
            point: req.body.state3[i].point,
            imagePath: req.body.state3[i].option.path

        });
        results.push({
            scoreBoard: `${req.protocol}://${req.get('host')}/${req.body.result[i].resultImg.filename}`,
            minScore: req.body.result[i].minScore,
            maxScore: req.body.result[i].maxScore,
            imagePath: req.body.result[i].resultImg.path
        });

    }

    try {
        const response = await Quizzes.create({ questionImage: question, statement_1, statement_2, statement_3, results, questionPath });
        res.json(response);
    } catch (error) {
        res.status(500).json(error.message);
    }

});

router.get('/get-all-quizzes', async (req, res) => {
    try {
        const quizzes = await Quizzes.find();
        console.log(quizzes);
        res.json(quizzes);
    } catch (error) {
        res.status(500).json(error.message);

    }
});

router.get('/get-quizze/:id', async (req, res) => {

    if (!req.params.id) {
        res.status(404).json({ message: 'Missing quizze id' });
    }

    try {
        const quizze = await Quizzes.findById(req.params.id);
        res.json(quizze);
    } catch (error) {
        res.status(500).json(error.message);
    }
});


router.post('/get-result', auth, async (req, res) => {
    const { score, quizze_id } = req.body;

    try {
        const response = await Quizzes.findByIdAndUpdate(quizze_id, { $push: { players: { user: req.user.id, score: score } } });

        const result1 = await response.results.find(result => result.minScore <= score && result.maxScore >= score);
        console.log(response, result1);

        res.json(result1);
    } catch (error) {
        res.status(500).json(error.message);
    }
});

router.delete("/delete/:id", auth, async (req, res) => {

    try {

        const ress = await Quizzes.findById(req.params.id);

        deleteImage(path.join(__dirname, `../${ress.questionPath}`));

        for (let i = 0; i < req.body.state1.length; i++) {
            deleteImage(path.join(__dirname, `../${ress.statement_1[i].imagePath}`))
            deleteImage(path.join(__dirname, `../${ress.statement_2[i].imagePath}`))
            deleteImage(path.join(__dirname, `../${ress.statement_3[i].imagePath}`))
            deleteImage(path.join(__dirname, `../${ress.results[i].imagePath}`))
        }

        await Quizzes.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: "Deleted successfully", success: true });
    } catch (error) {
        res.status(200).json({ message: error.message, success: false });

    }

});


module.exports = router;