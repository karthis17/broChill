const { default: mongoose } = require("mongoose");

module.exports = mongoose.model('flames', {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    description: { type: String, required: true },
    language: { type: mongoose.Schema.Types.ObjectId, ref: 'language', required: true },

    thumbnail: { type: String },

    imageUrl: { type: String, required: true },
    flamesWord: { type: String, required: true },

    createdAt: { type: Date, default: Date.now }
});