const encrypt = require("../encrypt.js");
const Room = require("../models/room.model.js");

exports.create = (req, res) => {
  try {
    let Email = encrypt.decrypt(req.body.Email);
    let val = Email + Math.floor(Math.random() * 10);
    let roomval = encrypt.encrypt(val);
    let roomId = roomval + "/" + req.body.roomId;
    let timings = [];
    if (req.body.timings) {
      timings = req.body.timings;
    }
    const room = new Room({
      Email: Email,
      roomId: roomId,
      timings: timings,
    });
    room
      .save()
      .then(() => {
        res.send({
          success: true,
          roomId: roomId,
        });
      })
      .catch((err) => {
        res.send({
          success: false,
          message: "Failed to create meeting",
        });
      });
  } catch (err) {
    res.send({
      success: false,
      message: "Invalid User",
    });
  }
};

exports.verifyMeeting = (req, res) => {
  let roomVal = req.params.meetingAdmin + "/" + req.params.roomId;
  Room.find({ roomId: roomVal })
    .then((room) => {
      if (room.length > 0) {
        try {
          let Email = encrypt.decrypt(req.params.meetingAdmin);
          Email = Email.slice(0, -1);
          res.send({
            success: true,
            adminEmail: Email,
          });
        } catch (err) {
          res.send({
            success: false,
            message: "Invalid Link",
          });
        }
      } else {
        res.send({
          success: false,
          message: "Invalid Link",
        });
      }
    })
    .catch((err) => {
      res.send({
        success: false,
        message: "Something went Wrong",
      });
    });
};
