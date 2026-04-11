const socket = io();

let username = "";
let currentRoom = "general";
let isOwner = false;

/* INIT SAFE */
document.addEventListener("DOMContentLoaded", () => {

  const loginScreen = document.getElementById("loginScreen");
  const app = document.getElementById("app");

  document.getElementById("enterBtn").onclick = () => {
    const input = document.getElementById("usernameInput");
    if (!input.value) return;

    username = input.value;
    socket.emit("join", username);

    loginScreen.style.display = "none";
    app.classList.remove("hidden");
  };

  /* SEND MESSAGE */
  document.getElementById("sendBtn").onclick = sendMessage;

  document.getElementById("msgInput").addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  function sendMessage() {
    const input = document.getElementById("msgInput");
    if (!input.value) return;

    socket.emit("send-message", {
      room: currentRoom,
      text: input.value
    });

    input.value = "";
  }

  /* ROOM SWITCH */
  document.querySelectorAll(".channel").forEach(el => {
    el.onclick = () => {
      currentRoom = el.dataset.room;
      socket.emit("join-room", currentRoom);
    };
  });

  /* RECEIVE MESSAGE */
  socket.on("receive-message", msg => {
    const div = document.createElement("div");
    div.textContent = `[${msg.username}] ${msg.text}`;
    document.getElementById("messages").appendChild(div);
  });

  socket.on("chat-history", msgs => {
    const box = document.getElementById("messages");
    box.innerHTML = "";
    msgs.forEach(m => {
      const div = document.createElement("div");
      div.textContent = `[${m.username}] ${m.text}`;
      box.appendChild(div);
    });
  });

  socket.on("user-list", users => {
    const list = document.getElementById("userList");
    list.innerHTML = "";
    users.forEach(u => {
      const div = document.createElement("div");
      div.textContent = u.isOwner ? "👑 " + u.username : u.username;
      list.appendChild(div);
    });
  });

  /* GIF SYSTEM */
  const gifBtn = document.getElementById("gifBtn");
  const gifPanel = document.getElementById("gifPanel");

  gifBtn.onclick = () => {
    gifPanel.classList.toggle("hidden");
  };

  const API_KEY = "YOUR_GIPHY_API_KEY";

  document.getElementById("gifSearch").addEventListener("input", async e => {
    const q = e.target.value;
    if (!q) return;

    const res = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${q}&limit=10`
    );

    const data = await res.json();
    const box = document.getElementById("gifResults");
    box.innerHTML = "";

    data.data.forEach(gif => {
      const img = document.createElement("img");
      img.src = gif.images.fixed_width.url;
      img.onclick = () => {
        socket.emit("send-message", {
          room: currentRoom,
          text: gif.images.fixed_width.url
        });
        gifPanel.classList.add("hidden");
      };
      box.appendChild(img);
    });
  });

  /* OWNER HOLD KEY COMBO (K + A + O + S) */
  const keys = new Set();
  let holdTimer = null;

  document.addEventListener("keydown", e => {
    keys.add(e.key.toLowerCase());

    if (["k","a","o","s"].every(k => keys.has(k))) {
      if (!holdTimer) {
        holdTimer = setTimeout(() => {
          socket.emit("owner-unlock");
        }, 3000);
      }
    }
  });

  document.addEventListener("keyup", e => {
    keys.delete(e.key.toLowerCase());
    clearTimeout(holdTimer);
    holdTimer = null;
  });

  socket.on("owner-confirmed", () => {
    isOwner = true;
    document.getElementById("ownerModal").classList.remove("hidden");
  });

  /* OWNER PANEL */
  document.getElementById("sendAnnouncement").onclick = () => {
    const text = document.getElementById("announcementText").value;
    socket.emit("owner-message", text);
  };

  document.getElementById("closeOwner").onclick = () => {
    document.getElementById("ownerModal").classList.add("hidden");
  };
});
