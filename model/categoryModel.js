const mongoose = require('mongoose');

// Define Schema for category
const categorySchema = new mongoose.Schema({

    language: {
        type: String,
        required: true,
    },
    native: {
        type: String,
        required: true,
    },
    categoryInNative: [{ category: String, inNative: String }],
    data: {
        // Structure your data according to your needs
        reels: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'reel' // Assuming you have a Mongoose model named 'Reel' for reels
        }],
        feeds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'feed' // Assuming you have a Mongoose model named 'Feed' for feeds
        }],
        quizzes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'quizzes' // Assuming you have a Mongoose model named 'Quiz' for quizzes
        }],
        fanQuizzes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'fanQuizzes' // Assuming you have a Mongoose model named 'Quiz' for quizzes
        }],
        funTest: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FunTest' // Assuming you have a Mongoose model named 'Quiz' for quizzes
        }],
        nameTest: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'nameing' // Assuming you have a Mongoose model named 'Quiz' for quizzes
        }],
        polls: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Poll' // Assuming you have a Mongoose model named 'Quiz' for quizzes
        }],
        frames: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'frames' // Assuming you have a Mongoose model named 'Quiz' for quizzes
        }],
        pickOneKickOne: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'pickKick' // Assuming you have a Mongoose model named 'Quiz' for quizzes
        }],
        gkQuestion: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'generalQuestion'
        }],
        riddles: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'riddle'
        }],
        ContestQuiz: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'contest'
        }]
        // Add more categories as needed
    }
});

// Create Category model
const Category = mongoose.model('language', categorySchema);

module.exports = Category;
