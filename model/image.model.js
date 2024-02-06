const mongoose = require('mongoose');

module.exports = mongoose.model("Image", {
    description: String,
    likes: { type: Number, default: 0 },
    comments: Array,
    shares: { type: Number, default: 0 },
    filename: String,
    originalFilename: String,
    path: String,
    username: String,
});