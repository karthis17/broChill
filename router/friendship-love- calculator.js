const auth = require('../middelware/auth');
const multer = require('multer');
const router = require('express').Router();
const path = require('path');
const { friendsCalc, loveCalc } = require('../model/friendNdLoveCalc.model');




const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


router.post('/add-love-quotes', upload.single('image'), async (req, res) => {

    const { maxPercentage, minPercentage, text } = req.body;

    if (!maxPercentage || !minPercentage) {
        res.status(400).json({ errors: "min and max percentage value are required" })
    }

    if (!Array.isArray(text) || !text) {
        res.status(400).json({ errors: "text must be an array" });
    }

    const resultImage = `${req.protocol}://${req.get('host')}/${req.file.filename}`

    try {
        const response = await loveCalc.create({ maxPercentage, minPercentage, text, resultImage });
        res.send(response);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});


router.post('/add-friend-quotes', upload.single('image'), async (req, res) => {

    const { maxPercentage, minPercentage, text } = req.body;

    if (!maxPercentage || !minPercentage) {
        res.status(400).json({ errors: "min and max percentage value are required" })
    }

    if (!Array.isArray(text) || !text) {
        res.status(400).json({ errors: "text must be an array" });
    }

    const resultImage = `${req.protocol}://${req.get('host')}/${req.file.filename}`

    try {
        const response = await friendsCalc.create({ maxPercentage, minPercentage, text, resultImage });
        res.send(response);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.post('/love-calculate', auth, async (req, res) => {

    const { name1, name2 } = req.body;

    // Calculate the love percentage
    let lovePercentage;
    try {
        lovePercentage = parseFloat(calculateLovePercentage(name1, name2));
        if (isNaN(lovePercentage)) {
            throw new Error('Invalid love percentage');
        }
        if (lovePercentage === 0) {
            lovePercentage = 10;
        }
    } catch (error) {
        return res.status(400).json({ error: 'Invalid names provided' });
    }

    console.log(lovePercentage);

    try {
        // Find a love result document that matches the calculated percentage
        const result = await loveCalc.findOne({
            minPercentage: { $lte: lovePercentage },
            maxPercentage: { $gte: lovePercentage }
        });

        if (!result) {
            return res.status(404).json({ error: 'No result found for the given love percentage' });
        }

        const resultText = result.text[Math.floor(Math.random() * result.text.length)];

        const user = await loveCalc.findByIdAndUpdate(result._id, {
            $push: {
                users: {
                    resultText,
                    name1,
                    name2,
                    user_id: req.user.id,
                    percentage: lovePercentage
                }
            }
        });

        console.log(user)
        res.json({ ...result.toObject(), lovePercentage, name1, name2, resultText });
    } catch (error) {
        // Handle error
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }



});
router.post('/friend-calculate', auth, async (req, res) => {

    const { name1, name2 } = req.body;

    // Calculate the love percentage
    let friendshipPercentage;
    try {
        friendshipPercentage = parseFloat(calculateFriendShipPercentage(name1, name2));
        if (isNaN(friendshipPercentage)) {
            throw new Error('Invalid love percentage');
        }
        if (friendshipPercentage === 0) {
            friendshipPercentage = 10;
        }
    } catch (error) {
        return res.status(400).json({ error: 'Invalid names provided' });
    }

    console.log(friendshipPercentage);

    try {
        // Find a love result document that matches the calculated percentage
        const result = await friendsCalc.findOne({
            minPercentage: { $lte: friendshipPercentage },
            maxPercentage: { $gte: friendshipPercentage }
        });

        if (!result) {
            return res.status(404).json({ error: 'No result found for the given love percentage' });
        }

        const resultText = result.text[Math.floor(Math.random() * result.text.length)];

        const user = await friendsCalc.findByIdAndUpdate(result._id, {
            $push: {
                users: {
                    resultText,
                    name1,
                    name2,
                    user_id: req.user.id,
                    percentage: friendshipPercentage
                }
            }
        });

        console.log(user)
        res.json({ ...result.toObject(), friendshipPercentage, name1, name2, resultText });
    } catch (error) {
        // Handle error
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }



});

function calculateLovePercentage(name1, name2) {
    // Concatenate names and count occurrences of 'l', 'o', 'v', 'e', and 's'
    let counts = { 'l': 0, 'o': 0, 'v': 0, 'e': 0, 's': 0 };
    let combinedNames = (name1.toLowerCase() + name2.toLowerCase()).split('');
    combinedNames.forEach(letter => {
        if (counts.hasOwnProperty(letter)) {
            counts[letter]++;
        }
    });

    // Perform repeated addition until a percentage score is found
    let numbers = Object.values(counts);
    while (numbers.length > 2) {
        let nextNumbers = [];
        for (let i = 0; i < numbers.length - 1; i++) {
            nextNumbers.push((numbers[i] + numbers[i + 1]) % 10);
        }
        numbers = nextNumbers;
    }

    // Convert the final number to a percentage score
    let lovePercentage = numbers[0] * 10 + numbers[1];
    return lovePercentage;
}
function calculateFriendShipPercentage(name1, name2) {
    // Concatenate names and count occurrences of 'l', 'o', 'v', 'e', and 's'
    let counts = { 'f': 0, 'r': 0, 'i': 0, 'e': 0, 'n': 0, 'd': 0, 's': 0 };
    let combinedNames = (name1.toLowerCase() + name2.toLowerCase()).split('');
    combinedNames.forEach(letter => {
        if (counts.hasOwnProperty(letter)) {
            counts[letter]++;
        }
    });

    // Perform repeated addition until a percentage score is found
    let numbers = Object.values(counts);
    while (numbers.length > 3) {
        let nextNumbers = [];
        for (let i = 0; i < numbers.length - 1; i++) {
            nextNumbers.push((numbers[i] + numbers[i + 1]) % 10);
        }
        numbers = nextNumbers;
    }

    // Convert the final number to a percentage score
    let lovePercentage = numbers[0] * 10 + numbers[1];
    return lovePercentage;
}


module.exports = router;