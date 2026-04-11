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

/* SWITCH ROOM */
function switchRoom(r) {
  room = r;
  document.getElementById("messages").innerHTML = "";
  socket.emit("join", { username, room });
}

/* MESSAGE */
const input = document.getElementById("msgInput");

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    socket.emit("send-message", {
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

socket.on("user-list", (users) => {
  const list = document.getElementById("userList");
  list.innerHTML = "";
  users.forEach(u => {
    const d = document.createElement("div");
    d.textContent = u;
    list.appendChild(d);
  });
});

/* MESSAGE RENDER */
function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";
  div.innerHTML = `<b>${msg.user}</b><br>${msg.text}`;
  document.getElementById("messages").appendChild(div);
}

/* GIF FIX (WORKING) */
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
        text: "",
        type: "gif",
        url: g.images.fixed_width.url
      });

      socket.emit("send-message", {
        text: "[GIF]",
      });

      document.getElementById("gifPanel").classList.add("hidden");
    };

    box.appendChild(img);
  });
});

/* OWNER UNLOCK */
const keys = new Set();
const req = new Set(["k", "a", "o", "s"]);
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

/* OWNER ACTION */
function toggleOwnerPanel() {
  document.getElementById("ownerPanel").classList.toggle("hidden");
}

function sendOwnerMsg() {
  const text = prompt("Announcement:");
  if (!text) return;

  socket.emit("owner-message", text);
}
