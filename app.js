// ==== FIREBASE CONFIGURATION ====
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
let isRickRollMode = false;

const bgMusic = new Audio("https://cdn.pixabay.com/audio/2023/03/30/audio_0b9d97be10.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.3;
bgMusic.play().catch(() => {});

const notificationAudio = new Audio("https://cdn.pixabay.com/download/audio/2022/02/23/audio_b38ec1d2d4.mp3");
const rickrollAudio = new Audio("https://archive.org/download/NeverGonnaGiveYouUpHQ/Never%20Gonna%20Give%20You%20Up%20-%20HQ.mp3");

// Utility to play notification sound softly
function playNotificationSound() {
  if (notificationSoundEnabled) notificationAudio.play().catch(() => {});
}

// Plays a 1 second snippet of Rickroll audio in Rickroll mode
function playRickrollSnippet() {
  if (!isRickRollMode) return;
  rickrollAudio.currentTime = Math.random() * (rickrollAudio.duration - 1);
  rickrollAudio.play().then(() => {
    setTimeout(() => rickrollAudio.pause(), 1000);
  }).catch(() => {});
}

// Generates a random 5-char uppercase room code
function generateRoomCode() {
  return Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Gets username input or fallback to random user
function getUserName() {
  const input = document.getElementById("usernameInput").value.trim();
  return input ? input : "User" + Math.floor(Math.random() * 1000);
}

// Show only one screen at a time
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(el => {
    el.classList.add("hidden");
    el.classList.remove("visible");
  });
  document.getElementById(id).classList.remove("hidden");
  document.getElementById(id).classList.add("visible");
}

// Start new room
function startRoom() {
  userName = getUserName();
  roomCode = generateRoomCode();
  enterChatRoom(roomCode);
}

// Join existing room
function joinRoom() {
  userName = getUserName();
  const input = document.getElementById("roomInput").value.trim().toUpperCase();
  if (!input) return alert("Enter a valid room code");
  roomCode = input;
  enterChatRoom(roomCode);
}

// Enter chat room and set up listeners
function enterChatRoom(code) {
  showScreen("chatArea");
  document.getElementById("currentRoomCode").innerText = code;
  document.getElementById("messages").innerHTML = "";

  const roomRef = db.ref("rooms/" + code);
  roomRef.off(); // Remove previous listeners
  roomRef.on("child_added", data => {
    const msg = data.val();
    addMessage(msg.name + ": " + msg.text);
    playNotificationSound();
    playRickrollSnippet();

    if (msg.text === "brodychem442/haha\\") startRainbowMode();
    if (msg.text === "brodychem442/stop\\") stopRainbowMode();
    if (msg.text === "rickroll(<io>)") startRickrollMode();
    if (msg.text === "brodychem6(<pong>)" && !hasStartedPong) {
      hasStartedPong = true;
      initPongGame();
    }
  });

  db.ref("rooms/" + code).push({ name: "System", text: `${userName} joined the chat.` });
}

// Leave chat room
function leaveRoom() {
  if (!roomCode) return;
  db.ref("rooms/" + roomCode).push({ name: "System", text: `${userName} left the chat.` });
  roomCode = "";
  userName = "";
  hasStartedPong = false;
  stopRainbowMode();
  stopRickrollMode();
  showScreen("mainMenu");
}

// Send chat message to Firebase
function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;
  db.ref("rooms/" + roomCode).push({ name: userName, text });
  input.value = "";
}

// Add message to chat area
function addMessage(message) {
  const messagesDiv = document.getElementById("messages");
  const msgEl = document.createElement("div");
  msgEl.textContent = message;
  if (isRickRollMode || rainbowInterval) {
    msgEl.classList.add("rainbow");
  }
  messagesDiv.appendChild(msgEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Start rainbow background mode
function startRainbowMode() {
  if (rainbowInterval) return;
  const chatArea = document.getElementById("chatArea");
  let hue = 0;
  rainbowInterval = setInterval(() => {
    hue = (hue + 5) % 360;
    chatArea.style.backgroundColor = `hsl(${hue}, 100%, 80%)`;
  }, 100);
}

// Stop rainbow mode
function stopRainbowMode() {
  clearInterval(rainbowInterval);
  rainbowInterval = null;
  document.getElementById("chatArea").style.backgroundColor = "";
}

// Start Rickroll mode with flying video
function startRickrollMode() {
  if (isRickRollMode) return;
  isRickRollMode = true;
  const fly = document.createElement("video");
  fly.src = "https://archive.org/download/NeverGonnaGiveYouUpHQ/Never%20Gonna%20Give%20You%20Up%20-%20HQ.mp4";
  fly.autoplay = true;
  fly.muted = true;
  fly.style.position = "absolute";
  fly.style.top = Math.random() * 300 + "px";
  fly.style.left = "-400px";
  fly.style.width = "200px";
  fly.style.transition = "left 10s linear";
  document.getElementById("rickrollFlyContainer").appendChild(fly);
  setTimeout(() => { fly.style.left = "120%"; }, 100);

  // Add "Not a Rick Roll" button
  if (!document.getElementById("notRickBtn")) {
    const notRickBtn = document.createElement("button");
    notRickBtn.id = "notRickBtn";
    notRickBtn.innerText = "Not a Rick Roll";
    notRickBtn.onclick = () => window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank");
    document.querySelector(".chat-header div").appendChild(notRickBtn);
  }
}

// Stop Rickroll mode
function stopRickrollMode() {
  isRickRollMode = false;
  document.getElementById("rickrollFlyContainer").innerHTML = "";
  const btn = document.getElementById("notRickBtn");
  if (btn) btn.remove();
}

// Toggle settings menus
function toggleSettingsMenu() {
  document.getElementById("settingsMenu").classList.toggle("hidden");
}

function toggleChatSettingsMenu() {
  document.getElementById("chatSettingsMenu").classList.toggle("hidden");
}

// Listen to notification sound toggles
document.getElementById("notifSoundToggle").addEventListener("change", e => {
  notificationSoundEnabled = e.target.checked;
});
document.getElementById("chatNotifToggle").addEventListener("change", e => {
  notificationSoundEnabled = e.target.checked;
});

// Send message on Enter key (without Shift)
document.getElementById("messageInput").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// File upload UI functions
function openFileUpload() {
  document.getElementById("fileUploadOverlay").classList.remove("hidden");
}
function closeFileUpload() {
  document.getElementById("fileUploadOverlay").classList.add("hidden");
}

// Upload txt file and send content to chat as a message with [File] prefix
function uploadSelectedFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file || file.type !== "text/plain") return alert("Only .txt files allowed.");

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    db.ref("rooms/" + roomCode).push({ name: userName, text: `[File] ${file.name}:\n` + content });
  };
  reader.readAsText(file);
  closeFileUpload();
}

// Earth and Moon minigame: double-click Earth, then click Moon to start asteroid defense game
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

document.addEventListener("DOMContentLoaded", () => {
  setupSpaceMiniGame();
});

// Simple placeholder for asteroid defense start
function startAsteroidDefenseGame() {
  alert("Asteroid Defense Game loading...");
  // Implement actual game in later versions
}

// Pong game implementation
function initPongGame() {
  const canvas = document.getElementById("pongCanvas");
  const ctx = canvas.getContext("2d");
  canvas.classList.remove("hidden");
  const buzz = new Audio("https://freesound.org/data/previews/26/26810_27367-lq.mp3");

  let p1 = 100, p2 = 100, ballX = 200, ballY = 150;
  let ballVX = 3, ballVY = 3;
  const paddleW = 10, paddleH = 60;

  function draw() {
    ctx.clearRect(0, 0, 400, 300);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 400, 300);

    ctx.fillStyle = "lime";
    ctx.fillRect(10, p1, paddleW, paddleH);
    ctx.fillStyle = "cyan";
    ctx.fillRect(380, p2, paddleW, paddleH);

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function update() {
    ballX += ballVX;
    ballY += ballVY;

    if (ballY < 0 || ballY > 300) ballVY *= -1;

    if (ballX < 20 && ballY > p1 && ballY < p1 + paddleH) {
      ballVX *= -1; buzz.play();
    }
    if (ballX > 370 && ballY > p2 && ballY < p2 + paddleH) {
      ballVX *= -1; buzz.play();
    }
    if (ballX < 0 || ballX > 400) {
      ballX = 200; ballY = 150;
    }
  }

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  canvas.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    p1 = e.clientY - rect.top - paddleH / 2;
  });

  gameLoop();
}

// Initialization
showScreen("mainMenu");
