const { default: mongoose } = require("mongoose");

module.exports = mongoose.model("riddle", {

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

    language: { type: mongoose.Schema.Types.ObjectId, ref: 'language', required: true },


    questions: [{
        textQuestion: { type: String },
        imageQuestion: { type: String },
        questionType: { type: String, required: true },
        optionType: String,
        options: [{
            option: { type: String },
            points: { type: Number },
        }],
        comments: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            text: { type: String },
            createdAt: { type: Date, default: Date.now }
        }],

        hasOption: { type: Boolean, required: true },
    }],

    category: String,
    subCategory: String,

    isActive: { type: Boolean, default: false },


    referenceImage: { type: String },

    description: { type: String, required: true },

    likes: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }
});