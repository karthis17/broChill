const mongoose = require("mongoose");

module.exports = mongoose.model("generalQuestion", {
    question: { type: String, required: true },
    questionDifLang: Array,
    optionDifLang: Array,
    options: Array,
    answer: { type: Number, required: true },

    createdAt: { type: Date, default: Date.now }
});