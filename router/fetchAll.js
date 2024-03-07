const FanQuizzes = require('../model/fanQuizzes.model');
const Reel = require('../model/reels.model');
const Feed = require('../model/feed.model');
const Quizzes = require('../model/quizzes.model');
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
    let fanQuizzes;
    let reel;
    let feed;
    let quizzes
    let frames
    let flames
    let friendNdLove
    let generalQ
    let guess
    let namefact
    let namemeaning
    let percentage
    let pick
    let poll
    let randImg
    let randTxt
    let riddle


    try {

        if (lang) {

            let questions = await FanQuizzes.find();

            fanQuizzes = await questions.filter(p => {
                const question = p.questionDifLang.find(tit => tit.lang === lang);
                const option = p.optionDifLang.find(tit => tit.lang === lang);

                p.question = question ? question.text : p.question;
                if (option) {
                    p.options = option.data;
                    return p;
                } else {
                    return false;
                }
            });


            let data1 = await Feed.find();

            console.log(data1)

            feed = await data1.filter(feed => {
                const title = feed.titleDifLang.find(tit => tit.lang === lang);
                const description = feed.descriptionDifLang.find(dis => dis.lang === lang);
                // If title or description is found in the specified language, use its text, otherwise fallback to default

                if (title) {
                    feed.title = title.text;
                    feed.description = description.text;
                    return feed;
                } else {
                    return null;
                }
            })

            let data2 = await Reel.find();


            reel = await data2.filter(feed => {
                const title = feed.titleDifLang.find(tit => tit.lang === lang);
                const description = feed.descriptionDifLang.find(dis => dis.lang === lang);
                // If title or description is found in the specified language, use its text, otherwise fallback to default

                if (title) {
                    feed.title = title.text;
                    feed.description = description.text;
                    return feed;
                } else {
                    return null;
                }
            })

            let data3 = await Frames.find();

            frames = await data3.filter(frame => {
                const title = frame.titleDifLang.find(tit => tit.lang === lang);


                if (title) {
                    frame.frameName = title.text;

                    return frame;
                } else {
                    return false;
                }
            });

            let data4 = await GeneralQ.find();


            generalQ = await data4.filter(p => {
                const question = p.questionDifLang.find(tit => tit.lang === lang);
                const option = p.optionDifLang.find(tit => tit.lang === lang);

                p.question = question ? question.text : p.question;
                if (option) {
                    p.options = option.data;
                    return p;
                } else {
                    return false;
                }
            });

            let data5 = await Percentage.find();

            percentage = await data5.filter(p => {
                const question = p.questionDifLang.find(tit => tit.lang === lang);

                if (question) {

                    p.question = question.text;
                    return p;
                } else {
                    return false;
                }
            });

            let data6 = await Pick.find();

            pick = await data6.filter(p => {
                const option1 = p.option1DifLang.find(tit => { tit.lang === lang });
                const option2 = p.option2DifLang.find(tit => { tit.lang === lang });

                if (option2 && option1) {

                    p.options[0]['option'] = option1.text;
                    p.options[1]['option'] = option2.text;
                    return p;
                } else {
                    return false;
                }
            });


            let data7 = await Poll.find();

            poll = await data7.filter(p => {
                const question = p.questionDifLang.find(tit => tit.lang === lang);
                const answer = p.optionDifLang.find(tit => tit.lang === lang);

                p.question = question ? question.text : p.question;

                if (answer && question) {

                    p.option = answer.data;
                    return p;
                }
                else
                    return null;
            });

            let data8 = await Riddle.find();

            riddle = data8.filter(ridle => {

                const question = ridle.questionDifLang.find(tit => tit.lang === lang);
                const answer = ridle.answerDifLang.find(dis => dis.lang === lang);

                if (question && answer) {
                    ridle.question = question.text
                    ridle.answer = answer.text

                    return ridle;
                }
                else {
                    return false;
                }

            });


            res.send({ fanQuizzes, reel, feed, frames, generalQ, percentage, pick, poll, riddle });

        }

    } catch (error) {

        res.status(500).json(error);

    }

});


module.exports = router;