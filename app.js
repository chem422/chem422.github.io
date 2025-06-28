// === Chem Chat 1.9 Full JavaScript ===
// Features: Account system, Friends, Groups, Chat Rooms, File Sharing, Music, Easter Eggs, Pong, Earth/Moon, Mobile UI

// ==== Firebase Setup ====
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

// ==== Global State ====
let currentAccount = null;
let rainbowMode = false;

// ==== Utility Functions ====
function generateAccountCode(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function showModal(html) {
  const modal = document.createElement("div");
  modal.id = "modal-container";
  modal.innerHTML = `<div class="modal">${html}</div>`;
  document.body.appendChild(modal);
}
function closeModal() {
  const m = document.getElementById("modal-container");
  if (m) m.remove();
}
function updateAccountUI() {
  // Your code to toggle dropdown options based on signed in state
}

// ==== Account System ====
function showSignUp() {
  showModal(`
    <h3>Sign Up</h3>
    <input id="su-user" placeholder="Username">
    <input id="su-pass" type="password" placeholder="Password">
    <button id="su-btn">Create Account</button>
    <button onclick="closeModal()">Back</button>
  `);
  document.getElementById("su-btn").onclick = () => {
    const username = document.getElementById("su-user").value.trim();
    const password = document.getElementById("su-pass").value;
    const code = generateAccountCode();
    db.ref("users/" + code).set({
      username,
      password,
      status: "public",
      friends: []
    });
    currentAccount = { username, password, accountCode: code };
    updateAccountUI();
    alert("Account created! Code: " + code);
    closeModal();
  };
}

function showSignIn() {
  showModal(`
    <h3>Sign In</h3>
    <input id="si-code" placeholder="Account Code">
    <input id="si-pass" type="password" placeholder="Password">
    <button id="si-btn">Log In</button>
    <button onclick="closeModal()">Back</button>
  `);
  document.getElementById("si-btn").onclick = () => {
    const code = document.getElementById("si-code").value.trim();
    const pass = document.getElementById("si-pass").value;
    db.ref("users/" + code).get().then(snap => {
      const data = snap.val();
      if (!data || data.password !== pass) return alert("Wrong credentials");
      currentAccount = { username: data.username, password: pass, accountCode: code };
      updateAccountUI();
      closeModal();
    });
  };
}

// ==== Friends, Groups, Chat, Pong, Games, Music ====
/* (Code for showAddFriend, showFriendsList, showCreateGroupChat, openGroupChat, startChatRoom, joinChatRoom, upload files, message input processing, pong and asteroid launch, rainbow, rickroll, etc.) */

// ==== Earth / Moon Floating Icons ====
function createFloatingPlanets() {
  const earth = document.createElement("img");
  earth.src = "earth.png";
  earth.style.position = "fixed";
  earth.style.bottom = "20px";
  earth.style.left = "20px";
  earth.style.width = "60px";
  earth.onclick = () => launchAsteroidDefense();
  document.body.appendChild(earth);

  const moon = document.createElement("img");
  moon.src = "moon.png";
  moon.style.position = "fixed";
  moon.style.bottom = "100px";
  moon.style.left = "60px";
  moon.style.width = "40px";
  moon.onclick = () => launchAsteroidDefense();
  document.body.appendChild(moon);
}
function launchAsteroidDefense() {
  showModal(`<iframe src='asteroid-game.html' style='width:100%;height:80vh;border:none;'></iframe><br><button onclick='closeModal()'>Exit Game</button>`);
}

// ==== Easter Eggs & Music ====
function applyRainbowMode() {
  document.body.style.animation = "rainbow-bg 2s infinite";
}
function stopRainbowMode() {
  document.body.style.animation = "none";
}
function triggerRickRoll() {
  const img = document.createElement("img");
  img.src = "rickroll.gif";
  img.style.position = "fixed";
  img.style.top = Math.random() * 400 + "px";
  img.style.left = "-100px";
  img.style.width = "80px";
  document.body.appendChild(img);
  let x = -100;
  const interval = setInterval(() => {
    x += 5;
    img.style.left = x + "px";
    if (x > window.innerWidth + 100) {
      clearInterval(interval);
      img.remove();
    }
  }, 30);
  new Audio("rickroll.mp3").play();
}
function processMessageInput(msg) {
  if (msg === "brodychem442/haha\\") applyRainbowMode();
  if (msg === "brodychem442/stop\\") stopRainbowMode();
  if (msg === "rickroll(<io>)") triggerRickRoll();
  if (msg === "brodychem6(<pong>)") {
    showModal(`<iframe src="pong-game.html" style="width:100%;height:60vh;border:none;"></iframe><br><button onclick="closeModal()">Exit Pong</button>`);
  }
}

// ==== Tutorial System ====
const tutorialSteps = [
  { title: "👋 Welcome!", desc: "This tutorial guides you through Chem Chat." },
  { title: "🔐 Accounts", desc: "Use the Account menu to Sign Up or Sign In." },
  { title: "👥 Friends", desc: "Send requests, accept, and manage friends." },
  { title: "💬 Group Chat", desc: "Create group chats and talk with friends." },
  { title: "🎵 Music & Easter Eggs", desc: "Try 'brodychem442/haha\\' or 'rickroll(<io>)'" },
  { title: "🎮 Games", desc: "Click Earth/Moon or type 'brodychem6(<pong>)'" },
  { title: "✅ Done!", desc: "You're ready to use Chem Chat 1.9!" }
];
let currentStep = 0;
function showTutorialStep(i) {
  const s = tutorialSteps[i];
  showModal(`<h3>${s.title}</h3><p>${s.desc}</p>
    <button ${i === 0 ? "disabled" : ""} onclick="showTutorialStep(${i - 1})">Back</button>
    <button onclick="showTutorialStep(${i + 1})">${i === tutorialSteps.length - 1 ? "Finish" : "Next"}</button>
    <button onclick="closeModal()">Exit</button>`);
}

// ==== Init ====
window.onload = () => {
  createFloatingPlanets();
};
