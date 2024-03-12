const mongoose = require("mongoose");

module.exports = mongoose.model("reel", {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    title: { type: String, required: true },
    language: { type: mongoose.Schema.Types.ObjectId, ref: 'language', required: true },
    description: { type: String },
    category: { type: String, required: true },
    fileUrl: { type: String, required: true },
    likes: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],

    isActive: { type: Boolean, default: false },

    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    views: { type: Number, default: 0 },

    shares: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});
