const mongoose = require('mongoose');

module.exports = mongoose.model("Admin", {
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
    avatar: String,
    createdAt: {
        type: Date,
        default: Date.now()
    }
});