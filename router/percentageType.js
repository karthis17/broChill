const Percentage = require('../model/percentageType.model');
const router = require('express').Router();
const auth = require('../middelware/auth');
const multer = require('multer');
const path = require('path');



const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + file.originalname + new Date().getMilliseconds() + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });



router.post("/add-question", async (req, res) => {


    const { question, result } = req.body;

    try {
        const ress = await Percentage.create({ question, result });
        res.send(ress);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }

});


router.get('/question/:id', async (req, res) => {

    try {
        const ress = await Percentage.findById(req.params.id);
        res.send(ress);
    } catch (error) {

        res.status(500).send(error.message);
    }

});


router.get('/get-all', async (req, res) => {
    try {
        const result = await Percentage.find();
        res.send(result);
    } catch (error) {

        res.status(500).send(error.message);
    }
});

router.post('/result', async (req, res) => {

    const { range, id } = req.body;

    try {
        const document = await Percentage.findById(id);
        if (!document) {
            res.status(404).send({ message: "No document found with the provided ID." });
        }

        const result = document.result.find(item => {
            return item.rangeFrom < range && item.rangeTo > range;
        });

        if (result) {
            res.send({ text: result.text, _id: id });
        } else {
            res.status(404).send({ message: "No text found for the given range." });
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
});


router.post('/likes', auth, async (req, res) => {
    try {
        const percentage_id = req.body.id;
        const userId = req.user.id;

        // Check if the user has already liked the post
        const percentageType = await Percentage.findById(percentage_id);
        if (!percentageType) {
            return res.status(404).json({ message: 'percentageType not found' });
        }

        if (percentageType.likes.includes(userId)) {
            return res.status(400).json({ message: 'You have already liked this percentageType' });
        }

        // Add user's ID to the likes array and save the percentageType
        percentageType.likes.push(userId);
        await percentageType.save();

        res.status(200).json({ message: 'percentageType liked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});




router.post('/share', async (req, res) => {
    try {
        const response = await Percentage.findByIdAndUpdate(req.body.id, { $inc: { shares: 1 } })

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.id) res.status(404).json({ message: 'id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await Percentage.findByIdAndUpdate(req.body.id, { $push: { comments: { text: req.body.comment, user: req.user.id } } })
        res.status(200).json({
            message: "comment added successfully",
            data: response
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.delete('/delete/:id', async (req, res) => {
    try {


        await Percentage.deleteOne({ _id: req.params.id });

        res.send({ message: "deleted successfully" });
    } catch (error) {
        res.status(500).send({ message: "internal error: " + error.message })
    }
});


router.put('/update', upload.single('frame'), async (req, res) => {

    const { question, result, id } = req.body;

    try {
        const ress = await Percentage.findByIdAndUpdate(id, { $set: { question, result } });
        res.send(ress);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }

})

module.exports = router;