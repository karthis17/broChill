const { default: mongoose } = require("mongoose");

module.exports = mongoose.model('FunTest', {

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    question: { type: String },
    texts: [{ type: String }],

    category: { type: String, required: true },

    language: { type: mongoose.Schema.Types.ObjectId, ref: 'language', required: true },


    description: { type: String, required: true },
    user_image: Number,
    text: Number,

    noOfUserImage: Number,

    range: [{
        x: Number,
        y: Number,
        value: Number
    }],
    frames: [{
        frameUrl: { type: String, required: true },
        path: { type: String },
        frame_size: {
            width: { type: Number, required: true },
            height: { type: Number, required: true }
        },
        coordinates: [{
            x: { type: Number },
            y: { type: Number, },
            width: { type: Number },
            height: { type: Number }
        }],
        textPosition: {
            x: { type: Number },
            y: { type: Number },
            width: { type: Number },
            height: { type: Number },
        },
        percentagePosition: {
            x: { type: Number },
            y: { type: Number },
            width: { type: Number },
            height: { type: Number },
        },
    }],

    isActive: { type: Boolean, default: false },
    views: { type: Number, default: 0 },

    thumbnail: String,
    referenceImage: String,

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    shares: { type: Number, default: 0 },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});