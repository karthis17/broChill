const { default: mongoose } = require("mongoose");

module.exports = mongoose.model('flames', {

    imageUrl: { type: String, required: true },
    flamesWord: { type: String, required: true },

    users: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name1: { type: String, required: true },
        name2: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});