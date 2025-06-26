// 🔧 INSERT YOUR FIREBASE CONFIG HERE:
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

let roomCode = "";
const name = "User" + Math.floor(Math.random() * 1000); // Random name

function generateRoomCode() {
  return Math.random().toString(36).substr(2, 5).toUpperCase();
}

function startRoom() {
  roomCode = generateRoomCode();
  enterChatRoom(roomCode);
}

function joinRoom() {
  const input = document.getElementById("roomInput").value.trim().toUpperCase();
  if (!input) return alert("Enter a valid room code");
  roomCode = input;
  enterChatRoom(roomCode);
}

function enterChatRoom(code) {
  document.getElementById("mainMenu").style.display = "none";
  document.getElementById("chatArea").style.display = "block";
  document.getElementById("currentRoomCode").innerText = code;

  const roomRef = db.ref("rooms/" + code);
  roomRef.on("child_added", (data) => {
    const msg = data.val();
    addMessage(msg.name + ": " + msg.text);
  });
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;

  db.ref("rooms/" + roomCode).push({
    name: name,
    text: text
  });

  input.value = "";
}

function addMessage(message) {
  const messagesDiv = document.getElementById("messages");
  const msgEl = document.createElement("div");
  msgEl.textContent = message;
  messagesDiv.appendChild(msgEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Press Enter to send, Shift+Enter for newline
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("messageInput").addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});
