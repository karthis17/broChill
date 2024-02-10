const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const Quizzes = require('../model/quizzes.model');
const auth = require('../middelware/auth');



const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const cpUpload = upload.fields([{ name: 'question', maxCount: 1 }, { name: 'state1', maxCount: 5 }, { name: 'state2', maxCount: 5 }, { name: 'state3', maxCount: 5 }]);

router.post('/upload', cpUpload, (req, res) => {

    console.log(req.body.frameName)
    console.log(req.files)

    // let statement_1 = [];
    // let statement_2 = [];
    // let statement_3 = [];

    // for (let i = 0; i < req.files['state1'].length; i++) {
    //     statement_1.push(req.files['state1'][i])
    //     statement_2.push(req.files['state2'][i])
    //     statement_3.push(req.files['state3'][i])
    // }

    // try {
    //     const response = Quizzes.create({ question: req.files['question'][0], })
    // } catch (error) {

    // }
});

module.exports = router;