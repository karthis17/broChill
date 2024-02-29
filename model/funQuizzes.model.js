const { default: mongoose } = require("mongoose");


module.exports = mongoose.model("funQuizzes", {

    question: { type: String, required: true },
    questionDifLang: Array,

    options: [{
        option: { type: String, required: true },
        answer: { type: Boolean, required: true },
    }]

});