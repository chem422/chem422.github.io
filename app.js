.// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyC_BX4N_7gO3tGZvGh_4MkHOQ2Ay2mRsRc",
  authDomain: "chat-room-22335.firebaseapp.com",
  projectId: "chat-room-22335",
  storageBucket: "chat-room-22335.firebasestorage.app",
  messagingSenderId: "20974926341",
  appId: "1:20974926341:web:c413eb3122888d6803fa6c",
  measurementId: "G-WB5QY60EG6"
};
firebase.initializeApp(firebaseConfig);

const db = firebase.database();

//////////////////////////////
// GLOBALS
let currentUser = null; // {uid, username, code, passwordHash}
let currentRoomCode = "";
let rainbowInterval = null;
let isRickRollMode = false;
let pongInterval = null;
let asteroidInterval = null;
let notificationSoundEnabled = true;
let musicEnabled = true;

const notificationAudio = new Audio("notification-alert-269289.mp3");
const backgroundMusic = new Audio("lo-fi-alarm-clock-243766.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.15;

//////////////////////////////
// UTILS
function generateAccountCode() {
  return Math.random().toString(36).substr(2, 10).toUpperCase();
}

function simpleHash(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash.toString();
}

function showToast(msg) {
  // Simple alert or implement your toast UI here
  alert(msg);
}

function playNotificationSound() {
  if (notificationSoundEnabled) {
    notificationAudio.currentTime = 0;
    notificationAudio.play();
  }
}

//////////////////////////////
// ACCOUNT SYSTEM
async function signUp(username, password) {
  username = username.trim();
  if (!username || !password) throw "Username and password required";

  const snapshot = await db.ref("users").orderByChild("username").equalTo(username).once("value");
  if (snapshot.exists()) throw "Username already taken";

  const accountCode = generateAccountCode();
  const passwordHash = simpleHash(password);

  const newUserRef = db.ref("users").push();
  await newUserRef.set({
    username,
    passwordHash,
    accountCode,
    topScores: [],
    lowScore: null,
    last20Messages: [],
    friends: {},
    friendRequests: {},
    friendStatus: "public"
  });

  currentUser = {
    uid: newUserRef.key,
    username,
    accountCode,
    passwordHash
  };

  updateUserInfoUI();
  loadFriendRequests();
  loadFriendsList();

  return currentUser;
}

async function signIn(accountCode, password) {
  accountCode = accountCode.trim();
  if (!accountCode || !password) throw "Account code and password required";

  const passwordHash = simpleHash(password);

  const snapshot = await db.ref("users").orderByChild("accountCode").equalTo(accountCode).once("value");
  if (!snapshot.exists()) throw "Account not found";

  let user = null;
  snapshot.forEach(child => {
    const data = child.val();
    if (data.passwordHash === passwordHash) {
      user = {
        uid: child.key,
        username: data.username,
        accountCode: data.accountCode,
        passwordHash: data.passwordHash
      };
    }
  });
  if (!user) throw "Incorrect password";

  currentUser = user;

  updateUserInfoUI();
  loadFriendRequests();
  loadFriendsList();

  return user;
}

function signOut() {
  currentUser = null;
  currentRoomCode = "";
  clearUIOnSignOut();
  stopBackgroundMusic();
}

//////////////////////////////
// FRIEND SYSTEM
async function sendFriendRequest(friendId) {
  if (!currentUser) throw "Not signed in";
  if (friendId === currentUser.uid) throw "Cannot friend yourself";

  const friendSnap = await db.ref("users/" + friendId).once("value");
  if (!friendSnap.exists()) throw "Friend user not found";

  const myFriendsSnap = await db.ref(`users/${currentUser.uid}/friends/${friendId}`).once("value");
  if (myFriendsSnap.exists()) throw "Already friends";

  const friendReqSnap = await db.ref(`users/${friendId}/friendRequests/${currentUser.uid}`).once("value");
  if (friendReqSnap.exists()) throw "Friend request already sent";

  await db.ref(`users/${friendId}/friendRequests/${currentUser.uid}`).set({
    username: currentUser.username,
    timestamp: Date.now()
  });
}

async function acceptFriendRequest(requesterId) {
  if (!currentUser) throw "Not signed in";

  const updates = {};
  updates[`users/${currentUser.uid}/friends/${requesterId}`] = true;
  updates[`users/${requesterId}/friends/${currentUser.uid}`] = true;
  updates[`users/${currentUser.uid}/friendRequests/${requesterId}`] = null;

  await db.ref().update(updates);

  loadFriendRequests();
  loadFriendsList();
}

async function denyFriendRequest(requesterId) {
  if (!currentUser) throw "Not signed in";
  await db.ref(`users/${currentUser.uid}/friendRequests/${requesterId}`).remove();

  loadFriendRequests();
}

async function removeFriend(friendId) {
  if (!currentUser) throw "Not signed in";

  const updates = {};
  updates[`users/${currentUser.uid}/friends/${friendId}`] = null;
  updates[`users/${friendId}/friends/${currentUser.uid}`] = null;

  await db.ref().update(updates);

  loadFriendsList();
}

async function setFriendStatus(status) {
  if (!currentUser) throw "Not signed in";
  if (status !== "public" && status !== "private") throw "Invalid status";
  await db.ref(`users/${currentUser.uid}`).update({ friendStatus: status });
}

// Load friend requests and update UI
function loadFriendRequests() {
  if (!currentUser) return;
  db.ref(`users/${currentUser.uid}/friendRequests`).on("value", snapshot => {
    const requests = snapshot.val() || {};
    const container = document.getElementById("friendRequestsList");
    container.innerHTML = "";
    for (const requesterId in requests) {
      const req = requests[requesterId];
      const div = document.createElement("div");
      div.className = "friend-request";
      div.textContent = `Request from: ${req.username}`;
      const acceptBtn = document.createElement("button");
      acceptBtn.textContent = "Accept";
      acceptBtn.onclick = () => acceptFriendRequest(requesterId);
      const denyBtn = document.createElement("button");
      denyBtn.textContent = "Deny";
      denyBtn.onclick = () => denyFriendRequest(requesterId);
      div.appendChild(acceptBtn);
      div.appendChild(denyBtn);
      container.appendChild(div);
    }
  });
}

// Load friends and update UI
function loadFriendsList() {
  if (!currentUser) return;
  db.ref(`users/${currentUser.uid}/friends`).on("value", async snapshot => {
    const friendsObj = snapshot.val() || {};
    const container = document.getElementById("friendsList");
    container.innerHTML = "";
    for (const friendId of Object.keys(friendsObj)) {
      const snap = await db.ref(`users/${friendId}`).once("value");
      if (snap.exists()) {
        const friendData = snap.val();
        const div = document.createElement("div");
        div.className = "friend-item";
        div.textContent = friendData.username;
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.onclick = () => removeFriend(friendId);
        div.appendChild(removeBtn);
        container.appendChild(div);
      }
    }
  });
}

//////////////////////////////
// GROUP CHAT SYSTEM
async function createGroupChat(name, memberIds) {
  if (!currentUser) throw "Not signed in";
  const groupRef = db.ref("groupChats").push();
  await groupRef.set({
    name,
    members: memberIds.reduce((acc, id) => {
      acc[id] = true;
      return acc;
    }, {}),
    createdBy: currentUser.uid,
    createdAt: Date.now()
  });
  return groupRef.key;
}

async function renameGroupChat(groupId, newName) {
  if (!currentUser) throw "Not signed in";
  await db.ref(`groupChats/${groupId}`).update({ name: newName });
}

async function addMembersToGroupChat(groupId, memberIds) {
  if (!currentUser) throw "Not signed in";
  const updates = {};
  memberIds.forEach(id => {
    updates[`groupChats/${groupId}/members/${id}`] = true;
  });
  await db.ref().update(updates);
}

async function deleteGroupChat(groupId) {
  if (!currentUser) throw "Not signed in";
  const snap = await db.ref(`groupChats/${groupId}`).once("value");
  if (!snap.exists()) throw "Group chat not found";
  if (snap.val().createdBy !== currentUser.uid) throw "Only creator can delete group chat";
  await db.ref(`groupChats/${groupId}`).remove();
}

//////////////////////////////
// CHAT ROOMS & MESSAGING
async function createChatRoom(code) {
  await db.ref(`chatRooms/${code}`).set({
    members: { [currentUser.uid]: true },
    createdAt: Date.now()
  });
  currentRoomCode = code;
  loadChatMessages();
}

async function joinChatRoom(code) {
  const roomRef = db.ref(`chatRooms/${code}`);
  const snap = await roomRef.once("value");
  if (!snap.exists()) throw "Room not found";
  await roomRef.child("members").child(currentUser.uid).set(true);
  currentRoomCode = code;
  loadChatMessages();
}

async function leaveChatRoom(code) {
  const roomRef = db.ref(`chatRooms/${code}/members`);
  await roomRef.child(currentUser.uid).remove();
  const snap = await roomRef.once("value");
  if (!snap.exists() || Object.keys(snap.val()).length === 0) {
    await db.ref(`chatRooms/${code}`).remove();
  }
  currentRoomCode = "";
  clearChatUI();
}

async function sendMessage(text) {
  if (!currentUser || !currentRoomCode) throw "Not signed in or not in a room";
  const message = {
    from: currentUser.username,
    uid: currentUser.uid,
    text,
    timestamp: Date.now()
  };
  await db.ref(`chatRooms/${currentRoomCode}/messages`).push(message);
}

function loadChatMessages() {
  if (!currentRoomCode) return;
  const container = document.getElementById("chatMessages");
  container.innerHTML = "";
  db.ref(`chatRooms/${currentRoomCode}/messages`).off();
  db.ref(`chatRooms/${currentRoomCode}/messages`).on("child_added", snapshot => {
    const msg = snapshot.val();
    const div = document.createElement("div");
    div.className = "chat-message";
    const time = new Date(msg.timestamp).toLocaleTimeString();
    div.textContent = `[${time}] ${msg.from}: ${msg.text}`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    playNotificationSound();
  });
}

function clearChatUI() {
  const container = document.getElementById("chatMessages");
  if(container) container.innerHTML = "";
}

//////////////////////////////
// PONG GAME FULL IMPLEMENTATION

const pongCanvas = document.getElementById("pongCanvas");
const pongCtx = pongCanvas?.getContext("2d");

const pongGame = {
  roomId: null,
  playerId: null,
  paddlePos: 125,
  opponentPaddlePos: 125,
  ballX: 250,
  ballY: 125,
  ballSpeedX: 4,
  ballSpeedY: 4,
  score1: 0,
  score2: 0,
  isGameRunning: false,

  init(roomId) {
    if (!pongCtx) return;

    this.roomId = roomId;
    this.playerId = currentUser.uid;
    this.paddlePos = 125;
    this.opponentPaddlePos = 125;
    this.score1 = 0;
    this.score2 = 0;
    this.ballX = 250;
    this.ballY = 125;
    this.ballSpeedX = 4;
    this.ballSpeedY = 4;
    this.isGameRunning = true;

    this.listenGameData();

    if (pongInterval) clearInterval(pongInterval);
    pongInterval = setInterval(() => {
      this.updateBall();
      this.syncGameData();
      this.render();
    }, 20);

    this.render();

    // Add event listener for mouse to control paddle
    pongCanvas.onmousemove = (e) => {
      const rect = pongCanvas.getBoundingClientRect();
      const y = e.clientY - rect.top;
      this.paddlePos = Math.max(0, Math.min(250, y - 25));
      this.syncGameData();
    };
  },

  async syncGameData() {
    if (!this.isGameRunning) return;
    await db.ref(`pongRooms/${this.roomId}/players/${this.playerId}`).set({
      paddlePos: this.paddlePos
    });
    await db.ref(`pongRooms/${this.roomId}/ball`).set({
      x: this.ballX,
      y: this.ballY,
      speedX: this.ballSpeedX,
      speedY: this.ballSpeedY
    });
    await db.ref(`pongRooms/${this.roomId}/scores`).set({
      p1: this.score1,
      p2: this.score2
    });
  },

  listenGameData() {
    db.ref(`pongRooms/${this.roomId}/players`).on("value", snapshot => {
      const players = snapshot.val() || {};
      for (const id in players) {
        if (id !== this.playerId) {
          this.opponentPaddlePos = players[id].paddlePos || 125;
        } else {
          this.paddlePos = players[id].paddlePos || 125;
        }
      }
    });
    db.ref(`pongRooms/${this.roomId}/ball`).on("value", snapshot => {
      const ball = snapshot.val();
      if (ball) {
        this.ballX = ball.x;
        this.ballY = ball.y;
        this.ballSpeedX = ball.speedX;
        this.ballSpeedY = ball.speedY;
      }
    });
    db.ref(`pongRooms/${this.roomId}/scores`).on("value", snapshot => {
      const scores = snapshot.val();
      if (scores) {
        this.score1 = scores.p1 || 0;
        this.score2 = scores.p2 || 0;
      }
    });
  },

  updateBall() {
    this.ballX += this.ballSpeedX;
    this.ballY += this.ballSpeedY;

    // Bounce off top and bottom
    if (this.ballY < 0 || this.ballY > 250) {
      this.ballSpeedY = -this.ballSpeedY;
      playPongSound();
    }

    // Bounce off paddles
    // Left paddle
    if (this.ballX < 30 && this.ballY > this.paddlePos && this.ballY < this.paddlePos + 50) {
      this.ballSpeedX = -this.ballSpeedX;
      playPongSound();
    }
    // Right paddle
    if (this.ballX > 470 && this.ballY > this.opponentPaddlePos && this.ballY < this.opponentPaddlePos + 50) {
      this.ballSpeedX = -this.ballSpeedX;
      playPongSound();
    }

    // Scoring
    if (this.ballX < 0) {
      this.score2++;
      this.resetBall();
    } else if (this.ballX > 500) {
      this.score1++;
      this.resetBall();
    }
  },

  resetBall() {
    this.ballX = 250;
    this.ballY = 125;
    this.ballSpeedX = 4 * (Math.random() > 0.5 ? 1 : -1);
    this.ballSpeedY = 4 * (Math.random() > 0.5 ? 1 : -1);
  },

  render() {
    if (!pongCtx) return;
    pongCtx.clearRect(0, 0, pongCanvas.width, pongCanvas.height);

    // Draw background
    pongCtx.fillStyle = "#000";
    pongCtx.fillRect(0, 0, pongCanvas.width, pongCanvas.height);

    // Draw paddles
    pongCtx.fillStyle = "white";
    pongCtx.fillRect(10, this.paddlePos, 10, 50); // Left paddle
    pongCtx.fillRect(480, this.opponentPaddlePos, 10, 50); // Right paddle

    // Draw ball
    pongCtx.beginPath();
    pongCtx.arc(this.ballX, this.ballY, 7, 0, Math.PI * 2);
    pongCtx.fill();

    // Draw scores
    pongCtx.font = "24px monospace";
    pongCtx.fillText(this.score1, 200, 30);
    pongCtx.fillText(this.score2, 300, 30);
  },

   stop() {
    this.isGameRunning = false;
    clearInterval(pongInterval);
    pongCanvas.onmousemove = null;
    if (pongCtx) {
      pongCtx.clearRect(0, 0, pongCanvas.width, pongCanvas.height);
    }
  }
};

function playPongSound() {
  if (notificationSoundEnabled) {
    notificationAudio.currentTime = 0;
    notificationAudio.play();
  }
}


// Get the Pong canvas and context
const pongCanvas = document.getElementById("pongCanvas");
const pongCtx = pongCanvas ? pongCanvas.getContext("2d") : null;

// Mouse move handler to control player's paddle
if (pongCanvas) {
  pongCanvas.addEventListener("mousemove", (event) => {
    // Calculate paddle position based on mouse Y relative to canvas
    const rect = pongCanvas.getBoundingClientRect();
    let mouseY = event.clientY - rect.top;
    // Keep paddle inside canvas bounds
    pongGame.paddlePos = Math.max(0, Math.min(mouseY - 25, pongCanvas.height - 50));
  });
}

// Start the Pong game loop
function startPongGame(roomId) {
  pongGame.init(roomId);
  pongGame.start();

  // Game update loop at 50 FPS
  pongInterval = setInterval(() => {
    pongGame.updateBall();
    pongGame.syncGameData();
    pongGame.render();
  }, 20);
}

// Stop the Pong game and clean up
function stopPongGame() {
  pongGame.stop();
  clearInterval(pongInterval);
}

// Example: to start pong in room "room123", call:
// startPongGame("room123");

// You may want to call stopPongGame() when leaving or ending the game.


