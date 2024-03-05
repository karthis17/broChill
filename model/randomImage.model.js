const { default: mongoose } = require("mongoose");

module.exports = mongoose.model('randomImage', {

    frameUrl: { type: String, required: true },
    frameName: { type: String, required: true },
    coordinates: [{
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true }
    }],
    frame_size: {
        width: { type: Number, required: true },
        height: { type: Number, required: true }
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    shares: { type: Number, default: 0 },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    thumbnail: { type: String },
    referenceImage: { type: String },
    createdAt: { type: Date, default: Date.now }
});