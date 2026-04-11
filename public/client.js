const socket = io();

let username = "";
let room = "general";

const GIPHY_API_KEY = "OU2xZQ6AXcETFTcyXK3Vd0pf5HB7wwFd";

/* LOGIN */
function enterApp() {
  username = document.getElementById("usernameInput").value;
  if (!username) return;

  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  socket.emit("join", { username, room });
}

/* SWITCH ROOM */
function switchRoom(newRoom) {
  room = newRoom;
  document.getElementById("messages").innerHTML = "";
  socket.emit("join", { username, room });
}

/* SEND MESSAGE */
const input = document.getElementById("msgInput");

input.addEventListener("keypress", (e) => {
  socket.emit("typing");

  if (e.key === "Enter") {
    socket.emit("send-message", {
      type: "text",
      text: input.value
    });

    input.value = "";
  }
});

/* GIF */
function toggleGifPanel() {
  document.getElementById("gifPanel").classList.toggle("hidden");
}

function closeGifPanel() {
  document.getElementById("gifPanel").classList.add("hidden");
}

const gifSearch = document.getElementById("gifSearch");
const gifResults = document.getElementById("gifResults");

gifSearch.addEventListener("input", async () => {
  const q = gifSearch.value.trim();
  if (!q) return;

  const res = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${q}&limit=10`
  );

  const data = await res.json();

  gifResults.innerHTML = "";

  data.data.forEach(gif => {
    const img = document.createElement("img");
    img.src = gif.images.fixed_width.url;

    img.onclick = () => {
      socket.emit("send-message", {
        type: "gif",
        url: gif.images.fixed_width.url
      });

      closeGifPanel();
    };

    gifResults.appendChild(img);
  });
});

/* RECEIVE */
socket.on("chat-history", (msgs) => {
  const messages = document.getElementById("messages");
  messages.innerHTML = "";
  msgs.forEach(addMessage);
});

socket.on("receive-message", addMessage);

socket.on("system-message", (msg) => {
  const div = document.createElement("div");
  div.className = "system";
  div.textContent = msg.text;
  document.getElementById("messages").appendChild(div);
});

socket.on("user-list", (users) => {
  const list = document.getElementById("userList");
  list.innerHTML = "";
  users.forEach(u => {
    const d = document.createElement("div");
    d.textContent = u;
    list.appendChild(d);
  });
});

socket.on("typing", (user) => {
  const t = document.getElementById("typing");
  t.textContent = `${user} is typing...`;
  setTimeout(() => t.textContent = "", 1000);
});

function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";

  if (msg.type === "gif") {
    div.innerHTML = `
      <b>${msg.user}</b><br>
      <img src="${msg.url}" style="max-width:200px;border-radius:12px;"><br>
      <small>${msg.time}</small>
    `;
  } else {
    div.innerHTML = `
      <b>${msg.user}</b><br>
      ${msg.text}<br>
      <small>${msg.time}</small>
    `;
  }

  document.getElementById("messages").appendChild(div);
}

/* =========================
   OWNER PANEL (K+A+O+S)
========================= */
const requiredKeys = new Set(["k", "a", "o", "s"]);
const pressedKeys = new Set();

let holdTimer = null;
let ownerUnlocked = false;

const ownerPanel = document.getElementById("ownerPanel");

function openOwnerPanel() {
  ownerPanel.classList.remove("hidden");
}

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  if (!requiredKeys.has(key)) return;

  pressedKeys.add(key);

  if (
    pressedKeys.size === requiredKeys.size &&
    !holdTimer &&
    !ownerUnlocked
  ) {
    holdTimer = setTimeout(() => {
      ownerUnlocked = true;
      openOwnerPanel();
    }, 3000);
  }
});

document.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  pressedKeys.delete(key);

  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
});
