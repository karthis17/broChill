const express = require('express');
const router = express.Router();
const Category = require('../model/categoryModel'); // Assuming your model file is named categoryModel.js
const Reel = require('../model/reels.model');
const Feed = require('../model/feed.model');
const Quiz = require('../model/quizzes.model');
const FanQuiz = require('../model/fanQuizzes.model');
const FunTest = require('../model/funtest.model');
const NameTest = require('../model/nameing.model');
const Poll = require('../model/poll.model');
const Frame = require('../model/frames.model');
const PickKick = require('../model/pickOneKickOne.model');
const Guessgame = require('../model/guessGame.model');
const generalQuestion = require('../model/general.model')
const riddle = require('../model/riddles.model');
const contest = require('../model/contest.model');





// Route to get all distinct languages in the Category collection
router.get('/', (req, res) => {
    Category.find({}, { language: 1, native: 1, _id: 1 })
        .then(languages => {
            res.status(200).json(languages);
        })
        .catch(error => {
            res.status(500).json({ error: 'Internal server error' });
        });
});


// Route to get all data based on a specific language and populate
router.get('/data/:language', (req, res) => {
    const language = req.params.language;

    Category.findOne({ _id: language })
        .populate({
            path: 'data.reels',
            model: Reel
        })
        .populate({
            path: 'data.feeds',
            model: Feed
        })
        .populate({
            path: 'data.quizzes',
            model: Quiz
        })
        .populate({
            path: 'data.fanQuizzes',
            model: FanQuiz
        })
        .populate({
            path: 'data.funTest',
            model: FunTest
        })
        .populate({
            path: 'data.nameTest',
            model: NameTest
        })
        .populate({
            path: 'data.polls',
            model: Poll
        })
        .populate({
            path: 'data.frames',
            model: Frame
        })
        .populate({
            path: 'data.pickOneKickOne',
            model: PickKick
        }).populate({
            path: 'data.guessGame',
            model: Guessgame
        }).populate({
            path: 'data.gkQuestion',
            model: generalQuestion
        }).populate({
            path: 'data.riddles',
            model: riddle
        }).populate({
            path: 'data.ContestQuiz',
            model: contest
        })
        // Add more population as needed
        .exec()
        .then(category => {
            if (!category) {
                return res.status(404).json({ error: `No data found for language '${language}'` });
            }
            res.status(200).json(category);
        })
        .catch(error => {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});


router.post('/add-language', (req, res) => {

    const { language, native, categoryNative } = req.body;

    const newCategory = new Category({
        language: language,
        native: native,
        data: {
            reels: [],
            feeds: [],
            quizzes: [],
            fanQuizzes: [],
            funTest: [],
            nameTest: [],
            polls: [],
            frames: [],
            pickOneKickOne: [],
            guessGame: [],
            ContestQuiz: [],
            gkQuestion: [],
            riddles: []
        },
        categoryInNative: categoryNative,

    });

    // Save the new category
    return newCategory.save().then((s) => {
        res.send({ success: true, message: "language added successfully" })
    }).catch((err) => {
        res.status(500).send({ success: false, message: "error saving category" });
    });


});
router.get('/category-names', (req, res) => {
    Category.find({})
        .then(categories => {
            if (!categories || categories.length === 0) {
                return res.status(404).json({ error: 'No data found' });
            }

            const result = [];
            const categoryNames = ["Personality Quiz", "Fans Quiz", "Fun Test", "Name Test", "Polls", "Party Games", "Contest Quiz", "GK Quiz", "Riddles"];
            const nameInDataBase = [
                "quizzes",
                "fanQuizzes",
                "funTest",
                "nameTest",
                "polls",
                "pickOneKickOne",
                "ContestQuiz",
                "gkQuestion",
                "riddles"]

            // Iterate over each category
            categories.forEach(category => {
                const nonEmptyCategories = ['All'];
                const data = category.data;

                // Check each category in data and add non-empty category names to the array
                for (const key in data) {
                    if (data.hasOwnProperty(key) && Array.isArray(data[key]) && data[key].length > 0) {
                        if (nameInDataBase.indexOf(key) !== -1) {
                            nonEmptyCategories.push(categoryNames[nameInDataBase.indexOf(key)]);
                        }

                    }
                }

                // If non-empty categories found, add language and category names to result
                if (nonEmptyCategories.length > 1) {
                    result.push({ _id: category._id, language: category.language, native: category.native, category: nonEmptyCategories });
                }
            });

            res.status(200).json(result);
        })
        .catch(error => {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});


module.exports = router;
