const { default: mongoose } = require("mongoose");


module.exports = mongoose.model("fanQuizzes", {

    question: { type: String, required: true },
    questionDifLang: Array,
    optionDifLang: Array,
    options: Array,
    answer: { type: Number, required: true },
    thumbnail: { type: String },


});