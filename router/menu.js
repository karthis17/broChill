const router = require('express').Router();
const adminRole = require('../middelware/checkRole');
const sub = require('../model/subCategory.model');
const thumbl = require('../model/categoryThum.model');
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');

router.post('/add-thumbnail', uploadFile.single("thumbnail"), async (req, res) => {

    const { category } = req.body;

    if (!req.file) {
        return res.status(404).json({ success: false, error: 'thumbnail not found' });
    }

    try {

        const thh = await thumbl.findOne({ category: category });

        if (thh) {


            thh.thumbnail = await uploadAndGetFirebaseUrl(req);

            thh.save();
        } else {

            const Thumbnail = new thumbl({
                category, thumbnail: await uploadAndGetFirebaseUrl(req)
            });

            await Thumbnail.save()
        }


        res.status(200).json({ success: true, message: 'thumbnail upodate' });

    } catch (error) {

        res.status(500).json({ error: 'Internal server error' });
    }
});


router.post('/edit-thumbnail', uploadFile.single("thumbnail"), async (req, res) => {

    const { category } = req.body;
    try {

        const thh = await thumbl.findOne({ category: category });

        if (req.file) {

            thh.thumbnail = await uploadAndGetFirebaseUrl(req);
        }

        thh.save();


        res.status(200).json({ success: true, message: 'thumbnail upodate' });


    } catch (error) {

        res.status(500).json({ error: 'Internal server error' });
    }
});



router.post('/add-subcategory', uploadFile.single("thumbnail"), async (req, res) => {

    const { category, title } = req.body;

    if (!req.file) {
        return res.status(404).json({ success: false, error: 'thumbnail not found' });
    }

    try {


        const Thumbnail = new sub({
            category, thumbnail: await uploadAndGetFirebaseUrl(req), title
        });

        await Thumbnail.save()



        res.status(200).json({ success: true, message: 'thumbnail upodate', data: Thumbnail.toJSON() });


    } catch (error) {

        res.status(500).json({ error: 'Internal server error' });
    }
});


router.get('/get-subcategory/:category', async (req, res) => {

    const category = req.params.category;

    try {

        console.log(category);
        const category1 = await sub.find({ category: category });

        if (category1.length > 0) {
            category1.unshift({ title: 'All', thumbnail: `${req.protocol}://${req.get('host')}/product5.jpg` });
        }

        res.status(200).json(category1);

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message });
    }

});


module.exports = router;