const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const reels = require('../model/reels.model');
const auth = require('../middelware/auth');
const deleteImage = require('../commonFunc/delete.image');
const { text } = require('body-parser');

const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/upload-reel', auth, upload.single('reel'), async (req, res) => {

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log(req.file)

        let { category, hashtags, titleDifLang, descriptionDifLang, title, description } = req.body;

        titleDifLang = JSON.parse(titleDifLang);
        descriptionDifLang = JSON.parse(descriptionDifLang);

        console.log(titleDifLang, descriptionDifLang)


        if (!Array.isArray(hashtags)) {
            return res.status(404).json({ message: 'hashtags must be an array' });
        }


        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
        const filePath = req.file.path;
        const reel = await reels.create({ category, titleDifLang, fileUrl, filePath, descriptionDifLang, user: req.user.id, hashtags, title, description });
        console.log(reel);

        res.status(201).json(reel);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

});


router.get('/search', async (req, res) => {

    try {
        const ress = await reels.find({ hashtags: { $in: [hashtag] } });
        res.json(ress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});


router.get('/get-reel/:id', async (req, res) => {

    const lang = req.query.lang;

    try {
        const reel = await reels.findById(req.params.id);

        if (lang) {
            const title = reel.titleDifLang.find(tit => tit.lang === lang);
            const description = reel.descriptionDifLang.find(dis => dis.lang === lang);

            reel.title = title ? title.text : reel.title;
            reel.description = description ? description.text : reel.title;


            res.json(reel);
        } else {

            res.json(reel);
        }
        res.send(reel)
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', err: error.message });
    }

});

router.get("/get-all", async (req, res) => {
    try {
        const lang = req.query.lang;

        const reelsData = await reels.find();

        if (lang) {
            let result = await reelsData.map(reel => {
                const title = reel.titleDifLang.find(tit => tit.lang === lang);
                const description = reel.descriptionDifLang.find(dis => dis.lang === lang);

                // If title or description is found in the specified language, use its text, otherwise fallback to default
                reel.title = title ? title.text : reel.title;
                reel.description = description ? description.text : reel.title;

                return reel;
            });

            res.json(result);
        } else {

            res.json(reelsData);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.post('/like', auth, async (req, res) => {
    try {
        const reelId = req.body.reelId;
        const userId = req.user.id;

        const reel = await reels.findById(reelId);
        if (!reel) {
            return res.status(404).json({ message: 'reel not found' });
        }

        if (reel.likes.includes(userId)) {
            return res.status(400).json({ message: 'You have already liked this reel' });
        }

        // Add user's ID to the likes array and save the reel
        reel.likes.push(userId);
        await reel.save();

        res.status(200).json({ message: 'reel liked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



router.post('/share', async (req, res) => {
    try {
        const response = await reels.findByIdAndUpdate(req.body.reelId, { $inc: { shares: 1 } })

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.reelId) res.status(404).json({ message: 'reel id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await reels.findByIdAndUpdate(req.body.reelId, { $push: { comments: { text: req.body.comment, user: req.user.id } } })
        res.status(200).json({
            message: "comment added successfully",
            data: response
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.delete('/delete/:reelId', auth, async (req, res) => {


    try {
        const reel = await reels.findById(req.params.reelId);
        let image = path.join(__dirname, `../${await reel.filePath}`);

        if (deleteImage(image)) {
            await reels.deleteOne({ _id: await reel._id });
            res.status(200).json({ message: "record deleted successfully" });
        }
        else {
            res.status(400).json({ message: "error while delete file" });
        }

    }
    catch (error) {
        res.status(500).json({ message: error.message, success: false });

    }

});

router.put("/update", auth, upload.single("new_reel"), async (req, res) => {

    console.log(req.body)
    let { description, category, hashtags, title, id, fileUrl, filePath } = req.body;
    try {
        if (req.file) {
            await deleteImage(path.join(__dirname, `../${filePath}`))
            fileUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
            filePath = req.file.path;
        }

        console.log(req.file)


        if (!Array.isArray(hashtags)) {
            return res.status(404).json({ message: 'hashtags must be an array' });
        }


        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        const reel = await reels.findByIdAndUpdate(id, { $set: { category, title, filePath, fileUrl, description, hashtags } });
        console.log(reel);

        res.status(201).json(reel);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

});


module.exports = router;