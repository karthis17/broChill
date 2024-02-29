const { default: mongoose } = require("mongoose");

module.exports = mongoose.model('percentageType', {

    question: { type: String, required: true },
    result: [{
        rangeFrom: { type: Number, required: true },
        rangeTo: { type: Number, required: true },
        text: { type: String, required: true }
    }
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    shares: { type: Number, default: 0 },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});