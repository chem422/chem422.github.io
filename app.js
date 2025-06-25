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
});
