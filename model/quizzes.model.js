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
    statement_2: [{
        option: { type: String, required: true },
        point: { type: String, required: true },
    }],
    createdAt: { type: Date, default: Date.now }
});