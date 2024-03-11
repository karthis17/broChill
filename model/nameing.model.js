const { default: mongoose } = require("mongoose");


module.exports = mongoose.model('nameing', {

    frames: [{

        frameUrl: { type: String, required: true },

        flame_word: String,
        textFlames: {
            x: { type: Number },
            y: { type: Number, },
            width: { type: Number, },
            height: { type: Number, },
            text: String,
        },

        frame_size: {
            width: { type: Number, required: true },
            height: { type: Number, required: true }
        },


        name1Position: {
            x: { type: Number },
            y: { type: Number, },
            width: { type: Number, },
            height: { type: Number, },
        },
        name2Position: {
            x: { type: Number },
            y: { type: Number, },
            width: { type: Number, },
            height: { type: Number, },
        },

        textPosition: {
            x: { type: Number },
            y: { type: Number, },
            width: { type: Number, },
            height: { type: Number, },
        },
        WordPosition: {
            x: { type: Number },
            y: { type: Number, },
            width: { type: Number, },
            height: { type: Number, },
        },
        percentagePosition: {
            x: { type: Number },
            y: { type: Number, },
            width: { type: Number, },
            height: { type: Number, },
        }


    }],
    percentageTexts: [
        {
            minPercentage: { type: Number },
            maxPercentage: { type: Number },
            text: [{ type: String }]
        }
    ],

    facts: [{
        fact: String,
        gender: String,
    }],
    views: { type: Number, default: 0 },


    meanings: [{
        letter: String,
        meaning: [{ type: String }],
    }],

    isActive: { type: Boolean, default: false },


    category: { type: String, required: true },
    language: { type: mongoose.Schema.Types.ObjectId, ref: 'language', required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    shares: { type: Number, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    description: { type: String },
    thumbnail: { type: String, required: true },

    createdAt: { type: Date, default: Date.now }

});