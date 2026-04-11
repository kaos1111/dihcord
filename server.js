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
  users: {}, // socket.id -> {username, room, isOwner, slowMode}
};

const slowMode = {
  general: 0,
  announcements: 0
};

function push(room, msg) {
  if (!state.messages[room]) state.messages[room] = [];
  state.messages[room].push(msg);
  if (state.messages[room].length > 200) state.messages[room].shift();
}

function emitUsers(room) {
  const list = Object.values(state.users)
    .filter(u => u.room === room)
    .map(u => ({ username: u.username, isOwner: u.isOwner }));

  io.to(room).emit("user-list", list);
}

io.on("connection", (socket) => {
  console.log("connected", socket.id);

  socket.on("join", (username) => {
    state.users[socket.id] = {
      username,
      room: "general",
      isOwner: false,
      lastMsg: 0
    };

    socket.join("general");

    socket.emit("chat-history", state.messages.general);
    emitUsers("general");
  });

  socket.on("join-room", (room) => {
    const user = state.users[socket.id];
    if (!user) return;

    socket.leave(user.room);
    user.room = room;
    socket.join(room);

    socket.emit("chat-history", state.messages[room]);
    emitUsers(room);
  });

  socket.on("send-message", ({ room, text }) => {
    const user = state.users[socket.id];
    if (!user) return;

    const now = Date.now();
    if (now - user.lastMsg < slowMode[room]) return;

    user.lastMsg = now;

    const msg = {
      username: user.username,
      text,
      time: now
    };

    push(room, msg);
    io.to(room).emit("receive-message", msg);
  });

  // 👑 OWNER UNLOCK
  socket.on("owner-unlock", () => {
    const user = state.users[socket.id];
    if (!user) return;

    user.isOwner = true;
    socket.emit("owner-confirmed");
    emitUsers(user.room);
  });

  // 📢 OWNER ANNOUNCEMENT (SECURE)
  socket.on("owner-message", (text) => {
    const user = state.users[socket.id];
    if (!user?.isOwner) return;

    const msg = {
      username: "👑 OWNER",
      text,
      time: Date.now()
    };

    push("announcements", msg);
    io.to("announcements").emit("receive-message", msg);
  });

  // 🌐 BROADCAST ALL ROOMS
  socket.on("owner-broadcast", (text) => {
    const user = state.users[socket.id];
    if (!user?.isOwner) return;

    const msg = {
      username: "📢 BROADCAST",
      text,
      time: Date.now()
    };

    for (let r of ROOMS) {
      push(r, msg);
      io.to(r).emit("receive-message", msg);
    }
  });

  // 🧹 CLEAR ROOM
  socket.on("owner-clear", (room) => {
    const user = state.users[socket.id];
    if (!user?.isOwner) return;

    state.messages[room] = [];
    io.to(room).emit("chat-history", []);
  });

  // 👢 KICK USER
  socket.on("owner-kick", (targetName) => {
    const user = state.users[socket.id];
    if (!user?.isOwner) return;

    for (let id in state.users) {
      if (state.users[id].username === targetName) {
        io.to(id).emit("kicked");
        io.sockets.sockets.get(id)?.disconnect();
      }
    }
  });

  // 🐢 SLOW MODE
  socket.on("owner-slowmode", ({ room, ms }) => {
    const user = state.users[socket.id];
    if (!user?.isOwner) return;

    slowMode[room] = ms;
  });

  socket.on("disconnect", () => {
    const user = state.users[socket.id];
    if (!user) return;

    io.to(user.room).emit("receive-message", {
      username: "System",
      text: `${user.username} left`,
      time: Date.now()
    });

    delete state.users[socket.id];
    emitUsers(user.room);
  });
});

server.listen(3000, () => console.log("http://localhost:3000"));
