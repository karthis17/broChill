require("dotenv").config();
const { default: mongoose } = require("mongoose");

module.exports = mongoose.model("category", {
    default: { type: String, required: true },
    title: [{
        text: { type: String, required: true },
        lang: { type: String, required: true },
    }],
});