const router = require('express').Router();
const adminRole = require('../middelware/checkRole');
const Poll = require('../model/poll.model');
const auth = require('../middelware/auth');
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');

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
            percentagesByOption.push({ option: +option, percentage: (votesByOption[option] / totalVotes) * 100 })

        }

        return percentagesByOption;
    } catch (error) {
        console.error('Error retrieving votes:', error);
        throw error;
    }
}

router.get('/get-poll/:id', async (req, res) => {

    try {
        const poll = await Poll.findById(req.params.id).populate('comments.user');
        let votes = await getVotesForOptions(req.params.id)

        votes.map(vote => { })

        const lang = req.query.lang ? req.query.lang : "english";

        if (lang) {
            const question = poll.questionDifLang.find(tit => tit.lang === lang);
            const option = poll.optionDifLang.find(tit => tit.lang === lang);

            poll.question = question ? question.text : poll.question;

            if (option) {
                poll.option = option.data;
            }

            res.send({
                poll, votes
            });
        } else {

            res.send({


                poll, votes
            });
        }

    } catch (error) {

        res.json({ error: error.message });
    }
});


router.get('/getAll', async (req, res) => {
    try {
        const lang = req.query.lang ? req.query.lang : "english";

        const poll = await Poll.find().populate('comments.user');

        if (lang) {
            let result = await poll.filter(p => {
                const question = p.questionDifLang.find(tit => tit.lang === lang);
                const answer = p.optionDifLang.find(tit => tit.lang === lang);

                p.question = question ? question.text : p.question;

                if (answer && question) {

                    p.option = answer.data;
                    return p;
                }
                else
                    return null;
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

const cpUpload1 = uploadFile.fields([
    { name: 'question', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
]);


router.post('/add-text-poll', auth, adminRole, cpUpload1, async (req, res) => {
    let { question, questionDifLang, optionDifLang } = req.body;
    console.log(req.body, req.file)

    let qn;

    if (questionDifLang) {
        questionDifLang = JSON.parse(questionDifLang);
    }
    if (optionDifLang) {
        optionDifLang = JSON.parse(optionDifLang);
    }
    if (req.files['question']) {
        qn = await uploadAndGetFirebaseUrl(req.files['question'][0]);
    } else {
        qn = question;
    }

    if (!req.files["thumbnail"]) {
        return res.status(404).send({ message: "No file found" });

    }

    let thumbnail = await uploadAndGetFirebaseUrl(req.files["thumbnail"][0]);


    try {
        const poll = await Poll.create({ question: qn, option: [], questionDifLang, optionDifLang, thumbnail });

        res.status(201).json({ message: 'Poll created successfully', poll });
    } catch (error) {

        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

});



const cpUpload = uploadFile.fields([{ name: 'question', maxCount: 1 }, { name: 'options', maxCount: 10 }]);

router.post('/add-img-poll', auth, adminRole, cpUpload, async (req, res) => {
    const { question, questionDifLang } = req.body;

    console.log(questionDifLang);

    if (questionDifLang) {
        questionDifLang = JSON.parse(questionDifLang);
    }

    const promiseImgs = []
    req.files['options'].forEach((option) => {
        console.log(option);
        promiseImgs.push(uploadAndGetFirebaseUrl(option));
    });
    const optionsArray = await Promise.all(promiseImgs);

    let qn = "";

    if (req.files['question']) {
        const qs = req.files['question'][0]
        qn = await uploadAndGetFirebaseUrl(qs);
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
router.post('/:postId/like', auth, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id; // Assuming user is authenticated and user ID is available in request

        // Check if the post is already liked by the user
        const post = await Poll.findById(postId);
        const isLiked = post.likes.includes(userId);

        // Update like status based on current state
        if (isLiked) {
            // If already liked, unlike the post
            post.likes.pull(userId);
        } else {
            // If not liked, like the post
            post.likes.push(userId);
        }

        // Save the updated post
        await post.save();

        res.status(200).json({ success: true, message: 'Post liked/unliked successfully.' });
    } catch (error) {
        console.error('Error liking/unliking post:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request.' });
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

router.delete('/delete/:pollId', auth, adminRole, async (req, res) => {

    try {
        await Poll.deleteOne({ _id: req.params.pollId });
        res.status(200).json({ message: "poll deleted successfully", success: true });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", success: false, error: error.message });
    }

});

router.put('/update', auth, adminRole, uploadFile.single('question'), async (req, res) => {
    const { question, options, id } = req.body;
    console.log(req.body, req.file)

    let qn;

    if (req.file) {
        qn = await uploadAndGetFirebaseUrl(req);
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
