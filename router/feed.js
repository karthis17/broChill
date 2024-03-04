const feeds = require('../model/feed.model');
const router = require('express').Router();
const auth = require('../middelware/auth');
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');

router.post('/upload-feed', auth, uploadFile.single('feed'), async (req, res) => {
    console.log(req.body)
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const fileUrl = await uploadAndGetFirebaseUrl(req)
        console.log(req.file)

        let { description, category, title, titleDifLang, descriptionDifLang } = req.body;

        titleDifLang = JSON.parse(titleDifLang);
        descriptionDifLang = JSON.parse(descriptionDifLang);

        console.log(titleDifLang, descriptionDifLang)


        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }


        // const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
        // const imagePath = req.file.path;
        const feed = await feeds.create({ category, title, imageUrl: fileUrl, description, user: req.user.id, titleDifLang, descriptionDifLang });
        console.log(feed);

        res.status(201).json(feed);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

});



router.get('/get-feed/:id', async (req, res) => {

    const lang = req.query.lang;

    try {
        const feed = await feeds.findById(req.params.id);
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

// router.get('/category/:id', async (req, res) => {
//     try {
//         const ress = await feeds.find({ category: req.params.id });
//         console.log(ress);
//         res.json(ress);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });



router.get('/category/:id', async (req, res) => {

    const lang = req.query.lang

    try {
        const ress = await feeds.find({ category: req.params.id });


        if (lang) {

            let balance = []

            let result = await ress.filter(feed => {
                const title = feed.titleDifLang.find(tit => tit.lang === lang);
                const description = feed.descriptionDifLang.find(dis => dis.lang === lang);

                feed.title = title ? title.text : feed.title;
                feed.description = description ? description.text : feed.title;

                if (title || description) {

                    return feed;
                } else {
                    balance.push(feed);
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




router.get("/get-all", async (req, res) => {
    const lang = req.query.lang;
    try {
        const feed = await feeds.find();

        if (lang && lang.toLowerCase() !== "english") {
            let result = await feed.filter(feed => {
                const title = feed.titleDifLang.find(tit => tit.lang === lang);
                const description = feed.descriptionDifLang.find(dis => dis.lang === lang);
                // If title or description is found in the specified language, use its text, otherwise fallback to default

                if (title) {
                    feed.title = title.text;
                    feed.description = description.text;
                    return feed;
                } else {
                    return false
                }
            });
            res.json(result);
        } else {
            res.json(feed);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});




router.post('/like', auth, async (req, res) => {
    try {
        const feedId = req.body.feedId;
        const userId = req.user.id;

        // Check if the user has already liked the post
        const feed = await feeds.findById(feedId);
        if (!feed) {
            return res.status(404).json({ message: 'feed not found' });
        }

        if (feed.likes.includes(userId)) {
            return res.status(400).json({ message: 'You have already liked this feed' });
        }

        // Add user's ID to the likes array and save the feed
        feed.likes.push(userId);
        await feed.save();

        res.status(200).json({ message: 'feed liked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.post('/share', async (req, res) => {
    try {
        const response = await feeds.findByIdAndUpdate(req.body.feedId, { $inc: { shares: 1 } })
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.feedId) res.status(404).json({ message: 'feed id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await feeds.findByIdAndUpdate(req.body.feedId, { $push: { comments: { text: req.body.comment, user: req.user.id } } })
        res.status(200).json({
            message: "comment added successfully",
            data: response
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.delete('/delete/:id', auth, async (req, res) => {


    try {
        const feed = await feeds.findById(req.params.id);

        await feeds.deleteOne({ _id: await feed._id });
        res.status(200).json({ message: "record deleted successfully" });

    }
    catch (error) {
        res.status(500).json({ message: error.message, success: false });

    }

});

router.put("/update", auth, uploadFile.single("new_feed"), async (req, res) => {

    console.log(req.body)
    let { description, category, title, id, imageUrl } = req.body;
    try {
        if (req.file) {
            imageUrl = await uploadAndGetFirebaseUrl(req)
        }

        console.log(req.file)


        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        const feed = await feeds.findByIdAndUpdate(id, { $set: { category, title, imageUrl, description } });
        console.log(feed);

        res.status(201).json(feed);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

});

module.exports = router;