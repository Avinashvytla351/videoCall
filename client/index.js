const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = 80;
const dotenv = require("dotenv");
const fetch = require("node-fetch");
const cookieParser = require("cookie-parser");
const { json } = require("express");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");
const { PeerServer } = require("peer");
const peerServer = PeerServer();
dotenv.config({ path: "../server/util/config.env" });

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
              let url = serverRoute + "/decryptEmail/" + req.cookies.email;
              let options = {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                json: true,
              };
              fetch(url, options)
                .then((body1) => body1.json())
                .then((json1) => {
                  let isAdmin = false;
                  if (json1.success) {
                    isAdmin = json1.Email == json.data.Email;
                  }
                  res.render("room", {
                    roomId: req.params.roomId,
                    meetingAdmin: req.params.meetingAdmin,
                    Email: req.cookies.email,
                    Username: req.cookies.username,
                    adminName: json.data.Username,
                    adminEmail: json.data.Email,
                    clientUrl: clientRoute,
                    serverUr: serverRoute,
                    isAdmin: isAdmin,
                  });
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

var socketSettings = {
  userMic: true,
  userVid: true,
  userChat: true,
  userPre: true,
  anonUser: true,
  anonMic: true,
  anonVid: true,
  anonChat: true,
  anonPre: true,
};

io.of("/new").on("connection", function (socket) {
  socket.on(
    "join-room",
    (RoomId, MeetingAdmin, Email, Username, peerId, isAdmin) => {
      let roomVal = MeetingAdmin + "/" + RoomId;
      const { error, user } = addUser({
        id: socket.id,
        name: peerId,
        room: roomVal,
        vidState: "videocam",
        micState: "keyboard_voice",
        isAdmin: isAdmin,
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

      socket.on("screenSharing", (iconValue) => {
        io.of("/new")
          .to(roomVal)
          .emit("screenShared", { idVal: peerId, icon: iconValue });
      });
      socket.on("screenStopping", (iconValue) => {
        io.of("/new")
          .to(roomVal)
          .emit("screenStopped", { idVal: peerId, icon: iconValue });
      });

      socket.on("allMic", (micVal) => {
        socketSettings.userMic = micVal;
        io.of("/new").to(roomVal).emit("allMicChange", micVal);
      });

      socket.on("allVid", (vidVal) => {
        socketSettings.userVid = vidVal;
        io.of("/new").to(roomVal).emit("allVidChange", vidVal);
      });

      socket.on("allChat", (chatVal) => {
        socketSettings.userChat = chatVal;
        io.of("/new").to(roomVal).emit("allChatChange", chatVal);
      });

      socket.on("allPre", (preVal) => {
        socketSettings.userPre = preVal;
        io.of("/new").to(roomVal).emit("allPreChange", preVal);
      });

      socket.on("anonMic", (anonMicVal) => {
        socketSettings.anonMic = anonMicVal;
        io.of("/new").to(roomVal).emit("anonMicChange", anonMicVal);
      });

      socket.on("anonVid", (anonVidVal) => {
        socketSettings.anonVid = anonVidVal;
        io.of("/new").to(roomVal).emit("anonVidChange", anonVidVal);
      });

      socket.on("anonChat", (anonChatVal) => {
        socketSettings.anonChat = anonChatVal;
        io.of("/new").to(roomVal).emit("anonChatChange", anonChatVal);
      });

      socket.on("anonPre", (anonPreVal) => {
        socketSettings.anonPre = anonPreVal;
        io.of("/new").to(roomVal).emit("anonPreChange", anonPreVal);
      });

      socket.on("anonUser", (anonUserVal) => {
        socketSettings.anonUser = anonUserVal;
        io.of("/new").to(roomVal).emit("anonUserChange", anonUserVal);
      });

      socket.on("getSocketSetting", (socketId) => {
        io.of("/new").to(socketId).emit("socketSettings", socketSettings);
      });
    }
  );
});

app.get("/logout", async (req, res) => {
  res.clearCookie("token");
  res.clearCookie("username");
  res.clearCookie("email");
  res.redirect("/");
});

server.listen(process.env.PORT || PORT, function (err) {
  if (err) console.log("Error in client setup");
  console.log("Client listening on Port", process.env.PORT || PORT);
});
