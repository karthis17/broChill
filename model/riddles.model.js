const { default: mongoose } = require("mongoose");

module.exports = mongoose.model("riddle", {
    question: { type: String, required: true },
    options: [{
        option: {},
    }],
    answer: { type: String, required: true },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    thumbnail: { type: String, required: true },
    description: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    language: { type: mongoose.Schema.Types.ObjectId, ref: 'language', required: true },


    createdAt: { type: Date, default: Date.now }
});