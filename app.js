// Firebase config
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

// Rocket Animation
const canvas = document.getElementById("space-bg");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let stars = Array.from({ length: 100 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  r: Math.random() * 1.5 + 0.5,
  a: Math.random() * Math.PI * 2,
}));

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }
}
function twinkleStars() {
  stars.forEach(s => {
    s.r += Math.sin(s.a += 0.05) * 0.05;
    if (s.r < 0.3) s.r = 0.3;
  });
  drawStars();
  requestAnimationFrame(twinkleStars);
}
twinkleStars();

// Rocket Entry
const rocket = document.getElementById("rocket");
const mainUI = document.getElementById("main-ui");
const fromLeft = Math.random() < 0.5;
rocket.style.left = fromLeft ? "-150px" : "calc(100vw + 150px)";
rocket.style.top = Math.random() * 50 + 25 + "%";
rocket.style.transition = "all 3s ease-out";
setTimeout(() => {
  rocket.style.left = "50vw";
  rocket.style.top = "50vh";
  rocket.style.transform = "translate(-50%, -50%) scale(3) rotate(1080deg)";
  rocket.style.opacity = 0;
}, 100);
setTimeout(() => {
  rocket.style.display = "none";
  mainUI.classList.remove("hidden");
}, 3500);

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Account Logic
let currentAccount = null;

function generateAccountCode(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function showModal(content) {
  const container = document.getElementById("modal-container");
  container.innerHTML = `<div class="modal">${content}</div>`;
}
function closeModal() {
  document.getElementById("modal-container").innerHTML = "";
}
function updateAccountUI() {
  const accountOptions = document.getElementById("account-options");
  const friendsOptions = document.getElementById("friends-options");
  if (!currentAccount) {
    accountOptions.innerHTML = `<p id="account-status-label">You are not signed in.</p>
      <button id="sign-up-btn">Sign Up</button>
      <button id="sign-in-btn">Sign In</button>`;
    friendsOptions.innerHTML = `<p>Please sign in to access Friends menu</p>`;
  } else {
    accountOptions.innerHTML = `<p>Welcome, ${currentAccount.username}</p>
      <button id="sign-out-btn">Sign Out</button>
      <button id="account-info-btn">Info</button>
      <button id="download-account-btn">Download Account</button>`;
    friendsOptions.innerHTML = `
      <button id="add-friend-btn">Add Friend</button>
      <button id="friend-list-btn">Friends List</button>
    `;
  }
}

// Sign Up
function showSignUp() {
  showModal(`
    <h3>Sign Up</h3>
    <input id="signup-username" placeholder="Username"><br>
    <input id="signup-password" type="password" placeholder="Password"><br>
    <button id="signup-confirm">Sign Up</button>
    <button onclick="closeModal()">Back</button>
  `);
  document.getElementById("signup-confirm").onclick = () => {
    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value.trim();
    if (!username || !password) return alert("Enter username and password.");
    const accountCode = generateAccountCode();
    db.ref("users/" + accountCode).set({ username, password, friends: [], status: "public" });
    currentAccount = { username, password, accountCode };
    const data = `Username: ${username}\nPassword: ${password}\nAccount Code: ${accountCode}`;
    navigator.clipboard.writeText(data);
    const blob = new Blob([data], { type: 'text/plain' });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "account_data.txt";
    a.click();
    closeModal();
    updateAccountUI();
  };
}

// Sign In
function showSignIn() {
  showModal(`
    <h3>Sign In</h3>
    <input id="signin-code" placeholder="Account Code"><br>
    <input id="signin-password" type="password" placeholder="Password"><br>
    <button id="signin-confirm">Sign In</button>
    <button onclick="closeModal()">Back</button>
  `);
  document.getElementById("signin-confirm").onclick = () => {
    const code = document.getElementById("signin-code").value.trim();
    const pass = document.getElementById("signin-password").value.trim();
    if (!code || !pass) return alert("Enter all fields.");
    db.ref("users/" + code).get().then(snap => {
      if (!snap.exists()) return alert("Account not found.");
      const data = snap.val();
      if (data.password !== pass) return alert("Incorrect password.");
      currentAccount = { username: data.username, password: pass, accountCode: code };
      closeModal();
      updateAccountUI();
    });
  };
}

// Add Friend
function showAddFriend() {
  showModal(`
    <h3>Add Friend</h3>
    <input id="friend-username" placeholder="Friend's Username"><br>
    <input id="friend-code" placeholder="Friend's 10-char Code"><br>
    <button id="send-friend-request">Send Friend Request</button>
    <button onclick="closeModal()">Back</button>
  `);
  document.getElementById("send-friend-request").onclick = () => {
    const fName = document.getElementById("friend-username").value.trim();
    const fCode = document.getElementById("friend-code").value.trim();
    if (!fName || !fCode || !currentAccount) return;
    db.ref("users/" + fCode).get().then(snap => {
      if (!snap.exists()) return alert("That account doesn't exist.");
      const target = snap.val();
      if (target.username !== fName) return alert("Username and code do not match.");
      db.ref(`friendRequests/${fCode}/${currentAccount.accountCode}`).set({
        senderName: currentAccount.username,
        timestamp: Date.now()
      });
      alert("Friend request sent!");
      closeModal();
    });
  };
}

// Events
window.addEventListener("click", e => {
  if (e.target.id === "sign-up-btn") showSignUp();
  if (e.target.id === "sign-in-btn") showSignIn();
  if (e.target.id === "sign-out-btn") {
    currentAccount = null;
    updateAccountUI();
  }
  if (e.target.id === "add-friend-btn") showAddFriend();
});

updateAccountUI();
