const socket = io();

let username = "";
let room = "general";

// 🔑 Giphy API Key (replace this)
const GIPHY_API_KEY = "OU2xZQ6AXcETFTcyKX3Vd0pf5HB7wwFd";

/* =========================
   LOGIN
========================= */
function enterApp() {
  username = document.getElementById("usernameInput").value;

  if (!username) return;

  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  socket.emit("join", { username, room });
}

/* =========================
   SWITCH ROOMS
========================= */
function switchRoom(newRoom) {
  room = newRoom;
  document.getElementById("messages").innerHTML = "";
  socket.emit("join", { username, room });
}

/* =========================
   INPUT + SEND
========================= */
const input = document.getElementById("msgInput");

input.addEventListener("keypress", (e) => {
  socket.emit("typing");

  if (e.key === "Enter") {
    const text = input.value;
    if (!text.trim()) return;

    // 🎬 GIF COMMAND
    if (text.startsWith("/gif ")) {
      const query = text.replace("/gif ", "");
      sendGif(query);
    } 
    else {
      socket.emit("send-message", {
        type: "text",
        text: text,
        user: username,
        time: new Date().toLocaleTimeString()
      });
    }

    input.value = "";
  }
});

/* =========================
   GIF FUNCTION (GIPHY)
========================= */
async function sendGif(query) {
  try {
    const res = await fetch(
      `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(query)}&api_key=${GIPHY_API_KEY}&limit=1`
    );

    const data = await res.json();

    if (data.data.length > 0) {
      const gifUrl = data.data[0].images.fixed_width.url;

      socket.emit("send-message", {
        type: "gif",
        url: gifUrl,
        user: username,
        time: new Date().toLocaleTimeString()
      });
    }
  } catch (err) {
    console.error("GIF error:", err);
  }
}

/* =========================
   RECEIVE HISTORY
========================= */
socket.on("chat-history", (msgs) => {
  document.getElementById("messages").innerHTML = "";
  msgs.forEach(addMessage);
});

/* =========================
   RECEIVE MESSAGE
========================= */
socket.on("receive-message", addMessage);

/* =========================
   SYSTEM MESSAGES
========================= */
socket.on("system-message", (msg) => {
  const div = document.createElement("div");
  div.className = "system";
  div.textContent = msg.text;

  document.getElementById("messages").appendChild(div);
});

/* =========================
   USERS LIST
========================= */
socket.on("user-list", (users) => {
  const list = document.getElementById("userList");
  list.innerHTML = "";

  users.forEach((u) => {
    const div = document.createElement("div");
    div.textContent = u;
    list.appendChild(div);
  });
});

/* =========================
   TYPING INDICATOR
========================= */
socket.on("typing", (user) => {
  const typing = document.getElementById("typing");
  typing.textContent = `${user} is typing...`;

  setTimeout(() => {
    typing.textContent = "";
  }, 1000);
});

/* =========================
   RENDER MESSAGE
========================= */
function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";

  // GIF message
  if (msg.type === "gif") {
    div.innerHTML = `
      <b>${msg.user}</b><br>
      <img src="${msg.url}" style="max-width:200px;border-radius:12px;"><br>
      <small>${msg.time}</small>
    `;
  }
  // TEXT message
  else {
    div.innerHTML = `
      <b>${msg.user}</b><br>
      ${msg.text}<br>
      <small>${msg.time}</small>
    `;
  }

  const messagesDiv = document.getElementById("messages");
  messagesDiv.appendChild(div);

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
