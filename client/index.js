const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = 2000;
const dotenv = require("dotenv");
const fetch = require("node-fetch");
const cookieParser = require("cookie-parser");
const { json } = require("express");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");
const { PeerServer } = require("peer");
const peerServer = PeerServer();
dotenv.config({ path: "../Server/util/config.env" });

let serverRoute = process.env.serverAddress;
let clientRoute = process.env.clientAddress;

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.use("/images", express.static("images"));
app.use("/public", express.static("public"));
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());

app.get("/", async (req, res) => {
  if (req.cookies.username) {
    data = {
      Username: req.cookies.username,
      Token: req.cookies.token,
      Email: req.cookies.email,
      roomId: uuidV4(),
    };
  } else {
    data = "";
  }
  res.render("home", data);
});

app.get("/admin", async (req, res) => {
  let url = serverRoute + "/getAllItems";
  let options = {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    json: true,
  };
  fetch(url, options)
    .then((body) => body.json())
    .then((json) => {
      if (json.success) {
        res.render("admin", { databody: json.shops, data: "" });
      } else {
        res.render("admin", { databody: "", data: "" });
      }
    });
});

app.get("/login", async (req, res) => {
  res.render("login", { data: "" });
});

app.post("/login", async (req, res) => {
  let url = serverRoute + "/login";
  let options = {
    body: JSON.stringify(req.body),
    method: "POST",
    headers: { "Content-Type": "application/json" },
    json: true,
  };
  fetch(url, options)
    .then((body) => body.json())
    .then((json) => {
      if (json.success) {
        res.cookie("token", json.token);
        res.cookie("username", json.Username);
        res.cookie("email", json.Email);
        if (json.admin) {
          res.redirect("/admin");
        } else {
          res.redirect("/");
        }
      } else {
        data = {
          message: json.message,
          symbol: "cancel",
        };
        res.render("login", data);
      }
    });
});
app.post("/register", async (req, res) => {
  let url = serverRoute + "/signup";
  let options = {
    body: JSON.stringify(req.body),
    method: "POST",
    headers: { "Content-Type": "application/json" },
    json: true,
  };
  fetch(url, options)
    .then((body) => body.json())
    .then((json) => {
      if (json.success) {
        data = {
          message: json.message,
          symbol: "check_circle",
        };
      } else {
        data = {
          message: json.message,
          symbol: "cancel",
        };
      }
      res.render("login", data);
    });
});

app.get("/newMeet", async (req, res) => {
  let url = serverRoute + "/addMeeting";
  let roomId = uuidV4();
  let body = {
    Email: req.cookies.email,
    roomId: roomId,
  };
  let options = {
    body: JSON.stringify(body),
    method: "POST",
    headers: { "Content-Type": "application/json" },
    json: true,
  };
  fetch(url, options)
    .then((body) => body.json())
    .then((json) => {
      if (json.success) {
        res.redirect("/" + json.roomId);
      } else {
        res.render("error", { message: json.message });
      }
    });
});

//verify the meeting
app.get("/:meetingAdmin/:roomId", async (req, res) => {
  let url =
    serverRoute +
    "/checkMeeting/" +
    req.params.meetingAdmin +
    "/" +
    req.params.roomId;
  let options = {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    json: true,
  };
  fetch(url, options)
    .then((body) => body.json())
    .then((json) => {
      if (json.success) {
        let url = serverRoute + "/findOneUser/" + json.adminEmail.toLowerCase();
        let options = {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          json: true,
        };
        fetch(url, options)
          .then((body) => body.json())
          .then((json) => {
            if (json.success) {
              res.render("room", {
                roomId: req.params.roomId,
                meetingAdmin: req.params.meetingAdmin,
                Email: req.cookies.email,
                Username: req.cookies.username,
                adminName: json.data.Username,
                adminEmail: json.data.Email,
              });
            } else {
              res.render("error", { message: json.message });
            }
          });
      } else {
        res.render("error", { message: json.message });
      }
    });
});

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  editUserMic,
  editUserVid,
} = require("./utils/users.js");

io.of("/new").on("connection", function (socket) {
  socket.on("join-room", (RoomId, MeetingAdmin, Email, Username, peerId) => {
    let roomVal = MeetingAdmin + "/" + RoomId;
    const { error, user } = addUser({
      id: socket.id,
      name: peerId,
      room: roomVal,
      vidState: "videocam",
      micState: "keyboard_voice",
    });
    socket.join(roomVal);
    let userVal = peerId + ":" + Username + ":" + Email;
    socket.broadcast.to(roomVal).emit("user-connected", userVal);

    socket.on("message", (Email, Username, text) => {
      io.of("/new").to(roomVal).emit("createMessage", Email, Username, text);
    });

    socket.on("disconnect", () => {
      const user = removeUser(socket.id);
      socket.broadcast.to(roomVal).emit("user-disconnected", userVal);
    });

    if (user) {
      io.to(user.room).emit("message", {
        user: "adminX",
        text: `${user.name.toUpperCase()} has left.`,
      });
      io.of("/new")
        .to(user.room)
        .emit("roomData", {
          room: user.room,
          users: getUsersInRoom(user.room),
        });
    }

    socket.on("mic-change", (id, micStatus) => {
      editUserMic(id, micStatus);
      io.of("/new")
        .to(roomVal)
        .emit("mic-changed", { peerId: peerId, user: getUser(id) });
    });

    socket.on("vid-change", (id, vidStatus) => {
      editUserVid(id, vidStatus);
      io.of("/new")
        .to(roomVal)
        .emit("vid-changed", { peerId: peerId, user: getUser(id) });
    });
  });
});

app.get("/logout", async (req, res) => {
  res.clearCookie("token");
  res.clearCookie("username");
  res.clearCookie("email");
  res.redirect("/");
});

server.listen(PORT, function (err) {
  if (err) console.log("Error in client setup");
  console.log("Client listening on Port", PORT);
});
