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
        const lang = req.query.lang;

        if (lang) {
            const question = poll.questionDifLang.find(tit => tit.lang === lang);

            poll.question = question ? question.text : poll.question;

            res.send({
                poll, votes
            });
        } else {

            res.send({


                poll, votes
            });
        }

        res.send({
            poll, votes
        });
    } catch (error) {

        res.json({ error: error.message });
    }
});


router.get('/getAll', async (req, res) => {
    try {
        const lang = req.query.lang;

        const poll = await Poll.find();

        if (lang) {
            let result = await poll.map(p => {
                const question = p.questionDifLang.find(tit => tit.lang === lang);

                p.question = question ? question.text : p.question;
                return p;
            });

            res.json(result);
        } else {

            res.json(poll);
        }

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
    let { question, options, questionDifLang } = req.body;
    console.log(req.body, req.file)

    let qn;

    if (questionDifLang) {
        questionDifLang = JSON.parse(questionDifLang);

    }
    if (req.file) {
        qn = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
    } else {
        qn = question;
    }

    const optionsArray = Array.isArray(options) ? options : [options];

    try {
        const poll = await Poll.create({ question: qn, option: optionsArray, questionDifLang });

        res.status(201).json({ message: 'Poll created successfully', poll });
    } catch (error) {

        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

});

const cpUpload = upload.fields([{ name: 'question', maxCount: 1 }, { name: 'options', maxCount: 10 }]);

router.post('/add-img-poll', cpUpload, async (req, res) => {
    const { question, questionDifLang } = req.body;

    if (questionDifLang) {
        questionDifLang = JSON.parse(questionDifLang);
    }

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
        const poll = await Poll.create({ question: qn, option: optionsArray, questionDifLang });

        res.status(201).json({ message: 'Poll created successfully', poll });
    } catch (error) {

        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

});

router.post('/likes', auth, async (req, res) => {

    try {
        const pollId = req.body.pollId;
        const userId = req.user.id;

        // Check if the user has already liked the post
        const poll = await Poll.findById(pollId);
        if (!poll) {
            return res.status(404).json({ message: 'poll not found' });
        }

        if (poll.likes.includes(userId)) {
            return res.status(400).json({ message: 'You have already liked this poll' });
        }

        // Add user's ID to the likes array and save the poll
        poll.likes.push(userId);
        await poll.save();

        res.status(200).json({ message: 'poll liked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.pollId) res.status(404).json({ message: 'Poll id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await Poll.findByIdAndUpdate(req.body.pollId, { $push: { comments: { text: req.body.comment, user: req.user.id } } })
        res.status(200).json({
            message: "comment added successfully",
            data: response
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/share', async (req, res) => {

    if (!req.body.pollId) res.status(404).json({ message: 'Poll id is required' });

    try {
        const response = await Poll.findByIdAndUpdate(req.body.pollId, { $inc: { shares: 1 } });
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.delete('/delete/:pollId', async (req, res) => {

    try {
        await Poll.deleteOne({ _id: req.params.pollId });
        res.status(200).json({ message: "poll deleted successfully", success: true });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", success: false, error: error.message });
    }

});

router.put('/update', upload.single('question'), async (req, res) => {
    const { question, options, id } = req.body;
    console.log(req.body, req.file)

    let qn;

    if (req.file) {
        qn = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
    } else {
        qn = question;
    }

    const optionsArray = Array.isArray(options) ? options : [options];

    try {
        const poll = await Poll.findByIdAndUpdate(id, { $set: { question: qn, option: optionsArray } });

        res.status(201).json({ message: 'Poll created successfully', poll });
    } catch (error) {

        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
