document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("intro");
  const main = document.getElementById("main");
  const bgMusic = document.getElementById("bg-music");
  let bgMusicEnabled = true;
  let isSignedIn = false;
  let friends = [];

  setTimeout(() => {
    intro.style.display = "none";
    main.classList.remove("hidden");
    if (bgMusicEnabled) bgMusic.play().catch(() => {});
  }, 5500);

  // Replace with your Firebase config from the Firebase Console
  const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // Main menu button functionality
  document.getElementById("start-chat").addEventListener("click", () => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    document.getElementById("room-code-display").textContent = roomCode;
    document.getElementById("chat-room-modal").classList.remove("hidden");
    loadChatMessages(roomCode);
  });

  document.getElementById("join-chat").addEventListener("click", () => {
    const roomCode = document.getElementById("room-code").value.trim();
    if (roomCode) {
      document.getElementById("room-code-display").textContent = roomCode;
      document.getElementById("chat-room-modal").classList.remove("hidden");
      loadChatMessages(roomCode);
    } else {
      alert("Please enter a room code!");
    }
  });

  document.getElementById("join-group-chat").addEventListener("click", () => {
    alert("Join Group Chat clicked! (Placeholder)");
  });

  document.getElementById("settings").addEventListener("click", () => {
    document.getElementById("settings-modal").classList.remove("hidden");
  });

  document.getElementById("tutorial").addEventListener("click", () => {
    document.getElementById("tutorial-modal").classList.remove("hidden");
    document.getElementById("tutorial-text").textContent = "Welcome to Chem Chat! Use the menu to start a chat or play Pong.";
  });

  document.getElementById("play-pong").addEventListener("click", () => {
    document.getElementById("pong-modal").classList.remove("hidden");
    resetGameState();
    setupControls();
  });

  // Account dropdown functionality
  document.getElementById("account-dropdown").addEventListener("click", () => {
    const content = document.getElementById("account-content");
    content.classList.toggle("show");
  });

  document.getElementById("sign-in").addEventListener("click", () => {
    const username = prompt("Enter username:");
    if (username) {
      isSignedIn = true;
      document.getElementById("account-status-text").textContent = `Signed in as ${username}.`;
      document.getElementById("sign-in").classList.add("hidden");
      document.getElementById("sign-up").classList.add("hidden");
      document.getElementById("sign-out").classList.remove("hidden");
    }
  });

  document.getElementById("sign-up").addEventListener("click", () => {
    const username = prompt("Choose a username:");
    if (username) {
      isSignedIn = true;
      document.getElementById("account-status-text").textContent = `Signed in as ${username}.`;
      document.getElementById("sign-in").classList.add("hidden");
      document.getElementById("sign-up").classList.add("hidden");
      document.getElementById("sign-out").classList.remove("hidden");
    }
  });

  document.getElementById("sign-out").addEventListener("click", () => {
    isSignedIn = false;
    document.getElementById("account-status-text").textContent = "You are not signed in.";
    document.getElementById("sign-in").classList.remove("hidden");
    document.getElementById("sign-up").classList.remove("hidden");
    document.getElementById("sign-out").classList.add("hidden");
  });

  // Friends dropdown functionality
  document.getElementById("friends-dropdown").addEventListener("click", () => {
    const content = document.getElementById("friends-content");
    content.classList.toggle("show");
    updateFriendsList();
  });

  document.getElementById("add-friend").addEventListener("click", () => {
    const friendName = prompt("Enter friend’s name:");
    if (friendName && !friends.includes(friendName)) {
      friends.push(friendName);
      updateFriendsList();
      showNotification(`Added ${friendName} as a friend!`);
    } else if (friends.includes(friendName)) {
      alert("Friend already added!");
    }
  });

  document.getElementById("invite-group").addEventListener("click", () => {
    if (friends.length > 0) {
      alert("Invited friends to group chat! (Placeholder)");
    } else {
      alert("No friends to invite!");
    }
  });

  document.getElementById("notifications").addEventListener("click", () => {
    alert("Notifications clicked! (Placeholder)");
  });

  // Chat room functionality
  document.querySelector("#chat-room-modal .back").addEventListener("click", () => {
    document.getElementById("chat-room-modal").classList.add("hidden");
  });

  document.getElementById("chat-send").addEventListener("click", () => {
    const chatInput = document.getElementById("chat-input");
    const message = chatInput.value.trim();
    const roomCode = document.getElementById("room-code-display").textContent;
    if (message && isSignedIn) {
      sendMessage(roomCode, message);
      chatInput.value = "";
    } else if (!isSignedIn) {
      alert("Please sign in to send messages!");
    }
  });

  document.getElementById("chat-add").addEventListener("click", () => {
    if (isSignedIn) {
      alert("Add user to chat! (Placeholder)");
    } else {
      alert("Please sign in to add users!");
    }
  });

  // Settings modal functionality
  document.querySelector("#settings-modal .back").addEventListener("click", () => {
    document.getElementById("settings-modal").classList.add("hidden");
  });

  document.getElementById("save-settings").addEventListener("click", () => {
    bgMusicEnabled = document.getElementById("bg-music-toggle").checked;
    if (bgMusicEnabled) bgMusic.play().catch(() => {});
    else bgMusic.pause();
    document.getElementById("settings-modal").classList.add("hidden");
  });

  // Tutorial modal functionality
  document.querySelector("#tutorial-modal .back").addEventListener("click", () => {
    document.getElementById("tutorial-modal").classList.add("hidden");
  });

  document.getElementById("tutorial-exit").addEventListener("click", () => {
    document.getElementById("tutorial-modal").classList.add("hidden");
  });

  let tutorialStep = 0;
  const tutorialTexts = [
    "Welcome to Chem Chat! Use the menu to start a chat or play Pong.",
    "Sign in to access all features via the Account dropdown.",
    "Add friends and invite them to group chats from the Friends menu.",
    "Enjoy the game and explore settings for customization."
  ];
  document.getElementById("tutorial-next").addEventListener("click", () => {
    tutorialStep = (tutorialStep + 1) % tutorialTexts.length;
    document.getElementById("tutorial-text").textContent = tutorialTexts[tutorialStep];
  });
  document.getElementById("tutorial-prev").addEventListener("click", () => {
    tutorialStep = (tutorialStep - 1 + tutorialTexts.length) % tutorialTexts.length;
    document.getElementById("tutorial-text").textContent = tutorialTexts[tutorialStep];
  });

  // Pong game functionality
  document.querySelector("#pong-modal .back").addEventListener("click", () => {
    document.getElementById("pong-modal").classList.add("hidden");
    gameActive = false;
  });

  const pongCanvas = document.getElementById("pong-canvas");
  pongCanvas.width = window.innerWidth * 0.9;
  pongCanvas.height = window.innerHeight * 0.6;
  const ctx = pongCanvas.getContext("2d");
  let playerPaddle = { x: 10, y: pongCanvas.height / 2 - 30, score: 0 };
  let opponentPaddle = { x: pongCanvas.width - 20, y: pongCanvas.height / 2 - 30, score: 0 };
  let ball = { x: pongCanvas.width / 2, y: pongCanvas.height / 2, dx: 5, dy: 5 };
  let gameActive = false;
  let ballSpeed = 2.5;

  function resetGameState() {
    playerPaddle.score = 0;
    opponentPaddle.score = 0;
    gameActive = false;
    document.querySelectorAll(".difficulty-btn").forEach(btn => btn.classList.remove("selected"));
    document.getElementById("normal").classList.add("selected");
    ballSpeed = 2.5;
    resetBall();
  }

  function setupControls() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const phoneControls = document.getElementById("phone-controls");
    if (isMobile) {
      phoneControls.classList.remove("hidden");
      phoneControls.classList.add("active");
      document.getElementById("touch-control").classList.add("selected");
    } else {
      phoneControls.classList.add("hidden");
    }
  }

  function startPongGame() {
    gameActive = true;
    gameLoop();
  }

  function gameLoop() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, pongCanvas.width, pongCanvas.height);
    ctx.fillStyle = "#0ff";
    ctx.fillRect(playerPaddle.x, playerPaddle.y, 10, 60);

    const timeToReachPaddle = (pongCanvas.width - opponentPaddle.x - ball.x) / Math.abs(ball.dx);
    const predictedY = ball.y + ball.dy * timeToReachPaddle;
    opponentPaddle.y += (predictedY - (opponentPaddle.y + 30)) * 0.15;

    if (opponentPaddle.y < 0) opponentPaddle.y = 0;
    if (opponentPaddle.y > pongCanvas.height - 60) opponentPaddle.y = pongCanvas.height - 60;

    ctx.fillRect(opponentPaddle.x, opponentPaddle.y, 10, 60);
    ctx.fillRect(ball.x, ball.y, 10, 10);
    ctx.fillText(playerPaddle.score, pongCanvas.width / 4, 30);
    ctx.fillText(opponentPaddle.score, 3 * pongCanvas.width / 4, 30);
    ball.x += ball.dx / 2;
    ball.y += ball.dy / 2;
    if (ball.y <= 0 || ball.y >= pongCanvas.height - 10) ball.dy *= -1;
    if (ball.x <= playerPaddle.x + 10 && ball.y >= playerPaddle.y && ball.y <= playerPaddle.y + 60) ball.dx *= -1;
    if (ball.x >= opponentPaddle.x - 10 && ball.y >= opponentPaddle.y && ball.y <= opponentPaddle.y + 60) ball.dx *= -1;
    if (ball.x <= 0) { opponentPaddle.score++; resetBall(); }
    if (ball.x >= pongCanvas.width - 10) { playerPaddle.score++; resetBall(); }
    if (playerPaddle.score >= 10 || opponentPaddle.score >= 10) {
      alert(`Game Over! ${playerPaddle.score >= 10 ? "You" : "Opponent"} Win!`);
      gameActive = false;
    }
    requestAnimationFrame(gameLoop);
  }

  function resetBall() {
    ball.x = pongCanvas.width / 2;
    ball.y = pongCanvas.height / 2;
    ball.dx = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
  }

  // PC controls
  document.addEventListener("keydown", (e) => {
    if (gameActive && !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      if (e.key === "w" && playerPaddle.y > 0) playerPaddle.y -= 5;
      if (e.key === "s" && playerPaddle.y < pongCanvas.height - 60) playerPaddle.y += 5;
    }
  });

  // Mobile touch controls
  pongCanvas.addEventListener("touchmove", (e) => {
    if (gameActive && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = pongCanvas.getBoundingClientRect();
      const touchY = touch.clientY - rect.top;
      playerPaddle.y = touchY - 30;
      if (playerPaddle.y < 0) playerPaddle.y = 0;
      if (playerPaddle.y > pongCanvas.height - 60) playerPaddle.y = pongCanvas.height - 60;
    }
  }, { passive: false });

  // Difficulty selection
  document.getElementById("easy").addEventListener("click", () => {
    document.querySelectorAll(".difficulty-btn").forEach(btn => btn.classList.remove("selected"));
    document.getElementById("easy").classList.add("selected");
    ballSpeed = 1;
  });

  document.getElementById("normal").addEventListener("click", () => {
    document.querySelectorAll(".difficulty-btn").forEach(btn => btn.classList.remove("selected"));
    document.getElementById("normal").classList.add("selected");
    ballSpeed = 2.5;
  });

  document.getElementById("hard").addEventListener("click", () => {
    document.querySelectorAll(".difficulty-btn").forEach(btn => btn.classList.remove("selected"));
    document.getElementById("hard").classList.add("selected");
    ballSpeed = 4;
  });

  document.getElementById("confirm-difficulty").addEventListener("click", startPongGame);

  // Chat functions
  function sendMessage(roomCode, message) {
    if (isSignedIn) {
      const chatRef = db.collection("chatRooms").doc(roomCode).collection("messages");
      chatRef.add({
        text: message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        user: document.getElementById("account-status-text").textContent.replace("Signed in as ", "").replace(".", "")
      }).then(() => {
        loadChatMessages(roomCode);
      }).catch((error) => {
        console.error("Error sending message: ", error);
      });
    }
  }

  function loadChatMessages(roomCode) {
    const chatMessages = document.getElementById("chat-messages");
    chatMessages.innerHTML = "";
    const chatRef = db.collection("chatRooms").doc(roomCode).collection("messages")
      .orderBy("timestamp", "asc");
    chatRef.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const messageDiv = document.createElement("div");
          const data = change.doc.data();
          messageDiv.textContent = `${data.user}: ${data.text}`;
          chatMessages.appendChild(messageDiv);
        }
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, (error) => {
      console.error("Error loading messages: ", error);
    });
  }

  // Friends functions
  function updateFriendsList() {
    const friendsList = document.getElementById("friends-list");
    friendsList.innerHTML = "";
    friends.forEach(friend => {
      const friendDiv = document.createElement("div");
      friendDiv.textContent = friend;
      friendsList.appendChild(friendDiv);
    });
  }

  function showNotification(message) {
    const notification = document.getElementById("notification-popup");
    notification.textContent = message;
    notification.classList.remove("hidden");
    setTimeout(() => notification.classList.add("hidden"), 3000);
  }
});
