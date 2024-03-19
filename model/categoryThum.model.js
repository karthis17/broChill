const { default: mongoose } = require("mongoose");

module.exports = mongoose.model('categoryThumbnail', {

    thumbnail: { type: String, required: true },
    category: { type: String, required: true }

})