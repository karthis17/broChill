const { default: mongoose } = require("mongoose");


module.exports = mongoose.model("funQuizzes", {

    question: { type: String, required: true },
    questionDifLang: Array,
    optionDifLang: Array,
    options: Array,
    answer: { type: Number, required: true }

});