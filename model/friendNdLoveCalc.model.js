const { default: mongoose } = require("mongoose");

const bgFrame = mongoose.model('friendLoveCalcBgImg', {
    loveResultImage: { type: String, required: true },
})

const loveCalc = mongoose.model('loveCalc', {

    minPercentage: { type: Number, required: true },
    maxPercentage: { type: Number, required: true },
    resultImage: { type: String, required: true },
    text: [{ type: String, required: true }],
    users: [{
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name1: { type: String, required: true },
        name2: { type: String, required: true },
        percentage: { type: Number, required: true },
        resultText: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    thumbnail: { type: String, required: true },

    createdAt: { type: Date, default: Date.now }

});


const friendsCalc = mongoose.model('friendCalc', {
    minPercentage: { type: Number, required: true },
    maxPercentage: { type: Number, required: true },
    resultImage: { type: String, required: true },
    text: [{ type: String, required: true }],
    users: [{
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name1: { type: String, required: true },
        name2: { type: String, required: true },
        percentage: { type: Number, required: true },
        resultText: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    thumbnail: { type: String, required: true },

    createdAt: { type: Date, default: Date.now }
});



module.exports = { friendsCalc, loveCalc }