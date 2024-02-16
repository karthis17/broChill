const { default: mongoose } = require("mongoose");


module.exports = mongoose.model("funQuizzes", {

    question: { type: String, required: true },
    options: [{
        option: { type: String, required: true },
        answer: { type: String, required: true },
    }]

});