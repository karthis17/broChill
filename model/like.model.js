const { default: mongoose } = require("mongoose");

module.exports = mongoose.model("Like", {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true }
});