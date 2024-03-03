const { default: mongoose } = require("mongoose");

module.exports = mongoose.model("guessGame", {
    question: { type: String, required: true },
    questionDifLang: Array,
    options: [{
        option: { type: String, required: true },
        answer: { type: Boolean, required: true },
    }],
    optionsType: { type: String, required: true },
    questionType: { type: String, required: true },
    createdAt: { type: Date, default: Date.now() }
})