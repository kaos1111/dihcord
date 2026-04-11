const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

// In-memory storage
let messages = [];
let users = {}; // socket.id -> username

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Send chat history
  socket.emit("chat-history", messages);

  // Set username
  socket.on("set-username", (username) => {
    users[socket.id] = username;
    io.emit("user-list", Object.values(users));
  });

  // Send message
  socket.on("send-message", (msg) => {
    const message = {
      user: users[socket.id] || "Anonymous",
      text: msg,
      time: new Date().toLocaleTimeString()
    };

    messages.push(message);
    if (messages.length > 100) messages.shift();

    io.emit("receive-message", message);
  });

  // Disconnect
  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("user-list", Object.values(users));
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
