const { default: mongoose } = require("mongoose");

module.exports = mongoose.model("riddle", {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});