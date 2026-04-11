const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* =========================
   MEMORY STORAGE
========================= */
const messages = {
  general: [],
  random: []
};

const users = {}; // socket.id -> username

/* =========================
   SOCKET LOGIC
========================= */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  /* JOIN ROOM */
  socket.on("join", ({ username, room }) => {
    users[socket.id] = username;

    socket.join(room);
    socket.room = room;

    // send chat history for room
    socket.emit("chat-history", messages[room] || []);

    // update user list
    updateUsers(room);

    // system message
    socket.to(room).emit("system-message", {
      text: `${username} joined #${room}`,
      time: new Date().toLocaleTimeString()
    });
  });

  /* =========================
     SEND MESSAGE (OBJECT SUPPORT)
  ========================= */
  socket.on("send-message", (msg) => {
    const room = socket.room;

    // normalize message (IMPORTANT)
    const message = {
      type: msg.type || "text",
      user: users[socket.id] || "Anonymous",
      time: new Date().toLocaleTimeString(),

      // text message
      text: msg.text || "",

      // gif message
      url: msg.url || null
    };

    // store message
    if (!messages[room]) messages[room] = [];
    messages[room].push(message);

    // limit memory
    if (messages[room].length > 200) {
      messages[room].shift();
    }

    // broadcast
    io.to(room).emit("receive-message", message);
  });

  /* =========================
     TYPING
  ========================= */
  socket.on("typing", () => {
    socket.to(socket.room).emit("typing", users[socket.id]);
  });

  /* =========================
     DISCONNECT
  ========================= */
  socket.on("disconnect", () => {
    const room = socket.room;
    const username = users[socket.id];

    delete users[socket.id];

    if (room) {
      updateUsers(room);

      socket.to(room).emit("system-message", {
        text: `${username} left`,
        time: new Date().toLocaleTimeString()
      });
    }
  });

  /* =========================
     UPDATE USERS LIST
  ========================= */
  function updateUsers(room) {
    const roomUsers = Object.values(users);
    io.to(room).emit("user-list", roomUsers);
  }
});

/* =========================
   START SERVER
========================= */
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
