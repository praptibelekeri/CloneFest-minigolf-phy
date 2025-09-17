import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BallPhysics } from './physics.js';
import { attachAimControls } from './wireAim.js';
import { updateHUDStroke, updateHUDHole, updatePowerUI, showHoleComplete, hideHoleComplete } from './ui.js';

const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x88caff);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 6, 10);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.2, 0);
controls.update();

// lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(5, 10, 5);
dir.castShadow = true;
scene.add(dir);

// ground
const groundMat = new THREE.MeshStandardMaterial({ color: 0x2f8b3a });
const groundGeo = new THREE.PlaneGeometry(40, 40);
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI/2;
ground.receiveShadow = true;
scene.add(ground);

// ball
const BALL_RADIUS = 0.12;
const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.3 });
const ball = new THREE.Mesh(ballGeo, ballMat);
ball.castShadow = true;
ball.position.set(0, BALL_RADIUS, 0);
scene.add(ball);

// simple walls
const walls = [];
function makeWall(x,z,w,d,h=0.5) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, h/2, z);
  m.receiveShadow = true;
  scene.add(m);
  walls.push(m);
  return m;
}
makeWall(0, -2.2, 10, 0.4);
makeWall(0, 2.2, 10, 0.4);
makeWall(6.0, 0, 0.4, 4.8);

// hole
const holePos = new THREE.Vector3(6.5, 0, 0);
const holeGeo = new THREE.CircleGeometry(0.25, 24);
holeGeo.rotateX(-Math.PI/2);
const holeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
const holeMesh = new THREE.Mesh(holeGeo, holeMat);
holeMesh.position.copy(holePos);
scene.add(holeMesh);

// physics
const ballPhysics = new BallPhysics(ball, {
  radius: BALL_RADIUS,
  groundY: 0,
  friction: 3.2,
  restitution: 0.55,
  colliders: walls,
  hole: { position: holePos, radius: 0.25 },
  onHole: ({strokes}) => showHoleComplete(strokes),
  onStroke: (s) => updateHUDStroke(s)
});

attachAimControls(renderer, camera, ball, ballPhysics, scene, { groundY: 0, powerScale: 4, maxPower: 18 });

// HUD buttons
document.getElementById('resetBtn').addEventListener('click', () => {
  ballPhysics.resetToStart();
  updateHUDStroke(0);
  hideHoleComplete();
});
document.getElementById('nextBtn').addEventListener('click', () => {
  ballPhysics.teleport(new THREE.Vector3(0, BALL_RADIUS, 0));
  updateHUDStroke(0);
  hideHoleComplete();
});
document.getElementById('nextLevelBtn').addEventListener('click', () => {
  document.getElementById('nextBtn').click();
});

updateHUDHole(1, 3);
updateHUDStroke(0);
updatePowerUI(0, 18);

// loop
let last = performance.now();
function animate(t) {
  requestAnimationFrame(animate);
  const now = t;
  const delta = Math.min((now - last) / 1000, 0.05);
  last = now;
  ballPhysics.update(delta);
  controls.update();
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
  renderer.setSize(w,h);
});
