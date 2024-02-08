const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const Image = require('../model/image.model');
const auth = require('../middelware/auth');



const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const cpUpload = upload.fields([{ name: 'question', maxCount: 1 }, { name: 'state1', maxCount: 5 }, { name: 'state2', maxCount: 8 }, { name: 'state3', maxCount: 8 }]);


router.post('/upload-question', cpUpload, async (req, res) => {


    console.log(req.files);
    res.status(200).json(req.files);

});


module.exports = router;