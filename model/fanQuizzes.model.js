const { default: mongoose } = require("mongoose");


module.exports = mongoose.model("fanQuizzes", {
    // user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    // description: { type: String, required: true },
    // language: String,
    // thumbnail: { type: String },
    // question: { type: String, required: true },
    // questionDifLang: Array,
    // optionDifLang: Array,
    // options: Array,
    // answer: { type: Number, required: true },
    // thumbnail: { type: String },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

    language: { type: mongoose.Schema.Types.ObjectId, ref: 'language', required: true },


    questions: [{

        question: { type: String, required: true },
        questionType: { type: String, required: true },
        optionType: String,
        options: [{
            option: { type: String, required: true },
            points: { type: Number, required: true },
        }]

    }],

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

    createdAt: { type: Date, default: Date.now }


});