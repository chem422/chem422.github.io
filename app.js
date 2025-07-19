import * as THREE from 'three';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, push } from "firebase/database";

// Firebase setup
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
let scene, camera, renderer, raycaster, player, keys = {};
let chatVisible = false;

document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 't') toggleChat();
});
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

document.getElementById('chat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const msg = e.target.value;
    push(ref(db, `rooms/${roomCode}/chat`), msg);
    e.target.value = '';
  }
});

function toggleChat() {
  chatVisible = !chatVisible;
  document.getElementById('chat-container').style.display = chatVisible ? 'block' : 'none';
}

function startRoom(create) {
  roomCode = document.getElementById('room-code').value;
  if (!roomCode) return alert("Room code required");
  document.getElementById('room-ui').style.display = 'none';
  initGame();
  listenChat();
}

function listenChat() {
  const log = document.getElementById('chat-log');
  onValue(ref(db, `rooms/${roomCode}/chat`), snapshot => {
    log.innerHTML = '';
    const data = snapshot.val();
    if (data) Object.values(data).forEach(msg => {
      log.innerHTML += `<div>${msg}</div>`;
    });
  });
}

function initGame() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
  renderer.setSize(window.innerWidth, window.innerHeight);

  raycaster = new THREE.Raycaster();
  player = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
  scene.add(player);

  // Ground
  for (let x = -10; x <= 10; x++) {
    for (let z = -10; z <= 10; z++) {
      const voxel = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial({ color: 0x00aa00 }));
      voxel.position.set(x, -1, z);
      scene.add(voxel);
    }
  }

  camera.position.y = 2;
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  handleMovement();
  renderer.render(scene, camera);
}

function handleMovement() {
  if (keys['w']) camera.position.z -= 0.1;
  if (keys['s']) camera.position.z += 0.1;
  if (keys['a']) camera.position.x -= 0.1;
  if (keys['d']) camera.position.x += 0.1;
  if (keys[' ']) camera.position.y += 0.1;
}
