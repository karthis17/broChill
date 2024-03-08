const FanQuizzes = require('../model/fanQuizzes.model');
const Reel = require('../model/reels.model');
const Feed = require('../model/feed.model');
const Quizzes = require('../model/quizzes.model');
const FunTest = require('../model/funtest.model');
const Nameing = require('../model/nameing.model');
const Frames = require('../model/frames.model');
const Flames = require('../model/flames.model');
const FriendNdLove = require('../model/friendNdLoveCalc.model');
const GeneralQ = require('../model/general.model');
const Guess = require('../model/guessGame.model');
const { nameFact, nameMeaning } = require('../model/nameMeaning.model');
const Percentage = require('../model/percentageType.model');
const Pick = require('../model/pickOneKickOne.model');
const Poll = require('../model/poll.model');
const RandImg = require('../model/randomImage.model');
const RandTxt = require('../model/funtest.model');
const Riddle = require('../model/riddles.model');


const router = require('express').Router();


router.get('/all/:lang', async function (req, res) {

    const lang = req.query.lang ? req.query.lang : "english";
    let quizzes;
    let funTest;
    let name;
    let frames
    let poll
    let pickNkick
    let fanQuizzes;

    try {

        quizzes = await Quizzes.find({ language: lang }).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: '-password'
            }
        });
        funTest = await FunTest.find({ language: lang }).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: '-password'
            }
        });
        name = await Nameing.find({ language: lang }).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: '-password'
            }
        });
        frames = await Frames.find({ language: lang }).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: '-password'
            }
        });
        poll = await Poll.find({ language: lang }).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: '-password'
            }
        });

        pickNkick = await Pick.find({ language: lang }).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: '-password'
            }
        });
        fanQuizzes = await FanQuizzes.find({ language: lang }).populate({
            path: 'user',
            select: '-password' // Exclude password and email fields from the 'user' document
        }).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: '-password'
            }
        });

        res.send({ quizzes, poll, frames, name, funTest, pickNkick, fanQuizzes });

    } catch (error) {

    }


});


module.exports = router;