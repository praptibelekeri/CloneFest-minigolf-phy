// src/main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BallPhysics } from './physics.js';
import { attachAimControls } from './wireAim.js';
import {
  updateHUDStroke,
  updateHUDHole,
  updatePowerUI,
  showHoleComplete,
  hideHoleComplete,
  updateBestText,
} from './ui.js';
import { levels } from './levels.js';

/* ----------------- START OVERLAY HANDLING ----------------- */
const startOverlay = document.getElementById('startOverlay');
const playBtn = document.getElementById('playBtn');
const settingsBtn = document.getElementById('settingsBtn');
const howtoBtn = document.getElementById('howtoBtn');

function showStartScreen() {
  startOverlay.style.display = 'flex';
}
function hideStartScreen() {
  startOverlay.style.display = 'none';
}

// Button interactions
playBtn.addEventListener('click', () => {
  hideStartScreen();
});
settingsBtn.addEventListener('click', () => alert('Settings panel goes here.'));
howtoBtn.addEventListener('click', () => alert('Show how-to-play instructions here.'));

// renderer
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();

// textures
const texLoader = new THREE.TextureLoader();
const grassTex = texLoader.load('/textures/grass.jpg');
grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
grassTex.repeat.set(20, 20);

const wallTex = texLoader.load('/textures/wood.jpg');
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;

// sky
try {
  const skyTex = texLoader.load('/textures/sky.jpg');
  const skyGeo = new THREE.SphereGeometry(100, 32, 32);
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyMesh);
} catch (e) {
  scene.background = new THREE.Color(0x88caff);
}

// camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 6, 10);

// controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.2, 0);
controls.update();

// lights
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.5));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 5);
dir.castShadow = true;
scene.add(dir);
scene.add(new THREE.AmbientLight(0xffffff, 0.25));

// ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ map: grassTex })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ball
const BALL_RADIUS = 0.12;
const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
const ballMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.2,
  roughness: 0.3,
});
const ball = new THREE.Mesh(ballGeo, ballMat);
ball.castShadow = true;
scene.add(ball);

// helpers
let levelIndex = 0;
let levelMeshes = [];
let holeMesh = null;

function makeWall(x, z, w, d, h = 0.5) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ map: wallTex });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, h / 2, z);
  m.receiveShadow = true;
  scene.add(m);
  levelMeshes.push(m);
  return m;
}

function makeHoleMesh(pos, radius) {
  // Group for all hole parts so it can be managed as one unit
  const group = new THREE.Group();

  // Cup wall (slightly flared/tapered: top a bit wider than bottom)
  // - Use open-ended cylinder for the side wall
  // - Smooth interior with high radial segments
  const topRadius = radius * 1.05;   // slightly wider at the top
  const bottomRadius = radius * 0.95; // slightly tighter at the bottom
  const cupDepth = 0.22;
  const cupGeo = new THREE.CylinderGeometry(
    topRadius,            // radiusTop
    bottomRadius,         // radiusBottom
    cupDepth,             // height
    64,                   // radial segments for smoothness
    1,                    // height segments
    true                  // openEnded (no caps)
  );
  const cupMat = new THREE.MeshStandardMaterial({
    color: 0x202020,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const cup = new THREE.Mesh(cupGeo, cupMat);
  // Sink the cup into the ground so the rim sits at y≈0
  cup.position.set(pos.x, -cupDepth / 2, pos.z);
  cup.castShadow = false;
  cup.receiveShadow = true;
  group.add(cup);

  // Cup bottom (dark disk)
  const baseGeo = new THREE.CircleGeometry(bottomRadius, 64);
  baseGeo.rotateX(-Math.PI / 2);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.9,
    metalness: 0.0,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.set(pos.x, -cupDepth, pos.z);
  base.castShadow = false;
  base.receiveShadow = true;
  group.add(base);

  // Thin raised rim around the edge (slightly above ground for visual pop)
  const rimInner = radius * 1.02;
  const rimOuter = radius * 1.18;
  const rimGeo = new THREE.RingGeometry(rimInner, rimOuter, 64);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.6,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = -Math.PI / 2;
  rim.position.set(pos.x, 0.003, pos.z); // slightly above ground
  rim.castShadow = false;
  rim.receiveShadow = true;
  group.add(rim);

  // Add to scene and track for level cleanup
  scene.add(group);
  levelMeshes.push(group);
  return group;
}

// sound
const sinkSound = new Audio('/sounds/plop.wav');

// physics
const ballPhysics = new BallPhysics(ball, {
  radius: BALL_RADIUS,
  groundY: 0,
  friction: 1.5,
  restitution: 0.55,
  colliders: [],
  hole: { position: new THREE.Vector3(5, 0, 0), radius: 0.25 },
  onHole: ({ strokes }) => handleHoleComplete(strokes),
  onStroke: (s) => updateHUDStroke(s),
  onSinkSound: () => {
    sinkSound.currentTime = 0;
    sinkSound.play().catch(() => {});
  },
});

// aim controls
attachAimControls(renderer, camera, ball, ballPhysics, scene, {
  groundY: 0,
  powerScale: 4,
  maxPower: 30,
  onAimStart: () => (controls.enabled = false),
  onAimEnd: () => (controls.enabled = true),
});

// UI buttons
// UI buttons
const resetBtn = document.getElementById('resetBtn');
const nextBtn = document.getElementById('nextBtn');
const followBtn = document.getElementById('followBtn');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const replayBtn = document.getElementById('replayBtn');

// playBtn already declared at the top for start overlay

// Event listeners
resetBtn.addEventListener('click', () => {
  ballPhysics.resetToStart();
  updateHUDStroke(0);
  hideHoleComplete();
  restoreBallVisual();
});
nextBtn.addEventListener('click', () => nextLevel());
followBtn.addEventListener('click', () => {
  followBall = !followBall;
  followBtn.innerText = `Follow: ${followBall ? 'On' : 'Off'}`;
});
playBtn.addEventListener('click', () => hideStartScreen());
nextLevelBtn.addEventListener('click', () => {
  hideHoleComplete();
  nextLevel();
});
replayBtn.addEventListener('click', () => {
  hideHoleComplete();
  loadLevel(levelIndex);
});

// game state
let totalStrokes = 0;
let followBall = false;
let currentLevelInfo = null;

// storage
const STORAGE_KEY = 'minigolf_highscores';
function loadBests() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}
function saveBests(b) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(b));
}

// levels
function clearLevelMeshes() {
  for (const m of levelMeshes) scene.remove(m);
  levelMeshes = [];
  holeMesh = null;
}

function loadLevel(idx) {
  clearLevelMeshes();
  const info = levels[idx];
  if (!info) return;
  const colliders = [];
  for (const w of info.walls) colliders.push(makeWall(w.x, w.z, w.w, w.d, w.h));

  const holePos = new THREE.Vector3(...info.hole.pos);
  holeMesh = makeHoleMesh(holePos, info.hole.radius);

  ballPhysics.setColliders(colliders);
  ballPhysics.setHole({ position: holePos, radius: info.hole.radius });
  ballPhysics.teleport(new THREE.Vector3(...info.start));

  restoreBallVisual();
  updateHUDHole(info.id, info.par);
  updateHUDStroke(0);

  const bests = loadBests();
  const key = `level_${info.id}`;
  if (bests[key]) updateBestText(`Best: ${bests[key]} strokes`);
  else updateBestText('');

  currentLevelInfo = info;
}

// sinking animation
let animatingSink = false;
function animateBallSink(onDone) {
  if (animatingSink) return;
  animatingSink = true;
  const duration = 1000;
  const start = performance.now();
  const startPos = ball.position.clone();
  const holePos = ballPhysics.hole.position.clone();

  function step(ts) {
    const t = Math.min(1, (ts - start) / duration);

    // Move into hole
    const targetXZ = new THREE.Vector3(holePos.x, startPos.y, holePos.z);
    ball.position.lerpVectors(startPos, targetXZ, t * 0.9);
    ball.position.y = startPos.y - 0.25 * t;

    // Spin + shrink + fade
    ball.rotation.y += 0.2;
    const s = 1 - 0.85 * t;
    ball.scale.setScalar(s);
    ball.material.transparent = true;
    ball.material.opacity = 1 - t;

    if (t < 1) requestAnimationFrame(step);
    else {
      animatingSink = false;
      ball.material.opacity = 1;
      ball.material.transparent = false;
      if (onDone) onDone();
    }
  }
  requestAnimationFrame(step);
}

function restoreBallVisual() {
  ball.visible = true;
  ball.scale.set(1, 1, 1);
  ball.material.opacity = 1;
  ball.material.transparent = false;
}

function handleHoleComplete(strokes) {
  totalStrokes += strokes;
  animateBallSink(() => {
    ball.visible = false;
    showHoleComplete(strokes);
    const bests = loadBests();
    const key = `level_${currentLevelInfo.id}`;
    const prev = bests[key];
    if (!prev || strokes < prev) {
      bests[key] = strokes;
      saveBests(bests);
      updateBestText(`New best: ${strokes} strokes`);
    } else updateBestText(`Best: ${prev} strokes`);
  });
}

function nextLevel() {
  levelIndex = (levelIndex + 1) % levels.length;
  loadLevel(levelIndex);
  totalStrokes = 0;
}
loadLevel(levelIndex);

// animate
let lastTime = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  ballPhysics.update(delta);

  if (followBall) {
    const targetPos = new THREE.Vector3(
      ball.position.x,
      camera.position.y,
      ball.position.z + 8
    );
    camera.position.lerp(targetPos, 0.06);
    controls.target.lerp(ball.position.clone(), 0.08);
    controls.update();
  } else {
    controls.update();
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

// start
showStartScreen();
