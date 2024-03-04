const { default: mongoose } = require("mongoose");

module.exports = mongoose.model("menu", {
    title: { type: String, required: true },
    titleDifLang: Array
});
