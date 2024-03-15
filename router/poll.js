const router = require('express').Router();
const adminRole = require('../middelware/checkRole');
const Poll = require('../model/poll.model');
const auth = require('../middelware/auth');
const { uploadFile, uploadAndGetFirebaseUrl, bucket } = require('../commonFunc/firebase');
const Category = require('../model/categoryModel');


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
        const lang = req.query.lang;

        const poll = await Poll.find({ language: lang, isActive: true }).populate({
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

router.get("/all", async (req, res) => {
    try {
        const ress = await Poll.find();

        res.send(ress);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

        let existingUser = await poll.totalVotes.find(opt => opt.votedUser.toString() === req.user.id.toString());

        console.log(existingUser);

        if (existingUser) {

            let Votedoption = poll.options.find(opt => opt._id.toString() == existingUser.option_id.toString());

            Votedoption.vote = parseInt(Votedoption.vote) - 1

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

        res.status(200).json({ message: "Vote recorded successfully", poll: { options: poll.options, totalVotes: poll.totalVotes } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});



const cpUpload1 = uploadFile.fields([
    { name: 'imageQuestion', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
    { name: 'option', maxCount: 10 }
]);


router.post('/add-poll', auth, adminRole, cpUpload1, async (req, res) => {
    let { textQuestion, options, isActive, description, language, questionType, optionType } = req.body;
    console.log(req.body, req.files)

    let imageQuestion = "";
    if (req.files['imageQuestion']) {
        imageQuestion = await uploadAndGetFirebaseUrl(req.files['imageQuestion'][0]);
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
        const poll = await Poll.create({ textQuestion, isActive, imageQuestion, options: optionsArray, thumbnail, description, language, user: req.user.id, questionType, optionType });

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

router.get('/share/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const response = await Poll.findByIdAndUpdate(postId, { $inc: { shares: 1 } }, { new: true })
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/view/:id', async (req, res) => {

    const id = req.params.id;

    try {
        const response = await Poll.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.delete('/delete/:id', auth, adminRole, async (req, res) => {

    const id = req.params.id;

    const cont = await Poll.findById(id);

    if (!cont) {
        return res.status(404).json({ message: 'cont not found' });
    }

    try {
        // Delete the file from Firebase Storage
        const fileUrl = cont.thumbnail;
        const encodedFileName = fileUrl.split('/').pop().split('?')[0];
        const fileName = decodeURIComponent(encodedFileName);
        console.log("Attempting to delete file:", fileName);
        try {

            await bucket.file(fileName).delete();
            console.log(fileName, "deleted");
        } catch (e) {
            console.log("Error deleting file", e.message);
        }
        if ((cont.questionType === 'image' || cont.questionType === 'both') && cont.imageQuestion) {
            const fileUrl = cont.imageQuestion;
            const encodedFileName = fileUrl.split('/').pop().split('?')[0];
            const fileName = decodeURIComponent(encodedFileName);
            console.log("Attempting to delete question image:", fileName);
            try {
                await bucket.file(fileName).delete();
                console.log(fileName, "deleted");
            } catch (err) {
                console.error("Error deleting question image:", err);
                // Skip to the next iteration of the loop
            }
        }

        console.log("Number of options:", cont.options.length); // Log the length of question.options

        if (cont.optionType == 'image' && cont.options.length > 0) {
            // Use Promise.all() for option deletions
            await Promise.all(cont.options.map(async (option) => {

                const fileUrl = option.option;
                const encodedFileName = fileUrl.split('/').pop().split('?')[0];
                const fileName = decodeURIComponent(encodedFileName);
                console.log("Attempting to delete option image:", fileName);
                try {
                    await bucket.file(fileName).delete();
                    console.log(fileName, "deleted");
                } catch (err) {
                    console.log("Error deleting option image:", err);
                    // Skip to the next iteration of the loop
                }

            }));
        } else {
            console.log("No options found for this question.");
        }


        // Delete the feed from the database
        await Poll.deleteOne({ _id: id });

        res.send({ message: 'File deleted successfully', success: true });
    } catch (err) {
        res.status(500).send({ message: err.message, success: false });
    }

});



const cpUpload2 = uploadFile.fields([
    { name: 'imageQuestion', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
    { name: 'option', maxCount: 10 }
]);
router.put('/update', auth, adminRole, cpUpload2, async (req, res) => {
    let { textQuestion, options, isActive, description, language, questionType, optionType, id, imageQuestion } = req.body;

    console.log(req.body)

    if (options) {

        options = JSON.parse(options);
    }


    if (req.files['imageQuestion']) {
        imageQuestion = await uploadAndGetFirebaseUrl(req.files['imageQuestion'][0]);
    }

    let i = 0;
    await Promise.all(options.map(async (option, k) => {
        if (typeof option.option === 'object') {
            options[k].option = await uploadAndGetFirebaseUrl(req.files['option'][i++]);
            console.log(options)
        }
    }))


    try {
        const poll = await Poll.findByIdAndUpdate(id, { $set: { options, textQuestion, imageQuestion, isActive, description, language, questionType, optionType, } }, { new: true });

        res.status(201).json({ message: 'Poll created successfully', poll });
    } catch (error) {

        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.get('/publish/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await Poll.findByIdAndUpdate(postId, { $set: { isActive: true } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});

router.get('/draft/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await Poll.findByIdAndUpdate(postId, { $set: { isActive: false } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});

module.exports = router;
