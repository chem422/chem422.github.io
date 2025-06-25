import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, deleteUser, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, set, get, onValue, remove, push } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC_BX4N_7gO3tGZvGh_4MkHOQ2Ay2mRsRc",
  authDomain: "chat-room-22335.firebaseapp.com",
  projectId: "chat-room-22335",
  storageBucket: "chat-room-22335.firebasestorage.app",
  messagingSenderId: "20974926341",
  appId: "1:20974926341:web:c413eb3122887d6803fa6c",
  measurementId: "G-WB5QY60EG6"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Audio
const bgMusic = document.getElementById("bg-music");
const notificationSound = document.getElementById("notification-sound");
const rickrollSound = document.getElementById("rickroll-sound");
function playNotificationSound() {
  notificationSound.play().catch(() => {});
}

// Intro Animation
const intro = document.getElementById("intro");
const main = document.getElementById("main");
setTimeout(() => {
  intro.style.display = "none";
  main.classList.remove("hidden");
}, 5500);

// Dropdowns
document.getElementById("account-dropdown").addEventListener("click", () => {
  document.getElementById("account-content").classList.toggle("show");
});
document.getElementById("friends-dropdown").addEventListener("click", () => {
  document.getElementById("friends-content").classList.toggle("show");
});

// Back Buttons
document.querySelectorAll(".back").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".modal").forEach(modal => modal.classList.add("hidden"));
  });
});

// Account System
function updateAccountDropdown(isSignedIn) {
  const statusText = document.getElementById("account-status-text");
  const accountContent = document.getElementById("account-content");
  accountContent.innerHTML = `<p id="account-status-text">${isSignedIn ? `Signed in as ${auth.currentUser.email.split("@")[0]}` : "You are not signed in."}</p>`;
  if (isSignedIn) {
    const actions = ["Sign Out", "Account Status", "Info", "Download Account Data", "Reset Password", "Delete Account"];
    actions.forEach(action => {
      const btn = document.createElement("button");
      btn.textContent = action;
      btn.id = action.toLowerCase().replace(" ", "-");
      accountContent.appendChild(btn);
    });
    document.getElementById("sign-out").addEventListener("click", () => auth.signOut());
    document.getElementById("account-status").addEventListener("click", () => {
      document.getElementById("account-status-modal").classList.remove("hidden");
      get(ref(db, `users/${auth.currentUser.uid}`)).then(snap => {
        document.getElementById("current-status").textContent = snap.val().status;
        document.querySelector(`input[value="${snap.val().status}"]`).checked = true;
      });
    });
    document.getElementById("info").addEventListener("click", () => {
      document.getElementById("info-modal").classList.remove("hidden");
      get(ref(db, `users/${auth.currentUser.uid}`)).then(snap => {
        document.getElementById("info-username").textContent = snap.val().username;
        document.getElementById("info-friend-id").textContent = snap.val().friendId;
        document.getElementById("info-scores").textContent = JSON.stringify(snap.val().scores || []);
        document.getElementById("info-password").textContent = snap.val().password; // Secure in production
      });
    });
    document.getElementById("download-account-data").addEventListener("click", () => {
      get(ref(db, `users/${auth.currentUser.uid}`)).then(snap => {
        const data = snap.val();
        const friends = [];
        get(ref(db, `friends/${auth.currentUser.uid}/friends`)).then(fSnap => {
          fSnap.forEach(f => friends.push(f.key));
          const accountData = `Username: ${data.username}\nPassword: ${data.password}\nAccount Code: ${data.accountCode}\nFriend ID: ${data.friendId}\nFriends: ${friends.join(", ")}\nScores: ${JSON.stringify(data.scores || [])}\nRecent Messages: ${JSON.stringify(data.recentMessages || [])}`;
          const blob = new Blob([accountData], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "account_data.txt";
          a.click();
          URL.revokeObjectURL(url);
        });
      });
    });
    document.getElementById("reset-password").addEventListener("click", () => {
      document.getElementById("reset-password-modal").classList.remove("hidden");
      const code = Math.random().toString(36).slice(2, 7);
      document.getElementById("reset-code").textContent = code;
    });
    document.getElementById("delete-account").addEventListener("click", () => {
      document.getElementById("delete-account-modal").classList.remove("hidden");
      const code = Math.random().toString(36).slice(2, 9);
      document.getElementById("delete-code").textContent = code;
    });
  } else {
    accountContent.innerHTML += `
      <button id="sign-in">Sign In</button>
      <button id="sign-up">Sign Up</button>
    `;
    document.getElementById("sign-in").addEventListener("click", () => {
      document.getElementById("sign-in-modal").classList.remove("hidden");
    });
    document.getElementById("sign-up").addEventListener("click", () => {
      document.getElementById("sign-up-modal").classList.remove("hidden");
    });
  }
  document.getElementById("temp-username").classList.toggle("hidden", isSignedIn);
}
onAuthStateChanged(auth, user => updateAccountDropdown(!!user));

document.getElementById("signup-btn").addEventListener("click", () => {
  const username = document.getElementById("signup-username").value;
  const password = document.getElementById("signup-password").value;
  const accountCode = Math.random().toString(36).slice(2, 12).toUpperCase();
  const friendId = Math.random().toString(36).slice(2, 12).toUpperCase();
  const email = `${username}@chemchat.com`;

  createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      const user = userCredential.user;
      set(ref(db, `users/${user.uid}`), {
        username,
        accountCode,
        friendId,
        password, // Secure in production
        status: "public",
        scores: [],
        recentMessages: []
      });
      const accountData = `Username: ${username}\nPassword: ${password}\nAccount Code: ${accountCode}\nFriend ID: ${friendId}`;
      navigator.clipboard.writeText(accountData);
      alert("Account created! Info copied to clipboard.");
      document.getElementById("sign-up-modal").classList.add("hidden");
    })
    .catch(error => alert(error.message));
});

document.getElementById("signup-download-btn").addEventListener("click", () => {
  const username = document.getElementById("signup-username").value;
  const password = document.getElementById("signup-password").value;
  const accountCode = Math.random().toString(36).slice(2, 12).toUpperCase();
  const friendId = Math.random().toString(36).slice(2, 12).toUpperCase();
  const email = `${username}@chemchat.com`;

  createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      const user = userCredential.user;
      set(ref(db, `users/${user.uid}`), {
        username,
        accountCode,
        friendId,
        password, // Secure in production
        status: "public",
        scores: [],
        recentMessages: []
      });
      const accountData = `Username: ${username}\nPassword: ${password}\nAccount Code: ${accountCode}\nFriend ID: ${friendId}`;
      const blob = new Blob([accountData], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "account_data.txt";
      a.click();
      URL.revokeObjectURL(url);
      alert("Account created! Data downloaded.");
      document.getElementById("sign-up-modal").classList.add("hidden");
    })
    .catch(error => alert(error.message));
});

document.getElementById("signin-btn").addEventListener("click", () => {
  const accountCode = document.getElementById("signin-account-code").value;
  const password = document.getElementById("signin-password").value;

  get(ref(db, "users")).then(snapshot => {
    let userId = null;
    let username = null;
    snapshot.forEach(child => {
      if (child.val().accountCode === accountCode) {
        userId = child.key;
        username = child.val().username;
      }
    });
    if (userId) {
      signInWithEmailAndPassword(auth, `${username}@chemchat.com`, password)
        .then(() => {
          document.getElementById("sign-in-modal").classList.add("hidden");
        })
        .catch(error => alert(error.message));
    } else {
      alert("Invalid account code.");
    }
  });
});

document.getElementById("reset-password-btn").addEventListener("click", () => {
  const accountId = document.getElementById("reset-account-id").value;
  const newPassword = document.getElementById("reset-new-password").value;
  const confirmPassword = document.getElementById("reset-confirm-password").value;
  const verifyCode = document.getElementById("reset-verify-code").value;
  const code = document.getElementById("reset-code").textContent;

  if (newPassword !== confirmPassword) return alert("Passwords do not match.");
  if (verifyCode !== `chem522[${code}]`) return alert("Invalid verification code.");

  get(ref(db, "users")).then(snapshot => {
    let userId = null;
    snapshot.forEach(child => {
      if (child.val().accountCode === accountId) userId = child.key;
    });
    if (userId && userId === auth.currentUser.uid) {
      updatePassword(auth.currentUser, newPassword)
        .then(() => {
          set(ref(db, `users/${userId}/password`), newPassword);
          alert("Password reset!");
          document.getElementById("reset-password-modal").classList.add("hidden");
        })
        .catch(error => alert(error.message));
    } else {
      alert("Invalid account ID.");
    }
  });
});

document.getElementById("delete-account-btn").addEventListener("click", () => {
  const verifyCode = document.getElementById("delete-verify-code").value;
  const code = document.getElementById("delete-code").textContent;
  const username = document.getElementById("delete-username").value;
  const password = document.getElementById("delete-password").value;
  const accountId = document.getElementById("delete-account-id").value;

  if (verifyCode !== `chem422[${code}]`) return alert("Invalid verification code.");

  get(ref(db, "users")).then(snapshot => {
    let userId = null;
    snapshot.forEach(child => {
      if (child.val().accountCode === accountId && child.val().username === username) userId = child.key;
    });
    if (userId && userId === auth.currentUser.uid) {
      signInWithEmailAndPassword(auth, `${username}@chemchat.com`, password)
        .then(() => {
          remove(ref(db, `users/${userId}`));
          remove(ref(db, `friends/${userId}`));
          remove(ref(db, `notifications/${userId}`));
          deleteUser(auth.currentUser)
            .then(() => {
              alert("Account deleted!");
              document.getElementById("delete-account-modal").classList.add("hidden");
            })
            .catch(error => alert(error.message));
        })
        .catch(error => alert(error.message));
    } else {
      alert("Invalid credentials.");
    }
  });
});

document.getElementById("toggle-password").addEventListener("click", () => {
  document.getElementById("password-verify").classList.remove("hidden");
});
document.getElementById("show-password").addEventListener("click", () => {
  const username = document.getElementById("verify-username").value;
  const accountId = document.getElementById("verify-account-id").value;
  const friendId = document.getElementById("verify-friend-id").value;

  get(ref(db, `users/${auth.currentUser.uid}`)).then(snap => {
    if (snap.val().username === username && snap.val().accountCode === accountId && snap.val().friendId === friendId) {
      const passwordEl = document.getElementById("info-password");
      passwordEl.classList.remove("blurred");
      document.getElementById("toggle-password").textContent = "👁️‍🗨️";
      document.getElementById("password-verify").classList.add("hidden");
    } else {
      alert("Invalid credentials.");
    }
  });
});

// Friend System
document.getElementById("add-friend").addEventListener("click", () => {
  document.getElementById("add-friend-modal").classList.remove("hidden");
});
document.getElementById("add-friend-btn").addEventListener("click", () => {
  const username = document.getElementById("friend-username").value;
  const friendId = document.getElementById("friend-id").value;

  get(ref(db, "users")).then(snapshot => {
    let targetUid = null;
    let correctUsername = null;
    snapshot.forEach(child => {
      if (child.val().friendId === friendId && child.val().username.toLowerCase() === username.toLowerCase()) {
        targetUid = child.key;
      } else if (child.val().friendId === friendId) {
        correctUsername = child.val().username;
      }
    });
    if (targetUid) {
      const notifId = push(ref(db, `notifications/${targetUid}`)).key;
      set(ref(db, `notifications/${targetUid}/${notifId}`), {
        type: "friend",
        from: auth.currentUser.uid,
        time: Date.now(),
        status: "pending"
      });
      alert("Friend request sent!");
      playNotificationSound();
      document.getElementById("add-friend-modal").classList.add("hidden");
    } else if (correctUsername) {
      document.getElementById("autocorrect").textContent = `Did you mean: ${correctUsername}?`;
      document.getElementById("autocorrect").classList.remove("hidden");
    } else {
      alert("Invalid friend ID or username.");
    }
  });
});

document.getElementById("friends-list").addEventListener("click", () => {
  if (!auth.currentUser) return alert("Sign in to view friends!");
  document.getElementById("friends-list-modal").classList.remove("hidden");
  const container = document.getElementById("friends-container");
  container.innerHTML = "";
  get(ref(db, `friends/${auth.currentUser.uid}/friends`)).then(snapshot => {
    snapshot.forEach(child => {
      get(ref(db, `users/${child.key}`)).then(user => {
        const status = user.val().status === "public" && user.val().online ? "online" : "offline";
        const friendDiv = document.createElement("div");
        friendDiv.className = "friend";
        friendDiv.innerHTML = `${user.val().username} <span class="dot ${status}"></span>`;
        friendDiv.addEventListener("click", () => {
          const modal = document.createElement("div");
          modal.className = "modal";
          modal.innerHTML = `
            <button class="back">Back</button>
            <h2>${user.val().username}</h2>
            <p>Friend ID: ${user.val().friendId}</p>
            <button id="invite-chat">Invite to Chat</button>
            <button id="invite-group">Invite to Group</button>
            <button id="remove-friend">Remove Friend</button>
          `;
          document.body.appendChild(modal);
          modal.querySelector(".back").addEventListener("click", () => modal.remove());
          modal.querySelector("#remove-friend").addEventListener("click", () => {
            const confirmModal = document.createElement("div");
            confirmModal.className = "modal";
            confirmModal.innerHTML = `
              <button class="back">Back</button>
              <h2>Remove ${user.val().username}?</h2>
              <button id="confirm-remove">Confirm</button>
              <button id="repeal-remove">Repeal</button>
            `;
            document.body.appendChild(confirmModal);
            confirmModal.querySelector(".back").addEventListener("click", () => confirmModal.remove());
            confirmModal.querySelector("#confirm-remove").addEventListener("click", () => {
              remove(ref(db, `friends/${auth.currentUser.uid}/friends/${child.key}`));
              remove(ref(db, `friends/${child.key}/friends/${auth.currentUser.uid}`));
              push(ref(db, `notifications/${child.key}`), {
                type: "friendRemoved",
                from: auth.currentUser.uid,
                time: Date.now()
              });
              confirmModal.remove();
              modal.remove();
            });
            confirmModal.querySelector("#repeal-remove").addEventListener("click", () => confirmModal.remove());
          });
        });
        container.appendChild(friendDiv);
      });
    });
  });
});

document.getElementById("notifications").addEventListener("click", () => {
  if (!auth.currentUser) return alert("Sign in to view notifications!");
  document.getElementById("notifications-modal").classList.remove("hidden");
  const container = document.getElementById("notifications-container");
  container.innerHTML = "";
  get(ref(db, `notifications/${auth.currentUser.uid}`)).then(snapshot => {
    snapshot.forEach(child => {
      get(ref(db, `users/${child.val().from}`)).then(user => {
        const notifDiv = document.createElement("div");
        notifDiv.className = "notification";
        notifDiv.innerHTML = `
          <p>${user.val().username} sent a ${child.val().type} request at ${new Date(child.val().time).toLocaleTimeString()}</p>
          <button class="accept">Accept</button>
          <button class="deny">Deny</button>
        `;
        notifDiv.querySelector(".accept").addEventListener("click", () => {
          if (child.val().type === "friend") {
            set(ref(db, `friends/${auth.currentUser.uid}/friends/${child.val().from}`), true);
            set(ref(db, `friends/${child.val().from}/friends/${auth.currentUser.uid}`), true);
          } else if (child.val().type === "groupInvite") {
            set(ref(db, `groupChats/${child.val().groupId}/members/${auth.currentUser.uid}`), true);
          }
          remove(ref(db, `notifications/${auth.currentUser.uid}/${child.key}`));
          notifDiv.remove();
        });
        notifDiv.querySelector(".deny").addEventListener("click", () => {
          remove(ref(db, `notifications/${auth.currentUser.uid}/${child.key}`));
          notifDiv.remove();
        });
        container.appendChild(notifDiv);
        const popup = document.getElementById("notification-popup");
        popup.innerHTML = notifDiv.innerHTML;
        popup.classList.remove("hidden");
        setTimeout(() => popup.classList.add("hidden"), 5000);
        playNotificationSound();
      });
    });
  });
});

// Group Chat
document.getElementById("join-group-chat").addEventListener("click", () => {
  if (!auth.currentUser) return alert("Sign in to join group chats!");
  document.getElementById("group-chat-modal").classList.remove("hidden");
  const container = document.getElementById("group-chats-container");
  container.innerHTML = "";
  get(ref(db, "groupChats")).then(snapshot => {
    snapshot.forEach(child => {
      if (child.val().members[auth.currentUser.uid]) {
        const groupDiv = document.createElement("div");
        groupDiv.className = "group-chat";
        groupDiv.innerHTML = `
          <p>${child.val().name} (${Object.keys(child.val().members).length} members)</p>
          <button class="connect">Connect</button>
        `;
        groupDiv.querySelector(".connect").addEventListener("click", () => {
          openChatRoom(child.key, true);
        });
        container.appendChild(groupDiv);
      }
    });
  });
});

document.getElementById("invite-group").addEventListener("click", () => {
  if (!auth.currentUser) return alert("Sign in to create group chats!");
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <button class="back">Back</button>
    <h2>Create Group Chat</h2>
    <div id="friends-select"></div>
    <button id="create-group">Invite</button>
  `;
  document.body.appendChild(modal);
  const friendsSelect = modal.querySelector("#friends-select");
  get(ref(db, `friends/${auth.currentUser.uid}/friends`)).then(snapshot => {
    snapshot.forEach(child => {
      get(ref(db, `users/${child.key}`)).then(user => {
        const div = document.createElement("div");
        div.innerHTML = `<label><input type="checkbox" value="${child.key}">${user.val().username}</label>`;
        friendsSelect.appendChild(div);
      });
    });
  });
  modal.querySelector(".back").addEventListener("click", () => modal.remove());
  modal.querySelector("#create-group").addEventListener("click", () => {
    const selected = Array.from(friendsSelect.querySelectorAll("input:checked")).map(input => input.value);
    if (selected.length) {
      const groupId = push(ref(db, "groupChats")).key;
      const members = { [auth.currentUser.uid]: true };
      selected.forEach(id => (members[id] = true));
      set(ref(db, `groupChats/${groupId}`), {
        name: "Group Chat",
        members,
        messages: {}
      });
      selected.forEach(id => {
        push(ref(db, `notifications/${id}`), {
          type: "groupInvite",
          groupId,
          from: auth.currentUser.uid,
          time: Date.now(),
          status: "pending"
        });
      });
      modal.remove();
      alert("Group chat created!");
    }
  });
});

// Chat Room
document.getElementById("start-chat").addEventListener("click", () => {
  const roomId = Math.random().toString(36).slice(2, 8).toUpperCase();
  openChatRoom(roomId);
});
document.getElementById("join-chat").addEventListener("click", () => {
  const roomId = document.getElementById("room-code").value.toUpperCase();
  if (roomId) openChatRoom(roomId);
});

function openChatRoom(roomId, isGroup = false) {
  document.getElementById("chat-room-modal").classList.remove("hidden");
  document.getElementById("room-code-display").textContent = roomId;
  document.getElementById("group-chat-dropdown").classList.toggle("hidden", !isGroup);
  const messages = document.getElementById("chat-messages");
  messages.innerHTML = "";
  const path = isGroup ? `groupChats/${roomId}/messages` : `rooms/${roomId}/messages`;
  onValue(ref(db, path), snapshot => {
    messages.innerHTML = "";
    snapshot.forEach(child => {
      const msg = child.val();
      const div = document.createElement("div");
      div.textContent = `${new Date(msg.time).toLocaleTimeString()}_${msg.sender}: ${msg.text}`;
      if (msg.text === "brodychem442/haha\\") {
        document.body.classList.add("rainbow");
      } else if (msg.text === "brodychem442/stop\\") {
        document.body.classList.remove("rainbow");
      } else if (msg.text === "rickroll(<io>)") {
        document.body.style.backgroundImage = "url('r.png')";
        document.getElementById("not-rickroll").classList.remove("hidden");
        document.getElementById("not-rickroll").addEventListener("click", () => {
          window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        });
        setInterval(() => {
          rickrollSound.play().catch(() => {});
        }, 10000);
        setInterval(() => {
          const img = document.createElement("img");
          img.src = "r.png";
          img.style.position = "absolute";
          img.style.width = "100px";
          img.style.left = "-100px";
          img.style.top = `${Math.random() * 100}vh`;
          img.style.transform = `rotate(${Math.random() * 360}deg)`;
          document.body.appendChild(img);
          let pos = -100;
          const move = setInterval(() => {
            pos += 5;
            img.style.left = `${pos}px`;
            if (pos > window.innerWidth) {
              img.remove();
              clearInterval(move);
            }
          }, 20);
        }, 5000);
      } else if (msg.text === "brodychem6(<pong>)") {
        document.getElementById("pong-modal").classList.remove("hidden");
      }
      messages.appendChild(div);
    });
  });
  if (!isGroup) {
    set(ref(db, `rooms/${roomId}/users/${auth.currentUser?.uid || "guest"}`), true);
    set(ref(db, `rooms/${roomId}/lastActive`), Date.now());
    const interval = setInterval(() => {
      get(ref(db, `rooms/${roomId}/users`)).then(snap => {
        if (!snap.exists() || Object.keys(snap.val()).length === 0) {
          setTimeout(() => remove(ref(db, `rooms/${roomId}`)), 5000);
          clearInterval(interval);
        }
      });
    }, 1000);
  }
}

document.getElementById("chat-send").addEventListener("click", () => {
  const input = document.getElementById("chat-input");
  const roomId = document.getElementById("room-code-display").textContent;
  const isGroup = !document.getElementById("group-chat-dropdown").classList.contains("hidden");
  const path = isGroup ? `groupChats/${roomId}/messages` : `rooms/${roomId}/messages`;
  push(ref(db, path), {
    sender: auth.currentUser?.email.split("@")[0] || document.getElementById("temp-username").value || "Guest",
    text: input.value,
    time: Date.now()
  });
  input.value = "";
});

// Pong Game
const pongModal = document.getElementById("pong-modal");
const canvas = document.getElementById("pong-canvas");
const ctx = canvas.getContext("2d");
const difficultyButtons = document.querySelectorAll(".difficulty-btn");
const phoneControls = document.querySelectorAll(".control-btn");
const confirmDifficulty = document.getElementById("confirm-difficulty");
const confirmControl = document.getElementById("confirm-control");

canvas.width = 600;
canvas.height = 400;
let difficulty = "normal";
let paddleSpeed = 5;
let ballSpeed = 5;
let controlMethod = "keyboard";

if (/Mobi|Android|iPhone/.test(navigator.userAgent)) {
  document.getElementById("difficulty-menu").classList.add("hidden");
  document.getElementById("phone-controls").classList.remove("hidden");
}

difficultyButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    difficultyButtons.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    difficulty = btn.id;
    if (difficulty === "easy") {
      paddleSpeed = 4;
      ballSpeed = 3;
    } else if (difficulty === "normal") {
      paddleSpeed = 5;
      ballSpeed = 5;
    } else {
      paddleSpeed = 6;
      ballSpeed = 7;
    }
  });
});

phoneControls.forEach(btn => {
  btn.addEventListener("click", () => {
    phoneControls.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    controlMethod = btn.id;
  });
});

confirmDifficulty.addEventListener("click", () => {
  document.getElementById("difficulty-menu").classList.add("hidden");
  canvas.classList.remove("hidden");
  startPong();
});

confirmControl.addEventListener("click", () => {
  document.getElementById("phone-controls").classList.add("hidden");
  canvas.classList.remove("hidden");
  startPong();
});

const paddleWidth = 10;
const paddleHeight = 60;
let playerPaddle = { x: 10, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
let aiPaddle = { x: canvas.width - 20, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
let ball = { x: canvas.width / 2, y: canvas.height / 2, dx: ballSpeed, dy: ballSpeed };

function startPong() {
  ctx.fillStyle = "#0ff";
  ctx.font = "20px Orbitron";
  ctx.fillText("GO!", canvas.width / 2 - 20, canvas.height / 2);
  setTimeout(() => {
    gameLoop();
  }, 1000);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0ff";
  ctx.fillRect(playerPaddle.x, playerPaddle.y, paddleWidth, paddleHeight);
  ctx.fillRect(aiPaddle.x, aiPaddle.y, paddleWidth, paddleHeight);
  ctx.fillRect(ball.x, ball.y, 10, 10);
  ctx.fillText(playerPaddle.score, canvas.width / 4, 30);
  ctx.fillText(aiPaddle.score, 3 * canvas.width / 4, 30);
  ctx.setLineDash([5, 15]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.strokeStyle = "#0ff";
  ctx.stroke();

  ball.x += ball.dx;
  ball.y += ball.dy;
  if (ball.y <= 0 || ball.y >= canvas.height - 10) ball.dy *= -1;
  if (ball.x <= playerPaddle.x + paddleWidth && ball.y >= playerPaddle.y && ball.y <= playerPaddle.y + paddleHeight) {
    ball.dx *= -1;
  }
  if (ball.x >= aiPaddle.x - 10 && ball.y >= aiPaddle.y && ball.y <= aiPaddle.y + paddleHeight) {
    ball.dx *= -1;
  }
  if (ball.x <= 0) {
    aiPaddle.score++;
    resetBall();
  }
  if (ball.x >= canvas.width - 10) {
    playerPaddle.score++;
    resetBall();
  }
  if (playerPaddle.score >= 10 || aiPaddle.score >= 10) {
    const winner = playerPaddle.score >= 10 ? "You" : "AI";
    alert(`Game Over! ${winner} Win!`);
    get(ref(db, `users/${auth.currentUser?.uid}`)).then(snap => {
      const scores = snap.val().scores || [];
      scores.push({ pong: playerPaddle.score });
      set(ref(db, `users/${auth.currentUser.uid}/scores`), scores);
    });
    pongModal.classList.add("hidden");
    return;
  }

  if (ball.y > aiPaddle.y + paddleHeight / 2) aiPaddle.y += paddleSpeed * 0.8;
  if (ball.y < aiPaddle.y + paddleHeight / 2) aiPaddle.y -= paddleSpeed * 0.8;

  if (controlMethod === "keyboard") {
    document.addEventListener("keydown", e => {
      if (e.key === "w" || e.key === "ArrowUp") playerPaddle.y -= paddleSpeed;
      if (e.key === "s" || e.key === "ArrowDown") playerPaddle.y += paddleSpeed;
      if (playerPaddle.y < 0) playerPaddle.y = 0;
      if (playerPaddle.y > canvas.height - paddleHeight) playerPaddle.y = canvas.height - paddleHeight;
    });
  } else if (controlMethod === "tilt-control") {
    window.addEventListener("deviceorientation", e => {
      playerPaddle.y += e.beta / 10;
      if (playerPaddle.y < 0) playerPaddle.y = 0;
      if (playerPaddle.y > canvas.height - paddleHeight) playerPaddle.y = canvas.height - paddleHeight;
    });
  } else if (controlMethod === "touch-control") {
    canvas.addEventListener("touchmove", e => {
      const touch = e.touches[0];
      playerPaddle.y = touch.clientY - canvas.offsetTop - paddleHeight / 2;
      if (playerPaddle.y < 0) playerPaddle.y = 0;
      if (playerPaddle.y > canvas.height - paddleHeight) playerPaddle.y = canvas.height - paddleHeight;
    });
  } else if (controlMethod === "arrow-control") {
    const up = document.createElement("button");
    up.textContent = "↑";
    up.style.position = "fixed";
    up.style.bottom = "100px";
    up.style.right = "20px";
    const down = document.createElement("button");
    down.textContent = "↓";
    down.style.position = "fixed";
    down.style.bottom = "50px";
    down.style.right = "20px";
    document.body.appendChild(up);
    document.body.appendChild(down);
    up.addEventListener("touchstart", () => playerPaddle.y -= paddleSpeed);
    down.addEventListener("touchstart", () => playerPaddle.y += paddleSpeed);
    pongModal.addEventListener("click", () => {
      up.remove();
      down.remove();
    }, { once: true });
  }

  requestAnimationFrame(gameLoop);
}

function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.dx = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
  ball.dy = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
}

// Tutorial
document.getElementById("tutorial").addEventListener("click", () => {
  startTutorial();
});

const tutorialSteps = [
  {
    text: "Welcome to Chem Chat 1.9! Click the Account dropdown to sign in or sign up.",
    element: "#account-dropdown",
    action: () => document.getElementById("account-content").classList.add("show")
  },
  {
    text: "Click Sign Up to create an account. Enter a username and password.",
    element: "#sign-up",
    action: () => {
      document.getElementById("account-content").classList.add("show");
      document.getElementById("sign-up-modal").classList.remove("hidden");
    }
  },
  {
    text: "Sign in with your account code and password.",
    element: "#sign-in",
    action: () => {
      document.getElementById("sign-up-modal").classList.add("hidden");
      document.getElementById("account-content").classList.add("show");
      document.getElementById("sign-in-modal").classList.remove("hidden");
    }
  },
  {
    text: "Change your account status to Public or Private.",
    element: "#account-status",
    action: () => {
      document.getElementById("sign-in-modal").classList.add("hidden");
      updateAccountDropdown(true); // Simulate signed-in state
      document.getElementById("account-status-modal").classList.remove("hidden");
    }
  },
  {
    text: "View your account info, including username, friend ID, and scores.",
    element: "#info",
    action: () => {
      document.getElementById("account-status-modal").classList.add("hidden");
      document.getElementById("info-modal").classList.remove("hidden");
    }
  },
  {
    text: "Add a friend using their username and friend ID.",
    element: "#add-friend",
    action: () => {
      document.getElementById("info-modal").classList.add("hidden");
      document.getElementById("friends-content").classList.add("show");
      document.getElementById("add-friend-modal").classList.remove("hidden");
    }
  },
  {
    text: "View your friends list and their online status.",
    element: "#friends-list",
    action: () => {
      document.getElementById("add-friend-modal").classList.add("hidden");
      document.getElementById("friends-content").classList.add("show");
      document.getElementById("friends-list-modal").classList.remove("hidden");
    }
  },
  {
    text: "Check notifications for friend requests and group invites.",
    element: "#notifications",
    action: () => {
      document.getElementById("friends-list-modal").classList.add("hidden");
      document.getElementById("friends-content").classList.add("show");
      document.getElementById("notifications-modal").classList.remove("hidden");
    }
  },
  {
    text: "Create a group chat by inviting friends.",
    element: "#invite-group",
    action: () => {
      document.getElementById("notifications-modal").classList.add("hidden");
      document.getElementById("friends-content").classList.add("show");
      document.getElementById("invite-group").click();
    }
  },
  {
    text: "Join a group chat you’ve been invited to.",
    element: "#join-group-chat",
    action: () => {
      document.querySelectorAll(".modal").forEach(modal => modal.classList.add("hidden"));
      document.getElementById("group-chat-modal").classList.remove("hidden");
    }
  },
  {
    text: "Start a new chat room with a random code.",
    element: "#start-chat",
    action: () => {
      document.getElementById("group-chat-modal").classList.add("hidden");
      document.getElementById("chat-room-modal").classList.remove("hidden");
      document.getElementById("room-code-display").textContent = "ABC123";
    }
  },
  {
    text: "Join a chat room using a room code.",
    element: "#join-chat",
    action: () => {
      document.getElementById("chat-room-modal").classList.add("hidden");
      document.getElementById("room-code").value = "ABC123";
    }
  },
  {
    text: "You’re all set! Explore Chem Chat 1.9 and have fun!",
    element: null,
    action: () => {
      document.getElementById("room-code").value = "";
      document.querySelectorAll(".modal").forEach(modal => modal.classList.add("hidden"));
    }
  }
];

let currentStep = 0;

function startTutorial() {
  document.getElementById("tutorial-modal").classList.remove("hidden");
  const overlay = document.createElement("div");
  overlay.className = "tutorial-overlay";
  document.body.appendChild(overlay);
  updateTutorialStep();
}

function updateTutorialStep() {
  const step = tutorialSteps[currentStep];
  document.getElementById("tutorial-text").textContent = step.text;
  document.getElementById("tutorial-prev").disabled = currentStep === 0;
  document.getElementById("tutorial-next").disabled = currentStep === tutorialSteps.length - 1;
  document.querySelectorAll(".tutorial-highlight").forEach(el => el.classList.remove("tutorial-highlight"));
  if (step.element) {
    const el = document.querySelector(step.element);
    if (el) el.classList.add("tutorial-highlight");
  }
  if (step.action) step.action();
}

document.getElementById("tutorial-prev").addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep--;
    updateTutorialStep();
  }
});

document.getElementById("tutorial-next").addEventListener("click", () => {
  if (currentStep < tutorialSteps.length - 1) {
    currentStep++;
    updateTutorialStep();
  }
});

document.getElementById("tutorial-exit").addEventListener("click", () => {
  document.getElementById("tutorial-modal").classList.add("hidden");
  document.querySelectorAll(".modal").forEach(modal => modal.classList.add("hidden"));
  document.querySelectorAll(".dropdown-content").forEach(d => d.classList.remove("show"));
  document.querySelectorAll(".tutorial-highlight").forEach(el => el.classList.remove("tutorial-highlight"));
  document.querySelector(".tutorial-overlay")?.remove();
  currentStep = 0;
});
