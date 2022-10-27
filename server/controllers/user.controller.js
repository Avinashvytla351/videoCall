const User = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const encrypt = require("../encrypt.js");

exports.create = (req, res) => {
  if (!req.body.Username || !req.body.Email || !req.body.Password) {
    return res.send({
      success: false,
      message: "Fill all the details",
    });
  }
  if (req.body.Email.length > 5 && req.body.Email.indexOf("@") > -1) {
    const user = new User({
      Username: req.body.Username,
      Email: req.body.Email,
      Password: req.body.Password,
    });
    user
      .save()
      .then((data) => {
        data.success = true;
        res.send({ success: true, message: "Registered Successfully" });
      })
      .catch((err) => {
        err.success = false;
        err.message1 = err.message;
        err.message = "";
        if (err.message1.includes("username")) {
          err.message = "Username is already taken";
        }
        if (err.message1.includes("Email")) {
          err.message = "Email is already taken";
        }
        res.send({
          success: false,
          message: err.message,
        });
      });
  } else {
    res.send({
      success: false,
      message: "Invalid Details",
    });
  }
};

exports.checkPass = (req, res) => {
  User.find({ Email: req.body.Email })
    .then(async (user) => {
      if (user.length === 0) {
        res.send({
          success: false,
          message: "User not found with Email-Id  " + req.body.Email,
        });
        return;
      }
      if (user[0].Password === req.body.Password) {
        let emailEncrypt = await encrypt.encrypt(user[0].Email.toLowerCase());
        let token = jwt.sign(
          {
            Username: user[0].Username,
            admin: user[0].admin,
            Email: user[0].Email,
          },
          process.env.secret,
          { expiresIn: "730h" }
        );
        res.cookie("token", token);
        res.cookie("username", user[0].Username.toLowerCase());
        res.cookie("email", emailEncrypt);
        res.send({
          success: true,
          token: token,
          Username: user[0].Username.toUpperCase(),
          Email: emailEncrypt,
          message: "login Successfull",
          admin: user[0].admin,
        });
      } else {
        res.send({
          success: false,
          message: "Incorrect password",
        });
      }
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        res.send({
          success: false,
          message: "User not found with Email-Id  " + req.body.Email,
        });
        return;
      }
      res.send({
        success: false,
        message: "Error retrieving user with Email-id " + req.body.Email,
      });
    });
};

exports.findOneUser = (req, res) => {
  User.find({ Email: req.params.Email })
    .then((user) => {
      if (user.length > 0) {
        res.send({
          success: true,
          data: user[0],
        });
      } else {
        res.send({
          success: false,
          message: "Invalid User",
        });
      }
    })
    .catch((err) => {
      res.send({
        success: false,
        message: "Invalid User",
      });
    });
};
