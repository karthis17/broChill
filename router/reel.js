const router = require('express').Router();
const reels = require('../model/reels.model');
const auth = require('../middelware/auth');
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');
const adminRole = require('../middelware/checkRole');


router.post('/upload-reel', auth, adminRole, uploadFile.single('reel'), async (req, res) => {

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const fileUrl = await uploadAndGetFirebaseUrl(req)
        let { category, titleDifLang, descriptionDifLang, title, description } = req.body;
        titleDifLang = JSON.parse(titleDifLang);
        descriptionDifLang = JSON.parse(descriptionDifLang);
        console.log(titleDifLang, descriptionDifLang)

        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }
        const reel = await reels.create({ category, titleDifLang, fileUrl, descriptionDifLang, user: req.user.id, title, description });
        return res.status(201).json(reel);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error:' + error });
    }
});




router.get('/category/:id', async (req, res) => {

    const lang = req.query.lang

    try {
        const ress = await reels.find({ category: req.params.id });


        if (lang) {

            let balance = []

            let result = await ress.filter(reel => {
                const title = reel.titleDifLang.find(tit => tit.lang === lang);
                const description = reel.descriptionDifLang.find(dis => dis.lang === lang);

                reel.title = title ? title.text : reel.title;
                reel.description = description ? description.text : reel.title;

                if (title || description) {

                    return reel;
                } else {
                    balance.push(reel);
                    return false;
                }

            });

            res.json([...result, ...balance]);
        } else {

            res.json(ress);
        }

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
                if (title) {
                    reel.title = title.text;
                    reel.description = description.text;
                    return reel;
                } else {
                    return false;
                }

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

router.delete('/delete/:reelId', auth, adminRole, async (req, res) => {

    try {
        const reel = await reels.findById(req.params.reelId);
        await reels.deleteOne({ _id: await reel._id });
        return res.status(200).json({ message: "record deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: error.message, success: false });

    }

});

router.put("/update", auth, adminRole, uploadFile.single("new_reel"), async (req, res) => {

    console.log(req.body)
    let { description, category, title, id, fileUrl } = req.body;
    try {
        if (req.file) {
            fileUrl = await uploadAndGetFirebaseUrl(req);
        }

        console.log(req.file)


        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        const reel = await reels.findByIdAndUpdate(id, { $set: { category, title, fileUrl, description, } });
        console.log(reel);

        return res.status(201).json(reel);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }

});



module.exports = router;