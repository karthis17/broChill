const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config()
const userRouter = require("./router/user");
const imageRouter = require("./router/post");
const pollRouter = require("./router/poll");
const quizzeRouter = require("./router/quizzes");
const flamesRouter = require("./router/flames");
const frameRouter = require("./router/frams");
const pickRouter = require("./router/pickOneKickOne");
const nameRouter = require("./router/nameMeaningNdFact");
const calc = require("./router/friendship-love- calculator");
const cors = require("cors")
const path = require("path");
const bodyParser = require("body-parser");


const app = express();
const port = 3000;

app.use(cors())

// app.use(express.json());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send("hello world");
});

app.use("/api/users", userRouter);
app.use(express.static(path.join(__dirname, 'uploads')));
app.use("/api/img", imageRouter);
app.use("/api/poll", pollRouter);
app.use("/api/frame", frameRouter);
app.use("/api/flames", flamesRouter);
app.use("/api/quizzes", quizzeRouter);
app.use("/api/nameing", nameRouter);
app.use("/api/pick-and-kick", pickRouter);
app.use("/api/love-friendship-calc", calc);

mongoose.connect(process.env.MONG_URL).then(() => {
    app.listen(port, () => {
        console.log("App listening on port " + port + " http://localhost:" + port);
    })
});

