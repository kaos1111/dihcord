const socket = io();

let room = "general";
let owner = false;
let username = "";

document.addEventListener("DOMContentLoaded", () => {

  // SAFE ELEMENT GETTER
  const el = (id) => document.getElementById(id);

  const login = el("login");
  const app = el("app");

  const ownerPanel = el("ownerPanel");

  /* LOGIN */
  el("enter").onclick = () => {
    const nameInput = el("name");
    if (!nameInput || !nameInput.value.trim()) return;

    username = nameInput.value.trim();
    socket.emit("join", username);

    login.style.display = "none";
    app.classList.remove("hidden");
  };

  /* SEND MESSAGE */
  el("send").onclick = sendMessage;

  el("msg").addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  function sendMessage() {
    const input = el("msg");
    if (!input || !input.value.trim()) return;

    socket.emit("send-message", {
      room,
      text: input.value.trim()
    });

    input.value = "";
  }

  /* CHANNEL SWITCH */
  document.querySelectorAll(".channel").forEach(c => {
    c.onclick = () => {
      room = c.dataset.room;
      socket.emit("join-room", room);
    };
  });

  /* RECEIVE MESSAGE */
  socket.on("receive-message", msg => {
    const box = el("messages");
    if (!box) return;

    const div = document.createElement("div");
    div.textContent = `${msg.username}: ${msg.text}`;
    box.appendChild(div);

    box.scrollTop = box.scrollHeight;
  });

  /* CHAT HISTORY */
  socket.on("chat-history", msgs => {
    const box = el("messages");
    if (!box) return;

    box.innerHTML = "";

    msgs.forEach(m => {
      const div = document.createElement("div");
      div.textContent = `${m.username}: ${m.text}`;
      box.appendChild(div);
    });

    box.scrollTop = box.scrollHeight;
  });

  /* USER LIST */
  socket.on("user-list", users => {
    const box = el("users");
    if (!box) return;

    box.innerHTML = "";

    users.forEach(u => {
      const div = document.createElement("div");
      div.textContent = u.isOwner ? `👑 ${u.username}` : u.username;
      box.appendChild(div);
    });
  });

  /* 👑 OWNER UNLOCK SYSTEM */
  const keys = new Set();
  let timer = null;

  document.addEventListener("keydown", e => {
    keys.add(e.key.toLowerCase());

    if (["k","a","o","s"].every(k => keys.has(k))) {
      if (!timer) {
        timer = setTimeout(() => {
          socket.emit("owner-unlock");
        }, 3000);
      }
    }
  });

  document.addEventListener("keyup", e => {
    keys.delete(e.key.toLowerCase());

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  });

  /* OWNER CONFIRMED */
  socket.on("owner-confirmed", () => {
    owner = true;

    // ✅ FIX: USE active CLASS INSTEAD OF hidden
    ownerPanel.classList.add("active");
  });

  /* OWNER ACTIONS */

  el("sendAnnounce").onclick = () => {
    const text = el("announce").value.trim();
    if (!text) return;

    socket.emit("owner-message", text);
    el("announce").value = "";
  };

  el("sendBroadcast").onclick = () => {
    const text = el("broadcast").value.trim();
    if (!text) return;

    socket.emit("owner-broadcast", text);
    el("broadcast").value = "";
  };

  el("kickBtn").onclick = () => {
    const target = el("kickUser").value.trim();
    if (!target) return;

    socket.emit("owner-kick", target);
    el("kickUser").value = "";
  };

  el("slowBtn").onclick = () => {
    const r = el("slowRoom").value.trim();
    const ms = Number(el("slowMs").value);

    if (!r || isNaN(ms)) return;

    socket.emit("owner-slowmode", { room: r, ms });

    el("slowRoom").value = "";
    el("slowMs").value = "";
  };

  el("clearBtn").onclick = () => {
    const r = el("clearRoom").value.trim();
    if (!r) return;

    socket.emit("owner-clear", r);
    el("clearRoom").value = "";
  };

  /* CLOSE OWNER PANEL */
  el("closeOwner").onclick = () => {
    ownerPanel.classList.remove("active");
  };

  /* 👢 KICK HANDLER */
  socket.on("kicked", () => {
    alert("You were kicked by the owner.");
    location.reload();
  });

});
