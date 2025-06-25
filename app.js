document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("intro");
  const main = document.getElementById("main");
  const bgMusic = document.getElementById("bg-music");
  let bgMusicEnabled = true;

  setTimeout(() => {
    intro.style.display = "none";
    main.classList.remove("hidden");
    if (bgMusicEnabled) bgMusic.play().catch(() => {});
  }, 5500);

  // Main menu button functionality
  document.getElementById("start-chat").addEventListener("click", () => {
    alert("Start Chat clicked! (Placeholder)");
  });

  document.getElementById("join-chat").addEventListener("click", () => {
    alert("Join Chat clicked! (Placeholder)");
  });

  document.getElementById("join-group-chat").addEventListener("click", () => {
    alert("Join Group Chat clicked! (Placeholder)");
  });

  document.getElementById("settings").addEventListener("click", () => {
    alert("Settings clicked! (Placeholder)");
  });

  document.getElementById("tutorial").addEventListener("click", () => {
    alert("Tutorial clicked! (Placeholder)");
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
    alert("Sign In clicked! (Placeholder)");
  });

  document.getElementById("sign-up").addEventListener("click", () => {
    alert("Sign Up clicked! (Placeholder)");
  });

  // Friends dropdown functionality
  document.getElementById("friends-dropdown").addEventListener("click", () => {
    const content = document.getElementById("friends-content");
    content.classList.toggle("show");
  });

  document.getElementById("friends-list").addEventListener("click", () => {
    alert("Friends List clicked! (Placeholder)");
  });

  document.getElementById("add-friend").addEventListener("click", () => {
    alert("Add Friend clicked! (Placeholder)");
  });

  document.getElementById("invite-group").addEventListener("click", () => {
    alert("Invite to Group Chat clicked! (Placeholder)");
  });

  document.getElementById("notifications").addEventListener("click", () => {
    alert("Notifications clicked! (Placeholder)");
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
  let ballSpeed = 5;

  function resetGameState() {
    playerPaddle.score = 0;
    opponentPaddle.score = 0;
    gameActive = false;
    document.querySelectorAll(".difficulty-btn").forEach(btn => btn.classList.remove("selected"));
    document.getElementById("normal").classList.add("selected");
    ballSpeed = 5;
    resetBall();
  }

  function setupControls() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const phoneControls = document.getElementById("phone-controls");
    if (isMobile) {
      phoneControls.classList.remove("hidden");
      phoneControls.classList.add("active");
      document.getElementById("touch-control").classList.add("selected"); // Default to touch
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
    opponentPaddle.y += (ball.y - (opponentPaddle.y + 30)) * 0.1;
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
    ballSpeed = 2;
  });

  document.getElementById("normal").addEventListener("click", () => {
    document.querySelectorAll(".difficulty-btn").forEach(btn => btn.classList.remove("selected"));
    document.getElementById("normal").classList.add("selected");
    ballSpeed = 5;
  });

  document.getElementById("hard").addEventListener("click", () => {
    document.querySelectorAll(".difficulty-btn").forEach(btn => btn.classList.remove("selected"));
    document.getElementById("hard").classList.add("selected");
    ballSpeed = 8;
  });

  document.getElementById("confirm-difficulty").addEventListener("click", startPongGame);
});
