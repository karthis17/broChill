const router = require('express').Router();
const adminRole = require('../middelware/checkRole');
const Poll = require('../model/poll.model');
const auth = require('../middelware/auth');
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');
const Category = require('../model/categoryModel');

// async function getVotesForOptions(pollId) {
//     try {
//         const poll = await Poll.findById(pollId);

//         if (!poll) {
//             throw new Error('Poll not found');
//         }

//         const votes = poll.votes || [];

//         const votesByOption = {};
//         const totalVotes = votes.length;

//         votes.forEach(({ votedOption }) => {
//             votesByOption[votedOption] = (votesByOption[votedOption] || 0) + 1;
//         });

//         const percentagesByOption = [];
//         for (const option in votesByOption) {
//             percentagesByOption.push({ option: +option, percentage: (votesByOption[option] / totalVotes) * 100 })

//         }

//         return percentagesByOption;
//     } catch (error) {
//         console.error('Error retrieving votes:', error);
//         throw error;
//     }
// }

router.get('/get-poll/:id', async (req, res) => {

    try {
        const poll = await Poll.findById(req.params.id).populate('user', 'comments.user');

        res.send(poll)

    } catch (error) {

        res.json({ error: error.message });
    }
});


router.get('/get-all', async (req, res) => {
    try {
        const lang = req.query.lang ? req.query.lang : "english";

        const poll = await Poll.find({ language: lang }).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user'
            }
        });

        res.json(poll);


    } catch (error) {

        res.json({ error: error.message });
    }
});


router.post('/:pollId/vote', auth, async (req, res) => {
    const pollId = req.params.pollId;
    const { optionId } = req.body;

    try {
        // Find the poll by ID
        const poll = await Poll.findById(pollId);
        if (!poll) {
            return res.status(404).json({ error: "Poll not found" });
        }

        // Check if the option exists in the poll
        const option = poll.options.find(opt => opt._id == optionId);
        if (!option) {
            return res.status(404).json({ error: "Option not found in the poll" });
        }

        // option.votedUsers.push(req.user.id);
        option.vote = option.vote ? parseInt(option.vote) + 1 : 1;

        let existingUser = poll.totalVotes.find(opt => opt.user === req.user.id);

        if (existingUser) {

            let Votedoption = poll.options.find(opt => opt._id == existingUser.option_id);

            Votedoption.vote = parseInt(option.vote) - 1

            existingUser.option_id = optionId;

        } else {

            poll.totalVotes.push({ votedUser: req.user.id, option_id: option._id });
        }



        // Calculate the percentage of votes for each option
        poll.options.forEach(opt => {
            opt.percentage = ((opt.vote || 0) / poll.totalVotes.length) * 100;
        });

        // Save the updated poll
        await poll.save();

        res.status(200).json({ message: "Vote recorded successfully", poll: poll.options });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// router.post('/vote', auth, async (req, res) => {

//     try {
//         const poll = await Poll.findOneAndUpdate(
//             { _id: req.body.pollId },
//             { $push: { votes: { votedOption: req.body.option, user: req.user.id } } },
//             { new: true }
//         );

//         console.log(req.body);
//         if (!poll) {
//             return res.status(404).json({ error: 'Poll not found' });
//         }

//         res.status(200).json({ message: 'Vote added successfully', poll });
//     } catch (error) {
//         console.error('Error adding vote:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }

// });

const cpUpload1 = uploadFile.fields([
    { name: 'question', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
    { name: 'option', maxCount: 10 }
]);


router.post('/add-poll', auth, adminRole, cpUpload1, async (req, res) => {
    let { question, options, description, language, questionType, optionType } = req.body;
    console.log(req.body, req.file)

    let qn;
    if (req.files['question']) {
        qn = await uploadAndGetFirebaseUrl(req.files['question'][0]);
    } else {
        qn = question;
    }


    let optionsArray = [];

    if (optionType === 'image') {
        const promiseImgs = []
        await Promise.all(req.files['option'].map(async (option) => {
            console.log(option);
            promiseImgs.push({ option: await uploadAndGetFirebaseUrl(option) });
        }));
        optionsArray = await Promise.all(promiseImgs);

    } else {
        optionsArray = JSON.parse(options);
    }

    console.log(optionsArray)

    if (!req.files["thumbnail"]) {
        return res.status(404).send({ message: "No file found" });

    }

    let thumbnail = await uploadAndGetFirebaseUrl(req.files["thumbnail"][0]);


    try {
        const poll = await Poll.create({ question: qn, options: optionsArray, thumbnail, description, language, user: req.user.id, questionType, optionType });

        const Language = await Category.findById(poll.language);
        if (!Language) {
            return res.status(404).send({ success: false, error: 'Language not found' });
        }
        Language.data.polls.push(poll._id);
        const savedCategory = await Language.save();

        res.status(201).json({ message: 'Poll created successfully', poll });
    } catch (error) {

        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

});



const cpUpload = uploadFile.fields([{ name: 'question', maxCount: 1 },]);

router.post('/add-img-poll', auth, adminRole, cpUpload, async (req, res) => {
    const { question, options, description, language, questionType, optionType } = req.body;


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
        const poll = await Poll.create({ question: qn, options, description, language, questionType, optionType });

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
        const response = await Poll.findByIdAndUpdate(req.body.pollId, { $push: { comments: { text: req.body.comment, user: req.user.id } } }, { new: true })
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
        const response = await Poll.findByIdAndUpdate(req.body.pollId, { $inc: { shares: 1 } }, { new: true });
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
