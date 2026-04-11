const socket = io();

let username = "";
let room = "general";

function enterApp() {
  username = document.getElementById("usernameInput").value;
  if (!username) return;

  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  socket.emit("join", { username, room });
}

function switchRoom(r) {
  room = r;
  document.getElementById("messages").innerHTML = "";
  socket.emit("join", { username, room });
}

/* =========================
   CHAT INPUT
========================= */
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

/* =========================
   RECEIVE
========================= */
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

/* =========================
   GIF PANEL
========================= */
function toggleGifPanel() {
  document.getElementById("gifPanel").classList.toggle("hidden");
}

function closeGifPanel() {
  document.getElementById("gifPanel").classList.add("hidden");
}

/* =========================
   OWNER PANEL
========================= */
function toggleOwnerPanel() {
  document.getElementById("ownerPanel").classList.toggle("hidden");
}

/* Create button ONLY after unlock */
function createOwnerButton() {
  if (document.getElementById("ownerToggleBtn")) return;

  const btn = document.createElement("button");
  btn.id = "ownerToggleBtn";
  btn.innerText = "👑 Owner";
  btn.style.position = "absolute";
  btn.style.bottom = "80px";
  btn.style.right = "20px";
  btn.style.padding = "10px";
  btn.style.borderRadius = "10px";
  btn.style.border = "none";
  btn.style.background = "#6c5ce7";
  btn.style.color = "white";
  btn.style.cursor = "pointer";

  btn.onclick = toggleOwnerPanel;

  document.body.appendChild(btn);
}

/* =========================
   SECRET UNLOCK (K + A + O + S)
========================= */
const requiredKeys = new Set(["k", "a", "o", "s"]);
const pressedKeys = new Set();

let holdTimer = null;
let unlocked = false;

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (!requiredKeys.has(key)) return;

  pressedKeys.add(key);

  if (
    pressedKeys.size === requiredKeys.size &&
    !holdTimer &&
    !unlocked
  ) {
    holdTimer = setTimeout(() => {
      unlocked = true;

      // OPEN PANEL
      document.getElementById("ownerPanel").classList.remove("hidden");

      // ONLY NOW create button
      createOwnerButton();

    }, 3000);
  }
});

document.addEventListener("keyup", (e) => {
  pressedKeys.delete(e.key.toLowerCase());

  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
});
