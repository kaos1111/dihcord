const socket = io();

let username = "";
let room = "general";
let isOwner = false;

/* LOGIN */
function enterApp() {
  username = document.getElementById("usernameInput").value;
  if (!username) return;

  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  socket.emit("join", { username, room });
}

/* ROOM */
function switchRoom(r) {
  room = r;
  document.getElementById("messages").innerHTML = "";
  socket.emit("join", { username, room });
}

/* MESSAGE */
const input = document.getElementById("msgInput");

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    socket.emit("send-message", { text: input.value });
    input.value = "";
  }
});

/* RECEIVE */
socket.on("receive-message", (msg) => {
  const div = document.createElement("div");
  div.className = "message";
  div.textContent = `${msg.user}: ${msg.text}`;
  document.getElementById("messages").appendChild(div);
});

/* USERS */
socket.on("user-list", (users) => {
  const list = document.getElementById("userList");
  list.innerHTML = "";
  users.forEach(u => {
    const d = document.createElement("div");
    d.textContent = u;
    list.appendChild(d);
  });
});

/* GIF */
function toggleGifPanel() {
  document.getElementById("gifPanel").classList.toggle("hidden");
}

/* OWNER */
function toggleOwnerPanel() {
  document.getElementById("ownerPanel").classList.toggle("hidden");
}

function sendOwnerMsg() {
  const text = prompt("Announcement:");
  if (!text) return;
  socket.emit("owner-message", text);
}

/* OWNER UNLOCK */
const keys = new Set();
const req = new Set(["k","a","o","s"]);
let timer = null;

document.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (!req.has(k)) return;

  keys.add(k);

  if (keys.size === 4 && !timer && !isOwner) {
    timer = setTimeout(() => {
      isOwner = true;
      socket.emit("owner-unlock");
      document.getElementById("ownerPanel").classList.remove("hidden");
    }, 3000);
  }
});

document.addEventListener("keyup", () => {
  keys.clear();
  clearTimeout(timer);
  timer = null;
});
