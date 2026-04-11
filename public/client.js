const socket = io();

// Ask username
let username = prompt("Enter your username:");
socket.emit("set-username", username);

const messagesDiv = document.getElementById("messages");
const usersList = document.getElementById("users");
const input = document.getElementById("messageInput");

// Send message
function sendMessage() {
  const msg = input.value;
  if (!msg.trim()) return;

  socket.emit("send-message", msg);
  input.value = "";
}

// Enter key
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Chat history
socket.on("chat-history", (messages) => {
  messages.forEach(addMessage);
});

// New message
socket.on("receive-message", (msg) => {
  addMessage(msg);
});

// User list
socket.on("user-list", (users) => {
  usersList.innerHTML = "";
  users.forEach((u) => {
    const li = document.createElement("li");
    li.textContent = u;
    usersList.appendChild(li);
  });
});

// Render message
function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";

  div.innerHTML = `
    <div><strong>${msg.user}</strong></div>
    <div>${msg.text}</div>
    <div class="meta">${msg.time}</div>
  `;

  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
