const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const Poll = require('../model/poll.model');
const auth = require('../middelware/auth');


async function getVotesForOptions(pollId) {
    try {
        const poll = await Poll.findById(pollId);

        if (!poll) {
            throw new Error('Poll not found');
        }

        const votes = poll.votes || [];

        const votesByOption = {};
        const totalVotes = votes.length;

        votes.forEach(({ votedOption }) => {
            votesByOption[votedOption] = (votesByOption[votedOption] || 0) + 1;
        });

        const percentagesByOption = [];
        for (const option in votesByOption) {
            percentagesByOption.push({ option, percentage: (votesByOption[option] / totalVotes) * 100 })

        }

        return percentagesByOption;
    } catch (error) {
        console.error('Error retrieving votes:', error);
        throw error;
    }
}



const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


router.get('/get-poll/:id', async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        const votes = await getVotesForOptions(req.params.id)
        res.send({
            poll, votes
        });
    } catch (error) {

        res.json({ error: error.message });
    }
});


router.get('/getAll', async (req, res) => {
    try {
        const poll = await Poll.find();
        res.send({
            poll
        });
    } catch (error) {

        res.json({ error: error.message });
    }
});



router.post('/vote', auth, async (req, res) => {

    try {
        const poll = await Poll.findOneAndUpdate(
            { _id: req.body.pollId },
            { $push: { votes: { votedOption: req.body.option, user: req.user.id } } },
            { new: true }
        );

        console.log(req.body);
        if (!poll) {
            return res.status(404).json({ error: 'Poll not found' });
        }

        res.status(200).json({ message: 'Vote added successfully', poll });
    } catch (error) {
        console.error('Error adding vote:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

});

router.post('/add-text-poll', upload.single('question'), async (req, res) => {
    const { question, options } = req.body;
    console.log(req.body, req.file)

    let qn;

    if (req.file) {
        qn = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
    } else {
        qn = question;
    }

    const optionsArray = Array.isArray(options) ? options : [options];

    try {
        const poll = await Poll.create({ question: qn, option: optionsArray });

        res.status(201).json({ message: 'Poll created successfully', poll });
    } catch (error) {

        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

});

const cpUpload = upload.fields([{ name: 'question', maxCount: 1 }, { name: 'options', maxCount: 10 }]);

router.post('/add-img-poll', cpUpload, async (req, res) => {
    const { question } = req.body;

    const optionsArray = []
    req.files['options'].forEach((option) => {
        console.log(option);
        const imageUrl = `${req.protocol}://${req.get('host')}/${option.filename}`;
        optionsArray.push(imageUrl);
    });

    let qn;

    if (req.files['question']) {
        req.files['question'].forEach((question) => {

            qn = `${req.protocol}://${req.get('host')}/${question.filename}`;

        })
    } else {
        qn = question;
    }


    try {
        const poll = await Poll.create({ question: qn, option: optionsArray });

        res.status(201).json({ message: 'Poll created successfully', poll });
    } catch (error) {

        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

});

module.exports = router;
