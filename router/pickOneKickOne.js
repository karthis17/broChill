const auth = require('../middelware/auth');
const router = require('express').Router();

const pickAndKick = require('../model/pickOneKickOne.model');
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');




router.post('/add-question', uploadFile.single('question'), async (req, res) => {

    const { option1, point1, option2, point2 } = req.body;
    let question;
  

    if (req.file) {
        question = await uploadAndGetFirebaseUrl(req);
        

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

router.delete("/delete/:id", auth, async function (req, res) {

    try {

            await pickAndKick.deleteOne({ _id: req.params.id })
    
        res.status(200).json({ message: "Deleted successfully", success: true });
    } catch (error) {
        res.status(200).json({ message: error.message, success: false });

    }

});

router.put("/update", auth, uploadFile.single('question'), async (req, res) => {
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