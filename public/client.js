const socket = io();

let username = "";
let room = "general";
let isOwner = false;

/* =========================
   ENTER APP
========================= */
function enterApp() {
  username = document.getElementById("usernameInput").value;
  if (!username) return;

  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  socket.emit("join", { username, room });
}

/* =========================
   SWITCH ROOM
========================= */
function switchRoom(r) {
  room = r;
  document.getElementById("messages").innerHTML = "";
  socket.emit("join", { username, room });
}

/* =========================
   CHAT INPUT
========================= */
const input = document.getElementById("msgInput");

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    socket.emit("send-message", { text: input.value });
    input.value = "";
  }
});

/* =========================
   RECEIVE
========================= */
socket.on("receive-message", addMessage);

socket.on("chat-history", (msgs) => {
  const box = document.getElementById("messages");
  box.innerHTML = "";
  msgs.forEach(addMessage);
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

/* =========================
   MESSAGE RENDER
========================= */
function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";
  div.textContent = `${msg.user}: ${msg.text}`;
  document.getElementById("messages").appendChild(div);
}

/* =========================
   GIF (ONLY WORKS IN APP)
========================= */
const gifKey = "OU2xZQ6AXcETFTcyXK3Vd0pf5HB7wwFd";

document.getElementById("gifSearch").addEventListener("input", async (e) => {
  const q = e.target.value;
  if (!q) return;

  const res = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=${gifKey}&q=${q}&limit=8`
  );

  const data = await res.json();

  const box = document.getElementById("gifResults");
  box.innerHTML = "";

  data.data.forEach(g => {
    const img = document.createElement("img");
    img.src = g.images.fixed_width.url;

    img.onclick = () => {
      socket.emit("send-message", {
        text: g.images.fixed_width.url
      });

      document.getElementById("gifPanel").classList.add("hidden");
    };

    box.appendChild(img);
  });
});

/* =========================
   GIF PANEL TOGGLE (SAFE)
========================= */
function toggleGifPanel() {
  const appVisible = !document.getElementById("app").classList.contains("hidden");
  if (!appVisible) return;

  document.getElementById("gifPanel").classList.toggle("hidden");
}

/* =========================
   OWNER PANEL
========================= */
function toggleOwnerPanel() {
  document.getElementById("ownerPanel").classList.toggle("hidden");
}

function sendOwnerMsg() {
  const text = prompt("Announcement:");
  if (!text) return;

  socket.emit("owner-message", text);
}

/* =========================
   OWNER UNLOCK (K+A+O+S HOLD 3s)
========================= */
const required = new Set(["k", "a", "o", "s"]);
const pressed = new Set();

let timer = null;

document.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (!required.has(k)) return;

  pressed.add(k);

  if (pressed.size === 4 && !timer && !isOwner) {
    timer = setTimeout(() => {
      isOwner = true;
      socket.emit("owner-unlock");

      document.getElementById("ownerPanel").classList.remove("hidden");
    }, 3000);
  }
});

document.addEventListener("keyup", () => {
  pressed.clear();
  clearTimeout(timer);
  timer = null;
});
