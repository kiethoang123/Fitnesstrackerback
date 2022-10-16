require("dotenv").config()
const express = require("express")
const app = express()

const bodyParser = require('body-parser');
app.use(bodyParser.json())

app.use(express.json());

const cors = require('cors');
app.use(cors());

const apiRouter = require("./api");
app.use("/api", apiRouter);

app.use((error, req, res, next) => {
    res.send(
        error
    );
})

module.exports = app;