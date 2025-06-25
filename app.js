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

  // Button functionality
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
});
