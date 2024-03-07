const auth = require('../middelware/auth');
const router = require('express').Router();

const pickAndKick = require('../model/pickOneKickOne.model');
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');
const adminRole = require('../middelware/checkRole');


const cpUplad = uploadFile.fields([{
    name: 'option', maxCount: 50
},
{
    name: 'question', maxCount: 30
},
{
    name: 'referencesImage', maxCount: 1
}])

router.post('/add-question', auth, adminRole, cpUplad, async (req, res) => {

    let { questions, language, description } = req.body;

    if (questions) {
        questions = JSON.parse(questions)
    }

    let i = 0;
    let j = 0;

    for (let k = 0; k < questions.length; k++) {
        const question = questions[k];

        if (question.questionType === 'image') {
            questions[k]["question"] = await uploadAndGetFirebaseUrl(req.files["question"][i++]);
        }

        if (question.optionType === 'image') {
            // Sequentially process options
            for (let n = 0; n < question.options.length; n++) {
                const option = question.options[n];
                questions[k]["options"][n].option = await uploadAndGetFirebaseUrl(req.files["option"][j++]);
            }
        }
    }


    // const  = [{ option: option1, point: point1 }, { option: option2, point: point2 }];
    console.log(questions)

    try {
        console.log(req.files["referencesImage"])
        let referencesImage = await uploadAndGetFirebaseUrl(req.files['referencesImage'][0])

        const result = await pickAndKick.create({ questions, referenceImage: referencesImage, language, description, user: req.user.id });

        res.json(result);

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });

    }
});

router.get('/get-by-id/:id', async (req, res) => {
    let lang = req.query.lang
    try {
        const pick = await pickAndKick.findById(req.params.id);


        res.send(pick);
    } catch (error) {

        res.json({ error: error.message });
    }
});


router.get('/get-all', async (req, res) => {
    try {
        let lang = req.query.lang
        const pick = await pickAndKick.find({ language: lang }).populate('user', 'comments.user');

        res.send(pick);



    } catch (error) {

        res.status(500).json({ error: error.message });
    }
});

router.post('/play', async (req, res) => {

    let lang = req.params.lang;

    const { option, questionId } = req.body;

    if (!option || !questionId) {
        res.status(404).send({ error: "Please provide a valid option and id" })
    }

    try {

        const ress = await pickAndKick.findById(questionId);

        if (lang && lang.toLowerCase() !== "english") {

            const option1 = ress.option1DifLang.find(tit => { tit.lang === lang });
            const option2 = ress.option2DifLang.find(tit => { tit.lang === lang });

            if (option2 && option1) {

                ress.options[0]['option'] = option1.text.toLowerCase();
                ress.options[1]['option'] = option2.text.toLowerCase();

            }
        }

        let result;
        ress.options.forEach(element => {
            if (element.option.toLowerCase() === option.toLowerCase() || e) result = element;
        })

        res.json(result);

    } catch (error) {

        res.status(500).json({ error: error.message });
    }
});

router.delete("/delete/:id", auth, adminRole, async function (req, res) {

    try {

        await pickAndKick.deleteOne({ _id: req.params.id })

        res.status(200).json({ message: "Deleted successfully", success: true });
    } catch (error) {
        res.status(200).json({ message: error.message, success: false });

    }

});

router.put("/update", auth, adminRole, uploadFile.single('question'), async (req, res) => {
    let { option1, point1, option2, point2, id } = req.body;
    let question;

    if (req.file) {
        question = await uploadAndGetFirebaseUrl(req);


    } else {
        question = req.body.question;
    }

    const options = [{ option: option1, point: point1 }, { option: option2, point: point2 }];
    console.log(options, question)

    try {

        const result = await pickAndKick.findByIdAndUpdate(id, { $set: { question, options } });

        res.json(result);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }
});

module.exports = router;