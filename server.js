const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const ROOMS = ["general", "announcements"];

const state = {
  messages: {
    general: [],
    announcements: []
  },
  users: {}, // socket.id -> {username, room, isOwner}
};

function pushMessage(room, msg) {
  if (!state.messages[room]) state.messages[room] = [];
  state.messages[room].push(msg);
  if (state.messages[room].length > 200) {
    state.messages[room].shift();
  }
}

function emitUserList(room) {
  const users = Object.values(state.users)
    .filter(u => u.room === room)
    .map(u => ({ username: u.username, isOwner: u.isOwner }));
  io.to(room).emit("user-list", users);
}

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join", (username) => {
    state.users[socket.id] = {
      username,
      room: "general",
      isOwner: false
    };

    socket.join("general");

    socket.emit("chat-history", state.messages.general);
    emitUserList("general");

    io.to("general").emit("receive-message", {
      username: "System",
      text: `${username} joined #general`,
      time: Date.now()
    });
  });

  socket.on("send-message", ({ room, text }) => {
    const user = state.users[socket.id];
    if (!user) return;

    const msg = {
      username: user.username,
      text,
      time: Date.now()
    };

    pushMessage(room, msg);
    io.to(room).emit("receive-message", msg);
  });

  socket.on("join-room", (room) => {
    const user = state.users[socket.id];
    if (!user) return;

    socket.leave(user.room);
    user.room = room;
    socket.join(room);

    socket.emit("chat-history", state.messages[room]);
    emitUserList(room);
  });

  // OWNER UNLOCK (server-side confirmation)
  socket.on("owner-unlock", () => {
    const user = state.users[socket.id];
    if (!user) return;

    user.isOwner = true;
    socket.emit("owner-confirmed");
    emitUserList(user.room);
  });

  // OWNER ONLY ANNOUNCEMENT
  socket.on("owner-message", (text) => {
    const user = state.users[socket.id];
    if (!user || !user.isOwner) return;

    const msg = {
      username: "👑 OWNER",
      text,
      time: Date.now()
    };

    pushMessage("announcements", msg);
    io.to("announcements").emit("receive-message", msg);
  });

  socket.on("disconnect", () => {
    const user = state.users[socket.id];
    if (!user) return;

    const room = user.room;
    delete state.users[socket.id];

    io.to(room).emit("receive-message", {
      username: "System",
      text: `${user.username} left`,
      time: Date.now()
    });

    emitUserList(room);
  });
});

server.listen(3000, () => {
  console.log("Mini Discord running on http://localhost:3000");
});
