const mongoose = require('mongoose');

module.exports = mongoose.model("Post", {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    title: { type: String, required: true },
    titleDifLang: Array,
    descriptionDifLang: Array,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
    imageUrl: { type: String, required: true },
    type: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    shares: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});