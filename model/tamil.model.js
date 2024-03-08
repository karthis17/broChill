const mongoose = require('mongoose');

// Define Schema for category
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true,
        enum: ['english', 'tamil'] // You can add more languages if needed
    },
    data: {
        // Structure your data according to your needs
        reels: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Reel' // Assuming you have a Mongoose model named 'Reel' for reels
        }],
        feeds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Feed' // Assuming you have a Mongoose model named 'Feed' for feeds
        }],
        quizzes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz' // Assuming you have a Mongoose model named 'Quiz' for quizzes
        }],
        // Add more categories as needed
    }
});

// Create Category model
const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
