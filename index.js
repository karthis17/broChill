const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config()
const userRouter = require("./router/user");
const imageRouter = require("./router/post");
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

mongoose.connect(process.env.MONG_URL).then(() => {
    app.listen(port, () => {
        console.log("App listening on port " + port + " http://localhost:" + port);
    })
});

