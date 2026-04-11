// 🔥 CRASH LOGGING (VERY IMPORTANT FOR RAILWAY)
process.on("uncaughtException", err => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", err => {
  console.error("UNHANDLED REJECTION:", err);
});

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ✅ REQUIRED FOR STATIC FILES
app.use(express.static("public"));

// ✅ HEALTH CHECK (prevents Railway timeout)
app.get("/health", (req, res) => {
  res.send("OK");
});

const ROOMS = ["general", "announcements"];

const state = {
  messages: {
    general: [],
    announcements: []
  },
  users: {}
};

const slowMode = {
  general: 0,
  announcements: 0
};

function push(room, msg) {
  if (!state.messages[room]) state.messages[room] = [];
  state.messages[room].push(msg);
  if (state.messages[room].length > 200) {
    state.messages[room].shift();
  }
}

function emitUsers(room) {
  const users = Object.values(state.users)
    .filter(u => u.room === room)
    .map(u => ({
      username: u.username,
      isOwner: u.isOwner
    }));

  io.to(room).emit("user-list", users);
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

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

    // 🐢 SLOW MODE ENFORCED SERVER-SIDE
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

  // 👑 OWNER UNLOCK (SECURE)
  socket.on("owner-unlock", () => {
    const user = state.users[socket.id];
    if (!user) return;

    user.isOwner = true;
    socket.emit("owner-confirmed");
    emitUsers(user.room);
  });

  // 📢 OWNER ANNOUNCEMENTS ONLY
  socket.on("owner-message", (text) => {
    const user = state.users[socket.id];
    if (!user || !user.isOwner) return;

    const msg = {
      username: "👑 OWNER",
      text,
      time: Date.now()
    };

    push("announcements", msg);
    io.to("announcements").emit("receive-message", msg);
  });

  // 🌐 BROADCAST
  socket.on("owner-broadcast", (text) => {
    const user = state.users[socket.id];
    if (!user || !user.isOwner) return;

    const msg = {
      username: "📢 BROADCAST",
      text,
      time: Date.now()
    };

    ROOMS.forEach(room => {
      push(room, msg);
      io.to(room).emit("receive-message", msg);
    });
  });

  // 🧹 CLEAR ROOM
  socket.on("owner-clear", (room) => {
    const user = state.users[socket.id];
    if (!user || !user.isOwner) return;

    state.messages[room] = [];
    io.to(room).emit("chat-history", []);
  });

  // 👢 KICK USER
  socket.on("owner-kick", (targetName) => {
    const user = state.users[socket.id];
    if (!user || !user.isOwner) return;

    for (let id in state.users) {
      if (state.users[id].username === targetName) {
        io.to(id).emit("kicked");
        const sock = io.sockets.sockets.get(id);
        if (sock) sock.disconnect();
      }
    }
  });

  // 🐢 SET SLOW MODE
  socket.on("owner-slowmode", ({ room, ms }) => {
    const user = state.users[socket.id];
    if (!user || !user.isOwner) return;

    slowMode[room] = ms;
  });

  socket.on("disconnect", () => {
    const user = state.users[socket.id];
    if (!user) return;

    delete state.users[socket.id];

    io.to(user.room).emit("receive-message", {
      username: "System",
      text: `${user.username} left`,
      time: Date.now()
    });

    emitUsers(user.room);
  });
});

// 🚀 RAILWAY FIX (MOST IMPORTANT LINE)
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Server running on port", PORT);
});
