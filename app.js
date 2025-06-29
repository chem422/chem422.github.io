// === Firebase Init ===
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
let currentAccount = null;
let currentRoomCode = null;

// === UI + THEME ===
function applyTheme(mode) {
  document.body.className = mode;
  localStorage.setItem("theme", mode);
}
function toggleTheme() {
  const mode = document.body.className === "dark" ? "light" : "dark";
  applyTheme(mode);
}
function loadTheme() {
  applyTheme(localStorage.getItem("theme") || "dark");
}
function detectUIMode() {
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  const mode = localStorage.getItem("uiMode") || (isMobile ? "mobile" : "pc");
  document.body.classList.add("ui-" + mode);
  localStorage.setItem("uiMode", mode);
}

// === ACCOUNT ===
function generateCode(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function showSignUp() {
  showModal(`
    <h3>Sign Up</h3>
    <input id="su-user" placeholder="Username">
    <input id="su-pass" type="password" placeholder="Password">
    <button onclick="createAccount()">Create</button>
  `);
}
function createAccount() {
  const username = document.getElementById("su-user").value;
  const password = document.getElementById("su-pass").value;
  const code = generateCode();
  db.ref("users/" + code).set({ username, password, status: "public", friends: [] });
  currentAccount = { username, password, accountCode: code };
  alert("Account created! Your code is: " + code);
  closeModal();
  updateAccountMenu();
}
function showSignIn() {
  showModal(`
    <h3>Sign In</h3>
    <input id="si-code" placeholder="Account Code">
    <input id="si-pass" type="password" placeholder="Password">
    <button onclick="signIn()">Login</button>
  `);
}
function signIn() {
  const code = document.getElementById("si-code").value;
  const pass = document.getElementById("si-pass").value;
  db.ref("users/" + code).get().then(snap => {
    const acc = snap.val();
    if (!acc || acc.password !== pass) return alert("Login failed.");
    currentAccount = { username: acc.username, password: pass, accountCode: code };
    alert("Welcome " + acc.username);
    closeModal();
    updateAccountMenu();
  });
}
function signOut() {
  currentAccount = null;
  updateAccountMenu();
  alert("Signed out.");
}
function updateAccountMenu() {
  const menu = document.getElementById("account-dropdown");
  if (!currentAccount) {
    menu.innerHTML = `
      <button onclick="showSignUp()">Sign Up</button>
      <button onclick="showSignIn()">Sign In</button>
    `;
  } else {
    menu.innerHTML = `
      <button onclick="downloadAccountData()">Download Account</button>
      <button onclick="signOut()">Sign Out</button>
    `;
  }
}

// === DROPDOWNS ===
function toggleAccountMenu() {
  const el = document.getElementById("account-dropdown");
  el.style.display = el.style.display === "block" ? "none" : "block";
}
function toggleFriendsMenu() {
  const el = document.getElementById("friends-dropdown");
  if (!currentAccount) {
    el.innerHTML = `<p style="padding:10px;">You're not signed in.</p>`;
  } else {
    el.innerHTML = `
      <button onclick="addFriend()">Add Friend</button>
      <button onclick="viewFriends()">Friend List</button>
    `;
  }
  el.style.display = el.style.display === "block" ? "none" : "block";
}

// === CHAT ROOMS ===
function startRoomChat() {
  const code = generateCode(6);
  joinRoom(code);
}
function joinRoomPrompt() {
  showModal(`
    <h3>Join Room</h3>
    <input id="room-code" placeholder="Room Code">
    <button onclick="joinRoom(document.getElementById('room-code').value)">Join</button>
  `);
}
function joinRoom(code) {
  currentRoomCode = code;
  document.getElementById("main-ui").style.display = "none";
  document.getElementById("chat-container").style.display = "block";
  alert("Joined room: " + code);
}

// === SEND MESSAGE (placeholder for now) ===
function sendMessage() {
  const input = document.getElementById("chat-input");
  const msg = input.value.trim();
  if (!msg) return;
  processMessage(msg);
  const box = document.getElementById("chat-box");
  box.innerHTML += `<p><b>You:</b> ${msg}</p>`;
  input.value = "";
}

// === MODALS ===
function showModal(html) {
  const box = document.getElementById("modal-container");
  box.innerHTML = `<div class="modal">${html}<br><button onclick="closeModal()">Close</button></div>`;
}
function closeModal() {
  document.getElementById("modal-container").innerHTML = "";
}

// === EASTER EGGS ===
function processMessage(msg) {
  if (msg === "brodychem442/haha\\") document.body.classList.add("rainbow");
  if (msg === "brodychem442/stop\\") document.body.classList.remove("rainbow");
  if (msg === "rickroll(<io>)") triggerRickRoll();
  if (msg === "brodychem6(<pong>)") showModal(`<iframe src="pong-game.html" style="width:100%;height:60vh;border:none;"></iframe>`);
}
function triggerRickRoll() {
  const img = document.createElement("img");
  img.src = "rickroll.gif";
  img.style.position = "fixed";
  img.style.top = "50%";
  img.style.left = "-150px";
  img.style.width = "100px";
  img.style.zIndex = "1000";
  document.body.appendChild(img);
  let x = -150;
  const move = setInterval(() => {
    x += 5;
    img.style.left = x + "px";
    if (x > window.innerWidth + 150) {
      clearInterval(move);
      img.remove();
    }
  }, 30);
  new Audio("rickroll.mp3").play();
}

// === INIT ===
window.onload = () => {
  detectUIMode();
  loadTheme();
  updateAccountMenu();
  document.getElementById("chat-container").style.display = "none";
};
