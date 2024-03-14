const FunTest = require('../model/funtest.model');
const router = require('express').Router();
const auth = require('../middelware/auth'); const multer = require('multer');
const path = require('path');
const Jimp = require('jimp');
const deleteImage = require('../commonFunc/delete.image');
const adminRole = require('../middelware/checkRole');
const { uploadFile, uploadAndGetFirebaseUrl, bucket } = require('../commonFunc/firebase');
const Category = require('../model/categoryModel');

const ObjectId = require('mongoose').Types.ObjectId;


const cpUpload1 = uploadFile.fields([{ name: 'frame', maxCount: 3 }
    , { name: "thumbnail", maxCount: 1 }
    , { name: "referenceImage", maxCount: 1 }
]);

router.post("/add-question", auth, adminRole, cpUpload1, async (req, res) => {


    let { question, texts, frames, isActive, description, language, type, noOfUserImage, range } = req.body;

    if (texts) {
        texts = JSON.parse(texts);
    }

    if (frames) {
        frames = JSON.parse(frames);
    }

    if (range) {
        range = JSON.parse(range);
    }

    if (!req.files["frame"]) {
        res.status(404).send({ menubar: 'frame is not found' });
    }

    if (!req.files["thumbnail"]) {
        return res.status(404).send({ message: "No tumbnail file found" });

    }
    // if (!req.files["referenceImage"]) {
    //     return res.status(404).send({ message: "No tumbnail file found" });

    // }

    let referenceImage;

    if (req.files["referenceImage"]) {

        referenceImage = await uploadAndGetFirebaseUrl(req.files["referenceImage"][0]);
    }
    let thumbnail;
    if (req.files["thumbnail"]) {

        thumbnail = await uploadAndGetFirebaseUrl(req.files["thumbnail"][0]);
    }

    await Promise.all(frames.map(async (frame, i) => {
        const frameUrl = await uploadAndGetFirebaseUrl(req.files["frame"][i]);
        frames[i]['frameUrl'] = frameUrl;
    }));



    try {



        const ress = await FunTest.create({ question, isActive, texts, description, language, frames, thumbnail, referenceImage, range, noOfUserImage, category: type, user: req.user.id });

        const Language = await Category.findById(ress.language);
        if (!Language) {
            return res.status(404).send({ success: false, error: 'Language not found' });
        }
        Language.data.funTest.push(ress._id);
        const savedCategory = await Language.save();

        res.send(ress);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }

});



router.post('/random-image/:id', async (req, res) => {
    try {
        const ress = await FunTest.findById(req.params.id);


        let frame;
        if (req.body.frameId) {
            console.log(req.body.frameId);

            const frameIdObjectId = new ObjectId(req.body.frameId);

            // Now you can compare the ObjectIds
            let f_id = ress.frames.findIndex(f => f._id.equals(frameIdObjectId));
            console.log(f_id, "asdfg")
            if (f_id !== -1) {
                frame = ress.frames[f_id + 1]
            } else {
                frame = ress.frames[0];
            }

        } else {

            frame = ress.frames[0];
        }

        if (frame === undefined) {
            frame = ress.frames[0]
        }

        const maskImages = [req.body.image]
        const baseImage = frame.frameUrl;
        const width = frame.frame_size.width;
        const height = frame.frame_size.height;
        const coordinates = frame.coordinates;

        const outputPath = path.join(__dirname, `../uploads/${req.params.id}.png`);

        console.log(outputPath);

        await applyMaskImg(baseImage, maskImages, outputPath, coordinates, width, height);

        res.send({ _id: frame._id, result: `${req.protocol}://${req.get('host')}/${req.params.id}.png` });
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send(error.message);
    }
});


const cpupp = uploadFile.fields([{
    name: 'image', maxCount: 10
}])

router.post('/random-text/:id', cpupp, async (req, res) => {

    try {
        const ress = await FunTest.findById(req.params.id);

        let maskImages = []

        try {
            if (req.files['image']) {

                maskImages = await Promise.all(req.files['image'].map(async (file) => {
                    return await uploadAndGetFirebaseUrl(file);
                }));
            }
        }
        catch (e) {
            console.log(e)
        }


        let randomNumber = Math.floor(Math.random() * await ress.texts.length);

        const baseImage = ress.frames[0].frameUrl;
        const width = ress.frames[0].frame_size.width;
        const height = ress.frames[0].frame_size.height;
        const coordinates = ress.frames[0].coordinates;

        const textPosition = ress.frames[0].textPosition;
        const text = await ress.texts[randomNumber];
        const outputPath = path.join(__dirname, `../uploads/${req.params.id}.png`);

        console.log(outputPath);

        await applyMask(baseImage, maskImages, outputPath, coordinates, width, height, textPosition, text);

        res.send({ _id: req.params.id, result: `${req.protocol}://${req.get('host')}/${req.params.id}.png` });
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send(error.message);
    }
});

const cpup1 = uploadFile.fields([{
    name: 'image', maxCount: 10
}])

router.post('/single-percentage/:id', cpup1, async (req, res) => {
    try {
        const re = await FunTest.findById(req.params.id);


        let maskImages = []

        try {

            if (req.files['image']) {

                maskImages = await Promise.all(req.files['image'].map(async (file) => {
                    return await uploadAndGetFirebaseUrl(file);
                }));
            }
        } catch (e) {
            console.log(e);
        }


        const randomNumber = `${Math.floor(Math.random() * 100 + 1)}%`;
        const baseImage = await re.frames[0].frameUrl;
        const coordinates = re.frames[0].coordinates;
        const width = re.frames[0].frame_size.width;
        const height = re.frames[0].frame_size.height;
        const percentage = await re.frames[0].percentagePosition;
        const outputPath = path.join(__dirname, `../uploads/${req.params.id + await re.frames[0]._id}.png`);


        // await the result of applyMask
        await applyMask(baseImage, maskImages, outputPath, coordinates, width, height, percentage, randomNumber);


        res.send({ _id: req.params.id, result: `${req.protocol}://${req.get('host')}/${req.params.id + await re.frames[0]._id}.png` });
    } catch (error) {
        res.status(500).send(error.message);
    }
})

const cpup2 = uploadFile.fields([{
    name: 'image', maxCount: 10
}])

router.post('/double-percentage/:id', cpup2, async (req, res) => {

    try {
        const ress = await FunTest.findById(req.params.id);

        let maskImages = []

        try {

            if (req.files['image']) {

                maskImages = await Promise.all(req.files['image'].map(async (file) => {
                    return await uploadAndGetFirebaseUrl(file);
                }));
            }
        }
        catch (err) {
            console.log(err);
        }
        const result = await Promise.all(ress.frames.map(async (frame, i) => {
            const randomNumber = `${Math.floor(Math.random() * 100 + 1)}%`;
            const baseImage = await frame.frameUrl;
            const width = await frame.frame_size.width
            const height = await frame.frame_size.height
            const coord = await frame.coordinates;
            const percentage = await frame.percentagePosition;
            const outputPath = path.join(__dirname, `../uploads/${req.params.id + await frame._id}.png`);

            // await the result of applyMask

            await applyMask(baseImage, maskImages, outputPath, coord, width, height, percentage, randomNumber);

            return {
                result1: `${req.protocol}://${req.get('host')}/${req.params.id + await frame._id}.png`,
            };
        }));

        res.send({ _id: req.params.id, result });
    } catch (error) {
        res.status(500).send(error.message);
    }

});

const cpup3 = uploadFile.fields([{
    name: 'image', maxCount: 10
}])

router.post('/percentage-range/:id', cpup3, async (req, res) => {
    try {
        const re = await FunTest.findById(req.params.id);

        // const randomNumber = Math.floor(Math.random() * 100 + 1);
        const randomNumber = 40;


        let maskImages = []

        try {

            if (req.files['image']) {

                maskImages = await Promise.all(req.files['image'].map(async (file) => {
                    return await uploadAndGetFirebaseUrl(file);
                }));
            }
        } catch (e) {
            console.log(e);
        }

        const number = re.range.find(r => r.y >= randomNumber && r.x <= randomNumber);

        const baseImage = await re.frames[0].frameUrl;
        const coord = await re.frames[0].coordinates;
        const outputPath = path.join(__dirname, `../uploads/${req.params.id}.png`);

        const width = re.frames[0].frame_size.width;
        const height = re.frames[0].frame_size.height;
        const percentage = await re.frames[0].textPosition;
        // await the result of applyMask
        console.log(baseImage, maskImages, outputPath, coord, width, height, percentage, number);
        let ress = await applyMask(baseImage, maskImages, outputPath, coord, width, height, percentage, `${number.value}`);


        res.send({ _id: req.params.id, result: ress });
    } catch (error) {
        res.status(500).send(error.message);
    }
})


router.get('/get-all', async (req, res) => {

    let lang = req.query.lang;
    try {
        const result = await FunTest.find({ language: lang, isActive: true }).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user'
            }
        });
        res.send(result);
    } catch (error) {

        res.status(500).send(error.message);
    }
});

router.post('/:postId/like', auth, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id; // Assuming user is authenticated and user ID is available in request

        // Check if the post is already liked by the user
        const post = await FunTest.findById(postId);
        const isLiked = post.likes.includes(userId);

        let like = false;
        let dislike = false;

        // Update like status based on current state
        if (isLiked) {

            // If already liked, unlike the post
            post.likes.pull(userId);
            like = true;
        } else {
            // If not liked, like the post
            post.likes.push(userId);
            dislike = true;
        }

        // Save the updated post
        await post.save();

        res.status(200).json({ success: true, like, dislike, message: 'Post liked/unliked successfully.' });
    } catch (error) {
        console.error('Error liking/unliking post:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request.' });
    }
});





router.get('/share/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const response = await FunTest.findByIdAndUpdate(postId, { $inc: { shares: 1 } }, { new: true })
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/view/:id', async (req, res) => {

    const id = req.params.id;

    try {
        const response = await FunTest.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});



router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.id) res.status(404).json({ message: 'id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await FunTest.findByIdAndUpdate(req.body.id, { $push: { comments: { text: req.body.comment, user: req.user.id } } }, { new: true })
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
    try {
        const ress = await FunTest.findById(req.params.id);


        let data = [ress.thumbnail, ress.referenceImage, ress.frameUrl, ...ress.frames.map(f => f.frameUrl)];


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


        await FunTest.deleteOne({ _id: req.params.id });

        res.send({ message: "deleted successfully" });
    } catch (error) {
        res.status(500).send({ message: "internal error: " + error.message })
    }
});



async function applyMaskImg(baseImageUrls, maskImages, outputPath, coordinates, bwidth, bheight) {
    try {
        const baseImage = await Jimp.read(baseImageUrls); // Assuming only one base image is provided

        console.log(baseImageUrls, maskImages, outputPath, coordinates);

        for (let i = 0; i < coordinates.length; i++) {
            let coordinate = coordinates[i];
            console.log(coordinate)
            const maskImage = await Jimp.read(await maskImages[i]);
            console.log(maskImages[i], coordinate.x, coordinate.y, coordinate.width, coordinate.height, bwidth, bheight)
            baseImage.resize(+bwidth, +bheight);
            maskImage.resize(+coordinate.width, +coordinate.height);
            baseImage.composite(maskImage, +coordinate.x, +coordinate.y, {
                mode: Jimp.BLEND_DESTINATION_OVER
            });
        }

        // for (let i = 0; i < texts.length; i++) {
        //     const { x, y, text } = texts[i];
        //     const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);

        //     baseImage.print(font, +x, +y, text);
        // }
        await baseImage.writeAsync(outputPath);

        console.log('Mask applied successfully.');
    } catch (error) {
        console.error('An error occurred:', error);
    }
}


async function applyMask(baseImagePath, maskImages, outputPath, coordinates, bwidth, bheight, tcoordinates, text) {
    try {
        const image = await Jimp.read(baseImagePath);

        image.resize(+bwidth, +bheight);
        if (maskImages) {
            for (let i = 0; i < coordinates.length; i++) {
                let coordinate = coordinates[i];
                console.log(coordinate)
                const maskImage = await Jimp.read(await maskImages[i]);
                console.log(maskImages[i], coordinate.x, coordinate.y, coordinate.width, coordinate.height, bwidth, bheight)
                maskImage.resize(+coordinate.width, +coordinate.height);
                image.composite(maskImage, +coordinate.x, +coordinate.y, {
                    mode: Jimp.BLEND_DESTINATION_OVER
                });
            }
        }

        // Define the text properties
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK); // Load black font
        const { x, y, width, height } = tcoordinates;

        image.print(font, parseInt(x), parseInt(y), {
            text: text,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        }, parseInt(width), parseInt(height));

        // Save the modified image
        await image.writeAsync(outputPath);

        console.log("Text overlay added successfully.");
    } catch (error) {
        console.error("Error:", error);
    }
}


router.get("/all", async (req, res) => {
    try {
        const data = await FunTest.find();
        res.send(data);
    } catch (error) {
        res.status(500).send(error.message);
    }
})


router.get('/publish/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await FunTest.findByIdAndUpdate(postId, { $set: { isActive: true } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});

router.get('/draft/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {

        const result = await FunTest.findByIdAndUpdate(postId, { $set: { isActive: false } }, { new: true });

        res.send({ success: true, message: "Successfully published", data: result });

    } catch (error) {

        res.status(500).send({ error: error.message, success: false });

    }
});

const cpUpload2 = uploadFile.fields([{ name: 'frame', maxCount: 20 }
    , { name: "thumbnail", maxCount: 1 }
    , { name: "referenceImage", maxCount: 1 }
]);

router.post("/update", auth, adminRole, cpUpload2, async (req, res) => {


    let { question, texts, frames, isActive, description, language, type, noOfUserImage, range, id, thumbnail, referenceImage } = req.body;

    if (texts) {
        texts = JSON.parse(texts);
    }

    if (frames) {
        frames = JSON.parse(frames);
    }

    if (range) {
        range = JSON.parse(range);
    }
    //     return res.status(404).send({ message: "No tumbnail file found" });

    // }

    if (req.files["referenceImage"]) {

        referenceImage = await uploadAndGetFirebaseUrl(req.files["referenceImage"][0]);
    }
    if (req.files["thumbnail"]) {

        thumbnail = await uploadAndGetFirebaseUrl(req.files["thumbnail"][0]);
    }

    let i = 0
    await Promise.all(frames.map(async (frame, j) => {
        if (!frame.frameUrl) {
            const frameUrl = await uploadAndGetFirebaseUrl(req.files["frame"][i++]);
            frames[j]['frameUrl'] = frameUrl;
        }
    }));



    try {



        const ress = await FunTest.findByIdAndUpdate(id, { question, isActive, texts, description, language, frames, thumbnail, referenceImage, range, noOfUserImage, category: type, user: req.user.id });


        res.send(ress);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }

});



module.exports = router;