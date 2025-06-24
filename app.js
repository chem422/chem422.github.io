// ==== FIREBASE CONFIGURATION ====
// Replace the following config with your Firebase project config
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
    if (msg.text === "brodychem6(<pong>)") {
      startPongMiniGame(msg.name);
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
  const chatArea = document.getElementById("chatArea");
  chatArea.style.backgroundColor = "";
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("messageInput")
    .addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
});

// ======= PONG GAME =======
function startPongMiniGame(starterName) {
  const canvas = document.getElementById("pongGame");
  const ctx = canvas.getContext("2d");
  canvas.style.display = "block";

  const players = Array.from(usersInRoom);
  let opponentName = "AI Bot";
  let isAI = true;

  if (players.length > 1) {
    const otherPlayers = players.filter((p) => p !== starterName);
    if (otherPlayers.length > 0) {
      opponentName = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
      isAI = false;
    }
  }

  addMessage(
    `🏓 ${starterName} vs ${opponentName} — Pong begins! First to 10 wins.`
  );

  let paddle1Y = 100,
    paddle2Y = 100;
  let ballX = 200,
    ballY = 150;
  let ballVX = 2,
    ballVY = 2;
  let score1 = 0,
    score2 = 0;

  const hud = document.createElement("div");
  hud.id = "pongScoreHUD";
  hud.style.position = "absolute";
  hud.style.top = "10px";
  hud.style.left = "50%";
  hud.style.transform = "translateX(-50%)";
  hud.style.color = "white";
  hud.style.fontSize = "18px";
  hud.style.fontWeight = "bold";
  hud.style.background = "rgba(0,0,0,0.6)";
  hud.style.padding = "8px 20px";
  hud.style.borderRadius = "10px";
  hud.innerText = `${starterName}: 0 | ${opponentName}: 0`;
  document.body.appendChild(hud);

  const hitSound = new Audio(
    "https://freesound.org/data/previews/26/26575_39389-lq.mp3"
  );

  function draw() {
    ctx.clearRect(0, 0, 400, 300);
    ctx.fillStyle = "#fff";
    ctx.fillRect(10, paddle1Y, 10, 60);
    ctx.fillRect(380, paddle2Y, 10, 60);
    ctx.beginPath();
    ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
    ctx.fill();

    ballX += ballVX;
    ballY += ballVY;

    if (ballY <= 0 || ballY >= 300) ballVY *= -1;

    if (ballX <= 20 && ballY >= paddle1Y && ballY <= paddle1Y + 60) {
      ballVX *= -1;
      hitSound.play();
    }
    if (ballX >= 380 && ballY >= paddle2Y && ballY <= paddle2Y + 60) {
      ballVX *= -1;
      hitSound.play();
    }

    if (ballX < 0) {
      score2++;
      updateScore();
      resetBall();
    }
    if (ballX > 400) {
      score1++;
      updateScore();
      resetBall();
    }

    if (score1 >= 10 || score2 >= 10) {
      addMessage(
        `🏁 Game Over! Winner: ${score1 > score2 ? starterName : opponentName}`
      );
      clearInterval(gameLoop);
      canvas.style.display = "none";
      document.body.removeChild(hud);
    }

    if (isAI) {
      if (paddle2Y + 30 < ballY) paddle2Y += 2;
      else if (paddle2Y + 30 > ballY) paddle2Y -= 2;
    }
  }

  function resetBall() {
    ballX = 200;
    ballY = 150;
    ballVX = -ballVX;
    ballVY = Math.random() > 0.5 ? 2 : -2;
  }

  function updateScore() {
    hud.innerText = `${starterName}: ${score1} | ${opponentName}: ${score2}`;
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "w" || e.key === "ArrowUp") paddle1Y -= 10;
    if (e.key === "s" || e.key === "ArrowDown") paddle1Y += 10;
  });

  const gameLoop = setInterval(draw, 16);
}
