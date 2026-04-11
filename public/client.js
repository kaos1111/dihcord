const socket = io();

let username = "";
let room = "general";

/* FORCE HIDE ON START */
window.addEventListener("load", () => {
  const panel = document.getElementById("ownerPanel");
  if (panel) panel.classList.add("hidden");
});

/* LOGIN */
function enterApp() {
  username = document.getElementById("usernameInput").value;
  if (!username) return;

  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  socket.emit("join", { username, room });
}

/* SWITCH ROOM */
function switchRoom(r) {
  room = r;
  document.getElementById("messages").innerHTML = "";
  socket.emit("join", { username, room });
}

/* CHAT */
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

/* RECEIVE */
socket.on("receive-message", addMessage);

socket.on("chat-history", (msgs) => {
  const box = document.getElementById("messages");
  box.innerHTML = "";
  msgs.forEach(addMessage);
});

socket.on("system-message", (m) => {
  const div = document.createElement("div");
  div.className = "system";
  div.textContent = m.text;
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

function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";
  div.innerHTML = `<b>${msg.user}</b><br>${msg.text || ""}`;
  document.getElementById("messages").appendChild(div);
}

/* GIF */
function toggleGifPanel() {
  document.getElementById("gifPanel").classList.toggle("hidden");
}

function closeGifPanel() {
  document.getElementById("gifPanel").classList.add("hidden");
}

/* OWNER PANEL */
function toggleOwnerPanel() {
  document.getElementById("ownerPanel").classList.toggle("hidden");
}

/* OWNER BUTTON */
function createOwnerButton() {
  if (document.getElementById("ownerToggleBtn")) return;

  const btn = document.createElement("button");
  btn.id = "ownerToggleBtn";
  btn.innerText = "👑 Owner";

  btn.style.position = "absolute";
  btn.style.bottom = "80px";
  btn.style.right = "20px";

  btn.onclick = toggleOwnerPanel;

  document.body.appendChild(btn);
}

/* SECRET KEYS */
const keys = new Set();
const required = new Set(["k", "a", "o", "s"]);

let timer = null;
let unlocked = false;

document.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (!required.has(k)) return;

  keys.add(k);

  if (keys.size === 4 && !timer && !unlocked) {
    timer = setTimeout(() => {
      unlocked = true;

      const panel = document.getElementById("ownerPanel");
      panel.classList.remove("hidden");

      createOwnerButton();

    }, 3000);
  }
});

document.addEventListener("keyup", (e) => {
  keys.delete(e.key.toLowerCase());
  clearTimeout(timer);
  timer = null;
});
