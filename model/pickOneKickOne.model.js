const mongoose = require('mongoose');

module.exports = mongoose.model("pickKick", {

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    language: { type: mongoose.Schema.Types.ObjectId, ref: 'language', required: true },

    thumbnail: { type: String, required: true },
    description: { type: String, required: true },

    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'subCategory' },


    questions: [{

        textQuestion: { type: String },
        imageQuestion: { type: String },
        questionType: { type: String, required: true },
        optionType: String,
        options: [{
            option: { type: String, required: true },
            vote: { type: Number, default: 0 },
            percentage: { type: Number, default: 0 }, // Percentage of votes for this option
        }],
        totalVotes: [{
            votedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            option_id: { type: mongoose.Schema.Types.ObjectId }
        }]
    }],

    isActive: { type: Boolean, default: false },


    likes: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    views: { type: Number, default: 0 },

    shares: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});