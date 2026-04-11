const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* =========================
   STORAGE
========================= */
const messages = {
  general: [],
  random: []
};

const users = {
  general: {},
  random: {}
};

/* =========================
   SOCKET.IO
========================= */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  /* JOIN */
  socket.on("join", ({ username, room }) => {
    socket.username = username;
    socket.room = room;

    if (!users[room]) users[room] = {};
    users[room][socket.id] = username;

    socket.join(room);

    socket.emit("chat-history", messages[room] || []);

    updateUsers(room);

    socket.to(room).emit("system-message", {
      text: `${username} joined #${room}`,
      time: new Date().toLocaleTimeString()
    });
  });

  /* MESSAGE */
  socket.on("send-message", (msg) => {
    const room = socket.room;
    if (!room) return;

    const message = {
      type: msg.type || "text",
      user: socket.username || "Anonymous",
      time: new Date().toLocaleTimeString(),
      text: msg.text || "",
      url: msg.url || null
    };

    if (!messages[room]) messages[room] = [];
    messages[room].push(message);

    if (messages[room].length > 200) {
      messages[room].shift();
    }

    io.to(room).emit("receive-message", message);
  });

  /* TYPING */
  socket.on("typing", () => {
    if (socket.room) {
      socket.to(socket.room).emit("typing", socket.username);
    }
  });

  /* OWNER AUTH (OPTIONAL SERVER SECURITY) */
  socket.on("owner-auth", ({ password }) => {
    if (password === "CHANGE_THIS_SECRET") {
      socket.emit("owner-granted");
    } else {
      socket.emit("owner-denied");
    }
  });

  /* DISCONNECT */
  socket.on("disconnect", () => {
    const room = socket.room;

    if (room && users[room]) {
      delete users[room][socket.id];

      updateUsers(room);

      socket.to(room).emit("system-message", {
        text: `${socket.username || "Someone"} left`,
        time: new Date().toLocaleTimeString()
      });
    }
  });

  function updateUsers(room) {
    const roomUsers = Object.values(users[room] || {});
    io.to(room).emit("user-list", roomUsers);
  }
});

/* =========================
   START SERVER
========================= */
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
