const mongoose = require("mongoose");


module.exports = mongoose.model("frames", {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

    frameName: { type: String, required: true },
    description: { type: String, required: true },
    frameUrl: { type: String, required: true },
    language: { type: mongoose.Schema.Types.ObjectId, ref: 'language', required: true },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    shares: { type: Number, default: 0 },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    thumbnail: { type: String, required: true },
    referenceImage: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    views: { type: Number, default: 0 },


    createdAt: { type: Date, default: Date.now() }

})
