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
  announcements: []
};

const users = {
  general: {},
  announcements: {}
};

/* =========================
   OWNER SYSTEM
========================= */
const owners = new Set(); // socket.id

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", ({ username, room }) => {
    socket.username = username;

    // ONLY allow announcements if owner
    if (room === "announcements" && !owners.has(socket.id)) {
      room = "general";
    }

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
      user: socket.username,
      text: msg.text || "",
      type: msg.type || "text",
      url: msg.url || null,
      time: new Date().toLocaleTimeString()
    };

    if (!messages[room]) messages[room] = [];
    messages[room].push(message);

    if (messages[room].length > 200) messages[room].shift();

    io.to(room).emit("receive-message", message);
  });

  /* OWNER UNLOCK */
  socket.on("owner-unlock", () => {
    owners.add(socket.id);
    socket.emit("owner-status", true);
    console.log(`${socket.username} is OWNER`);
  });

  /* OWNER ANNOUNCEMENT */
  socket.on("owner-message", (text) => {
    if (!owners.has(socket.id)) return;

    const message = {
      user: "👑 OWNER",
      text,
      type: "text",
      time: new Date().toLocaleTimeString()
    };

    messages.announcements.push(message);
    io.to("announcements").emit("receive-message", message);
  });

  /* DISCONNECT */
  socket.on("disconnect", () => {
    delete owners[socket.id];

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
    io.to(room).emit("user-list", Object.values(users[room] || {}));
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
