const router = require('express').Router();
const Quizzes = require('../model/quizzes.model');
const auth = require('../middelware/auth');
const { uploadFile, uploadAndGetFirebaseUrl } = require('../commonFunc/firebase');
const adminRole = require('../middelware/checkRole');
const Jimp = require('jimp');


// const multer = require('multer');
const path = require('path');


// const storage = multer.diskStorage({
//     destination: './uploads/', // Specify the upload directory
//     filename: function (req, file, callback) {
//         callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//     }
// });

// const upload = multer({
//     storage: storage,
//     limits: {
//         fileSize: 50 * 1024 * 1024, // 50 MB (adjust as needed)
//         files: 5 // Maximum number of files allowed (adjust as needed)
//     }
// });

const cpUpload = uploadFile.fields([
    { name: 'question', maxCount: 20 },
    { name: 'option', maxCount: 50 },
    { name: 'answer', maxCount: 20 },
    { name: 'referencesImage', maxCount: 2 }
]);


router.post('/add-quizze', auth, adminRole, cpUpload, async (req, res) => {

    let { questions, results, description, language } = req.body;

    console.log(req.body)

    questions = JSON.parse(questions)
    results = JSON.parse(results)


    let i = 0;
    let j = 0;

    for (let k = 0; k < questions.length; k++) {
        const question = questions[k];

        if (question.questionType === 'image') {
            questions[k]["question"] = await uploadAndGetFirebaseUrl(req.files["question"][i++]);
        }

        if (question.optionType === 'image') {
            // Sequentially process options
            for (let n = 0; n < question.options.length; n++) {
                const option = question.options[n];
                questions[k]["options"][n].option = await uploadAndGetFirebaseUrl(req.files["option"][j++]);
            }
        }
    }

    // Sequentially process results
    for (let m = 0; m < results.length; m++) {
        results[m].resultImg = await uploadAndGetFirebaseUrl(req.files["answer"][m]);
    }

    let referencesImage = await uploadAndGetFirebaseUrl(req.files["referencesImage"][0]);


    try {
        const qu = await Quizzes.create({ questions, results, description, referenceImage: referencesImage, language, user: req.user.id });
        res.send(qu);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }

});


router.get('/get-all-quizzes', async (req, res) => {
    try {
        const quizzes = await Quizzes.find();
        console.log(quizzes);
        res.json(quizzes);
    } catch (error) {
        res.status(500).json(error.message);

    }
});

router.get('/get-quizze/:id', async (req, res) => {

    if (!req.params.id) {
        res.status(404).json({ message: 'Missing quizze id' });
    }

    try {
        const quizze = await Quizzes.findById(req.params.id);
        res.json(quizze);
    } catch (error) {
        res.status(500).json(error.message);
    }
});

const cpUplad = uploadFile.fields([
    { name: 'image', maxCount: 5 }
]);

router.post('/get-result', cpUplad, async (req, res) => {
    let { score, quizze_id, userText } = req.body;

    try {

        const response = await Quizzes.findById(quizze_id);

        const result1 = await response.results.find(result => result.minScore <= score && result.maxScore >= score);

        const baseImage = result1.resultImg;
        const squareCoord = result1.coordinates;
        let Images = [];
        if (squareCoord.length > 0) {
            // Upload images in parallel
            await Promise.all(squareCoord.map(async (corr, i) => {
                Images.push(await uploadAndGetFirebaseUrl(req.files['image'][i]));
            }));

            // Assign URLs to squareCoord objects
            await Promise.all(squareCoord.map(async (sq, i) => {
                squareCoord[i]["path"] = await Images[i];
            }));
        }
        const scoreCoord = result1.scorePosition;



        // let resText = [];
        // let i = 0
        // let j = 0

        // for (let test of textCoord) {
        //     if (test.noOfName.length > 0) {
        //         test.noOfName.forEach((t) => {
        //             if (!resText[j]) {
        //                 resText[j] = test.text.replace(t, userText[i++]);
        //             } else {
        //                 resText[j] = resText[j].replace(t, userText[i++]);
        //             }
        //         });
        //         j++;
        //     } else {

        //         resText.push(test.text);
        //     }
        // }

        // const texts = textCoord.map((text, i) => {
        //     return {
        //         text: resText[i],
        //         width: text.width,
        //         height: text.height,
        //         x: text.x,
        //         y: text.y
        //     };
        // });

        // scoreCoord["text"] = score;
        // texts.push(scoreCoord);

        const outputPath = path.join(__dirname, `../uploads/askhdjks.png`);


        await applyMask(baseImage, squareCoord, outputPath, `${score}`, scoreCoord, result1.frame_size.width, result1.frame_size.height)


        // text.forEach(element => {
        //     let te = element.split(' ');
        //     te.forEach(line => {
        //         line.includes('<fanme')
        //     })
        // });

        // console.log(response, result1);

        res.json(result1);
    } catch (error) {
        res.status(500).json(error.message);
    }
});

router.delete("/delete/:id", auth, adminRole, async (req, res) => {

    try {
        await Quizzes.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: "Deleted successfully", success: true });
    } catch (error) {
        res.status(200).json({ message: error.message, success: false });

    }

});


async function applyMask(baseImagePath, maskImages, outputPath, texts, scoreCoord, baseW, baseH) {
    try {
        const baseImage = await Jimp.read(baseImagePath);
        console.log(texts, "sad");

        console.log(baseImagePath, maskImages, outputPath);

        baseImage.resize(+baseW, +baseH);
        for (let i = 0; i < maskImages.length; i++) {
            const { path, x, y, width, height } = maskImages[i];
            console.log(path, x, y, width, height);
            const maskImage = await Jimp.read(path);

            console.log(maskImage)
            maskImage.resize(+width, +height);
            baseImage.composite(maskImage, +x, +y, {
                mode: Jimp.BLEND_DESTINATION_OVER
            });
        }



        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK); // Load black font
        const { x, y, width, height } = scoreCoord;
        let text = texts;

        // Calculate the center coordinates within the specified region
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        // Measure text width and height
        const textWidth = Jimp.measureText(font, text);
        const textHeight = Jimp.measureTextHeight(font, text);

        // Calculate the starting position of the text to achieve center alignment
        const textX = centerX - textWidth / 2;
        const textY = centerY - textHeight / 2;

        // Print the text in the center of the region
        baseImage.print(font, textX, textY, text);


        await baseImage.writeAsync(outputPath);


        console.log('Mask applied successfully.');
    } catch (error) {
        console.error('An error occurred:', error);
    }
}


module.exports = router;