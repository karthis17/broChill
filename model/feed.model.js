const mongoose = require('mongoose');

module.exports = mongoose.model("feed", {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    imagePath: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    shares: { type: Number, default: 0 },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    titleDifLang: Array,
    descriptionDifLang: Array,
    createdAt: { type: Date, default: Date.now },
});