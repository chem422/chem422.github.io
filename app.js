let hiddenClickCount = 0;
let postRickrollUnlocked = false;

function rickRoll() {
  window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
}

function handleCoreClick(coreCount) {
  if (coreCount === 10) {
    const file = new Blob(
      ['<html><head><meta http-equiv="refresh" content="0; URL=https://youtu.be/dQw4w9WgXcQ"></head></html>'],
      { type: 'text/html' }
    );
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(file);
    downloadLink.download = "more_cores.html";
    downloadLink.click();
  } else if (coreCount === 50) {
    alert("Yes.");
  } else if (coreCount === 20000) {
    alert("4060-4385-4535-1204");
  }
}

function tapSecret() {
  hiddenClickCount++;
  if (hiddenClickCount === 5) {
    document.getElementById("secret-menu").style.display = "block";
  }
}

function verifyCode() {
  const input = document.getElementById("code-input").value.trim();
  if (input === "4060-4385-4535-1204") {
    window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    postRickrollUnlocked = true;
  } else if (
    postRickrollUnlocked &&
    input.startsWith("4060-4385-4535-1204-")
  ) {
    alert("Welcome, " + input.split("-").slice(-1)[0]);
  } else {
    alert("Invalid code.");
  }
}
