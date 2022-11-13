const socket = io.connect(clientUrl + "/new");
const videoGrid = document.getElementById("room-grid");
const participants = document.getElementById("allParticipants");
var Peerit;
if (Email) {
  const Idval = Email + "_" + Username;
  Peerit = new Peer(Idval);
} else {
  Peerit = new Peer(undefined, {
    host: "0.peerjs.com",
    port: "443",
  });
}
var dish;
window.addEventListener(
  "load",
  function () {
    // select parent of dish
    let scenary = document.getElementsByClassName("Scenary")[0];

    // create dish
    dish = new Sizer(scenary);

    // resize the cameras
    dish.resize();

    // resize event of window
    window.addEventListener("resize", function () {
      // resize event to dimension cameras
      dish.resize();
    });
  },
  false
);

var ssp = [];
const myPeer = Peerit;
const myVideo = document.createElement("video");
myVideo.muted = true;

const peers = {};
var myVideoStream;
const addVideoStream = (video, stream, namePart, peerPart) => {
  let add = document.createElement("div");
  add.className = "videoContent";
  add.id = peerPart;
  video.srcObject = stream;
  if (!stream) {
    video.style.background = "black";
  }
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  add.append(video);
  add.insertAdjacentHTML(
    "beforeend",
    "<span class='userName'>" + namePart + "</span>"
  );
  add.insertAdjacentHTML(
    "beforeend",
    "<span class='userLogo'>" + namePart[0] + "</span>"
  );
  if (videoGrid.querySelectorAll(".videoContent").length > 12) {
    participants.append(add);
  } else {
    videoGrid.append(add);
  }
  let check = document.querySelectorAll(".videoContent");
  check.forEach((item) => {
    if (item.getElementsByTagName("video").length == 0) {
      item.remove();
    }
  });

  dish.resize();
};

myPeer.on("open", (peerId) => {
  socket.emit("join-room", RoomId, MeetingAdmin, Email, Username, peerId);
});

try {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: true,
    })
    .then((stream) => {
      myVideoStream = stream;
      if (Email === "<%= adminEmail %>") {
        addVideoStream(myVideo, stream, "You (Admin)", "");
      } else {
        addVideoStream(myVideo, stream, "You", "");
      }
      myPeer.on("call", (call) => {
        call.answer(stream);
        const peerPart = call.peer.split("_")[0];
        const namePart = call.peer.split("_")[1];
        const video = document.createElement("video");
        call.on("stream", (userStream) => {
          if (namePart) {
            addVideoStream(video, userStream, namePart, peerPart);
          } else {
            addVideoStream(video, userStream, "Anonymous", peerPart);
          }
          ssp.push(call.peerConnection);
        });
      });

      socket.on("user-connected", (userVal) => {
        let requirements = userVal.split(":");
        let peerId = requirements[0];
        connectToNewUser(peerId, stream);
      });
    })
    .catch((err) => {
      var stream = null;
      myVideoStream = stream;
      if (Email === "<%= adminEmail %>") {
        addVideoStream(myVideo, stream, "You (Admin)");
      } else {
        addVideoStream(myVideo, stream, "You");
      }

      myPeer.on("call", (call) => {
        call.answer(stream);
        const peerPart = call.peer.split("_")[0];
        const namePart = call.peer.split("_")[1];
        const video = document.createElement("video");
        call.on("stream", (userStream) => {
          if (namePart) {
            addVideoStream(video, userStream, namePart, peerPart);
          } else {
            addVideoStream(video, userStream, "Anonymous", peerPart);
          }
          ssp.push(call.peerConnection);
        });
      });

      socket.on("user-connected", (userVal) => {
        let requirements = userVal.split(":");
        let peerId = requirements[0];
        connectToNewUser(peerId, stream);
      });
    });
} catch (err) {
  var stream = null;
  myVideoStream = stream;
  if (Email === "<%= adminEmail %>") {
    addVideoStream(myVideo, stream, "You (Admin)");
  } else {
    addVideoStream(myVideo, stream, "You");
  }

  myPeer.on("call", (call) => {
    call.answer(stream);
    const peerPart = call.peer.split("_")[0];
    const namePart = call.peer.split("_")[1];
    const video = document.createElement("video");
    call.on("stream", (userStream) => {
      if (namePart) {
        addVideoStream(video, userStream, namePart, peerPart);
      } else {
        addVideoStream(video, userStream, "Anonymous", peerPart);
      }
      ssp.push(call.peerConnection);
    });
  });

  socket.on("user-connected", (userVal) => {
    let requirements = userVal.split(":");
    let peerId = requirements[0];
    connectToNewUser(peerId, stream);
  });
}
socket.on("user-disconnected", (userVal) => {
  let requirements = userVal.split(":");
  let peerId = requirements[0];
  if (peers[peerId]) {
    let userPeerId = peerId.split("_")[0];
    document.getElementById(userPeerId).remove();
    peers[peerId].close();
  }
  dish.resize();
});

const connectToNewUser = (peerId, stream) => {
  if (peers[peerId]) {
    peers[peerId].close();
    dish.resize();
  }
  const call = myPeer.call(peerId, stream);
  const video = document.createElement("video");
  let namePart = peerId.split("_");
  let peerPart = namePart[0];
  namePart = namePart[1];
  call.on("stream", (userStream) => {
    if (namePart) {
      addVideoStream(video, userStream, namePart, peerPart);
    } else {
      addVideoStream(video, userStream, "Anonymous", peerPart);
    }
    ssp.push(call.peerConnection);
  });

  call.on("close", () => {
    video.remove();
    let check = document.querySelectorAll(".videoContent");
    check.forEach((item) => {
      if (item.getElementsByTagName("video").length == 0) {
        item.remove();
      }
    });
  });
  peers[peerId] = call;
};

const muteUnmute = () => {
  try {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getAudioTracks()[0].enabled = false;
      setMute();
    } else {
      myVideoStream.getAudioTracks()[0].enabled = true;
      setUnmute();
    }
  } catch (err) {
    setMute();
  }
};

const setUnmute = () => {
  let mic = document.getElementById("mic-btn");
  mic.innerHTML = '<span class="material-icons-outlined">keyboard_voice</span>';
  mic.style.border = "none";
  mic.style.background = "rgb(1, 87, 140)";
  if (socket.id) {
    socket.emit("mic-change", socket.id, "keyboard_voice");
    socket.on("mic-changed", (data) => {
      let peerPart = data.peerId.split("_")[0];
      document.getElementById(peerPart).querySelectorAll(".icon")[2].innerHTML =
        data.user.micState;
    });
  }
};

const setMute = () => {
  let mic = document.getElementById("mic-btn");
  mic.innerHTML = '<span class="material-icons-outlined">mic_off</span>';
  mic.style.background = "rgba(255, 255, 255, 0.15)";
  if (socket.id) {
    socket.emit("mic-change", socket.id, "mic_off");
    socket.on("mic-changed", (data) => {
      let peerPart = data.peerId.split("_")[0];
      document.getElementById(peerPart).querySelectorAll(".icon")[2].innerHTML =
        data.user.micState;
    });
  }
};

const playStop = () => {
  try {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getVideoTracks()[0].enabled = false;
      setStop();
    } else {
      myVideoStream.getVideoTracks()[0].enabled = true;
      setPlay();
    }
  } catch (err) {
    setStop();
  }
};

const setPlay = () => {
  let vid = document.getElementById("video-btn");
  vid.innerHTML = '<span class="material-icons-outlined">videocam</span>';
  vid.style.border = "none";
  vid.style.background = "rgb(1, 87, 140)";
  if (socket.id) {
    socket.emit("vid-change", socket.id, "videocam");
    socket.on("vid-changed", (data) => {
      let peerPart = data.peerId.split("_")[0];
      document.getElementById(peerPart).querySelectorAll(".icon")[1].innerHTML =
        data.user.vidState;
    });
  }
};

const setStop = () => {
  let vid = document.getElementById("video-btn");
  vid.innerHTML = '<span class="material-icons-outlined">videocam_off</span>';
  vid.style.background = "rgba(255, 255, 255, 0.15)";
  if (socket.id) {
    socket.emit("vid-change", socket.id, "videocam_off");
    socket.on("vid-changed", (data) => {
      let peerPart = data.peerId.split("_")[0];
      document.getElementById(peerPart).querySelectorAll(".icon")[1].innerHTML =
        data.user.vidState;
    });
  }
};

document.onkeydown = (e) => {
  e = e || window.event;
  if (e.keyCode == 13 && !e.shiftKey) {
    e.preventDefault();
    let text = document.getElementById("msg");
    let checkVal = text.value.split(" ").join("");
    if (text.value != "" && checkVal.length > 0 && text.value.length > 0) {
      socket.emit("message", Email, Username, text.value);
      text.value = "";
    }
  }
};

document.getElementById("chat-send").onclick = function () {
  let text = document.getElementById("msg");
  let checkVal = text.value.split(" ").join("");
  if (text.value != "" && checkVal.length > 0 && text.value.length > 0) {
    socket.emit("message", Email, Username, text.value);
    text.value = "";
  }
};

socket.on("createMessage", (email, Username, text) => {
  if (Username == undefined || Username == null || Username.length == 0) {
    Username = "Anonymous";
  }
  let appendVal;
  if (Email == email) {
    appendVal = document.createElement("div");
    appendVal.className = "right-msg";
    let msgUser = document.createElement("div");
    msgUser.className = "msg-user";
    let msg = document.createElement("div");
    msg.className = "msg";
    if (Email.length == 0) {
      msgUser.innerText = "You/Anonymous";
    } else {
      msgUser.innerText = "You";
    }
    msg.innerText = text;
    appendVal.append(msgUser);
    appendVal.append(msg);
  } else {
    appendVal = document.createElement("div");
    appendVal.className = "left-msg";
    let msgUser = document.createElement("div");
    msgUser.className = "msg-user";
    let msg = document.createElement("div");
    msg.className = "msg";
    msg.innerText = text;
    msgUser.innerHTML = Username;
    appendVal.append(msgUser);
    appendVal.append(msg);
  }
  document.getElementById("chat-body").append(appendVal);
  console.log(document.getElementById("chat").style.display);
  if (
    document.getElementById("chat").style.display == "none" ||
    document.getElementById("chat").style.display == ""
  ) {
    document.getElementById("notify").style.display = "block";
  }
});

socket.on("roomData", (userDetails) => {
  let allUsers = userDetails.users;
  allUsers.forEach((user) => {
    let userName = user.name.split("_");
    let peerId = userName[0];
    if (userName[1]) {
      userName = userName[1].toUpperCase();
      if (userName.length > 30) {
        userName = userName.slice(30);
      }
    } else {
      userName = "Anonymous";
    }
    let userDiv = document.createElement("div");
    userDiv.className = "user";
    userDiv.id = peerId;
    let details = document.createElement("div");
    details.className = "details";
    details.insertAdjacentHTML(
      "beforeend",
      '<span class="material-icons icon">account_circle</span>'
    );
    let userDivName = document.createElement("span");
    userDivName.className = "userDetails";
    userDivName.innerText = userName;
    details.append(userDivName);
    userDiv.append(details);
    let userMicVid = document.createElement("div");
    userMicVid.className = "userMicVid";
    userMicVid.insertAdjacentHTML(
      "beforeend",
      '<span class="material-icons-outlined icon">' +
        user.vidState +
        '</span><span class="material-icons-outlined icon">' +
        user.micState +
        "</span>"
    );
    userDiv.append(userMicVid);
    let existingUsers = document.getElementById(peerId);
    if (existingUsers) {
    } else {
      document.getElementById("user-body").append(userDiv);
    }
  });
});

const stopScreenShare = () => {
  let videoTrack = myVideoStream.getVideoTracks()[0];
  ssp.forEach((item) => {
    let sender = item.getSenders().find(function (s) {
      return s.track.kind == videoTrack.kind;
    });
    sender.replaceTrack(videoTrack);
  });
  document.getElementById("ssAlert").style.display = "none";
  socket.emit("screenStopping", "present_to_all");
};

document.getElementById("present-btn").addEventListener("click", (e) => {
  navigator.mediaDevices
    .getDisplayMedia({
      video: { cursor: "always" },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    })
    .then((screenStream) => {
      let videoTrack = screenStream.getVideoTracks()[0];
      videoTrack.onended = function () {
        stopScreenShare();
      };
      ssp.forEach((item) => {
        let sender = item.getSenders().find(function (s) {
          return s.track.kind == videoTrack.kind;
        });
        sender.replaceTrack(videoTrack);
      });
      socket.emit("screenSharing", "cancel_presentation");
      document.getElementById("present-btn").className = "temp";
      document.getElementById("ssAlert").style.display = "flex";
    })
    .catch((err) => {
      console.log("cannot share screen", err);
    });
});

socket.on("screenShared", (data) => {
  let allVideos = videoGrid.querySelectorAll(".videoContent");
  let checkId = data.idVal.split("_")[0];
  let userName = data.idVal.split("_")[1];
  if (userName) {
  } else {
    userName = "Anonymous";
  }
  let alert = document.getElementById("ssAlert2");
  alert.innerHTML =
    '<span class="material-icons-outlined"> present_to_all </span>' +
    userName +
    " started sharing the screen";

  allVideos.forEach((video) => {
    if (video.id == checkId) {
      video.style.display = "block";
      video.style.width = "fit-content";
    } else {
      video.style.display = "none";
    }
  });
  let buttonVal = document
    .getElementById("present-btn")
    .querySelector(".material-icons-round");
  buttonVal.innerHTML = data.icon;
  document.getElementById("present-btn").style.background =
    "rgba(255, 255, 255, 0.089)";
  document.getElementById("present-btn").disabled = true;
  /*if (!(document.getElementById("present-btn").className == "temp")) {
  } else {
  }*/
  alert.style.transform = "translate(-50%, 0)";
  setTimeout(() => {
    alert.style.transform = "translate(-50%, -300px)";
  }, 3000);
});

socket.on("screenStopped", (data) => {
  let userName = data.idVal.split("_")[1];
  if (userName) {
  } else {
    userName = "Anonymous";
  }
  let alert = document.getElementById("ssAlert2");
  alert.innerHTML =
    '<span class="material-icons-outlined"> present_to_all </span>' +
    userName +
    " stopped sharing the screen";

  let allVideos = videoGrid.querySelectorAll(".videoContent");
  allVideos.forEach((video) => {
    video.style.display = "block";
    video.style.width = "100%";
  });
  let buttonVal = document
    .getElementById("present-btn")
    .querySelector(".material-icons-round");
  buttonVal.innerHTML = data.icon;
  document.getElementById("present-btn").style.background = "rgb(183,243,151)";
  document.getElementById("present-btn").disabled = false;

  alert.style.transform = "translate(-50%, 0)";
  setTimeout(() => {
    alert.style.transform = "translate(-50%, -300px)";
  }, 3000);
});
