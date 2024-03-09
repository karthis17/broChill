const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
    option: { type: String, required: true },
    vote: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }, // Percentage of votes for this option
});

const pollSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    question: { type: String, required: true },
    description: { type: String, required: true },
    questionType: { type: String, required: true },
    optionType: { type: String, required: true },
    language: { type: mongoose.Schema.Types.ObjectId, ref: 'language', required: true },

    options: [optionSchema],
    thumbnail: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    shares: { type: Number, default: 0 },
    totalVotes: [{
        votedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        option_id: { type: mongoose.Schema.Types.ObjectId }
    }] // Total number of votes for the poll
}, { timestamps: true });

const Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;