const router = require('express').Router();
const reels = require('../model/reels.model');
const auth = require('../middelware/auth');
const { uploadFile, uploadAndGetFirebaseUrl, bucket } = require('../commonFunc/firebase');
const adminRole = require('../middelware/checkRole');
const Category = require('../model/categoryModel');


const upp = uploadFile.fields([{
    name: "reel",
    maxCount: 1
}, {
    name: 'thumbnail',
    maxCount: 1
}])

router.post('/upload-reel', auth, adminRole, upp, async (req, res) => {

    const { language, description, subCategory, title, isActive } = req.body;

    try {

        let fileUrl;
        let thumbnail;
        try {

            fileUrl = await uploadAndGetFirebaseUrl(req.files['reel'][0]);
        } catch (e) {
            return res.status(404).send({ success: false, message: "reel upload failed" });
        }

        try {
            thumbnail = await uploadAndGetFirebaseUrl(req.files['thumbnail'][0]);
        } catch (error) {
            return res.status(404).send({ success: false, message: "thumbnail upload failed" });

        }


        const reel = await reels.create({ subCategory, title, fileUrl, user: req.user.id, language, isActive, description, thumbnail });

        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        const Language = await Category.findById(reel.language);
        if (!Language) {
            return res.status(404).send({ success: false, error: 'Language not found' });
        }
        Language.data.reels.push(reel._id);
        const savedCategory = await Language.save();


        return res.status(201).json(reel);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error:' + error });
    }
});



router.get('/get/:id', async (req, res) => {

    if (!req.params.id) {
        res.status(404).json({ message: 'Missing quizze id' });
    }
    const lang = req.query.lang;

    try {
        const con = await reels.find({ subCategory: req.params.id, language: lang, isActive: true }).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: '-password'
            }
        });
        res.json(con);
    } catch (error) {
        res.status(500).json(error.message);
    }
});


router.get("/all", async (req, res) => {
    try {
        res.send(await reels.find());
    } catch (error) {

        res.status(500).json({ message: 'Internal server error:' + error });
    }
});

router.get('/get-reel/:id', async (req, res) => {

    const lang = req.query.lang;

    try {
        const reel = await reels.findById(req.params.id).populate({
            path: 'user',
            select: '-password'
        }).populate({
            path: 'comments',
            populate: {
                psth: 'user',
                select: '-password'
            }
        })


        res.send(reel)
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', err: error.message });
    }

});

router.get("/get-all", async (req, res) => {
    const lang = req.query.lang;
    try {
        const feed = await reels.find({ language: lang, isActive: true }).populate({
            path: 'user',
            select: '-password'
        }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: '-password'
            }
        })

        res.send(feed);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});

router.post('/:postId/like', auth, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id; // Assuming user is authenticated and user ID is available in request

        // Check if the post is already liked by the user
        const post = await reels.findOne({ customId: postId });
        const isLiked = post.likes.includes(userId);

        let like = false;

        // Update like status based on current state
        if (isLiked) {
            // If already liked, unlike the post
            post.likes.pull(userId);
        } else {
            // If not liked, like the post
            like = true;
            post.likes.push(userId);
        }

        // Save the updated post
        await post.save();

        res.status(200).json({ success: true, like, message: 'Post liked/unliked successfully.' });
    } catch (error) {
        console.error('Error liking/unliking post:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request.' });
    }
});



router.get('/share/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const response = await reels.findOneAndUpdate({ customId: postId }, { $inc: { shares: 1 } }, { new: true })
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/view/:id', async (req, res) => {

    const id = req.params.id;

    try {
        const response = await reels.findOneAndUpdate({ customId: id }, { $inc: { views: 1 } }, { new: true });
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment/:id', auth, async (req, res) => {
    // if (!req.body.id) res.status(404).json({ message: 'id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await reels.findOneAndUpdate({ customId: req.params.id }, { $push: { comments: { text: req.body.comment, user: req.user.id } } }, { new: true }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: ['-password', '-post']
            }
        });
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.delete('/delete/:id', auth, adminRole, async (req, res) => {

    const id = req.params.id;

    const reel = await reels.findById(id);

    if (!reel) {
        return res.status(404).json({ message: 'Reel not found' });
    }

    try {
        // Delete the file from Firebase Storage
        // Delete the file from Firebase Storage
        const fileUrl = reel.fileUrl;
        const encodedFileName = fileUrl.split('/').pop().split('?')[0];
        const fileName = decodeURIComponent(encodedFileName);
        console.log("Attempting to delete file:", fileName);
        try {
            await bucket.file(fileName).delete();
            console.log(fileName, "deleted");
        } catch (e) {
            console.log("Error deleting file", e.message);
        }
        // Delete the reel from the database
        await reels.deleteOne({ _id: id });

        res.send({ message: 'File deleted successfully', success: true });
    } catch (err) {
        res.status(500).send({ message: err.message, success: false });
    }
});


router.put("/update", auth, adminRole, upp, async (req, res) => {

    console.log(req.body)
    let { description, subCategory, title, language, isActive, id, fileUrl, thumbnail } = req.body;
    try {
        if ('reel' in req.files) {
            fileUrl = await uploadAndGetFirebaseUrl(req.files['reel'][0])
        }

        if ('thumbnail' in req.files) {
            thumbnail = await uploadAndGetFirebaseUrl(req.files['thumbnail'][0]);
        }
        console.log(req.file)


        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        const feed = await reels.findByIdAndUpdate(id, { $set: { subCategory, title, fileUrl, description, language, isActive, thumbnail } });
        console.log(feed);

        res.status(201).json(feed);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

});


router.get('/publish/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await reels.findByIdAndUpdate(postId, { $set: { isActive: true } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});

router.get('/draft/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await reels.findByIdAndUpdate(postId, { $set: { isActive: false } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});

module.exports = router;