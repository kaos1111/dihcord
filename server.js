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

// room-based users (FIXED)
const users = {
  general: {},
  random: {}
};

/* =========================
   SOCKET LOGIC
========================= */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  /* JOIN ROOM */
  socket.on("join", ({ username, room }) => {
    socket.username = username;
    socket.room = room;

    users[room][socket.id] = username;

    socket.join(room);

    socket.emit("chat-history", messages[room] || []);

    updateUsers(room);

    socket.to(room).emit("system-message", {
      text: `${username} joined #${room}`,
      time: new Date().toLocaleTimeString()
    });
  });

  /* SEND MESSAGE */
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
    socket.to(socket.room).emit("typing", socket.username);
  });

  /* OWNER AUTH (SECURE) */
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
    const username = socket.username;

    if (room && users[room]) {
      delete users[room][socket.id];
      updateUsers(room);

      socket.to(room).emit("system-message", {
        text: `${username || "Someone"} left`,
        time: new Date().toLocaleTimeString()
      });
    }
  });

  function updateUsers(room) {
    const roomUsers = Object.values(users[room] || {});
    io.to(room).emit("user-list", roomUsers);
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
