const mongoose = require('mongoose');

module.exports = mongoose.model("quizzes", {
    questionImage: { type: String, required: true },
    statement_1: [{
        option: { type: String, required: true },
        point: { type: String, required: true },
    }],
    statement_2: [{
        option: { type: String, required: true },
        point: { type: String, required: true },

    }],
    statement_3: [{
        option: { type: String, required: true },
        point: { type: String, required: true },

    }],
    results: [{
        scoreBoard: { type: String, required: true },
        maxScore: { type: Number, required: true },
        minScore: { type: Number, required: true },
    }],
    players: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        score: { type: Number, required: true },
        createdAt: { type: Date, default: Date.now },
    }],
    createdAt: { type: Date, default: Date.now }
});