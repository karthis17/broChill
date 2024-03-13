const feeds = require('../model/feed.model');
const router = require('express').Router();
const auth = require('../middelware/auth');
const adminRole = require('../middelware/checkRole');
const { uploadFile, uploadAndGetFirebaseUrl, bucket } = require('../commonFunc/firebase');
const Category = require('../model/categoryModel');

router.post('/upload-feed', auth, adminRole, uploadFile.single('feed'), async (req, res) => {
    console.log(req.body)
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const fileUrl = await uploadAndGetFirebaseUrl(req)
        console.log(req.file)

        let { description, category, title, language, isActive } = req.body;




        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }


        // const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
        // const imagePath = req.file.path;
        const feed = await feeds.create({ category, title, imageUrl: fileUrl, description, isActive, user: req.user.id, language });
        console.log(feed);
        const Language = await Category.findById(feed.language);
        if (!category) {
            return res.status(404).send({ success: false, error: 'Language not found' });
        }
        Language.data.feeds.push(feed._id);
        const savedCategory = await Language.save();


        res.status(201).json(feed);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

});



router.get('/get-feed/:id', async (req, res) => {

    const lang = req.query.lang;

    try {
        const feed = await feeds.findById(req.params.id).populate('comments.user');
        if (lang) {
            const title = feed.titleDifLang.find(tit => tit.lang === lang);
            const description = feed.descriptionDifLang.find(dis => dis.lang === lang);

            feed.title = title ? title.text : feed.title;
            feed.description = description ? description.text : feed.description;


            res.json(feed);
        } else {

            res.json(feed);
        }
        res.send(feed)
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', err: error.message });
    }

});


router.get("/category/:category", async (req, res) => {
    try {
        const data = await feeds.find({ category: req.params.category });
        res.send(data);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error:' + error });
    }
});



router.get("/get-all", async (req, res) => {
    const lang = req.query.lang;
    try {
        const feed = await feeds.find({ language: lang }).populate({
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


router.get("/all", async (req, res) => {
    try {

        const result = await feeds.find();

        res.send(result);
    } catch (error) {

        res.status(500).json({ message: error.message });

    }
});




router.post('/:postId/like', auth, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id; // Assuming user is authenticated and user ID is available in request

        // Check if the post is already liked by the user
        const post = await feeds.findById(postId);
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
        const feedId = req.params.id;
        const response = await feeds.findByIdAndUpdate(feedId, { $inc: { shares: 1 } }, { new: true })
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/view/:id', async (req, res) => {

    const id = req.params.id;

    try {
        const response = await feeds.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.feedId) res.status(404).json({ message: 'feed id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await feeds.findByIdAndUpdate(req.body.feedId, { $push: { comments: { text: req.body.comment, user: req.user.id } } }, { new: true })
        res.status(200).json({
            message: "comment added successfully",
            data: response
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.put("/update", auth, adminRole, uploadFile.single("new_feed"), async (req, res) => {

    console.log(req.body)
    let { description, category, title, language, isActive, id, imageUrl } = req.body;
    try {
        if (req.file) {
            imageUrl = await uploadAndGetFirebaseUrl(req)
        }

        console.log(req.file)


        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        const feed = await feeds.findByIdAndUpdate(id, { $set: { category, title, imageUrl, description, language, isActive } });
        console.log(feed);

        res.status(201).json(feed);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

});


router.delete('/delete/:id', auth, adminRole, async (req, res) => {

    const id = req.params.id;

    const feed = await feeds.findById(id);

    if (!feed) {
        return res.status(404).json({ message: 'feed not found' });
    }

    try {
        // Delete the file from Firebase Storage
        const fileUrl = feed.imageUrl;
        const encodedFileName = fileUrl.split('/').pop().split('?')[0];
        const fileName = decodeURIComponent(encodedFileName);
        console.log("Attempting to delete file:", fileName);
        try {

            await bucket.file(fileName).delete();
            console.log(fileName, "deleted");
        } catch (e) {
            console.log("Error deleting file", e.message);
        }

        // Delete the feed from the database
        await feeds.deleteOne({ _id: id });

        res.send({ message: 'File deleted successfully', success: true });
    } catch (err) {
        res.status(500).send({ message: err.message, success: false });
    }
});




router.get('/publish/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await feeds.findByIdAndUpdate(postId, { $set: { isActive: true } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});

router.get('/draft/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await feeds.findByIdAndUpdate(postId, { $set: { isActive: false } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});

module.exports = router;