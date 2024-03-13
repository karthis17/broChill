const Frames = require('../model/frames.model');
const auth = require('../middelware/auth');
const multer = require('multer');
const router = require('express').Router();
// const path = require('path');
// const Jimp = require('jimp');
const adminRole = require('../middelware/checkRole');
const deleteImage = require('../commonFunc/delete.image');
const { uploadFile, uploadAndGetFirebaseUrl, bucket } = require('../commonFunc/firebase');
const Category = require('../model/categoryModel');


const cpUpload1 = uploadFile.fields([
    { name: 'frame', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
    { name: 'referenceImage', maxCount: 1 },
]);

router.post('/upload-frame', auth, adminRole, cpUpload1, async (req, res) => {


    let { frameName, description, language, isActive } = req.body;


    if (!req.files['frame']) {
        return res.status(404).send({ message: "No file found" });
    }

    if (!req.files['thumbnail']) {
        return res.status(404).send({ message: "No thumbnail file found" });
    }

    if (!req.files['referenceImage']) {
        return res.status(404).send({ message: "No referenceImage file found" });
    }


    try {

        let frameUrl = await uploadAndGetFirebaseUrl(req.files['frame'][0]);
        let thumbnail = await uploadAndGetFirebaseUrl(req.files['thumbnail'][0]);
        let referenceImage = await uploadAndGetFirebaseUrl(req.files['referenceImage'][0]);

        const results = await Frames.create({ frameName, frameUrl, thumbnail, referenceImage, isActive, description, language, user: req.user.id });

        const Language = await Category.findById(results.language);
        if (!Language) {
            return res.status(404).send({ success: false, error: 'Language not found' });
        }
        Language.data.frames.push(results._id);
        const savedCategory = await Language.save();





        res.send(results);
    } catch (error) {

        res.status(500).send("internal error: " + error.message);

    }
});

router.get('/get-all', async function (req, res) {
    const lang = req.params.lang;


    try {
        const data = await Frames.find({ language: lang, isActive: true }).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: '-password'
            }
        });
        res.send(data);
    } catch (error) {
        res.status(500).send("internal error: " + error.message);

    }

});

router.post('/:postId/like', auth, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id; // Assuming user is authenticated and user ID is available in request

        // Check if the post is already liked by the user
        const post = await Frames.findById(postId);
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
    if (!req.body.frame_id) res.status(404).json({ message: 'frame id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await Frames.findByIdAndUpdate(req.body.frame_id, { $push: { comments: { text: req.body.comment, user: req.user.id } } }, { new: true })
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
        const feedId = req.params.id;
        const response = await Frames.findByIdAndUpdate(feedId, { $inc: { shares: 1 } }, { new: true })
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/view/:id', async (req, res) => {

    const id = req.params.id;

    try {
        const response = await Frames.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.get('/get/:id', async (req, res) => {
    const lang = req.query.lang;

    try {
        const response = await Frames.findById(req.params.id).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: '-password'
            }
        });
        res.send(response);
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }

});

const cpUpload2 = uploadFile.fields([
    { name: 'frame', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
    { name: 'referenceImage', maxCount: 1 },
]);


router.post('/update', auth, adminRole, cpUpload2, async (req, res) => {


    let { frameName, description, language, isActive, id } = req.body;

    let frameUrl;
    let thumbnail;
    let referenceImage;

    try {
        frameUrl = await uploadAndGetFirebaseUrl(req.files['frame'][0]);
    } catch (e) {
        frameUrl = req.body.frame;
    }

    try {
        thumbnail = await uploadAndGetFirebaseUrl(req.files['thumbnail'][0]);
    } catch (error) {
        thumbnail = req.body.thumbnail;
    }

    try {
        referenceImage = await uploadAndGetFirebaseUrl(req.files['referenceImage'][0]);

    } catch (error) {
        referenceImage = req.body.referenceImage;
    }

    try {




        const results = await Frames.findByIdAndUpdate(id, { $set: { frameName, frameUrl, thumbnail, referenceImage, isActive, description, language, user: req.user.id } }, { new: true });

        const Language = await Category.findById(results.language);
        if (!Language) {
            return res.status(404).send({ success: false, error: 'Language not found' });
        }
        Language.data.frames.push(results._id);
        const savedCategory = await Language.save();





        res.send(results);
    } catch (error) {

        res.status(500).send("internal error: " + error.message);

    }
});

router.delete('/delete/:id', auth, adminRole, async (req, res) => {
    try {

        const ress = await Frames.findById(req.params.id)

        let data = [ress.thumbnail, ress.referenceImage, ress.frameUrl];


        await Promise.all(data.map(async (url) => {
            if (url) {

                const fileUrl = url;
                const encodedFileName = fileUrl.split('/').pop().split('?')[0];
                const fileName = decodeURIComponent(encodedFileName);
                console.log("Attempting to delete file:", fileName);
                try {

                    await bucket.file(fileName).delete();
                    console.log(fileName, "deleted");
                } catch (e) {
                    console.log("Error deleting file", e.message);
                }
            }

        }))

        await Frames.deleteOne({ _id: req.params.id });
        // } else {
        //     res.status(404).send({ error: 'err while deleting image' });
        // }
        res.send({ message: "result deleted successfully" });
    } catch (error) {
        res.status(500).send({ message: "internal error: " + error.message })
    }
})




router.get('/publish/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await Frames.findByIdAndUpdate(postId, { $set: { isActive: true } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});

router.get('/draft/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await Frames.findByIdAndUpdate(postId, { $set: { isActive: false } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});


router.get("/all", async (req, res) => {
    try {
        const data = await Frames.find();
        res.send(data);
    } catch (error) {
        res.status(500).send({ error: error.message, success: false });
    }
})

module.exports = router;