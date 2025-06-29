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

// === UI & Theme Setup ===
function applyTheme(mode) {
  document.body.className = mode;
  localStorage.setItem("theme", mode);
  if (currentAccount) db.ref("users/" + currentAccount.accountCode + "/theme").set(mode);
}
function toggleTheme() {
  applyTheme(document.body.className === "dark" ? "light" : "dark");
}
function loadTheme() {
  const theme = localStorage.getItem("theme") || "dark";
  applyTheme(theme);
}
function detectUIMode() {
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const saved = localStorage.getItem("uiMode");
  if (saved) document.body.classList.add("ui-" + saved);
  else {
    const choice = mobile ? "mobile" : "pc";
    localStorage.setItem("uiMode", choice);
    document.body.classList.add("ui-" + choice);
  }
}

// === Account System ===
function showSignUp() {
  showModal(`
    <h3>Sign Up</h3>
    <input id="su-user" placeholder="Username">
    <input id="su-pass" type="password" placeholder="Password">
    <button onclick="createAccount()">Create</button>
  `);
}
function generateCode(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function createAccount() {
  const user = document.getElementById("su-user").value.trim();
  const pass = document.getElementById("su-pass").value;
  const code = generateCode();
  db.ref("users/" + code).set({ username: user, password: pass, status: "public", friends: [] });
  currentAccount = { username: user, password: pass, accountCode: code };
  alert("Your account code is: " + code);
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
    if (!acc || acc.password !== pass) return alert("Invalid credentials.");
    currentAccount = { username: acc.username, password: pass, accountCode: code };
    alert("Welcome back, " + acc.username);
    closeModal();
    updateAccountMenu();
  });
}
function updateAccountMenu() {
  const menu = document.getElementById("account-dropdown");
  menu.innerHTML = "";
  if (!currentAccount) {
    menu.innerHTML = `
      <button onclick="showSignUp()">Sign Up</button>
      <button onclick="showSignIn()">Sign In</button>
    `;
  } else {
    menu.innerHTML = `
      <button onclick="downloadAccountData()">Download Account</button>
      <button onclick="resetPassword()">Reset Password</button>
      <button onclick="deleteAccount()">Delete Account</button>
      <button onclick="signOut()">Sign Out</button>
    `;
  }
}
function signOut() {
  currentAccount = null;
  updateAccountMenu();
  alert("Signed out.");
}

// === Dropdown Toggles ===
function toggleAccountMenu() {
  const menu = document.getElementById("account-dropdown");
  menu.style.display = (menu.style.display === "block") ? "none" : "block";
}
function toggleFriendsMenu() {
  const menu = document.getElementById("friends-dropdown");
  if (!currentAccount) {
    menu.innerHTML = `<p style="padding:10px;">You're not signed in.</p>`;
  } else {
    menu.innerHTML = `
      <button onclick="addFriend()">Add Friend</button>
      <button onclick="viewFriends()">Friend List</button>
      <button onclick="showGroupMenu()">Create Group Chat</button>
    `;
  }
  menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

// === Modal System ===
function showModal(html) {
  const box = document.getElementById("modal-container");
  box.innerHTML = `<div class="modal">${html}<br><button onclick="closeModal()">Close</button></div>`;
}
function closeModal() {
  const box = document.getElementById("modal-container");
  box.innerHTML = "";
}

// === Chat System ===
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
  alert("Joined room: " + code);
  // future: init chat sync here
}

// === Games ===
function startPongGame() {
  showModal(`<iframe src="pong-game.html" style="width:100%;height:400px;border:none;"></iframe>`);
}
function startAsteroidGame() {
  showModal(`<iframe src="asteroid-game.html" style="width:100%;height:500px;border:none;"></iframe>`);
}

// === Easter Eggs ===
function processMessage(msg) {
  if (msg === "brodychem442/haha\\") document.body.classList.add("rainbow");
  if (msg === "brodychem442/stop\\") document.body.classList.remove("rainbow");
  if (msg === "rickroll(<io>)") triggerRickRoll();
  if (msg === "brodychem6(<pong>)") startPongGame();
}
function triggerRickRoll() {
  const img = document.createElement("img");
  img.src = "rickroll.gif";
  img.style.position = "fixed";
  img.style.top = "50%";
  img.style.left = "-150px";
  img.style.width = "100px";
  document.body.appendChild(img);
  let x = -150;
  const move = setInterval(() => {
    x += 5;
    img.style.left = x + "px";
    if (x > window.innerWidth + 150) { clearInterval(move); img.remove(); }
  }, 30);
  new Audio("rickroll.mp3").play();
}

// === Init ===
window.onload = () => {
  detectUIMode();
  loadTheme();
  updateAccountMenu();
};
