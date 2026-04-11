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

const users = {};

const owners = new Set();

io.on("connection", (socket) => {
  socket.on("join", ({ username, room }) => {
    socket.username = username;
    socket.room = room;

    socket.join(room);

    if (!users[room]) users[room] = {};
    users[room][socket.id] = username;

    socket.emit("chat-history", messages[room] || []);
    io.to(room).emit("user-list", Object.values(users[room]));
  });

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
    const room = socket.room;
    if (users[room]) {
      delete users[room][socket.id];
      io.to(room).emit("user-list", Object.values(users[room]));
    }
  });
});

server.listen(PORT, () => console.log("Running on", PORT));
