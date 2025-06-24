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
const name = "User" + Math.floor(Math.random() * 1000);
let rainbowInterval = null;
let usersInRoom = new Set();
let hasStartedPong = false;

function generateRoomCode() {
  return Math.random().toString(36).substr(2, 5).toUpperCase();
}

function startRoom() {
  roomCode = generateRoomCode();
  enterChatRoom(roomCode);
}

function joinRoom() {
  const input = document.getElementById("roomInput").value.trim().toUpperCase();
  if (!input) return alert("Enter a valid room code");
  roomCode = input;
  enterChatRoom(roomCode);
}

function enterChatRoom(code) {
  document.getElementById("mainMenu").style.display = "none";
  document.getElementById("chatArea").style.display = "flex";
  document.getElementById("currentRoomCode").innerText = code;

  const roomRef = db.ref("rooms/" + code);
  roomRef.on("child_added", (data) => {
    const msg = data.val();
    usersInRoom.add(msg.name);
    addMessage(msg.name + ": " + msg.text);

    if (msg.text === "brodychem442/haha\\") startRainbowMode();
    if (msg.text === "brodychem442/stop\\") stopRainbowMode();
    if (msg.text === "brodychem6(<pong>)" && !hasStartedPong) {
      hasStartedPong = true;
      setTimeout(() => startPongMiniGame(msg.name), 1000);
    }
  });
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;
  db.ref("rooms/" + roomCode).push({ name: name, text: text });
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
  document.getElementById("chatArea").style.backgroundColor = "";
}

document.addEventListener("DOMContentLoaded", () => {
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
      });
    }
  });
}

// 🕹️ Pong Game Function
function startPongMiniGame(starterName) {
  const canvas = document.getElementById("pongGame");
  const ctx = canvas.getContext("2d");
  canvas.style.display = "block";

  let paddle1Y = 100;
  let paddle2Y = 100;
  let ballX = 200;
  let ballY = 150;
  let ballDX = 3;
  let ballDY = 2;
  let score1 = 0;
  let score2 = 0;
  const paddleHeight = 50;
  const paddleWidth = 10;

  let player = usersInRoom.size > 1 && starterName !== name ? 2 : 1;

  let upPressed = false;
  let downPressed = false;

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === "w") upPressed = true;
    if (e.key === "ArrowDown" || e.key === "s") downPressed = true;
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowUp" || e.key === "w") upPressed = false;
    if (e.key === "ArrowDown" || e.key === "s") downPressed = false;
  });

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ballX, ballY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "lime";
    ctx.fillRect(10, paddle1Y, paddleWidth, paddleHeight);
    ctx.fillStyle = "blue";
    ctx.fillRect(canvas.width - 20, paddle2Y, paddleWidth, paddleHeight);

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`Score: ${score1} - ${score2}`, 150, 20);
    ctx.fillText(`You are Player ${player === 1 ? "Green (1)" : "Blue (2)"}`, 100, 290);
  }

  function update() {
    ballX += ballDX;
    ballY += ballDY;

    if (ballY <= 0 || ballY >= canvas.height) ballDY *= -1;

    if (player === 1) {
      if (upPressed) paddle1Y -= 5;
      if (downPressed) paddle1Y += 5;
    } else {
      if (upPressed) paddle2Y -= 5;
      if (downPressed) paddle2Y += 5;
    }

    paddle1Y = Math.max(0, Math.min(canvas.height - paddleHeight, paddle1Y));
    paddle2Y = Math.max(0, Math.min(canvas.height - paddleHeight, paddle2Y));

    if (ballX <= 20 && ballY >= paddle1Y && ballY <= paddle1Y + paddleHeight) ballDX *= -1;
    if (ballX >= canvas.width - 20 && ballY >= paddle2Y && ballY <= paddle2Y + paddleHeight) ballDX *= -1;

    if (ballX < 0) {
      score2++;
      resetBall();
    } else if (ballX > canvas.width) {
      score1++;
      resetBall();
    }

    if (usersInRoom.size === 1) {
      paddle2Y = ballY - paddleHeight / 2;
    }
  }

  function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballDX *= -1;
    ballDY = (Math.random() - 0.5) * 6;
  }

  setInterval(() => {
    update();
    draw();
  }, 1000 / 60);
}

// 🚀 Earth Defense Game
function startAsteroidDefenseGame() {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
  canvas.style.display = "block";
  canvas.style.margin = "20px auto";
  document.body.innerHTML = "";
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

    ctx.fillStyle = "#0f0";
    ctx.fillRect(earthX, 280, 80, 10);

    ctx.fillStyle = "gray";
    asteroids.forEach((a) => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    hearts.forEach((h) => drawHeart(h.x, h.y));

    ctx.fillStyle = "white";
    ctx.font = "14px sans-serif";
    ctx.fillText("Score: " + score, 10, 20);
    ctx.fillText("Health: " + "❤".repeat(health), 300, 20);
  }

  function update() {
    if (Math.random() < 0.02) {
      asteroids.push({ x: Math.random() * 390, y: 0 });
    }

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
      alert("Game Over! Score: " + score);
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
