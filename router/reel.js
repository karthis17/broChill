const router = require('express').Router();
const reels = require('../model/reels.model');
const auth = require('../middelware/auth');
const { uploadFile, uploadAndGetFirebaseUrl, bucket } = require('../commonFunc/firebase');
const adminRole = require('../middelware/checkRole');
const Category = require('../model/categoryModel');


router.post('/upload-reel', auth, adminRole, uploadFile.single('reel'), async (req, res) => {

    const { language, description, category, title, isActive } = req.body;

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const fileUrl = await uploadAndGetFirebaseUrl(req)

        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }
        const reel = await reels.create({ category, title, fileUrl, user: req.user.id, language, isActive, description });

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



router.get("/category/:category", async (req, res) => {
    try {
        const data = await reels.find({ category: req.params.category });
        res.send(data);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error:' + error });
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
            select: -password
        }).populate({
            path: 'comments',
            populate: {
                psth: 'user',
                select: -password
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
            select: -password
        }).populate({
            path: 'comments',
            populate: {
                psth: 'user',
                select: -password
            }
        })

        res.send(feed);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/:postId/like', auth, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id; // Assuming user is authenticated and user ID is available in request

        // Check if the post is already liked by the user
        const post = await reels.findById(postId);
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



router.get('/share/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const response = await reels.findByIdAndUpdate(postId, { $inc: { shares: 1 } }, { new: true })
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/view/:id', async (req, res) => {

    const id = req.params.id;

    try {
        const response = await reels.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.reelId) res.status(404).json({ message: 'reel id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await reels.findByIdAndUpdate(req.body.reelId, { $push: { comments: { text: req.body.comment, user: req.user.id } } }, { new: true })
        res.status(200).json({
            message: "comment added successfully",
            data: response
        })
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


router.put("/update", auth, adminRole, uploadFile.single("reel"), async (req, res) => {

    console.log(req.body)
    let { description, category, title, language, isActive, id, fileUrl } = req.body;
    try {
        if (req.file) {
            fileUrl = await uploadAndGetFirebaseUrl(req)
        }

        console.log(req.file)


        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        const feed = await reels.findByIdAndUpdate(id, { $set: { category, title, fileUrl, description, language, isActive } });
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