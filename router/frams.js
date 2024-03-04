const Frames = require('../model/frames.model');
const auth = require('../middelware/auth');
const multer = require('multer');
const router = require('express').Router();
const path = require('path');
const Jimp = require('jimp');
const adminRole = require('../middelware/checkRole');
const deleteImage = require('../commonFunc/delete.image');

const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + file.originalname + new Date().getMilliseconds() + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


router.get('/get-frames', async (req, res) => {
    const lang = req.query.lang;
    try {
        const response = await Frames.find();
        if (lang && lang.toLowerCase() !== "english") {
            let result = await response.filter(frame => {
                const title = frame.titleDifLang.find(tit => tit.lang === lang);


                if (title) {
                    frame.frameName = title.text;

                    return frame;
                } else {
                    return false;
                }
            });

            res.json(result);
        } else {

            res.json(response);
        }

    } catch (error) {

        res.status(500).send({ message: "Internal Server Error", err: error.message });

    }
});


router.post('/upload-frame', auth, adminRole, upload.single('frame'), async (req, res) => {


    let { frameName, frame_size, coordinates, texts, titleDifLang } = req.body;


    titleDifLang = JSON.parse(titleDifLang);

    console.log('Framesize:', JSON.parse(frame_size));
    console.log('Coordinates:', JSON.parse(coordinates));

    frame_size = JSON.parse(frame_size);
    coordinates = JSON.parse(coordinates);
    texts = JSON.parse(texts);

    if (req.file) {

        try {
            let pathF = path.join(__dirname, `../${req.file.path}`);
            const image = await Jimp.read(pathF);

            await image.resize(frame_size.width, frame_size.height);

            await image.writeAsync(pathF);

            console.log("Image resized successfully!");
        } catch (error) {
            console.error("Error:", error);
        }

    }
    texts.forEach((text, i) => {
        let num = text.text.split(' ').filter(text => text.includes("<fname"));
        console.log('Num:', num);
        texts[i]["noOfName"] = num;
    });

    console.log('ss:', frame_size, 'cc:', coordinates, 'tt:', texts);

    if (!req.file) {
        return res.status(404).send({ message: "No file found" });
    }

    let frameUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;

    try {
        const results = await Frames.create({ frameName, frameUrl, frame_size, texts, coordinates, path: req.file.path, titleDifLang });


        res.send(results);
    } catch (error) {

        res.status(500).send("internal error: " + error.message);

    }
});


const cpUpload = upload.fields([
    { name: 'image', maxCount: 5 },
]);

router.post('/upload-image', auth, cpUpload, async (req, res) => {

    let { userText } = req.body;

    if (!req.files) {
        return res.status(404).send({ message: "No file found" });
    }

    if (!req.body.frame_id) return res.status(404).send({ message: "frame id is required" });


    let image = `${req.protocol}://${req.get('host')}/${req.files['image'][0].filename}`;

    try {
        const results = await Frames.findByIdAndUpdate(req.body.frame_id);


        console.log(results);

        const baseImagePath = path.join(__dirname, `../${results.path}`);
        const outputPath = path.join(__dirname, `../${req.files['image'][0].path}`);
        const corrdinates = await results.coordinates;
        const textCor = await results.texts;

        const maskImage = corrdinates.map((coordinate, i) => {
            return {
                path: path.join(__dirname, `../${req.files['image'][i].path}`),
                width: coordinate.width,
                height: coordinate.height,
                x: coordinate.x,
                y: coordinate.y
            };
        });

        let resText = [];
        let i = 0
        let j = 0

        for (let test of textCor) {
            if (test.noOfName.length > 0) {
                test.noOfName.forEach((t) => {
                    if (!resText[j]) {
                        resText[j] = test.text.replace(t, userText[i++]);
                    } else {
                        resText[j] = resText[j].replace(t, userText[i++]);
                    }
                });
                j++;
            } else {

                resText.push(test.text);
            }
        }

        const texts = textCor.map((text, i) => {
            return {
                text: resText[i],
                width: text.width,
                height: text.height,
                x: text.x,
                y: text.y
            };
        });

        await applyMask(baseImagePath, maskImage, outputPath, texts, results.frame_size.width, results.frame_size.height)


        await results.uploads.push({ image, user: req.user.id });

        await results.save();

        res.send({ results, link: image });
    } catch (error) {

        res.status(500).send("internal error: " + error.message);

    }

});

router.post('/likes', auth, async (req, res) => {

    try {
        const frame_id = req.body.frame_id;
        const userId = req.user.id;
        console.log(req.body)

        const frame = await Frames.findById(frame_id);
        if (!frame) {
            return res.status(404).json({ message: 'frame not found' });
        }

        if (frame.likes.includes(userId)) {
            return res.status(400).json({ message: 'You have already liked this frame' });
        }

        frame.likes.push(userId);
        await frame.save();

        res.status(200).json({ message: 'frame liked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.frame_id) res.status(404).json({ message: 'frame id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await Frames.findByIdAndUpdate(req.body.frame_id, { $push: { comments: { text: req.body.comment, user: req.user.id } } })
        res.status(200).json({
            message: "comment added successfully",
            data: response
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/share', async (req, res) => {

    if (!req.body.frame_id) res.status(404).json({ message: 'Poll id is required' });

    try {
        const response = await Frames.findByIdAndUpdate(req.body.frame_id, { $inc: { shares: 1 } });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get('get/:id', async (req, res) => {
    const lang = req.query.lang;

    try {
        const response = await Frames.findById(req.params.id);
        if (lang) {
            const title = response.titleDifLang.find(tit => tit.lang === lang);

            response.frameName = title ? title.text : response.frameName;


            res.json(response);
        } else {

            res.json(response);
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }

});


router.put('/update', auth, adminRole, upload.single('frame'), async (req, res) => {
    let { frameName, frame_size, coordinates, texts, id, frameUrl, imagePath } = req.body;

    console.log('Framesize:', JSON.parse(frame_size));
    console.log('Coordinates:', JSON.parse(coordinates));

    frame_size = JSON.parse(frame_size);
    coordinates = JSON.parse(coordinates);
    if (texts) {
        texts = JSON.parse(texts);
    } else {
        texts = [];
    }

    texts.forEach((text, i) => {
        let num = text.text.split(' ').filter(text => text.includes("<fname"));
        console.log('Num:', num);
        texts[i]["noOfName"] = num;
    });

    console.log('ss:', frame_size, 'cc:', coordinates, 'tt:', texts);

    if (req.file) {
        try {
            let pathF = path.join(__dirname, `../${req.file.path}`);
            const image = await Jimp.read(pathF);

            await image.resize(frame_size.width, frame_size.height);

            await image.writeAsync(pathF);

            console.log("Image resized successfully!");
        } catch (error) {
            console.error("Error:", error);
        }

        frameUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
        let im = path.join(__dirname, `../${imagePath}`)
        await deleteImage(im);
        imagePath = req.file.path;
    }


    try {

        const results = await Frames.findByIdAndUpdate(id, { $set: { frameName, frameUrl, frame_size, texts, coordinates, path: imagePath } });

        res.send({ success: true, message: "record updated successfully." });
    } catch (error) {

        res.status(500).send("internal error: " + error.message);

    }
});

router.delete('/delete/:id', auth, adminRole, async (req, res) => {
    try {

        const ress = await Frames.findById(req.params.id)

        if (deleteImage(path.join(__dirname, `../${ress.path}`))) {

            await Frames.deleteOne({ _id: req.params.id });
        } else {
            res.status(404).send({ error: 'err while deleting image' });
        }
        res.send({ message: "result deleted successfully" });
    } catch (error) {
        res.status(500).send({ message: "internal error: " + error.message })
    }
})


async function applyMask(baseImagePath, maskImages, outputPath, texts, baseW, baseH) {
    try {
        const baseImage = await Jimp.read(baseImagePath);
        console.log(texts, "sad");

        console.log(baseImagePath, maskImages, outputPath);

        for (let i = 0; i < maskImages.length; i++) {
            const { path, x, y, width, height } = maskImages[i];
            console.log(path, x, y, width, height);
            const maskImage = await Jimp.read(path);
            maskImage.resize(+width, +height);
            baseImage.resize(+baseW, +baseH);
            baseImage.composite(maskImage, x, y, {
                mode: Jimp.BLEND_DESTINATION_OVER
            });
        }

        for (let i = 0; i < texts.length; i++) {
            const { x, y, width, height, text } = texts[i];
            const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);

            baseImage.print(font, x, y, text);
        }
        await baseImage.writeAsync(outputPath);


        console.log('Mask applied successfully.');
    } catch (error) {
        console.error('An error occurred:', error);
    }
}


module.exports = router;