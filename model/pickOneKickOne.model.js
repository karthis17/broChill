const mongoose = require('mongoose');

module.exports = mongoose.model("pickKick", {
    question: { type: String, required: true },
   
    options: [{
        option: { type: String, required: true },
        point: { type: String, required: true },
    }],
    players: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        score: { type: Number, required: true },
        createdAt: { type: Date, default: Date.now }

    }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});