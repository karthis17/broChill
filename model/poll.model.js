const mongoose = require("mongoose");

module.exports = mongoose.model("poll", {
    question: { type: String, required: true },
    option: [{ type: String, required: true }],
    votes: [{
        votedOption: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    shares: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }

})