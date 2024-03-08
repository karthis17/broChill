const mongoose = require('mongoose');

module.exports = mongoose.model("pickKick", {

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    language: { type: mongoose.Schema.Types.ObjectId, ref: 'language', required: true },

    thumbnail: { type: String, required: true },
    description: { type: String, required: true },


    questions: [{

        question: { type: String, required: true },
        questionType: { type: String, required: true },
        optionType: String,
        options: [{
            option: { type: String, required: true },
            vote: { type: Number, default: 0 },
            percentage: { type: Number, default: 0 }, // Percentage of votes for this option
            votedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
        }],
        totalVotes: { type: Number, default: 0 }
    }],

    likes: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    shares: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});