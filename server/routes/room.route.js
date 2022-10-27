module.exports = (app) => {
  const rooms = require("../controllers/room.controller.js");

  app.post("/addMeeting", rooms.create);

  //verify meeting
  app.get("/checkMeeting/:meetingAdmin/:roomId", rooms.verifyMeeting);
};
