const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const messages = {
  general: [],
  announcements: []
};

const users = {
  general: {},
  announcements: {}
};

const owners = new Set();

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join", ({ username, room }) => {
    socket.username = username;

    if (room === "announcements" && !owners.has(socket.id)) {
      room = "general";
    }

    socket.room = room;

    if (!users[room]) users[room] = {};
    users[room][socket.id] = username;

    socket.join(room);

    socket.emit("chat-history", messages[room] || []);
    updateUsers(room);
  });

  socket.on("send-message", (msg) => {
    const room = socket.room;
    if (!room) return;

    const message = {
      user: socket.username,
      text: msg.text || "",
      time: new Date().toLocaleTimeString()
    };

    messages[room].push(message);
    io.to(room).emit("receive-message", message);
  });

  socket.on("owner-unlock", () => {
    owners.add(socket.id);
  });

  socket.on("owner-message", (text) => {
    if (!owners.has(socket.id)) return;

    const message = {
      user: "👑 OWNER",
      text,
      time: new Date().toLocaleTimeString()
    };

    messages.announcements.push(message);
    io.to("announcements").emit("receive-message", message);
  });

  socket.on("disconnect", () => {
    delete owners[socket.id];

    const room = socket.room;
    if (room && users[room]) {
      delete users[room][socket.id];
      updateUsers(room);
    }
  });

  function updateUsers(room) {
    io.to(room).emit("user-list", Object.values(users[room] || {}));
  }
});

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
