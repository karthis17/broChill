const router = require('express').Router();
const Quizzes = require('../model/quizzes.model');
const auth = require('../middelware/auth');
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');

const adminRole = require('../middelware/checkRole');


const cpUpload = uploadFile.fields([
    { name: 'question', maxCount: 1 },
    { name: 'state1', maxCount: 5 },
    { name: 'state2', maxCount: 5 },
    { name: 'state3', maxCount: 5 },
    { name: 'answer', maxCount: 5 }
]);

router.post('/upload', auth, adminRole, cpUpload, (req, res) => {

    res.json(req.files)

});

router.post('/add-quizze', auth, adminRole, async (req, res) => {
    const bodyData = req.body;

    let statement_1 = [];
    let statement_2 = [];
    let statement_3 = [];
    let results = [];


    const question = await uploadAndGetFirebaseUrl(bodyData.question);
    let promiseImgs1 = []
    let promiseImgs2 = []
    let promiseImgs3 = []
    let promiseImgsResult = []



    for (let i = 0; i < bodyData.state1.length; i++) {
        statement_1.push({
            point: bodyData.state1[i].point,
        });
        promiseImgs1.push(uploadAndGetFirebaseUrl(bodyData.state1[i].option))
        statement_2.push({
            point: bodyData.state2[i].point,
        });
        promiseImgs2.push(uploadAndGetFirebaseUrl(bodyData.state2[i].option))
        statement_3.push({
            point: bodyData.state3[i].point,
        });
        promiseImgs3.push(uploadAndGetFirebaseUrl(bodyData.state3[i].option))
        results.push({
            minScore: bodyData.result[i].minScore,
            maxScore: bodyData.result[i].maxScore,
        });
        promiseImgsResult.push(uploadAndGetFirebaseUrl(bodyData.result[i].resultImg))

    }
    promiseImgs1 = await Promise.all(promiseImgs1);
    promiseImgs2 = await Promise.all(promiseImgs2);
    promiseImgs3 = await Promise.all(promiseImgs3);
    promiseImgsResult = await Promise.all(promiseImgsResult);
    for (let i = 0; i < bodyData.state1.length; i++) {
        statement_1[i].option = promiseImgs1[i]
        statement_2[i].option = promiseImgs2[i]
        statement_3[i].option = promiseImgs3[i]
        results[i].scoreBoard = promiseImgsResult[i]
    }

    console.log(statement_1, statement_2, statement_3, results);

    try {
        const response = await Quizzes.create({ questionImage: question, statement_1, statement_2, statement_3, results });
        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json(error.message);
    }

});

const cpUpload1 = uploadFile.fields([
    { name: 'question', maxCount: 1 },

    { name: 'answer', maxCount: 5 }
]);


router.post("/add-text-quizzes", auth, adminRole, cpUpload1, async (req, res) => {

    let { statement_1, statement_2, statement_3, result } = req.body;

    console.log(req.body)

    statement_1 = JSON.parse(statement_1);
    statement_2 = JSON.parse(statement_2);
    statement_3 = JSON.parse(statement_3);
    let results = JSON.parse(result);

    if (!statement_1 || !statement_2 || !statement_3) {
        res.status(404).json({ message: "Please provide a data" });
    }

    let promiseImgsResult = [];

    if (!req.files["answer"]) {
        res.status(404).json({ message: "Please provide a answer data" });
    }

    req.files["answer"].map((file, i) => {
        promiseImgsResult.push(uploadAndGetFirebaseUrl(file));
    })

    let question;

    if (req.files["question"]) {
        question = await uploadAndGetFirebaseUrl(req.files["question"][0]);
    } else {
        question = req.body.question;
    }

    promiseImgsResult = await Promise.all(promiseImgsResult);

    results = results.map((result, i) => {

        result["scoreBoard"] = promiseImgsResult[i];

        return result;

    });

    try {
        const quizess = await Quizzes.create({ questionImage: question, results, statement_1, statement_2, statement_3 });
        res.send({ success: true, data: quizess });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
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

router.delete("/delete/:id", auth, adminRole, async (req, res) => {

    try {
        await Quizzes.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: "Deleted successfully", success: true });
    } catch (error) {
        res.status(200).json({ message: error.message, success: false });

    }

});


module.exports = router;