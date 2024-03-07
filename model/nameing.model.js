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
            text: { type: String, }
        }
    ],

    facts: [{
        fact: String,
        gender: String,
    }],

    meanings: [{
        letter: String,
        meaning: String,
    }],

    category: { type: String, required: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    description: { type: String },
    thumbnail: { type: String, required: true },

    createdAt: { type: Date, default: Date.now }

});