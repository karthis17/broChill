const mongoose = require("mongoose");

module.exports = mongoose.model("generalQuestion", {
    question: { type: String, required: true },
    questionDifLang: Array,
    optionDifLang: Array,
    options: Array,
    answer: { type: Number, required: true },
    thumbnail: { type: String },

    createdAt: { type: Date, default: Date.now }
});