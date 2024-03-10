const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config()
const userRouter = require("./router/user");
const allRouter = require("./router/fetchAll");
const adminRouter = require("./router/admin");
const imageRouter = require("./router/post");
const pollRouter = require("./router/poll");
const quizzeRouter = require("./router/quizzes");
const flamesRouter = require("./router/flames");
const frameRouter = require("./router/frams");
const pickRouter = require("./router/pickOneKickOne");
const nameRouter = require("./router/nameMeaningNdFact");
const guessRouter = require("./router/guessGame");
const funQuRouter = require("./router/fanQuizzes");
const riddleRouter = require("./router/riddles");
const feedRouter = require("./router/feed");
const generalRouter = require("./router/general-qiestion");
const reelRouter = require("./router/reel");
// const percentageTypeRouter = require("./router/percentageType");
// const RandImgRouter = require("./router/randomImage");
const funtestRouter = require("./router/funtest");
const menuRouter = require("./router/menu");
const calc = require("./router/friendship-love- calculator");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const nameingRouter = require("./router/naming");
const lnagRouter = require("./router/language");
const contest = require("./router/contest");


const app = express();
const port = 3000;

app.use(cors())

app.use(express.json());
app.use(bodyParser.json({ limit: '1gb' }));
app.use(bodyParser.urlencoded({ limit: '1gb', extended: true }));

app.get('/', (req, res) => {
    res.send("hello world");
});

const categoryNames = ["Reels", "Feeds", "Personality Quiz", "Fans Quiz", "Fun Test", "Name Test", "Polls", "Frames", "Party Games", "Contest Quiz", "General Knowledge Quiz", "Riddles"];

app.use("/api/users", userRouter);
app.use("/api", allRouter);
app.use("/api/admin", adminRouter);
app.use(express.static(path.join(__dirname, 'uploads')));
// app.use("/api/img", imageRouter);
app.use("/api/polls", pollRouter);
app.use("/api/frames", frameRouter);
// app.use("/api/flames", flamesRouter);
app.use("/api/personalityquiz", quizzeRouter);
// app.use("/api/nameing", nameRouter);
// app.use("/api/guess-game", guessRouter);
app.use("/api/fansquiz", funQuRouter);
app.use("/api/gkquiz", generalRouter);
app.use("/api/riddles", riddleRouter);
app.use("/api/reels", reelRouter);
app.use("/api/feeds", feedRouter);
app.use("/api/menu", menuRouter);
app.use("/api/partygames", pickRouter);
// app.use("/api/love-friendship-calc", calc);
// app.use('/api/random-image', RandImgRouter);
app.use('/api/funtest', funtestRouter);
app.use('/api/nametest', nameingRouter);
app.use('/api/language', lnagRouter);
app.use('/api/contestquiz', contest);
// app.use('/api/percentage-type', percentageTypeRouter);

mongoose.connect(process.env.MONG_URL).then(() => {
    app.listen(port, () => {
        console.log("App listening on port " + port + " http://localhost:" + port);
    });

});

