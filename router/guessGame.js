const auth = require('../middelware/auth');
const multer = require('multer');
const router = require('express').Router();
const path = require('path');
const guess = require('../model/guessGame.model');
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
    { name: 'options', maxCount: 10 },
]);

router.post('/upload', cpUpload, async (req, res) => {

    // res.json(req.files)

    let { correctOption, questionType, optionsType, questionDifLang } = req.body;


    if (questionDifLang) {

        questionDifLang = JSON.parse(questionDifLang);
    }

    let question;
    let imagePath;
    if (req.files['question']) {

        question = `${req.protocol}://${req.get('host')}/${req.files['question'][0].filename}`
        imagePath = req.files['question'][0].path;
    } else {
        console.log(req.body)
        question = req.body.question;
    }

    if (!correctOption || !question) {
        return res.status(404).send({ err: "aee", question, correctOption });
    }


    let options = [];
    let answer;
    if (req.files['options']) {

        req.files['options'].forEach(element => {
            if (element.originalname === correctOption) {
                answer = element;
                options.push({
                    option: `${req.protocol}://${req.get('host')}/${element.filename}`,
                    answer: true,
                    imagePath: element.path
                });
            } else {
                options.push({
                    option: `${req.protocol}://${req.get('host')}/${element.filename}`,
                    answer: false,
                    imagePath: element.path
                });
            }
        });
    } else {
        req.body.options.forEach(item => {
            if (item === correctOption) {
                answer = item;
                options.push({
                    option: item,
                    answer: true,
                });
            } else {
                options.push({
                    option: item,
                    answer: false
                });
            }
        })
    }

    if (!answer) {
        return res.status(404).send({ err: "awser is requried" });
    }

    try {
        const result = await guess.create({ question, options, questionType, optionsType, imagePath, questionDifLang });
        res.json(result);
    } catch (error) {
        res.status(500).json(error);
    }

});


router.get('/get-all', async (req, res) => {

    const lang = req.query.lang;

    try {
        const questions = await guess.find();
        if (lang) {
            let result = await questions.map(p => {
                const question = p.questionDifLang.find(tit => tit.lang === lang);

                p.question = question ? question.text : p.question;
                return p;
            });

            res.json(result);
        } else {

            res.json(questions);
        }
    } catch (error) {

        res.status(500).json(error);

    }

});


router.post('/get-by-id/:id', async (req, res) => {

    const lang = req.query.lang;

    try {
        const questions = await guess.findById(req.params.id);
        if (lang) {
            const question = questions.questionDifLang.find(tit => tit.lang === lang);

            questions.question = question ? question.text : questions.question;

        }
        res.json(questions);
    } catch (error) {

        res.status(500).json(error);

    }

});

router.post('/answer', async (req, res) => {

    const { selectedOption_id, question_id } = req.body;

    if (!selectedOption_id || !question_id) {
        res.status(404).json({
            error: 'Please provide a selected option and question id'
        });
    }

    try {
        const result = await guess.findById(question_id);
        const answer = result.options.find(option => option._id === selectedOption_id);

        res.send(answer);
    } catch (error) {

        res.status(500).send(error.message);

    }

});

router.delete("/delete/:id", async (req, res) => {

    try {
        const ress = await guess.findById(req.params.id);

        if (ress.questionType === "image") {
            deleteImage(path.join(__dirname, `../${ress.imagePath}`));
        }

        if (ress.optionsType === "image") {
            ress.options.forEach(option => {
                deleteImage(path.join(__dirname, `../${option.imagePath}`));
            });
        }

        await guess.deleteOne({ _id: req.params.id });
        res.status(200).send({ message: "record deletd successfully." });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }

});

router.put("/update", async (req, res) => {

    let { id, imagePath, question, answer, options, questionType, optionsType } = req.params;


    if (req.files['question']) {

        question = `${req.protocol}://${req.get('host')}/${req.files['question'][0].filename}`
        imagePath = req.files['question'][0].path;
    } else {
        console.log(req.body)
        question = req.body.question;
    }

    if (!correctOption || !question) {
        return res.status(404).send({ err: "aee", question, correctOption });
    }


    if (req.files['options']) {

        req.files['options'].forEach(element => {
            if (element.originalname === correctOption) {
                answer = element;
                options.push({
                    option: `${req.protocol}://${req.get('host')}/${element.filename}`,
                    answer: true,
                    imagePath: element.path
                });
            } else {
                options.push({
                    option: `${req.protocol}://${req.get('host')}/${element.filename}`,
                    answer: false,
                    imagePath: element.path
                });
            }
        });
    } else {
        req.body.options.forEach(item => {
            if (item === correctOption) {
                answer = item;
                options.push({
                    option: item,
                    answer: true,
                });
            } else {
                options.push({
                    option: item,
                    answer: false
                });
            }
        })
    }

    if (!answer) {
        return res.status(404).send({ err: "awser is requried" });
    }

    try {
        const result = await guess.create({ question, options, questionType, optionsType, imagePath });
        res.json(result);
    } catch (error) {
        res.status(500).json(error);
    }
});


module.exports = router;