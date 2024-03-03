const multer = require('multer');
const path = require('path');
const admin = require('firebase-admin');
const serviceAccount = require('../path/witalks-e7c25-firebase-adminsdk-eqm2y-a29fcc0f92.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'https://console.firebase.google.com/project/witalks-e7c25/storage/witalks-e7c25.appspot.com/files',
});



const storage = multer.memoryStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const uploadFile = multer({ storage: storage });
const bucket = admin.storage().bucket("gs://witalks-e7c25.appspot.com");


const uploadAndGetFirebaseUrl = async (req) => {
    const fileData = req?.file || req || undefined
    const imageBuffer = fileData?.buffer;

    if (!imageBuffer) {
        console.error('Image buffer is undefined.');
        throw new Error('Image buffer is undefined.')
    }

    else {
        const imageName = fileData.originalname;
        const file = bucket.file(imageName);
        await file.save(imageBuffer, { contentType: 'image/jpeg' });
        const [url] = await file.getSignedUrl({ action: 'read', expires: '03-01-2500' });
        console.log('Image uploaded to firebase successfully. Name:', fileData.originalname);
        return url;
    }

}

module.exports = {
    uploadFile,
    uploadAndGetFirebaseUrl,
}