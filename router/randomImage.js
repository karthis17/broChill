const RandImg = require('../model/randomImage.model');
const router = require('express').Router();
const auth = require('../middelware/auth');
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');

router.post("/upload-frame", uploadFile.single('frame'), async (req, res) => {


    const { frameName } = req.body;

    if (!req.file) {
        res.status(404).send({ menubar: 'frame is not found' });
    }

    const fileUrl = await uploadAndGetFirebaseUrl(req)

    try {
        const frame = await RandImg.create({ fileUrl, frameName });
        res.send(frame);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }

});


router.get('/get-frame', async (req, res) => {

    try {
        const frames = await RandImg.find();
        const randomNum = Math.floor(Math.random() * frames.length);

        res.send(frames[randomNum]);
    } catch (error) {

        res.status(500).send(error.message);
    }

});


router.get('/get-all', async (req, res) => {
    try {
        const frames = await RandImg.find();
        res.send(frames);
    } catch (error) {

        res.status(500).send(error.message);
    }
});


router.get('/:id', async (req, res) => {
    try {
        const frame = await RandImg.findById(req.params.id);
        res.send(frame);
    } catch (error) {

        res.status(500).send(error.message);
    }
});


router.post('/likes', auth, async (req, res) => {
    try {
        const frame_id = req.body.id;
        const userId = req.user.id;

        // Check if the user has already liked the post
        const frame = await RandImg.findById(frame_id);
        if (!frame) {
            return res.status(404).json({ message: 'frame not found' });
        }

        if (frame.likes.includes(userId)) {
            return res.status(400).json({ message: 'You have already liked this frame' });
        }

        // Add user's ID to the likes array and save the frame
        frame.likes.push(userId);
        await frame.save();

        res.status(200).json({ message: 'frame liked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});




router.post('/share', async (req, res) => {
    try {
        const response = await RandImg.findByIdAndUpdate(req.body.id, { $inc: { shares: 1 } })

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.id) res.status(404).json({ message: 'feed id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await RandImg.findByIdAndUpdate(req.body.id, { $push: { comments: { text: req.body.comment, user: req.user.id } } })
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

        const ress = await RandImg.findById(req.params.id)

        if(!!ress)
        await RandImg.deleteOne({ _id: req.params.id });
        res.send({ message: "deleted successfully" });
    } catch (error) {
        res.status(500).send({ message: "internal error: " + error.message })
    }
});


router.put('/update', uploadFile.single('frame'), async (req, res) => {

    let { frameName, frameUrl, id } = req.body;


    if (req.file) {
        frameUrl = await uploadAndGetFirebaseUrl(req);
    }

    try {
        const updatedFrame = await RandImg.findByIdAndUpdate(id, { $set: { frameUrl, frameName } });
        res.send({ success: true, message: "updated successfully" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }

})



module.exports = router;