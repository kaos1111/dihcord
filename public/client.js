const socket = io();

let room = "general";
let owner = false;
let username = "";

document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("enter").onclick = () => {
    username = document.getElementById("name").value;
    socket.emit("join", username);

    document.getElementById("login").style.display = "none";
    document.getElementById("app").classList.remove("hidden");
  };

  document.getElementById("send").onclick = send;

  function send() {
    const msg = document.getElementById("msg").value;
    socket.emit("send-message", { room, text: msg });
    document.getElementById("msg").value = "";
  }

  document.querySelectorAll(".channel").forEach(c => {
    c.onclick = () => {
      room = c.dataset.room;
      socket.emit("join-room", room);
    };
  });

  socket.on("receive-message", msg => {
    const div = document.createElement("div");
    div.textContent = `${msg.username}: ${msg.text}`;
    document.getElementById("messages").appendChild(div);
  });

  socket.on("chat-history", msgs => {
    const box = document.getElementById("messages");
    box.innerHTML = "";
    msgs.forEach(m => {
      const d = document.createElement("div");
      d.textContent = `${m.username}: ${m.text}`;
      box.appendChild(d);
    });
  });

  socket.on("user-list", users => {
    const box = document.getElementById("users");
    box.innerHTML = "";
    users.forEach(u => {
      box.innerHTML += `<div>${u.isOwner ? "👑" : ""} ${u.username}</div>`;
    });
  });

  /* 👑 OWNER UNLOCK */
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
    clearTimeout(timer);
    timer = null;
  });

  socket.on("owner-confirmed", () => {
    owner = true;
    document.getElementById("ownerPanel").classList.remove("hidden");
  });

  /* OWNER ACTIONS */
  document.getElementById("sendAnnounce").onclick = () => {
    socket.emit("owner-message", document.getElementById("announce").value);
  };

  document.getElementById("sendBroadcast").onclick = () => {
    socket.emit("owner-broadcast", document.getElementById("broadcast").value);
  };

  document.getElementById("kickBtn").onclick = () => {
    socket.emit("owner-kick", document.getElementById("kickUser").value);
  };

  document.getElementById("slowBtn").onclick = () => {
    socket.emit("owner-slowmode", {
      room: document.getElementById("slowRoom").value,
      ms: Number(document.getElementById("slowMs").value)
    });
  };

  document.getElementById("clearBtn").onclick = () => {
    socket.emit("owner-clear", document.getElementById("clearRoom").value);
  };

  document.getElementById("closeOwner").onclick = () => {
    document.getElementById("ownerPanel").classList.add("hidden");
  };
});
