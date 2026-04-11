const socket = io();

let username = "";
let room = "general";

// LOGIN
function enterApp() {
  username = document.getElementById("usernameInput").value;
  if (!username) return;

  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  socket.emit("join", { username, room });
}

// SWITCH ROOM
function switchRoom(newRoom) {
  room = newRoom;
  document.getElementById("messages").innerHTML = "";
  socket.emit("join", { username, room });
}

// SEND MESSAGE
const input = document.getElementById("msgInput");

input.addEventListener("keypress", (e) => {
  socket.emit("typing");

  if (e.key === "Enter") {
    socket.emit("send-message", input.value);
    input.value = "";
  }
});

// RECEIVE HISTORY
socket.on("chat-history", (msgs) => {
  document.getElementById("messages").innerHTML = "";
  msgs.forEach(addMessage);
});

// RECEIVE MESSAGE
socket.on("receive-message", addMessage);

// SYSTEM MESSAGE
socket.on("system-message", (msg) => {
  const div = document.createElement("div");
  div.className = "system";
  div.textContent = msg.text;
  document.getElementById("messages").appendChild(div);
});

// USER LIST
socket.on("user-list", (users) => {
  const list = document.getElementById("userList");
  list.innerHTML = "";
  users.forEach(u => {
    const div = document.createElement("div");
    div.textContent = u;
    list.appendChild(div);
  });
});

// TYPING
socket.on("typing", (user) => {
  const typing = document.getElementById("typing");
  typing.textContent = `${user} is typing...`;

  setTimeout(() => typing.textContent = "", 1000);
});

// ADD MESSAGE
function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";
  div.innerHTML = `
    <b>${msg.user}</b><br>
    ${msg.text}<br>
    <small>${msg.time}</small>
  `;
  document.getElementById("messages").appendChild(div);

  document.getElementById("messages").scrollTop =
    document.getElementById("messages").scrollHeight;
}
