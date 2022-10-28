const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const PORT = 7000;
dotenv.config({ path: "../server/util/config.env" });

const User = require("./models/user.model");
const Room = require("./models/room.model.js");
const app = express();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());

mongoose.Promise = global.Promise;
moment.suppressDeprecationWarnings = true;

dbConfig = {
  url: process.env.dbURL,
};

mongoose
  .connect(dbConfig.url, {
    useNewUrlParser: true,
    //to remove deprication message
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to the database");
  })
  .catch((err) => {
    console.log("Could not connect to the database. Exiting now...", err);
    process.exit();
  });

app.get("/", async (req, res) => {
  res.send("this is server");
});
const users = require("./controllers/user.controller.js");
const rooms = require("./controllers/room.controller.js");

require("./routes/user.route.js")(app);
require("./routes/room.route.js")(app);

app.listen(process.env.PORT || PORT, () =>
  console.log("Server @ port", process.env.PORT || PORT)
);
