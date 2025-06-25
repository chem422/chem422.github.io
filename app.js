// === FIREBASE CONFIGURATION & INIT ===
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
const auth = firebase.auth();

// === GLOBAL VARIABLES ===
let currentUser = null;      // Current signed-in user info { username, uid, code }
let currentRoomCode = "";    // Current chat room or group code
let rainbowInterval = null;
let isRickRollMode = false;
let pongInterval = null;
let asteroidInterval = null;
let bgMusic = new Audio("https://cdn.pixabay.com/audio/2023/03/30/audio_0b9d97be10.mp3");
let notificationAudio = new Audio("https://cdn.pixabay.com/download/audio/2022/02/23/audio_b38ec1d2d4.mp3");
let rickrollAudio = new Audio("https://archive.org/download/NeverGonnaGiveYouUpHQ/Never%20Gonna%20Give%20You%20Up%20-%20HQ.mp3");
let notificationSoundEnabled = true;

// === ACCOUNT SYSTEM ===

// Helper: Generate random alphanumeric code (length 10)
function generateAccountCode() {
  return Math.random().toString(36).substr(2, 10).toUpperCase();
}

// Simple hash function (not cryptographically secure)
function simpleHash(str) {
  let hash = 0, i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash.toString();
}

// Sign up user with username + password
async function signUp(username, password) {
  username = username.trim();
  if (!username || !password) throw "Username and password required";

  // Check duplicate username
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

  // Auto sign in
  return currentUser;
}

// Sign in user by account code + password
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
  return user;
}

// Sign out user
function signOut() {
  currentUser = null;
  currentRoomCode = "";
}

// Download account data txt
async function downloadAccountData() {
  if (!currentUser) return alert("Not signed in");
  const userRef = db.ref("users/" + currentUser.uid);
  const snapshot = await userRef.once("value");
  const data = snapshot.val();
  if (!data) return alert("User data not found");

  let content = `Username: ${data.username}\nAccount Code: ${data.accountCode}\nPassword Hash: ${data.passwordHash}\n\nTop 5 Earth/Moon Scores: ${data.topScores ? data.topScores.slice(0,5).join(", ") : "None"}\nLowest Score: ${data.lowScore || "None"}\n\nLast 20 Messages:\n`;

  if(data.last20Messages){
    data.last20Messages.forEach(m => {
      content += `- ${m}\n`;
    });
  } else content += "None";

  const blob = new Blob([content], {type: "text/plain"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ChemChat_Account_${data.username}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Reset password process
async function resetPassword(accountCode, newPassword, confirmPassword) {
  if (!accountCode || !newPassword || !confirmPassword) throw "All fields required";
  if (newPassword !== confirmPassword) throw "Passwords do not match";

  const snapshot = await db.ref("users").orderByChild("accountCode").equalTo(accountCode).once("value");
  if (!snapshot.exists()) throw "Account not found";

  let userKey = null;
  snapshot.forEach(child => {
    userKey = child.key;
  });
  if (!userKey) throw "User not found";

  const newHash = simpleHash(newPassword);
  await db.ref("users/" + userKey).update({ passwordHash: newHash });

  // If current user is resetting own password, update currentUser hash
  if(currentUser && currentUser.uid === userKey){
    currentUser.passwordHash = newHash;
  }
}

// Delete account process
async function deleteAccount(accountCode, password) {
  if (!accountCode || !password) throw "All fields required";

  const passwordHash = simpleHash(password);
  const snapshot = await db.ref("users").orderByChild("accountCode").equalTo(accountCode).once("value");
  if (!snapshot.exists()) throw "Account not found";

  let userKey = null;
  let correctPassword = false;
  snapshot.forEach(child => {
    if(child.val().passwordHash === passwordHash){
      userKey = child.key;
      correctPassword = true;
    }
  });

  if (!userKey) throw "Account not found or incorrect password";
  if(!correctPassword) throw "Incorrect password";

  await db.ref("users/" + userKey).remove();
  if(currentUser && currentUser.uid === userKey){
    currentUser = null;
    currentRoomCode = "";
  }
}

// === FRIEND SYSTEM ===

// Send friend request by friendId (user id)
async function sendFriendRequest(friendId) {
  if (!currentUser) throw "Not signed in";
  if (friendId === currentUser.uid) throw "Cannot friend yourself";

  // Check if friend exists
  const friendSnap = await db.ref("users/" + friendId).once("value");
  if (!friendSnap.exists()) throw "Friend user not found";

  // Check if already friends or requested
  const myFriendsSnap = await db.ref(`users/${currentUser.uid}/friends/${friendId}`).once("value");
  if (myFriendsSnap.exists()) throw "Already friends";

  const friendReqSnap = await db.ref(`users/${friendId}/friendRequests/${currentUser.uid}`).once("value");
  if (friendReqSnap.exists()) throw "Friend request already sent";

  // Send friend request
  await db.ref(`users/${friendId}/friendRequests/${currentUser.uid}`).set({
    username: currentUser.username,
    timestamp: Date.now()
  });
}

// Accept friend request
async function acceptFriendRequest(requesterId) {
  if (!currentUser) throw "Not signed in";

  // Add each other as friends
  const updates = {};
  updates[`users/${currentUser.uid}/friends/${requesterId}`] = true;
  updates[`users/${requesterId}/friends/${currentUser.uid}`] = true;

  // Remove friend request
  updates[`users/${currentUser.uid}/friendRequests/${requesterId}`] = null;

  await db.ref().update(updates);
}

// Deny friend request
async function denyFriendRequest(requesterId) {
  if (!currentUser) throw "Not signed in";
  await db.ref(`users/${currentUser.uid}/friendRequests/${requesterId}`).remove();
}

// Remove friend
async function removeFriend(friendId) {
  if (!currentUser) throw "Not signed in";

  const updates = {};
  updates[`users/${currentUser.uid}/friends/${friendId}`] = null;
  updates[`users/${friendId}/friends/${currentUser.uid}`] = null;

  await db.ref().update(updates);
}

// Set friend status (public/private)
async function setFriendStatus(status) {
  if (!currentUser) throw "Not signed in";
  if (status !== "public" && status !== "private") throw "Invalid status";
  await db.ref(`users/${currentUser.uid}`).update({ friendStatus: status });
}

// Get friend requests realtime
function onFriendRequestsUpdate(callback) {
  if (!currentUser) return;
  const ref = db.ref(`users/${currentUser.uid}/friendRequests`);
  ref.on("value", snapshot => {
    const requests = snapshot.val() || {};
    callback(requests);
  });
}

// Get friend list realtime
function onFriendsUpdate(callback) {
  if (!currentUser) return;
  const ref = db.ref(`users/${currentUser.uid}/friends`);
  ref.on("value", async snapshot => {
    const friendsObj = snapshot.val() || {};
    const friends = [];

    // Fetch friend usernames and status
    for(const friendId of Object.keys(friendsObj)){
      const snap = await db.ref(`users/${friendId}`).once("value");
      if(snap.exists()){
        const f = snap.val();
        friends.push({
          uid: friendId,
          username: f.username,
          status: f.friendStatus || "public"
        });
      }
    }
    callback(friends);
  });
}

// === GROUP CHAT SYSTEM ===

// Create group chat with name + members (uids array)
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

// Rename group chat
async function renameGroupChat(groupId, newName) {
  if (!currentUser) throw "Not signed in";
  await db.ref(`groupChats/${groupId}`).update({ name: newName });
}

// Add members to group chat
async function addMembersToGroupChat(groupId, memberIds) {
  if (!currentUser) throw "Not signed in";
  const updates = {};
  memberIds.forEach(id => {
    updates[`groupChats/${groupId}/members/${id}`] = true;
  });
  await db.ref().update(updates);
}

// Remove group chat (only creator)
async function deleteGroupChat(groupId) {
  if (!currentUser) throw "Not signed in";
  const snap = await db.ref(`groupChats/${groupId}`).once("value");
  if (!snap.exists()) throw "Group chat not found";
  if (snap.val().createdBy !== currentUser.uid) throw "Only creator can delete group chat";
  await db.ref(`groupChats/${groupId}`).remove();
}

// === CHAT ROOMS (normal chat rooms) ===

// Create chat room (room code)
async function createChatRoom(code) {
  await db.ref(`chatRooms/${code}`).set({
    members: { [currentUser.uid]: true },
    createdAt: Date.now()
  });
  currentRoomCode = code;
}

// Join chat room
async function joinChatRoom(code) {
  const roomRef = db.ref(`chatRooms/${code}`);
  const snap = await roomRef.once("value");
  if (!snap.exists()) throw "Room not found";
  await roomRef.child("members").child(currentUser.uid).set(true);
  currentRoomCode = code;
}

// Leave chat room & delete if empty
async function leaveChatRoom(code) {
  const roomRef = db.ref(`chatRooms/${code}/members`);
  await roomRef.child(currentUser.uid).remove();
  const snap = await roomRef.once("value");
  if (!snap.exists() || Object.keys(snap.val()).length === 0) {
    await db.ref(`chatRooms/${code}`).remove();
  }
  currentRoomCode = "";
}

// Send chat message to room or group
async function sendMessage(text, isGroup = false, groupId = "") {
  if (!currentUser) throw "Not signed in";
  const message = {
    from: currentUser.username,
    uid: currentUser.uid,
    text,
    timestamp: Date.now()
  };
  if (isGroup && groupId) {
    await db.ref(`groupChats/${groupId}/messages`).push(message);
  } else if (currentRoomCode) {
    await db.ref(`chatRooms/${currentRoomCode}/messages`).push(message);
  }
}

// Listen to chat messages
function onChatMessages(callback, isGroup = false, groupId = "") {
  if (isGroup && groupId) {
    db.ref(`groupChats/${groupId}/messages`).on("child_added", snapshot => {
      callback(snapshot.val());
    });
  } else if (currentRoomCode) {
    db.ref(`chatRooms/${currentRoomCode}/messages`).on("child_added", snapshot => {
      callback(snapshot.val());
    });
  }
}

// === PONG GAME ===

const pongGame = {
  roomId: null,
  playerId: null,
  paddlePos: 0,
  opponentPaddlePos: 0,
  ballX: 250,
  ballY: 125,
  ballSpeedX: 4,
  ballSpeedY: 4,
  score1: 0,
  score2: 0,
  isGameRunning: false,
  init(roomId) {
    this.roomId = roomId;
    this.playerId = currentUser.uid;
    this.paddlePos = 125;  // center paddle
    this.score1 = 0;
    this.score2 = 0;
    this.ballX = 250;
    this.ballY = 125;
    this.ballSpeedX = 4;
    this.ballSpeedY = 4;
    this.isGameRunning = true;

    // Sync paddle and score to Firebase
    this.syncGameData();
    this.listenGameData();
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
      this.render();
    });
    db.ref(`pongRooms/${this.roomId}/ball`).on("value", snapshot => {
      const ball = snapshot.val();
      if(ball) {
        this.ballX = ball.x;
        this.ballY = ball.y;
        this.ballSpeedX = ball.speedX;
        this.ballSpeedY = ball.speedY;
      }
      this.render();
    });
    db.ref(`pongRooms/${this.roomId}/scores`).on("value", snapshot => {
      const scores = snapshot.val();
      if(scores){
        this.score1 = scores.p1 || 0;
        this.score2 = scores.p2 || 0;
      }
      this.render();
    });
  },
  updateBall() {
    this.ballX += this.ballSpeedX;
    this.ballY += this.ballSpeedY;

    // Ball collision top/bottom
    if(this.ballY < 0 || this.ballY > 250){
      this.ballSpeedY = -this.ballSpeedY;
      playPongSound();
    }
    // Ball collision paddle
    if((this.ballX < 30 && this.ballY > this.paddlePos && this.ballY < this.paddlePos + 50) ||
      (this.ballX > 470 && this.ballY > this.opponentPaddlePos && this.ballY < this.opponentPaddlePos + 50)) {
      this.ballSpeedX = -this.ballSpeedX;
      playPongSound();
    }

    // Score
    if(this.ballX < 0){
      this.score2++;
      this.resetBall();
    } else if(this.ballX > 500){
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
    // Render pong game UI on your canvas or elements
    // Example: update paddle positions, ball position, scores, etc.
  },
  start() {
    if(this.isGameRunning) return;
    this.isGameRunning = true;
    this.paddlePos = 125;
    this.opponentPaddlePos = 125;
    this.score1 = 0;
    this.score2 = 0;
    this.ballX = 250;
    this.ballY = 125;
    this.ballSpeedX = 4;
    this.ballSpeedY = 4;

    pongInterval = setInterval(() => {
      this.updateBall();
      this.syncGameData();
    }, 20);
  },
  stop() {
    this.isGameRunning = false;
    clearInterval(pongInterval);
  }
};

function playPongSound(){
  if(notificationSoundEnabled){
    notificationAudio.currentTime = 0;
    notificationAudio.play();
  }
}

// === ASTEROID DEFENSE GAME ===

const asteroidGame = {
  health: 3,
  maxHealth: 3,
  score: 0,
  powerUps: [],
  activePowerUps: [],
  asteroids: [],
  boss: null,
  powerUpTimers: {},
  tankMissiles: 0,
  tankCooldown: 0,
  cloverActive: false,
  hourglassActive: false,
  init() {
    this.health = 3;
    this.maxHealth = 3;
    this.score = 0;
    this.powerUps = [];
    this.activePowerUps = [];
    this.asteroids = [];
    this.boss = null;
    this.powerUpTimers = {};
    this.tankMissiles = 0;
    this.tankCooldown = 0;
    this.cloverActive = false;
    this.hourglassActive = false;
    this.spawnLoop();
  },
  spawnLoop() {
    asteroidInterval = setInterval(() => {
      // Spawn asteroids based on timing, increase difficulty with score
      this.spawnAsteroid();
      this.updateGame();
    }, this.hourglassActive ? 1500 : 1000);
  },
  spawnAsteroid() {
    // Logic to spawn asteroids of different types and colors with different health and score values
    // Random spawn position top of screen
    // Add to this.asteroids array
  },
  updateGame() {
    // Move asteroids down, check collisions with Earth
    // Handle power-up drops
    // Update UI, health, score, boss status
  },
  activatePowerUp(type) {
    // Add power-up effect (heart, clover, hourglass, hammer, bomb, tank, lightning, mystery)
    // Manage timers for power-ups
  },
  fireTankMissile() {
    if(this.tankMissiles > 0 && this.tankCooldown <= 0){
      this.tankMissiles--;
      this.tankCooldown = 10; // cooldown seconds
      // Damage asteroids or boss
    }
  },
  takeDamage(amount) {
    this.health -= amount;
    if(this.health <= 0){
      this.gameOver();
    }
  },
  gameOver() {
    clearInterval(asteroidInterval);
    alert("Game Over! Your score: " + this.score);
  }
};

// === UI AND NOTIFICATIONS ===

function showToast(message) {
  // Implement toast notification with fade in/out
  console.log("Toast:", message);
}

function playNotificationSound() {
  if(notificationSoundEnabled){
    notificationAudio.currentTime = 0;
    notificationAudio.play();
  }
}

// === RICKROLL EASTER EGG ===

function startRickRoll() {
  isRickRollMode = true;
  rickrollAudio.play();
  // Display video flying across screen and snippets playing on chat messages
}

function stopRickRoll() {
  isRickRollMode = false;
  rickrollAudio.pause();
  rickrollAudio.currentTime = 0;
  // Remove flying video if any
}

// === MISC FUNCTIONS ===

// Save last 20 chat messages to user account (for chat history download)
async function saveLastMessages(messages) {
  if (!currentUser) return;
  const last20 = messages.slice(-20);
  await db.ref(`users/${currentUser.uid}/last20Messages`).set(last20);
}

// Other helper functions and UI event listeners below...

// === Event Listeners and UI Interaction Logic ===

// Example: Hook sign-up form submit
document.getElementById("signupForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const username = e.target.username.value;
    const password = e.target.password.value;
    await signUp(username, password);
    showToast("Signed up successfully!");
  } catch (err) {
    showToast(err);
  }
});

// ... Similar hooks for sign-in, password reset, friend requests, chat sending, pong controls ...

