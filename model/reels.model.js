const mongoose = require("mongoose");

const reelSchema = new mongoose.Schema({
    customId: { type: Number, unique: true, required: true, default: 1 }, // Removed 'required' and 'default' properties
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    title: { type: String, required: true },
    language: { type: mongoose.Schema.Types.ObjectId, ref: 'language', required: true },
    description: { type: String },
    thumbnail: String,
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'subCategory', required: true },

    fileUrl: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: false },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Create a pre-save hook to automatically increment the customId
reelSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const latestDocument = await this.constructor.findOne({}, { customId: 1 }, { sort: { customId: -1 } });
            if (latestDocument) {
                this.customId = latestDocument.customId + 1;
            } else {
                this.customId = 1; // Set customId to 1 if there are no documents yet
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

module.exports = mongoose.model("reel", reelSchema);
