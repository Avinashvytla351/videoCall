const socket = io.connect(clientUrl + "/new");
const videoGrid = document.getElementById("room-grid");
const participants = document.getElementById("allParticipants");
const spareGrid = document.getElementById("spare-grid");
const winWidth = window.innerWidth;
const winHeight = window.innerHeight;
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
  socket.emit(
    "join-room",
    RoomId,
    MeetingAdmin,
    Email,
    Username,
    peerId,
    isAdmin
  );
});

try {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: true,
    })
    .then((stream) => {
      myVideoStream = stream;
      if (isAdmin) {
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
      if (isAdmin) {
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
  if (isAdmin) {
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

//Chat part

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
  let messages = document.getElementById("chat-body");
  shouldScroll =
    messages.scrollTop + messages.clientHeight === messages.scrollHeight;
  document.getElementById("chat-body").append(appendVal);
  if (!shouldScroll) {
    scrollToBottom();
  }
  if (
    document.getElementById("chat").style.display == "none" ||
    document.getElementById("chat").style.display == ""
  ) {
    document.getElementById("notify").style.display = "block";
  }
});

function scrollToBottom() {
  let messages = document.getElementById("chat-body");
  messages.scrollTop = messages.scrollHeight;
}

var chat = document.getElementById("chat-btn");
var chatclose = document.getElementById("chatclose");
chat.onclick = function () {
  document.getElementById("notify").style.display = "none";
  chat.style.background = "rgb(1, 87, 140)";
  chat.style.border = "none";
  document.getElementById("chat").style.display = "flex";
  setTimeout(() => {
    document.getElementById("chat").style.transform = "translateX(0)";
    dish.resize();
  }, 100);
};
chatclose.onclick = function () {
  document.getElementById("notify").style.display = "none";
  chat.style.background = "rgba(255, 255, 255, 0.15)";
  document.getElementById("chat").style.transform = "translateX(1000px)";
  setTimeout(() => {
    document.getElementById("chat").style.display = "none";
    dish.resize();
  }, 100);
};
//chat part end

socket.on("roomData", (userDetails) => {
  let allUsers = userDetails.users;
  console.log(allUsers);
  allUsers.forEach((user) => {
    let userName = user.name.split("_");
    let admin = user.isAdmin;
    let peerId = userName[0];
    if (userName[1]) {
      userName = userName[1].toUpperCase();
      if (userName.length > 30) {
        userName = userName.slice(30);
      }
    } else {
      userName = "Anonymous";
    }
    if (admin) {
      userName = userName + " (Admin)";
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
      spareGrid.append(video);
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
  dish._ratio = Math.min(winHeight / winWidth, winWidth / winHeight);
  dish._aspect = 4;
  dish.resize();
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

  let allVideos = spareGrid.querySelectorAll(".videoContent");
  allVideos.forEach((video) => {
    videoGrid.append(video);
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
  dish._ratio = 3 / 4;
  dish._aspect = 0;
  dish.resize();
});

$("#allMicIn").change(function () {
  let allMicIn = document.getElementById("allMicIn");
  socket.emit("allMic", allMicIn.checked);
  let anonUserIn = document.getElementById("anonUserIn");
  if (isAdmin && allMicIn.checked && anonUserIn.checked) {
    $("#anonMicIn").prop("checked", true);
    document.getElementById("anonMicIn").disabled = false;
  } else if (isAdmin && !allMicIn.checked) {
    $("#anonMicIn").prop("checked", false);
    document.getElementById("anonMicIn").disabled = true;
  }
});

socket.on("allMicChange", (micVal) => {
  console.log("You are Muted", Email);
  let mic = document.getElementById("mic-btn");
  if (isAdmin || micVal) {
    mic.disabled = false;
  } else {
    try {
      let enabled = myVideoStream.getAudioTracks()[0].enabled;
      if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setMute();
      }
    } catch {
      setMute();
    }
    mic.disabled = true;
  }
});

$("#allVidIn").change(function () {
  let allVidIn = document.getElementById("allVidIn");
  socket.emit("allVid", allVidIn.checked);
  let anonUserIn = document.getElementById("anonUserIn");
  if (isAdmin && allVidIn.checked && anonUserIn.checked) {
    $("#anonVidIn").prop("checked", true);
    document.getElementById("anonVidIn").disabled = false;
  } else if (isAdmin && !allVidIn.checked) {
    $("#anonVidIn").prop("checked", false);
    document.getElementById("anonVidIn").disabled = true;
  }
});

socket.on("allVidChange", (vidVal) => {
  console.log("You are not allowed to turn your video on");
  let vid = document.getElementById("video-btn");
  if (isAdmin || vidVal) {
    vid.disabled = false;
  } else {
    try {
      let enabled = myVideoStream.getVideoTracks()[0].enabled;
      if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setStop();
      }
    } catch {
      setStop();
    }
    vid.disabled = true;
  }
});

$("#allChatIn").change(function () {
  let allChatIn = document.getElementById("allChatIn");
  socket.emit("allChat", allChatIn.checked);
  let anonUserIn = document.getElementById("anonUserIn");
  if (isAdmin && allChatIn.checked && anonUserIn.checked) {
    $("#anonChatIn").prop("checked", true);
    document.getElementById("anonChatIn").disabled = false;
  } else if (isAdmin && !allChatIn.checked) {
    $("#anonChatIn").prop("checked", false);
    document.getElementById("anonChatIn").disabled = true;
  }
});

socket.on("allChatChange", (chatVal) => {
  if (isAdmin || chatVal) {
    console.log("Your Chat has been enabled");
    chat.disabled = false;
    document.getElementById("message-chat-icon").innerHTML = "message";
  } else {
    console.log("Your Chat has been disabled");
    try {
      chatclose.click();
      setTimeout(() => {
        chatclose.click();
      }, 1000);
    } catch {
      setTimeout(() => {
        chatclose.click();
      }, 2000);
    }
    chat.disabled = true;
    document.getElementById("message-chat-icon").innerHTML =
      "speaker_notes_off";
  }
});

$("#allPreIn").change(function () {
  let allPreIn = document.getElementById("allPreIn");
  socket.emit("allPre", allPreIn.checked);
  let anonUserIn = document.getElementById("anonUserIn");
  if (isAdmin && allPreIn.checked && anonUserIn.checked) {
    $("#anonPreIn").prop("checked", true);
    document.getElementById("anonPreIn").disabled = false;
  } else if (isAdmin && !allPreIn.checked) {
    $("#anonPreIn").prop("checked", false);
    document.getElementById("anonPreIn").disabled = true;
  }
});

socket.on("allPreChange", (preVal) => {
  if (isAdmin || preVal) {
    document.getElementById("present-btn").style.background =
      "rgb(183,243,151)";
    document.getElementById("present-btn").disabled = false;
  } else {
    document.getElementById("present-btn").style.background =
      "rgba(255, 255, 255, 0.089)";
    document.getElementById("present-btn").disabled = true;
  }
});

$("#anonMicIn").change(function () {
  let anonMicIn = document.getElementById("anonMicIn");
  socket.emit("anonMic", anonMicIn.checked);
});

socket.on("anonMicChange", (anonMicVal) => {
  if (!Email) {
    console.log("You are Muted", Email);
    let mic = document.getElementById("mic-btn");
    if (anonMicVal) {
      mic.disabled = false;
    } else {
      try {
        let enabled = myVideoStream.getAudioTracks()[0].enabled;
        if (enabled) {
          myVideoStream.getAudioTracks()[0].enabled = false;
          setMute();
        }
      } catch {
        setMute();
      }
      mic.disabled = true;
    }
  }
});

$("#anonVidIn").change(function () {
  let anonVidIn = document.getElementById("anonVidIn");
  socket.emit("anonVid", anonVidIn.checked);
});

socket.on("anonVidChange", (anonVidVal) => {
  if (!Email) {
    console.log("You are not allowed to turn your video on");
    let vid = document.getElementById("video-btn");
    if (anonVidVal) {
      vid.disabled = false;
    } else {
      try {
        let enabled = myVideoStream.getVideoTracks()[0].enabled;
        if (enabled) {
          myVideoStream.getVideoTracks()[0].enabled = false;
          setStop();
        }
      } catch {
        setStop();
      }
      vid.disabled = true;
    }
  }
});

$("#anonChatIn").change(function () {
  let anonChatIn = document.getElementById("anonChatIn");
  socket.emit("anonChat", anonChatIn.checked);
});

socket.on("anonChatChange", (anonChatVal) => {
  if (!Email) {
    if (anonChatVal) {
      console.log("Your Chat has been enabled");
      chat.disabled = false;
      document.getElementById("message-chat-icon").innerHTML = "message";
    } else {
      console.log("Your Chat has been disabled");
      try {
        chatclose.click();
        setTimeout(() => {
          chatclose.click();
        }, 1000);
      } catch {
        setTimeout(() => {
          chatclose.click();
        }, 2000);
      }
      chat.disabled = true;
      document.getElementById("message-chat-icon").innerHTML =
        "speaker_notes_off";
    }
  }
});

$("#anonPreIn").change(function () {
  let anonPreIn = document.getElementById("anonPreIn");
  socket.emit("anonPre", anonPreIn.checked);
});

socket.on("anonPreChange", (anonPreVal) => {
  if (!Email) {
    if (anonPreVal) {
      document.getElementById("present-btn").style.background =
        "rgb(183,243,151)";
      document.getElementById("present-btn").disabled = false;
    } else {
      document.getElementById("present-btn").style.background =
        "rgba(255, 255, 255, 0.089)";
      document.getElementById("present-btn").disabled = true;
    }
  }
});

$("#anonUserIn").change(function () {
  let anonUserIn = document.getElementById("anonUserIn");
  socket.emit("anonUser", anonUserIn.checked);
  if (isAdmin && anonUserIn.checked) {
    $("#anonPreIn").prop("checked", true);
    $("#anonChatIn").prop("checked", true);
    $("#anonVidIn").prop("checked", true);
    $("#anonMicIn").prop("checked", true);
    document.getElementById("anonPreIn").disabled = false;
    document.getElementById("anonChatIn").disabled = false;
    document.getElementById("anonVidIn").disabled = false;
    document.getElementById("anonMicIn").disabled = false;
  } else if (isAdmin && !anonUserIn.checked) {
    $("#anonPreIn").prop("checked", false);
    $("#anonChatIn").prop("checked", false);
    $("#anonVidIn").prop("checked", false);
    $("#anonMicIn").prop("checked", false);
    document.getElementById("anonPreIn").disabled = true;
    document.getElementById("anonChatIn").disabled = true;
    document.getElementById("anonVidIn").disabled = true;
    document.getElementById("anonMicIn").disabled = true;
  }
});

socket.on("anonUserChange", (anonUserVal) => {
  if (!Email) {
    if (anonUserVal) {
    } else {
      window.location.replace("/");
    }
  }
});

const myInterval = setInterval(() => {
  console.log(10);
  try {
    socket.emit("getSocketSetting", socket.id);
    stopInterval();
  } catch {}
}, 1000);

function stopInterval() {
  clearInterval(myInterval);
}

socket.on("socketSettings", (socketSettings) => {
  console.log(socketSettings);
  if (!Email) {
    if (socketSettings.anonUser) {
    } else {
      window.location.replace("/");
    }

    let mic = document.getElementById("mic-btn");
    if (socketSettings.anonMic) {
      mic.disabled = false;
    } else {
      try {
        let enabled = myVideoStream.getAudioTracks()[0].enabled;
        if (enabled) {
          myVideoStream.getAudioTracks()[0].enabled = false;
          setMute();
        }
      } catch {
        setMute();
      }
      mic.disabled = true;
    }

    let vid = document.getElementById("video-btn");
    if (socketSettings.anonVid) {
      vid.disabled = false;
    } else {
      try {
        let enabled = myVideoStream.getVideoTracks()[0].enabled;
        if (enabled) {
          myVideoStream.getVideoTracks()[0].enabled = false;
          setStop();
        }
      } catch {
        setStop();
      }
      vid.disabled = true;
    }

    if (socketSettings.anonChat) {
      console.log("Your Chat has been enabled");
      chat.disabled = false;
      document.getElementById("message-chat-icon").innerHTML = "message";
    } else {
      console.log("Your Chat has been disabled");
      try {
        chatclose.click();
        setTimeout(() => {
          chatclose.click();
        }, 1000);
      } catch {
        setTimeout(() => {
          chatclose.click();
        }, 2000);
      }
      chat.disabled = true;
      document.getElementById("message-chat-icon").innerHTML =
        "speaker_notes_off";
    }

    if (socketSettings.anonPre) {
      document.getElementById("present-btn").style.background =
        "rgb(183,243,151)";
      document.getElementById("present-btn").disabled = false;
    } else {
      document.getElementById("present-btn").style.background =
        "rgba(255, 255, 255, 0.089)";
      document.getElementById("present-btn").disabled = true;
    }
  }

  if (isAdmin || socketSettings.userPre) {
    document.getElementById("present-btn").style.background =
      "rgb(183,243,151)";
    document.getElementById("present-btn").disabled = false;
  } else {
    document.getElementById("present-btn").style.background =
      "rgba(255, 255, 255, 0.089)";
    document.getElementById("present-btn").disabled = true;
  }

  if (isAdmin || socketSettings.userChat) {
    chat.disabled = false;
    document.getElementById("message-chat-icon").innerHTML = "message";
  } else {
    console.log("Your Chat has been disabled");
    try {
      chatclose.click();
      setTimeout(() => {
        chatclose.click();
      }, 1000);
    } catch {
      setTimeout(() => {
        chatclose.click();
      }, 2000);
    }
    chat.disabled = true;
    document.getElementById("message-chat-icon").innerHTML =
      "speaker_notes_off";
  }

  let vid = document.getElementById("video-btn");
  if (isAdmin || socketSettings.userVid) {
    vid.disabled = false;
  } else {
    try {
      let enabled = myVideoStream.getVideoTracks()[0].enabled;
      if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setStop();
      }
    } catch {
      setStop();
    }
    vid.disabled = true;
  }

  let mic = document.getElementById("mic-btn");
  if (isAdmin || socketSettings.userMic) {
    mic.disabled = false;
  } else {
    try {
      let enabled = myVideoStream.getAudioTracks()[0].enabled;
      if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setMute();
      }
    } catch {
      setMute();
    }
    mic.disabled = true;
  }
});

document.getElementById("copy-link").onclick = function () {
  navigator.clipboard.writeText(window.location.href);
  document.getElementById("copy-icon").innerHTML = "done";
  setTimeout(() => {
    document.getElementById("copy-icon").innerHTML = "content_copy";
  }, 1000);
};

var dotsmenu = document.querySelector(".settings-options");
var dots = document.querySelector(".setting-btn");
dotsmenu.style.display = "none";
var settClose = document.getElementById("sett-close");
dots.onclick = function () {
  dotsmenu.style.display = "block";
};
settClose.onclick = function () {
  dotsmenu.style.display = "none";
};
