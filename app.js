// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC_BX4N_7gO3tGZvGh_4MkHOQ2Ay2mRsRc",
    authDomain: "chat-room-22335.firebaseapp.com",
    projectId: "chat-room-22335",
    storageBucket: "chat-room-22335.appspot.com",
    messagingSenderId: "20974926341",
    appId: "1:20974926341:web:c413eb3122887d6803fa6c",
    measurementId: "G-WB5QY60EG6"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM Elements
const mainMenu = document.getElementById('main-menu');
const chatRoom = document.getElementById('chat-room');
const startChatBtn = document.getElementById('start-chat');
const joinChatBtn = document.getElementById('join-chat');
const roomCodeInput = document.getElementById('room-code');
const currentRoomCode = document.getElementById('current-room-code');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message');
const leaveRoomBtn = document.getElementById('leave-room');
const notificationSound = document.getElementById('notification-sound');

// Global variables
let currentRoom = null;
let username = `User${Math.floor(Math.random() * 1000)}`;

// Switch between main menu and chat room
function showChatRoom(roomCode) {
    mainMenu.classList.add('hidden');
    chatRoom.classList.remove('hidden');
    currentRoomCode.textContent = roomCode;
    currentRoom = roomCode;
    listenForMessages();
}

function showMainMenu() {
    chatRoom.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    currentRoom = null;
    messagesContainer.innerHTML = '';
    roomCodeInput.value = '';
}

// Play notification sound
function playNotificationSound() {
    notificationSound.currentTime = 0; // Rewind to start in case it's playing
    notificationSound.play().catch(e => console.log("Audio play failed:", e));
}

// Send a message to the current room
function sendMessage() {
    const messageText = messageInput.value.trim();
    if (messageText && currentRoom) {
        const timestamp = Date.now();
        database.ref(`rooms/${currentRoom}/messages`).push().set({
            text: messageText,
            sender: username,
            timestamp: timestamp
        });
        messageInput.value = '';
    }
}

// Listen for new messages in the current room
function listenForMessages() {
    if (!currentRoom) return;
    
    database.ref(`rooms/${currentRoom}/messages`).on('child_added', (snapshot) => {
        const message = snapshot.val();
        displayMessage(message);
    });
}

// Display a message in the chat
function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    if (message.sender === username) {
        messageElement.classList.add('sent');
        messageElement.textContent = message.text;
    } else {
        messageElement.classList.add('received');
        messageElement.innerHTML = `<strong>${message.sender}:</strong> ${message.text}`;
        playNotificationSound(); // Play sound for received messages
    }
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Event Listeners
startChatBtn.addEventListener('click', () => {
    const customRoomName = prompt("Enter a name for your chat room:");
    if (customRoomName && customRoomName.trim() !== "") {
        showChatRoom(customRoomName.trim());
    } else {
        alert("Please enter a valid room name");
    }
});

joinChatBtn.addEventListener('click', () => {
    const roomCode = roomCodeInput.value.trim();
    if (roomCode !== "") {
        // Check if room exists
        database.ref(`rooms/${roomCode}`).once('value').then((snapshot) => {
            if (snapshot.exists()) {
                showChatRoom(roomCode);
            } else {
                alert('Room not found. Please check the name and try again.');
            }
        });
    } else {
        alert('Please enter a room name.');
    }
});

sendMessageBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

leaveRoomBtn.addEventListener('click', showMainMenu);

// Initialize
showMainMenu();
