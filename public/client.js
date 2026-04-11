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

/* SWITCH */
function switchRoom(r) {
  room = r;
  document.getElementById("messages").innerHTML = "";
  socket.emit("join", { username, room });
}

/* SEND */
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

  if (msg.type === "gif") {
    div.innerHTML = `${msg.user}: <img src="${msg.url}" width="150">`;
  } else {
    div.textContent = `${msg.user}: ${msg.text}`;
  }

  document.getElementById("messages").appendChild(div);
});

/* USERS */
socket.on("user-list", (users) => {
  const box = document.getElementById("users");
  box.innerHTML = users.map(u => `<div>${u}</div>`).join("");
});

/* GIF */
function toggleGif() {
  document.getElementById("gifPanel").classList.toggle("hidden");
}

document.getElementById("gifSearch").addEventListener("input", async (e) => {
  const q = e.target.value;
  if (!q) return;

  const res = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=OU2xZQ6AXcETFTcyXK3Vd0pf5HB7wwFd&q=${q}&limit=5`
  );

  const data = await res.json();

  const box = document.getElementById("gifResults");
  box.innerHTML = "";

  data.data.forEach(g => {
    const img = document.createElement("img");
    img.src = g.images.fixed_width.url;

    img.onclick = () => {
      socket.emit("send-message", {
        type: "gif",
        url: g.images.fixed_width.url
      });

      document.getElementById("gifPanel").classList.add("hidden");
    };

    box.appendChild(img);
  });
});

/* OWNER PANEL */
function sendOwner() {
  const text = prompt("announcement");
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
