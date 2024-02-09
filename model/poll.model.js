const mongoose = require("mongoose");

module.exports = mongoose.model("poll", {
    question: { type: String, required: true },
    option: [{ type: String, required: true }],
    votes: [{
        votedOption: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
})