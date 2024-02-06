const mongoose = require('mongoose');

module.exports = mongoose.model("User", {
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    avatarUrl: String,
    createdAt: {
        type: Date,
        default: Date.now()
    }
});