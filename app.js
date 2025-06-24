// ==== FIREBASE CONFIGURATION ====
// Replace these with your own Firebase project credentials
  const firebaseConfig = {
    apiKey: "AIzaSyC_BX4N_7gO3tGZvGh_4MkHOQ2Ay2mRsRc",
    authDomain: "chat-room-22335.firebaseapp.com",
    projectId: "chat-room-22335",
    storageBucket: "chat-room-22335.firebasestorage.app",
    messagingSenderId: "20974926341",
    appId: "1:20974926341:web:c413eb3122887d6803fa6c",
    measurementId: "G-WB5QY60EG6"
  };

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let roomCode = "";
let userName = "";
let rainbowInterval = null;
let notificationSoundEnabled = true;
let hasStartedPong = false;

// Notification sound audio
const notificationAudio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

function playNotificationSound() {
  if (notificationSoundEnabled) {
    notificationAudio.play().catch(() => {});
  }
}

function generateRoomCode() {
  return Math.random().toString(36).substr(2, 5).toUpperCase();
}

function getUserName() {
  const input = document.getElementById("usernameInput").value.trim();
  return input ? input : "User" + Math.floor(Math.random() * 1000);
}

function startRoom() {
  userName = getUserName();
  roomCode = generateRoomCode();
  enterChatRoom(roomCode);
}

function joinRoom() {
  userName = getUserName();
  const input = document.getElementById("roomInput").value.trim().toUpperCase();
  if (!input) return alert("Enter a valid room code");
  roomCode = input;
  enterChatRoom(roomCode);
}

function enterChatRoom(code) {
  document.getElementById("mainMenu").style.display = "none";
  document.getElementById("chatArea").style.display = "flex";
  document.getElementById("currentRoomCode").innerText = code;
  document.getElementById("messages").innerHTML = "";

  const roomRef = db.ref("rooms/" + code);
  
  roomRef.on("child_added", (data) => {
    const msg = data.val();
    addMessage(msg.name + ": " + msg.text);
    playNotificationSound();

    // Rainbow mode triggers
    if (msg.text === "brodychem442/haha\\") startRainbowMode();
    if (msg.text === "brodychem442/stop\\") stopRainbowMode();

    // Pong game start trigger (simplified for demo)
    if (msg.text === "brodychem6(<pong>)" && !hasStartedPong) {
      hasStartedPong = true;
      alert("Pong game started! (Feature coming soon!)");
      // Implement pong game start here
    }
  });

  // Announce user joined
  roomRef.push({ name: "System", text: `${userName} joined the chat.` });
}

function leaveRoom() {
  if (!roomCode) return;
  const roomRef = db.ref("rooms/" + roomCode);
  roomRef.push({ name: "System", text: `${userName} left the chat.` });

  roomCode = "";
  userName = "";
  hasStartedPong = false;
  document.getElementById("chatArea").style.display = "none";
  document.getElementById("mainMenu").style.display = "block";
  document.getElementById("messages").innerHTML = "";
  stopRainbowMode();
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;
  const roomRef = db.ref("rooms/" + roomCode);
  roomRef.push({ name: userName, text: text });
  input.value = "";
}

function addMessage(message) {
  const messagesDiv = document.getElementById("messages");
  const msgEl = document.createElement("div");
  msgEl.textContent = message;
  messagesDiv.appendChild(msgEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function startRainbowMode() {
  if (rainbowInterval) return;
  const chatArea = document.getElementById("chatArea");
  let hue = 0;
  rainbowInterval = setInterval(() => {
    hue = (hue + 5) % 360;
    chatArea.style.backgroundColor = `hsl(${hue}, 100%, 75%)`;
  }, 100);
}

function stopRainbowMode() {
  clearInterval(rainbowInterval);
  rainbowInterval = null;
  const chatArea = document.getElementById("chatArea");
  chatArea.style.backgroundColor = "";
}

// Settings menu toggles
function toggleSettingsMenu() {
  const menu = document.getElementById("settingsMenu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

function toggleChatSettingsMenu() {
  const menu = document.getElementById("chatSettingsMenu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

// Settings toggles event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Notification sound toggle
  const notifToggle = document.getElementById("notifSoundToggle");
  notifToggle.checked = notificationSoundEnabled;
  notifToggle.addEventListener("change", () => {
    notificationSoundEnabled = notifToggle.checked;
  });

  // Music toggle (not implemented here, placeholder)
  document.getElementById("musicToggle").addEventListener("change", (e) => {
    if (e.target.checked) {
      console.log("Music ON (not implemented)");
    } else {
      console.log("Music OFF (not implemented)");
    }
  });

  // Theme toggle
  const themeToggle = document.getElementById("themeToggle");
  themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  });

  // Enter key sends message
  document.getElementById("messageInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  setupSpaceMiniGame();
});

function setupSpaceMiniGame() {
  let clickCount = 0;
  const earth = document.getElementById("earth");
  const moon = document.getElementById("moon");
  if (!earth || !moon) return;

  earth.addEventListener("dblclick", () => {
    clickCount++;
    if (clickCount === 1) {
      moon.addEventListener("click", () => {
        startAsteroidDefenseGame();
      }, { once: true });
    }
  });
}

function startAsteroidDefenseGame() {
  // Clear main content and add canvas for asteroid defense game
  document.body.innerHTML = "";
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
  canvas.style.display = "block";
  canvas.style.margin = "20px auto";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let earthX = 160;
  let health = 3;
  let score = 0;
  let asteroids = [];
  let hearts = [];

  function drawHeart(x, y) {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Earth (green platform)
    ctx.fillStyle = "#0f0";
    ctx.fillRect(earthX, 280, 80, 10);

    // Draw asteroids
    ctx.fillStyle = "gray";
    asteroids.forEach((a) => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw hearts
    hearts.forEach((h) => drawHeart(h.x, h.y));

    // HUD: Score and Health
    ctx.fillStyle = "white";
    ctx.font = "14px sans-serif";
    ctx.fillText("Score: " + score, 10, 20);
    ctx.fillText("Health: " + "❤".repeat(health), 300, 20);
  }

  function update() {
    // Randomly add asteroid
    if (Math.random() < 0.02) {
      asteroids.push({ x: Math.random() * 390, y: 0 });
    }
    // Randomly add heart if health < 3
    if (Math.random() < 0.005 && health < 3) {
      hearts.push({ x: Math.random() * 390, y: 0 });
    }

    asteroids.forEach((a, i) => {
      a.y += 3;
      if (a.y > 280 && a.x > earthX && a.x < earthX + 80) {
        health--;
        asteroids.splice(i, 1);
      } else if (a.y > 300) {
        score++;
        asteroids.splice(i, 1);
      }
    });

    hearts.forEach((h, i) => {
      h.y += 2;
      if (h.y > 280 && h.x > earthX && h.x < earthX + 80) {
        if (health < 3) health++;
        hearts.splice(i, 1);
      } else if (h.y > 300) {
        hearts.splice(i, 1);
      }
    });

    if (health <= 0) {
      alert("Game Over! Your score: " + score);
      location.reload();
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "a" || e.key === "ArrowLeft") earthX -= 15;
    if (e.key === "d" || e.key === "ArrowRight") earthX += 15;
    if (earthX < 0) earthX = 0;
    if (earthX > 320) earthX = 320;
  });

  setInterval(() => {
    update();
    draw();
  }, 1000 / 60);
}
