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

const notificationAudio = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_c5db2ad1d4.mp3"); // softer ping
const paddleBuzz = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_b50d326a89.mp3");

function playNotificationSound() {
  if (notificationSoundEnabled) {
    notificationAudio.play().catch(() => {});
  }
}

// ===== Room Handling =====
function generateRoomCode() {
  return Math.random().toString(36).substr(2, 5).toUpperCase();
}

function getUserName() {
  const input = document.getElementById("usernameInput").value.trim();
  return input ? input : "User" + Math.floor(Math.random() * 1000);
}

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((el) => {
    el.classList.remove("visible");
    el.classList.add("hidden");
  });
  document.getElementById(screenId).classList.remove("hidden");
  document.getElementById(screenId).classList.add("visible");
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
  showScreen("chatArea");
  document.getElementById("currentRoomCode").innerText = code;
  document.getElementById("messages").innerHTML = "";

  const roomRef = db.ref("rooms/" + code);
  roomRef.on("child_added", (data) => {
    const msg = data.val();
    if (msg.text === "brodychem442/haha\\") startRainbowMode();
    if (msg.text === "brodychem442/stop\\") stopRainbowMode();
    if (msg.text === "brodychem6(<pong>)" && !hasStartedPong) {
      hasStartedPong = true;
      startPongGame();
    }

    if (msg.file) {
      addMessage(`${msg.name} uploaded file: <a href="${msg.file}" target="_blank">${msg.filename}</a>`);
    } else {
      addMessage(msg.name + ": " + msg.text, msg.text === "brodychem442/haha\\");
    }

    playNotificationSound();
  });

  db.ref("rooms/" + code).push({ name: "System", text: `${userName} joined the chat.` });
}

function leaveRoom() {
  db.ref("rooms/" + roomCode).push({ name: "System", text: `${userName} left the chat.` });
  roomCode = "";
  userName = "";
  hasStartedPong = false;
  stopRainbowMode();
  showScreen("mainMenu");
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;
  db.ref("rooms/" + roomCode).push({ name: userName, text });
  input.value = "";
}

function addMessage(message, isRainbow = false) {
  const messagesDiv = document.getElementById("messages");
  const msgEl = document.createElement("div");
  msgEl.innerHTML = message;
  if (isRainbow) {
    msgEl.style.background = "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)";
    msgEl.style.webkitBackgroundClip = "text";
    msgEl.style.webkitTextFillColor = "transparent";
    msgEl.style.fontWeight = "bold";
  }
  messagesDiv.appendChild(msgEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ===== Rainbow Background =====
function startRainbowMode() {
  if (rainbowInterval) return;
  let hue = 0;
  rainbowInterval = setInterval(() => {
    hue = (hue + 5) % 360;
    document.getElementById("chatArea").style.backgroundColor = `hsl(${hue}, 100%, 75%)`;
  }, 100);
}

function stopRainbowMode() {
  clearInterval(rainbowInterval);
  rainbowInterval = null;
  document.getElementById("chatArea").style.backgroundColor = "";
}

// ===== Settings =====
function toggleSettingsMenu() {
  const menu = document.getElementById("settingsMenu");
  menu.classList.toggle("hidden");
}

function toggleChatSettingsMenu() {
  const menu = document.getElementById("chatSettingsMenu");
  menu.classList.toggle("hidden");
}

document.getElementById("musicToggle").addEventListener("change", (e) => {
  if (e.target.checked) startBackgroundMusic();
  else stopBackgroundMusic();
});

document.getElementById("notifSoundToggle").addEventListener("change", (e) => {
  notificationSoundEnabled = e.target.checked;
  document.getElementById("notifSoundToggleChat").checked = e.target.checked;
});

document.getElementById("notifSoundToggleChat").addEventListener("change", (e) => {
  notificationSoundEnabled = e.target.checked;
  document.getElementById("notifSoundToggle").checked = e.target.checked;
});

// ===== Music =====
let bgMusic = null;
function startBackgroundMusic() {
  if (!bgMusic) {
    bgMusic = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_226f53b7be.mp3");
    bgMusic.loop = true;
  }
  bgMusic.play().catch(() => {});
}
function stopBackgroundMusic() {
  if (bgMusic) bgMusic.pause();
}

// ===== File Upload =====
function showFileUpload() {
  document.getElementById("fileUploadPopup").style.display = "block";
}
function hideFileUpload() {
  document.getElementById("fileUploadPopup").style.display = "none";
}
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file || file.type !== "text/plain") return alert("Only .txt files allowed");

  const reader = new FileReader();
  reader.onload = function () {
    const content = reader.result;
    const blob = new Blob([content], { type: "text/plain" });
    const fileURL = URL.createObjectURL(blob);
    db.ref("rooms/" + roomCode).push({ name: userName, file: fileURL, filename: file.name });
    hideFileUpload();
  };
  reader.readAsText(file);
}

// ===== Pong Game (simplified) =====
function startPongGame() {
  alert("Pong started! Multiplayer paddle sync and buzz sound coming soon.");
  // Use Firebase to sync paddle positions and implement game logic
  // Use paddleBuzz.play() when ball hits paddle
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("messageInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});
