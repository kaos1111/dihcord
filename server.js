const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

// rooms: { roomName: [messages] }
const messages = {
  general: [],
  random: []
};

const users = {}; // socket.id -> username

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", ({ username, room }) => {
    users[socket.id] = username;
    socket.join(room);

    socket.room = room;

    // send history
    socket.emit("chat-history", messages[room]);

    // update user list
    updateUsers(room);

    // join message
    socket.to(room).emit("system-message", {
      text: `${username} joined #${room}`,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on("send-message", (msg) => {
    const room = socket.room;
    const message = {
      user: users[socket.id],
      text: msg,
      time: new Date().toLocaleTimeString()
    };

    messages[room].push(message);
    if (messages[room].length > 200) messages[room].shift();

    io.to(room).emit("receive-message", message);
  });

  socket.on("typing", () => {
    socket.to(socket.room).emit("typing", users[socket.id]);
  });

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

  function updateUsers(room) {
    const roomUsers = Object.values(users);
    io.to(room).emit("user-list", roomUsers);
  }
});

server.listen(PORT, () => {
  console.log("Server running on", PORT);
});
