module.exports = (app) => {
  const users = require("../controllers/user.controller.js");

  // Create a new user
  app.post("/signup", users.create);
  app.post("/login", users.checkPass);

  //find one user
  app.get("/findOneUser/:Email", users.findOneUser);

  //decrypt Email
  app.get("/decryptEmail/:Email", users.decryptEmail);
};
