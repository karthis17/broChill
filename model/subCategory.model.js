const { default: mongoose } = require("mongoose");

module.exports = mongoose.model('subCategory', {

    title: { type: String, required: true },
    thumbnail: { type: String, required: true },
    category: { type: String, required: true }

})