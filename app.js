// ==== FIREBASE CONFIGURATION ====
// Replace these with your Firebase project credentials

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

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((el) => {
    el.classList.add("hidden");
    el.classList.remove("visible");
  });
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.remove("hidden");
    screen.classList.add("visible");
  }
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
    addMessage(msg.name + ": " + msg.text);
    playNotificationSound();

    // Rainbow mode triggers
    if (msg.text === "brodychem442/haha\\") startRainbowMode();
    if (msg.text === "brodychem442/stop\\") stopRainbowMode();

    // Pong game start trigger
    if (msg.text === "brodychem6(<pong>)" && !hasStartedPong) {
      hasStartedPong = true;
      startPongMiniGame();
    }
  });

  // Announce user joined
  const roomRefJoinMsg = db.ref("rooms/" + code);
  roomRefJoinMsg.push({ name: "System", text: `${userName} joined the chat.` });

  // Setup drag and drop file sharing listeners
  setupFileDragDrop();
}

function leaveRoom() {
  if (!roomCode) return;
  const roomRef = db.ref("rooms/" + roomCode);
  roomRef.push({ name: "System", text: `${userName} left the chat.` });

  roomCode = "";
  userName = "";
  hasStartedPong = false;
  document.getElementById("messages").innerHTML = "";
  stopRainbowMode();

  showScreen("mainMenu");
}

function sendMessage(text = null) {
  const input = document.getElementById("messageInput");
  let msgText = text !== null ? text : input.value.trim();
  if (!msgText) return;
  const roomRef = db.ref("rooms/" + roomCode);
  roomRef.push({ name: userName, text: msgText });
  if (text === null) input.value = "";
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

// Toggle settings menus
function toggleSettingsMenu() {
  const menu = document.getElementById("settingsMenu");
  menu.classList.toggle("hidden");
}

function toggleChatSettingsMenu() {
  const menu = document.getElementById("chatSettingsMenu");
  menu.classList.toggle("hidden");
}

// Music toggle
document.getElementById("musicToggle").addEventListener("change", (e) => {
  if (e.target.checked) {
    startBackgroundMusic();
  } else {
    stopBackgroundMusic();
  }
});

// Theme toggle
document.getElementById("themeToggle").addEventListener("change", (e) => {
  if (e.target.checked) {
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
  }
});

// Notification sound toggle
document.getElementById("notifSoundToggle").addEventListener("change", (e) => {
  notificationSoundEnabled = e.target.checked;
});

// Background music
let bgMusic = null;
function startBackgroundMusic() {
  if (!bgMusic) {
    bgMusic = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_226f53b7be.mp3?filename=space-music-11126.mp3");
    bgMusic.loop = true;
  }
  bgMusic.play().catch(() => {});
}

function stopBackgroundMusic() {
  if (bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }
}

// Send message on enter key press
document.getElementById("messageInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Setup Space Mini Game triggers
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

// Asteroid Defense Game code:
function startAsteroidDefenseGame() {
  document.body.innerHTML = "";
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 320;
  canvas.style.background = "#000";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let earthX = 200;
  let health = 3;
  let score = 0;
  let asteroids = [];
  let hearts = [];

  function drawHeart(x, y) {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Earth
    ctx.fillStyle = "#0f0";
    ctx.beginPath();
    ctx.ellipse(earthX + 40, canvas.height - 20, 40, 15, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Asteroids
    ctx.fillStyle = "#888";
    asteroids.forEach((a) => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, 10, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Hearts
    hearts.forEach((h) => drawHeart(h.x, h.y));

    // HUD
    ctx.fillStyle = "#fff";
    ctx.font = "18px Arial";
    ctx.fillText("Score: " + score, 10, 25);
    ctx.fillText("Health: " + "❤".repeat(health), canvas.width - 120, 25);
  }

  function update() {
    if (Math.random() < 0.02) {
      asteroids.push({ x: Math.random() * (canvas.width - 20) + 10, y: 0 });
    }
    if (Math.random() < 0.005 && health < 3) {
      hearts.push({ x: Math.random() * (canvas.width - 20) + 10, y: 0 });
    }

    asteroids.forEach((a, i) => {
      a.y += 3;
      if (a.y > canvas.height - 30 &&
        a.x > earthX &&
        a.x < earthX + 80) {
        health--;
        asteroids.splice(i, 1);
      } else if (a.y > canvas.height) {
        score++;
        asteroids.splice(i, 1);
      }
    });

    hearts.forEach((h, i) => {
      h.y += 2;
      if (h.y > canvas.height - 30 &&
        h.x > earthX &&
        h.x < earthX + 80) {
        if (health < 3) health++;
        hearts.splice(i, 1);
      } else if (h.y > canvas.height) {
        hearts.splice(i, 1);
      }
    });

    if (health <= 0) {
      alert("Game Over! Score: " + score);
      location.reload();
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "a" || e.key === "ArrowLeft") {
      earthX -= 20;
      if (earthX < 0) earthX = 0;
    }
    if (e.key === "d" || e.key === "ArrowRight") {
      earthX += 20;
      if (earthX > canvas.width - 80) earthX = canvas.width - 80;
    }
  });

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
}

// Setup drag-and-drop file sharing in chat
function setupFileDragDrop() {
  const chatArea = document.getElementById("chatArea");
  chatArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    chatArea.style.border = "2px dashed #4caf50";
  });
  chatArea.addEventListener("dragleave", (e) => {
    e.preventDefault();
    chatArea.style.border = "";
  });
  chatArea.addEventListener("drop", (e) => {
    e.preventDefault();
    chatArea.style.border = "";
    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    for (const file of files) {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = function(event) {
          const text = event.target.result;
          sendMessage(`[File: ${file.name}]\n` + text);
        };
        reader.readAsText(file);
      } else {
        alert("Only .txt files are supported!");
      }
    }
  });
}

// ==== PONG GAME ====
// Simple 2-player pong inside chat window in a popup div
// This is a very basic implementation — you can extend it as needed

let pongInterval = null;

function startPongMiniGame() {
  alert("Starting Pong! Controls: Player1 W/S, Player2 Up/Down Arrows");

  // Create pong container overlay
  const pongOverlay = document.createElement("div");
  pongOverlay.id = "pongOverlay";
  pongOverlay.style.position = "fixed";
  pongOverlay.style.top = "50%";
  pongOverlay.style.left = "50%";
  pongOverlay.style.transform = "translate(-50%, -50%)";
  pongOverlay.style.background = "#111";
  pongOverlay.style.border = "3px solid #0f0";
  pongOverlay.style.zIndex = "9999";
  pongOverlay.style.width = "600px";
  pongOverlay.style.height = "400px";
  pongOverlay.style.display = "flex";
  pongOverlay.style.flexDirection = "column";
  pongOverlay.style.alignItems = "center";
  pongOverlay.style.justifyContent = "center";
  pongOverlay.style.color = "#eee";
  pongOverlay.style.fontFamily = "monospace";

  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 400;
  pongOverlay.appendChild(canvas);

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close Pong";
  closeBtn.style.marginTop = "10px";
  closeBtn.style.padding = "5px 10px";
  closeBtn.style.cursor = "pointer";
  closeBtn.onclick = () => {
    clearInterval(pongInterval);
    pongOverlay.remove();
  };
  pongOverlay.appendChild(closeBtn);

  document.body.appendChild(pongOverlay);

  const ctx = canvas.getContext("2d");

  // Game variables
  let paddleHeight = 80;
  let paddleWidth = 12;
  let ballRadius = 10;
  let leftPaddleY = canvas.height / 2 - paddleHeight / 2;
  let rightPaddleY = canvas.height / 2 - paddleHeight / 2;
  let ballX = canvas.width / 2;
  let ballY = canvas.height / 2;
  let ballSpeedX = 5;
  let ballSpeedY = 3;
  let leftScore = 0;
  let rightScore = 0;
  const winningScore = 10;

  let upPressedP1 = false;
  let downPressedP1 = false;
  let upPressedP2 = false;
  let downPressedP2 = false;

  function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawNet() {
    ctx.fillStyle = "#ccc";
    for (let i = 10; i < canvas.height; i += 30) {
      ctx.fillRect(canvas.width / 2 - 1, i, 2, 15);
    }
  }

  function drawText(text, x, y, size = "20px") {
    ctx.fillStyle = "#eee";
    ctx.font = `${size} monospace`;
    ctx.fillText(text, x, y);
  }

  function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    // Ball should bounce naturally toward the player who scored last
    ballSpeedX = -ballSpeedX;
    ballSpeedY = (Math.random() * 6) - 3; // random Y speed between -3 and 3
  }

  function update() {
    // Move paddles
    if (upPressedP1) leftPaddleY -= 7;
    if (downPressedP1) leftPaddleY += 7;
    if (upPressedP2) rightPaddleY -= 7;
    if (downPressedP2) rightPaddleY += 7;

    // Constrain paddles
    leftPaddleY = Math.max(0, Math.min(canvas.height - paddleHeight, leftPaddleY));
    rightPaddleY = Math.max(0, Math.min(canvas.height - paddleHeight, rightPaddleY));

    // Move ball
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Bounce off top and bottom
    if (ballY < ballRadius || ballY > canvas.height - ballRadius) {
      ballSpeedY = -ballSpeedY;
    }

    // Left paddle collision
    if (ballX - ballRadius < paddleWidth &&
        ballY > leftPaddleY &&
        ballY < leftPaddleY + paddleHeight) {
      ballSpeedX = -ballSpeedX;
      // Bounce ball toward center (more natural)
      let relativeIntersectY = (leftPaddleY + paddleHeight / 2) - ballY;
      ballSpeedY = -relativeIntersectY * 0.3;
    }

    // Right paddle collision
    if (ballX + ballRadius > canvas.width - paddleWidth &&
        ballY > rightPaddleY &&
        ballY < rightPaddleY + paddleHeight) {
      ballSpeedX = -ballSpeedX;
      let relativeIntersectY = (rightPaddleY + paddleHeight / 2) - ballY;
      ballSpeedY = -relativeIntersectY * 0.3;
    }

    // Check score
    if (ballX < 0) {
      rightScore++;
      resetBall();
    } else if (ballX > canvas.width) {
      leftScore++;
      resetBall();
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawNet();

    // Draw paddles
    drawRect(0, leftPaddleY, paddleWidth, paddleHeight, "green");
    drawRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight, "blue");

    // Draw ball
    drawCircle(ballX, ballY, ballRadius, "white");

    // Draw scores
    drawText(leftScore, canvas.width / 4, 40, "30px");
    drawText(rightScore, canvas.width * 3 / 4, 40, "30px");
  }

  function checkWin() {
    if (leftScore >= winningScore) {
      alert("Green Player Wins!");
      clearInterval(pongInterval);
      document.getElementById("pongOverlay").remove();
      hasStartedPong = false;
    } else if (rightScore >= winningScore) {
      alert("Blue Player Wins!");
      clearInterval(pongInterval);
      document.getElementById("pongOverlay").remove();
      hasStartedPong = false;
    }
  }

  function gameLoop() {
    update();
    draw();
    checkWin();
  }

  // Keyboard controls
  window.addEventListener("keydown", (e) => {
    if (e.key === "w") upPressedP1 = true;
    if (e.key === "s") downPressedP1 = true;
    if (e.key === "ArrowUp") upPressedP2 = true;
    if (e.key === "ArrowDown") downPressedP2 = true;
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === "w") upPressedP1 = false;
    if (e.key === "s") downPressedP1 = false;
    if (e.key === "ArrowUp") upPressedP2 = false;
    if (e.key === "ArrowDown") downPressedP2 = false;
  });

  pongInterval = setInterval(gameLoop, 1000 / 60);
}

document.addEventListener("DOMContentLoaded", () => {
  setupSpaceMiniGame();
});
