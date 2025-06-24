// ==== FIREBASE CONFIGURATION ====
// Replace with your own Firebase config
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
let bgMusic = null;
let pongInterval = null;
let pongBuzzSound = null;
let pongPlayers = 2; // Default 2-player mode (can be changed)

// Audio elements
const notificationAudio = new Audio("https://cdn.pixabay.com/download/audio/2022/02/23/audio_b38ec1d2d4.mp3");
notificationAudio.volume = 0.3; // softer volume
const rickrollAudio = new Audio("https://archive.org/download/NeverGonnaGiveYouUpHQ/Never%20Gonna%20Give%20You%20Up%20-%20HQ.mp3");
rickrollAudio.volume = 0.25;
rickrollAudio.loop = false;

const bgMusicSrc = "https://cdn.pixabay.com/download/audio/2021/10/19/audio_0d45d8796b.mp3"; // example background music
// Create bg music element
bgMusic = new Audio(bgMusicSrc);
bgMusic.loop = true;
bgMusic.volume = 0.15;

// Load pong buzz sound
pongBuzzSound = new Audio("https://freesound.org/data/previews/26/26810_27367-lq.mp3");
pongBuzzSound.volume = 0.5;

function playNotificationSound() {
  if (notificationSoundEnabled) {
    notificationAudio.currentTime = 0;
    notificationAudio.play().catch(() => {});
  }
}

function playRickrollSnippet() {
  if (!isRickRollMode) return;
  // Play a 1 second snippet from a random point in the song
  rickrollAudio.currentTime = Math.random() * (rickrollAudio.duration - 1);
  rickrollAudio.play().then(() => {
    setTimeout(() => rickrollAudio.pause(), 1000);
  }).catch(() => {});
}

// Generates a random 5-letter uppercase room code
function generateRoomCode() {
  return Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Returns user name from input or a default
function getUserName() {
  const input = document.getElementById("usernameInput").value.trim();
  return input ? input : "User" + Math.floor(Math.random() * 1000);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(el => {
    el.classList.add("hidden");
    el.classList.remove("visible");
  });
  document.getElementById(id).classList.remove("hidden");
  document.getElementById(id).classList.add("visible");
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
  setupChatListeners(code);
  startBackgroundMusic();
  setupPongCanvas();
}

function setupChatListeners(code) {
  const roomRef = db.ref("rooms/" + code);

  // Listen for new messages
  roomRef.on("child_added", data => {
    const msg = data.val();
    handleIncomingMessage(msg);
  });

  // Send system join message
  db.ref("rooms/" + code).push({ name: "System", text: `${userName} joined the chat.` });
}

function handleIncomingMessage(msg) {
  addMessage(msg.name + ": " + msg.text);
  playNotificationSound();
  playRickrollSnippet();

  // Handle Easter eggs and commands
  if (msg.text === "brodychem442/haha\\") startRainbowMode();
  else if (msg.text === "brodychem442/stop\\") stopRainbowMode();
  else if (msg.text === "rickroll(<io>)") startRickrollMode();
  else if (msg.text === "brodychem6(<pong>)" && !hasStartedPong) {
    hasStartedPong = true;
    initPongGame();
  }
}

function leaveRoom() {
  if (!roomCode) return;
  db.ref("rooms/" + roomCode).push({ name: "System", text: `${userName} left the chat.` });
  roomCode = "";
  userName = "";
  hasStartedPong = false;
  stopRainbowMode();
  stopRickrollMode();
  stopBackgroundMusic();
  showScreen("mainMenu");
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;
  db.ref("rooms/" + roomCode).push({ name: userName, text });
  input.value = "";
}

function addMessage(message) {
  const messagesDiv = document.getElementById("messages");
  const msgEl = document.createElement("div");

  // Check rainbow or Rickroll mode
  if (isRickRollMode || rainbowInterval) {
    msgEl.classList.add("rainbow-text");
  }
  msgEl.textContent = message;
  messagesDiv.appendChild(msgEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Rainbow mode changes chat background colors continuously
function startRainbowMode() {
  if (rainbowInterval) return;
  const chatArea = document.getElementById("chatArea");
  let hue = 0;
  rainbowInterval = setInterval(() => {
    hue = (hue + 5) % 360;
    chatArea.style.backgroundColor = `hsl(${hue}, 100%, 85%)`;
  }, 100);
}

function stopRainbowMode() {
  clearInterval(rainbowInterval);
  rainbowInterval = null;
  document.getElementById("chatArea").style.backgroundColor = "";
}

// Rickroll mode logic
function startRickrollMode() {
  if (isRickRollMode) return;
  isRickRollMode = true;

  // Add the flying Rickroll video
  createFlyingRickrollVideo();

  // Add the "Not a Rick Roll" button if not exists
  if (!document.getElementById("notRickrollBtn")) {
    const notRickBtn = document.createElement("button");
    notRickBtn.id = "notRickrollBtn";
    notRickBtn.innerText = "Not a Rick Roll";
    notRickBtn.style.marginLeft = "10px";
    notRickBtn.onclick = () => window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank");
    document.querySelector(".chat-header div").appendChild(notRickBtn);
  }
}

function createFlyingRickrollVideo() {
  const container = document.getElementById("rickrollFlyContainer");
  const fly = document.createElement("video");
  fly.src = "https://archive.org/download/NeverGonnaGiveYouUpHQ/Never%20Gonna%20Give%20You%20Up%20-%20HQ.mp4";
  fly.autoplay = true;
  fly.muted = true;
  fly.loop = true;
  fly.style.position = "fixed";
  fly.style.top = `${Math.random() * (window.innerHeight - 150)}px`;
  fly.style.left = "-400px";
  fly.style.width = "200px";
  fly.style.borderRadius = "12px";
  fly.style.boxShadow = "0 0 20px #ff0040";
  fly.style.transition = "left 12s linear";
  container.appendChild(fly);

  // Animate flying across the screen
  setTimeout(() => {
    fly.style.left = `${window.innerWidth + 400}px`;
  }, 100);

  // Remove the video after it flies offscreen
  setTimeout(() => {
    fly.remove();
    if (isRickRollMode) createFlyingRickrollVideo(); // Loop again randomly
  }, 13000 + Math.random() * 5000);
}

function stopRickrollMode() {
  isRickRollMode = false;
  const container = document.getElementById("rickrollFlyContainer");
  container.innerHTML = "";

  // Remove Not a Rick Roll button
  const notRickBtn = document.getElementById("notRickrollBtn");
  if (notRickBtn) notRickBtn.remove();
}

// Settings menu toggles
function toggleSettingsMenu() {
  document.getElementById("settingsMenu").classList.toggle("hidden");
}

function toggleChatSettingsMenu() {
  document.getElementById("chatSettingsMenu").classList.toggle("hidden");
}

// Notification sound toggles
document.getElementById("notifSoundToggle").addEventListener("change", e => {
  notificationSoundEnabled = e.target.checked;
});

document.getElementById("chatNotifToggle").addEventListener("change", e => {
  notificationSoundEnabled = e.target.checked;
});

// Send message on Enter key (no Shift)
document.getElementById("messageInput").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// File upload overlay handling
function openFileUpload() {
  document.getElementById("fileUploadOverlay").classList.remove("hidden");
}

function closeFileUpload() {
  document.getElementById("fileUploadOverlay").classList.add("hidden");
}

function uploadSelectedFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) return alert("No file selected.");
  if (file.type !== "text/plain") return alert("Only .txt files allowed.");

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    db.ref("rooms/" + roomCode).push({ name: userName, text: `[File] ${file.name}:\n` + content });
  };
  reader.readAsText(file);
  closeFileUpload();
}

// Drag & drop file support
const uploadBox = document.getElementById("fileUploadOverlay");
uploadBox.addEventListener("dragover", e => {
  e.preventDefault();
  uploadBox.style.backgroundColor = "rgba(0,0,0,0.95)";
});
uploadBox.addEventListener("dragleave", e => {
  e.preventDefault();
  uploadBox.style.backgroundColor = "rgba(0,0,0,0.85)";
});
uploadBox.addEventListener("drop", e => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    document.getElementById("fileInput").files = files;
    uploadSelectedFile();
  }
});

// Earth/Moon minigame setup
function setupSpaceMiniGame() {
  let moonClickListener = null;
  const earth = document.getElementById("earth");
  const moon = document.getElementById("moon");
  if (!earth || !moon) return;

  earth.addEventListener("dblclick", () => {
    if (moonClickListener) return; // already active
    moonClickListener = () => {
      startAsteroidDefenseGame();
      moon.removeEventListener("click", moonClickListener);
      moonClickListener = null;
    };
    moon.addEventListener("click", moonClickListener);
  });
}

// Asteroid defense game placeholder
function startAsteroidDefenseGame() {
  alert("Asteroid Defense Game Loading... (not yet implemented)");
  // TODO: Implement full asteroid defense game here
}

// Background music controls
function startBackgroundMusic() {
  if (!bgMusic) return;
  bgMusic.play().catch(() => {}); // Autoplay may require user interaction in some browsers
}

function stopBackgroundMusic() {
  if (!bgMusic) return;
  bgMusic.pause();
  bgMusic.currentTime = 0;
}

// PONG GAME IMPLEMENTATION
function setupPongCanvas() {
  const canvas = document.getElementById("pongCanvas");
  canvas.width = 400;
  canvas.height = 300;
  canvas.classList.add("hidden");
}

// Initialize Pong Game
function initPongGame() {
  const canvas = document.getElementById("pongCanvas");
  const ctx = canvas.getContext("2d");
  canvas.classList.remove("hidden");

  let p1 = 120, p2 = 120;
  let ballX = 200, ballY = 150;
  let ballVX = 3, ballVY = 3;
  const paddleW = 10, paddleH = 60;
  const speed = 5;

  // For touch controls
  let touchY1 = null;
  let touchY2 = null;

  // Reset Pong Interval if already running
  if (pongInterval) clearInterval(pongInterval);

  // Clear pong buzz sound timeout tracker
  let canPlayBuzz = true;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Paddles
    ctx.fillStyle = "lime";
    ctx.fillRect(10, p1, paddleW, paddleH);
    ctx.fillStyle = "cyan";
    ctx.fillRect(canvas.width - 20, p2, paddleW, paddleH);

    // Ball
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function update() {
    ballX += ballVX;
    ballY += ballVY;

    // Bounce off top and bottom
    if (ballY < 8 || ballY > canvas.height - 8) ballVY *= -1;

    // Ball hits left paddle
    if (ballX < 20 && ballY > p1 && ballY < p1 + paddleH) {
      ballVX *= -1;
      playBuzzSound();
    }
    // Ball hits right paddle
    if (ballX > canvas.width - 20 && ballY > p2 && ballY < p2 + paddleH) {
      ballVX *= -1;
      playBuzzSound();
    }

    // Ball out of bounds resets
    if (ballX < 0 || ballX > canvas.width) {
      ballX = canvas.width / 2;
      ballY = canvas.height / 2;
      ballVX = (Math.random() > 0.5 ? 1 : -1) * 3;
      ballVY = (Math.random() > 0.5 ? 1 : -1) * 3;
    }
  }

  function playBuzzSound() {
    if (canPlayBuzz) {
      pongBuzzSound.currentTime = 0;
      pongBuzzSound.play().catch(() => {});
      canPlayBuzz = false;
      setTimeout(() => {
        canPlayBuzz = true;
      }, 200);
    }
  }

  // Keyboard controls
  document.addEventListener("keydown", e => {
    switch (e.key) {
      case "w": p1 = Math.max(0, p1 - speed); break;
      case "s": p1 = Math.min(canvas.height - paddleH, p1 + speed); break;
      case "ArrowUp": p2 = Math.max(0, p2 - speed); break;
      case "ArrowDown": p2 = Math.min(canvas.height - paddleH, p2 + speed); break;
    }
  });

  // Touch controls for mobile
  canvas.addEventListener("touchstart", e => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (touch.clientX < window.innerWidth / 2) {
        touchY1 = touch.clientY;
      } else {
        touchY2 = touch.clientY;
      }
    }
  });

  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.clientX < window.innerWidth / 2) {
        const delta = touch.clientY - touchY1;
        p1 = Math.min(Math.max(0, p1 + delta), canvas.height - paddleH);
        touchY1 = touch.clientY;
      } else {
        const delta = touch.clientY - touchY2;
        p2 = Math.min(Math.max(0, p2 + delta), canvas.height - paddleH);
        touchY2 = touch.clientY;
      }
    }
  }, { passive: false });

  canvas.addEventListener("touchend", e => {
    if (e.touches.length === 0) {
      touchY1 = null;
      touchY2 = null;
    }
  });

  // Basic multiplayer sync placeholder (this can be expanded for real network sync)
  function syncPaddles() {
    if (!roomCode) return;
    db.ref(`rooms/${roomCode}/pong`).set({
      p1,
      p2,
      ballX,
      ballY,
      ballVX,
      ballVY,
    });
  }

  db.ref(`rooms/${roomCode}/pong`).on("value", snapshot => {
    if (!snapshot.exists()) return;
    const data = snapshot.val();

    // Avoid overriding local paddles for now to keep it local
    // You can implement real multiplayer paddle control here

    ballX = data.ballX;
    ballY = data.ballY;
    ballVX = data.ballVX;
    ballVY = data.ballVY;
  });

  pongInterval = setInterval(() => {
    update();
    draw();
    syncPaddles();
  }, 1000 / 60);
}

// UI initialization after DOM loaded
window.addEventListener("load", () => {
  showScreen("mainMenu");
  setupSpaceMiniGame();

  // Hook up buttons
  document.getElementById("startRoomBtn").onclick = startRoom;
  document.getElementById("joinRoomBtn").onclick = joinRoom;
  document.getElementById("sendMsgBtn").onclick = sendMessage;
  document.getElementById("leaveRoomBtn").onclick = leaveRoom;

  document.getElementById("openSettingsBtn").onclick = toggleSettingsMenu;
  document.getElementById("closeSettingsBtn").onclick = toggleSettingsMenu;
  document.getElementById("openChatSettingsBtn").onclick = toggleChatSettingsMenu;
  document.getElementById("closeChatSettingsBtn").onclick = toggleChatSettingsMenu;

  document.getElementById("fileUploadBtn").onclick = openFileUpload;
  document.getElementById("fileUploadCancelBtn").onclick = closeFileUpload;
  document.getElementById("fileUploadSubmitBtn").onclick = uploadSelectedFile;
});
