// Extended Owner Admin System with Mute फीature

const OWNER_PASSWORD = "403403";
let bannedIPs = [];
let mutedUsers = []; // {username, duration}

// Create Owner Button
const ownerBtn = document.createElement("button");
ownerBtn.innerText = "Owner";
ownerBtn.style.position = "fixed";
ownerBtn.style.bottom = "20px";
ownerBtn.style.right = "20px";
document.body.appendChild(ownerBtn);

ownerBtn.onclick = () => {
    const password = prompt("Enter Owner Password:");
    if (password === OWNER_PASSWORD) {
        openOwnerPanel();
    } else {
        alert("Wrong password");
    }
};

function openOwnerPanel() {
    const command = prompt("Enter command (kick, ban, mute, clear, announce, mutedlist):");
    handleCommand(command);
}

function handleCommand(command) {
    switch(command) {
        case "kick":
            const userToKick = prompt("Enter username to kick:");
            kickUser(userToKick);
            break;

        case "ban":
            const ip = prompt("Enter IP to ban:");
            banIP(ip);
            break;

        case "mute":
            const userToMute = prompt("Enter username to mute:");
            const time = prompt("Enter mute time (leave blank for permanent):");
            muteUser(userToMute, time);
            break;

        case "mutedlist":
            showMutedList();
            break;

        case "clear":
            clearChat();
            break;

        case "announce":
            const message = prompt("Enter announcement:");
            announce(message);
            break;

        default:
            alert("Unknown command");
    }
}

function kickUser(username) {
    console.log(`${username} has been kicked.`);
    alert(`${username} kicked (demo only)`);
}

function banIP(ip) {
    bannedIPs.push(ip);
    console.log(`IP ${ip} banned.`);
    alert(`IP ${ip} added to blacklist`);
}

function muteUser(username, time) {
    const duration = time && time.trim() !== "" ? time : "permanent";
    mutedUsers.push({ username, duration });
    alert(`${username} muted (${duration})`);
}

function showMutedList() {
    if (mutedUsers.length === 0) {
        alert("No muted users");
        return;
    }

    let list = "Muted Users:\n";
    mutedUsers.forEach((user, index) => {
        list += `${index + 1}. ${user.username} (${user.duration})\n`;
    });

    const action = prompt(list + "\nType number to unmute user:");
    const index = parseInt(action) - 1;

    if (!isNaN(index) && mutedUsers[index]) {
        unmuteUser(index);
    }
}

function unmuteUser(index) {
    const user = mutedUsers[index];
    mutedUsers.splice(index, 1);
    alert(`${user.username} has been unmuted`);
}

function clearChat() {
    const chat = document.getElementById("chat");
    if (chat) {
        chat.innerHTML = "";
    }
}

function announce(message) {
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    audio.play();

    const announcement = document.createElement("div");
    announcement.innerText = `[ANNOUNCEMENT]: ${message}`;
    announcement.style.background = "red";
    announcement.style.color = "white";
    announcement.style.padding = "10px";
    announcement.style.position = "fixed";
    announcement.style.top = "0";
    announcement.style.width = "100%";
    announcement.style.textAlign = "center";

    document.body.appendChild(announcement);
}
