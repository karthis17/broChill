const { default: mongoose } = require("mongoose");

module.exports = mongoose.model("guessGame", {
    question: { type: String, required: true },
    options: [{
        option: { type: String, required: true },
        answer: { type: Boolean, required: true }
    }]
})