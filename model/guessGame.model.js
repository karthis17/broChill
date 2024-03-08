const { default: mongoose } = require("mongoose");

module.exports = mongoose.model("guessGame", {
    question: { type: String, required: true },
    questionDifLang: Array,
    options: Array,
    optionDifLang: Array,
    optionsType: { type: String, required: true },
    questionType: { type: String, required: true },
    createdAt: { type: Date, default: Date.now() },
    language: { type: mongoose.Schema.Types.ObjectId, ref: 'language', required: true },

    answer: { type: Number, required: true }
})