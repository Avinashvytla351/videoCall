const users = [];

const addUser = ({ id, name, room, vidState, micState }) => {
  name = name.trim().toLowerCase();
  room = room.trim().toLowerCase();

  const existingUser = users.find(
    (user) => user.room === room && user.name === name
  );

  if (!name || !room) return { error: "Username and room are required." };
  if (existingUser) return { error: "Username already exists." };

  var user = { id, name, room, vidState, micState };

  users.push(user);

  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) return users.splice(index, 1)[0];
};

const getUser = (id) => users.find((user) => user.id === id);

const editUserMic = (id, micStatus) => {
  let findval = users.findIndex((user) => user.id === id);
  if (findval !== -1) {
    users[findval].micState = micStatus;
  }
};

const editUserVid = (id, vidStatus) => {
  let findval = users.findIndex((user) => user.id === id);
  if (findval !== -1) {
    users[findval].vidState = vidStatus;
  }
};

const getUsersInRoom = (room) => users.filter((user) => user.room === room);

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  editUserMic,
  editUserVid,
};
