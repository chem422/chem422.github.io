import * as THREE from 'three';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, push } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC_BX4N_7gO3tGZvGh_4MkHOQ2Ay2mRsRc",
  authDomain: "chat-room-22335.firebaseapp.com",
  databaseURL: "https://chat-room-22335-default-rtdb.firebaseio.com",
  projectId: "chat-room-22335",
  storageBucket: "chat-room-22335.appspot.com",
  messagingSenderId: "20974926341",
  appId: "1:20974926341:web:8e03564116b082cb03fa6c"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let roomCode = "";
let scene, camera, renderer, raycaster;
let keys = {}, chatVisible = false;
const voxels = [];

document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 't') toggleChat();
});
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

document.getElementById('chat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const msg = e.target.value;
    if (msg.length > 0) {
      push(ref(db, `rooms/${roomCode}/chat`), { text: msg });
      e.target.value = '';
    }
  }
});

function toggleChat() {
  chatVisible = !chatVisible;
  document.getElementById('chat-box').style.display = chatVisible ? 'block' : 'none';
}

function startRoom(isCreate) {
  const input = document.getElementById('room-input');
  roomCode = input.value.trim();
  if (!roomCode) return alert("Enter a room code!");

  document.getElementById('menu').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';

  if (isCreate) {
    set(ref(db, `rooms/${roomCode}`), { created: Date.now() });
  }

  initGame();
  listenChat();
}

function listenChat() {
  const log = document.getElementById('chat-log');
  onValue(ref(db, `rooms/${roomCode}/chat`), snapshot => {
    const data = snapshot.val();
    log.innerHTML = '';
    if (data) {
      Object.values(data).forEach(entry => {
        log.innerHTML += `<div>> ${entry.text}</div>`;
      });
    }
  });
}

function initGame() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);

  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
  renderer.setSize(window.innerWidth, window.innerHeight);

  raycaster = new THREE.Raycaster();

  // green voxel land
  const voxelMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  for (let x = -10; x <= 10; x++) {
    for (let z = -10; z <= 10; z++) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(1,1
