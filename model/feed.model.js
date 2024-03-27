const mongoose = require('mongoose');

module.exports = mongoose.model("feed", {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    description: { type: String, required: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'subCategory' },

    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    shares: { type: Number, default: 0 },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    isActive: { type: Boolean, default: false },
    views: { type: Number, default: 0 },

    language: { type: mongoose.Schema.Types.ObjectId, ref: 'language', required: true },
    createdAt: { type: Date, default: Date.now },
});