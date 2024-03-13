const { default: mongoose } = require("mongoose");

module.exports = mongoose.model("contest", {

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

    language: { type: mongoose.Schema.Types.ObjectId, ref: 'language', required: true },

    isActive: { type: Boolean, default: false },
    category: String,
    subCategory: String,

    questions: [{

        textQuestion: { type: String, },
        imageQuestion: { type: String, },
        questionType: { type: String, required: true },
        optionType: String,
        options: [{
            option: { type: String, required: true },
            points: { type: Number, required: true },
        }]

    }],

    resultImage: { type: Boolean, required: true, default: false },

    results: [{
        maxScore: { type: Number, required: true },
        minScore: { type: Number, required: true },
        resultImg: { type: String, required: true },
        frame_size: {
            width: { type: Number },
            height: { type: Number },
        },
        coordinates: [],
        scorePosition: {
            x: Number,
            y: Number,
            width: Number,
            height: Number,
        },
        noOfTexts: [],
    }],

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



})