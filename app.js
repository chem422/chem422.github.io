// Firebase setup using global variable (avoiding import issues)
var firebase = window.firebase; // Ensure Firebase is loaded from CDN
const auth = firebase.auth();
const db = firebase.database();

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

const bgMusic = document.getElementById("bg-music");
const notificationSound = document.getElementById("notification-sound");
const rickrollSound = document.getElementById("rickroll-sound");
let bgMusicEnabled = true;
let notifSoundEnabled = true;

function playNotificationSound() {
  if (notifSoundEnabled) notificationSound.play().catch(() => {});
}

function hideAllModals() {
  document.querySelectorAll(".modal").forEach(modal => modal.classList.add("hidden"));
  document.querySelectorAll(".dropdown-content").forEach(content => content.classList.remove("show"));
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("settings").addEventListener("click", () => {
    hideAllModals();
    document.getElementById("settings-modal").classList.remove("hidden");
  });

  document.querySelector("#settings-modal .back").addEventListener("click", () => {
    document.getElementById("settings-modal").classList.add("hidden");
  });

  document.getElementById("save-settings").addEventListener("click", () => {
    bgMusicEnabled = document.getElementById("bg-music-toggle").checked;
    notifSoundEnabled = document.getElementById("notif-sound-toggle").checked;
    bgMusic.muted = !bgMusicEnabled;
    notificationSound.muted = !notifSoundEnabled;
    if (auth.currentUser) {
      db.ref(`users/${auth.currentUser.uid}/settings`).set({
        bgMusic: bgMusicEnabled,
        notifSound: notifSoundEnabled
      });
    }
    document.getElementById("settings-modal").classList.add("hidden");
  });

  const intro = document.getElementById("intro");
  const main = document.getElementById("main");
  setTimeout(() => {
    intro.style.display = "none";
    main.classList.remove("hidden");
    hideAllModals(); // Ensure all modals are hidden on load
    if (bgMusicEnabled) bgMusic.play().catch(() => {});
  }, 5500);

  auth.onAuthStateChanged(user => {
    const statusText = document.getElementById("account-status-text");
    statusText.textContent = user ? `Signed in as ${user.email.split("@")[0]}` : "You are not signed in.";
    document.getElementById("temp-username").classList.toggle("hidden", !!user);
  });

  let currentUsers = new Set();
  db.ref(".info/connected").on("value", snap => {
    if (snap.val() && auth.currentUser) {
      const con = db.ref(`presence/${auth.currentUser.uid}`);
      con.onDisconnect().remove();
      con.set(true);
      db.ref("presence").on("value", snap => {
        currentUsers = new Set(Object.keys(snap.val() || {}));
      });
    }
  });

  function handleDrop(event) {
    event.preventDefault();
    const chatInputArea = document.getElementById("chat-input-area");
    chatInputArea.classList.remove("dragover");
    const file = event.dataTransfer.files[0];
    if (file && file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = e => {
        const roomId = document.getElementById("room-code-display").textContent;
        if (roomId) {
          const isGroup = !document.getElementById("group-chat-dropdown").classList.contains("hidden");
          const path = isGroup ? `groupChats/${roomId}/messages` : `rooms/${roomId}/messages`;
          db.ref(path).push({
            sender: auth.currentUser?.email.split("@")[0] || document.getElementById("temp-username").value || "Guest",
            text: `Uploaded .txt: ${e.target.result.substring(0, 500)}`,
            time: Date.now(),
            type: "file"
          }).catch(err => console.error("Upload failed:", err));
        }
      };
      reader.readAsText(file);
    }
  }

  document.getElementById("chat-input-area").addEventListener("dragover", e => {
    e.preventDefault();
    document.getElementById("chat-input-area").classList.add("dragover");
  });

  document.getElementById("chat-input-area").addEventListener("dragleave", () => {
    document.getElementById("chat-input-area").classList.remove("dragover");
  });

  document.getElementById("chat-send").addEventListener("click", () => {
    const input = document.getElementById("chat-input");
    const roomId = document.getElementById("room-code-display").textContent;
    if (roomId && input.value.trim()) {
      const isGroup = !document.getElementById("group-chat-dropdown").classList.contains("hidden");
      const path = isGroup ? `groupChats/${roomId}/messages` : `rooms/${roomId}/messages`;
      db.ref(path).push({
        sender: auth.currentUser?.email.split("@")[0] || document.getElementById("temp-username").value || "Guest",
        text: input.value,
        time: Date.now()
      });
      if (input.value === "rickroll(<io>)") {
        document.body.style.backgroundImage = "url('R.png')";
        document.getElementById("not-rickroll").classList.remove("hidden");
        document.getElementById("not-rickroll").addEventListener("click", () => {
          window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        });
        setInterval(() => {
          if (notifSoundEnabled) rickrollSound.play().catch(() => {});
        }, 10000);
      } else if (input.value === "brodychem6(<pong>)" && currentUsers.size >= 1) {
        hideAllModals();
        document.getElementById("pong-modal").classList.remove("hidden");
        startPongGame();
      }
      input.value = "";
    }
  });

  document.getElementById("account-dropdown").addEventListener("click", () => {
    hideAllModals();
    const content = document.getElementById("account-content");
    content.classList.toggle("show");
  });

  document.getElementById("friends-dropdown").addEventListener("click", () => {
    hideAllModals();
    const content = document.getElementById("friends-content");
    content.classList.toggle("show");
  });

  document.querySelectorAll(".modal .back").forEach(back => {
    back.addEventListener("click", () => {
      back.closest(".modal").classList.add("hidden");
    });
  });

  const pongCanvas = document.getElementById("pong-canvas");
  pongCanvas.width = 600;
  pongCanvas.height = 400;
  const ctx = pongCanvas.getContext("2d");
  let playerPaddle = { x: 10, y: pongCanvas.height / 2 - 30, score: 0 };
  let opponentPaddle = { x: pongCanvas.width - 20, y: pongCanvas.height / 2 - 30, score: 0 };
  let ball = { x: pongCanvas.width / 2, y: pongCanvas.height / 2, dx: 5, dy: 5 };
  let gameActive = false;

  function startPongGame() {
    const userCount = currentUsers.size;
    document.getElementById("opponent-name").textContent = "";
    if (userCount === 1) {
      document.getElementById("opponent-name").textContent = "AI";
    } else if (userCount === 2) {
      const users = Array.from(currentUsers);
      const opponentUid = users.filter(u => u !== auth.currentUser?.uid)[0];
      document.getElementById("opponent-name").textContent = opponentUid || "Opponent";
    } else if (userCount >= 4) {
      const pongInitiator = auth.currentUser?.uid;
      const otherUsers = Array.from(currentUsers).filter(u => u !== pongInitiator);
      const randomOpponent = otherUsers[Math.floor(Math.random() * otherUsers.length)];
      document.getElementById("opponent-name").textContent = randomOpponent || "Random Opponent";
    } else {
      document.getElementById("opponent-name").textContent = "Waiting for players...";
      return;
    }
    gameActive = true;
    resetBall();
    gameLoop();
  }

  function gameLoop() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, pongCanvas.width, pongCanvas.height);
    ctx.fillStyle = "#0ff";
    ctx.fillRect(playerPaddle.x, playerPaddle.y, 10, 60);
    if (currentUsers.size === 1) {
      opponentPaddle.y += (ball.y - (opponentPaddle.y + 30)) * 0.1; // AI movement
    }
    ctx.fillRect(opponentPaddle.x, opponentPaddle.y, 10, 60);
    ctx.fillRect(ball.x, ball.y, 10, 10);
    ctx.fillText(playerPaddle.score, pongCanvas.width / 4, 30);
    ctx.fillText(opponentPaddle.score, 3 * pongCanvas.width / 4, 30);
    ball.x += ball.dx;
    ball.y += ball.dy;
    if (ball.y <= 0 || ball.y >= pongCanvas.height - 10) ball.dy *= -1;
    if (ball.x <= playerPaddle.x + 10 && ball.y >= playerPaddle.y && ball.y <= playerPaddle.y + 60) ball.dx *= -1;
    if (ball.x >= opponentPaddle.x - 10 && ball.y >= opponentPaddle.y && ball.y <= opponentPaddle.y + 60) ball.dx *= -1;
    if (ball.x <= 0) { opponentPaddle.score++; resetBall(); }
    if (ball.x >= pongCanvas.width - 10) { playerPaddle.score++; resetBall(); }
    if (playerPaddle.score >= 10 || opponentPaddle.score >= 10) {
      alert(`Game Over! ${playerPaddle.score >= 10 ? "You" : "Opponent"} Win!`);
      document.getElementById("pong-modal").classList.add("hidden");
      gameActive = false;
      return;
    }
    document.addEventListener("keydown", e => {
      if (e.key === "w" && playerPaddle.y > 0) playerPaddle.y -= 5;
      if (e.key === "s" && playerPaddle.y < pongCanvas.height - 60) playerPaddle.y += 5;
    }, { once: true });
    requestAnimationFrame(gameLoop);
  }

  function resetBall() {
    ball.x = pongCanvas.width / 2;
    ball.y = pongCanvas.height / 2;
    ball.dx = 5 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = 5 * (Math.random() > 0.5 ? 1 : -1);
  }

  document.getElementById("confirm-difficulty").addEventListener("click", startPongGame);

  const tutorialSteps = [
    { text: "Welcome! Click Account to sign in or sign up.", element: "#account-dropdown", action: () => document.getElementById("account-content").classList.add("show") },
    { text: "Drag a .txt file here or type to chat.", element: "#chat-input-area", action: () => {} },
    { text: "Click Settings to adjust audio.", element: "#settings", action: () => document.getElementById("settings-modal").classList.remove("hidden") },
    { text: "You’re set! Explore Chem Chat 1.9!", element: null, action: () => document.getElementById("settings-modal").classList.add("hidden") }
  ];

  let currentStep = 0;
  document.getElementById("tutorial").addEventListener("click", () => {
    hideAllModals();
    document.getElementById("tutorial-modal").classList.remove("hidden");
    const overlay = document.createElement("div");
    overlay.className = "tutorial-overlay";
    document.body.appendChild(overlay);
    updateTutorialStep();
  });

  function updateTutorialStep() {
    const step = tutorialSteps[currentStep];
    document.getElementById("tutorial-text").textContent = step.text;
    document.getElementById("tutorial-prev").disabled = currentStep === 0;
    document.getElementById("tutorial-next").disabled = currentStep === tutorialSteps.length - 1;
    document.querySelectorAll(".tutorial-highlight").forEach(el => el.classList.remove("tutorial-highlight"));
    if (step.element) document.querySelector(step.element).classList.add("tutorial-highlight");
    if (step.action) step.action();
  }

  document.getElementById("tutorial-prev").addEventListener("click", () => { if (currentStep > 0) { currentStep--; updateTutorialStep(); } });
  document.getElementById("tutorial-next").addEventListener("click", () => { if (currentStep < tutorialSteps.length - 1) { currentStep++; updateTutorialStep(); } });
  document.getElementById("tutorial-exit").addEventListener("click", () => {
    document.getElementById("tutorial-modal").classList.add("hidden");
    document.querySelector(".tutorial-overlay").remove();
    currentStep = 0;
  });
});
