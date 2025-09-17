// src/physics.js
import * as THREE from 'three';

/**
 * BallPhysics: ball mesh + simple physics for mini-golf
 *
 * - Exponential friction for frame-rate independence
 * - Sphere vs AABB collision resolution (robust & fast)
 * - Slope support by raycasting down and projecting velocity on hit plane
 * - Hole detection by distance + low-speed threshold
 *
 * Public API:
 *   new BallPhysics(ballMesh, options)
 *   applyShot(directionVec3, powerNumber)
 *   update(deltaSeconds)
 *   resetToStart()
 *   teleport(posVec3)
 *   setColliders(arrayOfThreeMeshes)
 */
export class BallPhysics {
  constructor(ballMesh, params = {}) {
    this.ball = ballMesh;
    this.radius = params.radius ?? 0.12;        // meters
    this.mass = params.mass ?? 0.045;           // kg (for reference)
    this.groundY = params.groundY ?? 0;
    this.friction = params.friction ?? 3.0;     // per second (exponential)
    this.restitution = params.restitution ?? 0.6;
    this.restThreshold = params.restThreshold ?? 0.02; // m/s
    this._velocity = new THREE.Vector3(0,0,0);

    this.colliders = Array.isArray(params.colliders) ? params.colliders.slice() : [];
    this._colliderBoxes = this.colliders.map(m => new THREE.Box3().setFromObject(m));

    // hole specification
    this.hole = params.hole ?? { position: new THREE.Vector3(5,0,0), radius: 0.25 };

    // callbacks
    this.onHole = params.onHole ?? (() => {});
    this.onStroke = params.onStroke ?? (() => {});
    this.onMove = params.onMove ?? (() => {});
    this.onStop = params.onStop ?? (() => {});

    this.strokes = params.initialStrokes ?? 0;

    // internal raycaster for slope detection
    this._ray = new THREE.Raycaster();
    this._tmp = new THREE.Vector3();
    this._lastMovingTime = performance.now() / 1000;
    this._stuckTimeout = params.stuckTimeout ?? 4.0;

    this.startPosition = (params.startPosition && params.startPosition.clone) ? params.startPosition.clone() : this.ball.position.clone();
  }

  get velocity() { return this._velocity; }

  setColliders(meshArray) {
    this.colliders = meshArray.slice();
    this._colliderBoxes = this.colliders.map(m => new THREE.Box3().setFromObject(m));
  }

  addCollider(mesh) {
    this.colliders.push(mesh);
    this._colliderBoxes.push(new THREE.Box3().setFromObject(mesh));
  }

  updateColliderBoxes() {
    for (let i=0;i<this.colliders.length;i++){
      this._colliderBoxes[i].setFromObject(this.colliders[i]);
    }
  }

  // direction: normalized THREE.Vector3 (y ignored), power: scalar speed
  applyShot(direction, power) {
    const dir = direction.clone();
    dir.y = 0;
    if (dir.lengthSq() === 0) return;
    dir.normalize();
    const speed = Math.max(0, power);
    this._velocity.copy(dir.multiplyScalar(speed));
    this.strokes += 1;
    try { this.onStroke(this.strokes); } catch(e){}
    this._lastMovingTime = performance.now() / 1000;
  }

  // delta in seconds
  update(delta) {
    if (delta <= 0) return;

    // subdivide to prevent tunneling
    const maxStep = 1/120; // ~8ms per substep
    let remaining = delta;
    while (remaining > 0) {
      const dt = Math.min(remaining, maxStep);
      this._updateStep(dt);
      remaining -= dt;
    }
    this._unstickIfNeeded();
  }

  _updateStep(dt) {
    // integrate 2D horizontal movement
    const disp = this._velocity.clone().multiplyScalar(dt);
    this.ball.position.add(disp);

    // simple ground clamp
    if (this.ball.position.y - this.radius < this.groundY) {
      this.ball.position.y = this.groundY + this.radius;
      if (this._velocity.y < 0) this._velocity.y = 0;
    }

    // slope projection if colliders provided - raycast down
    if (this.colliders.length) {
      this._ray.set(this.ball.position.clone(), new THREE.Vector3(0,-1,0));
      const hits = this._ray.intersectObjects(this.colliders, true);
      if (hits.length > 0) {
        const hit = hits[0];
        const faceNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
        // if slope steep enough, project velocity onto plane to simulate rolling
        if (Math.abs(faceNormal.y) < 0.999) {
          this._velocity.projectOnPlane(faceNormal);
          // small downhill bias: accelerate slightly downhill (optional)
          // const downhill = faceNormal.clone().multiplyScalar(-0.5 * (1 - faceNormal.y));
          // this._velocity.add(downhill.multiplyScalar(dt));
        }
      }
    }

    // collisions: sphere vs AABB
    for (let i=0; i < this._colliderBoxes.length; i++) {
      this._collideSphereAABB(this._colliderBoxes[i]);
    }

    // friction: exponential decay factor per dt
    const factor = Math.exp(-this.friction * dt);
    this._velocity.multiplyScalar(factor);

    // small threshold -> stop
    if (this._velocity.length() < this.restThreshold) {
      if (this._velocity.length() !== 0) {
        this._velocity.set(0,0,0);
        try { this.onStop(); } catch(e){}
      }
    } else {
      this._lastMovingTime = performance.now() / 1000;
      try { this.onMove(); } catch(e){}
    }

    // hole detection: distance + low-speed
    if (this._checkHole()) {
      this._velocity.set(0,0,0);
      try { this.onHole({strokes: this.strokes}); } catch(e){}
    }
  }

  // sphere vs AABB collision & simple response
  _collideSphereAABB(box) {
    const c = this.ball.position;
    const closest = new THREE.Vector3(
      Math.max(box.min.x, Math.min(c.x, box.max.x)),
      Math.max(box.min.y, Math.min(c.y, box.max.y)),
      Math.max(box.min.z, Math.min(c.z, box.max.z))
    );
    const delta = c.clone().sub(closest);
    const dist = delta.length();
    if (dist < this.radius && dist > 0) {
      const normal = delta.clone().divideScalar(dist);
      const penetration = this.radius - dist;
      // move ball out of collision
      this.ball.position.add(normal.clone().multiplyScalar(penetration + 1e-6));
      // velocity reflect with restitution
      const v = this._velocity;
      const vn = normal.clone().multiplyScalar(v.dot(normal));
      const vt = v.clone().sub(vn);
      // reflect normal component and apply restitution
      this._velocity.copy(vt.sub(vn.multiplyScalar(this.restitution)));
      // small damping
      this._velocity.multiplyScalar(0.95);
    } else if (dist === 0) {
      // exactly at center (rare) push up
      this.ball.position.y += 1e-3;
      this._velocity.multiplyScalar(0.5);
    }
  }

  _checkHole() {
    const d2 = this.ball.position.distanceToSquared(this.hole.position);
    const inside = d2 <= (this.hole.radius * this.hole.radius);
    const slowEnough = this._velocity.length() < 0.25;
    return inside && slowEnough;
  }

  resetToStart() {
    this.ball.position.copy(this.startPosition);
    this._velocity.set(0,0,0);
    this.strokes = 0;
    try { this.onStroke(this.strokes); } catch(e){}
  }

  teleport(position) {
    this.ball.position.copy(position);
    this.startPosition.copy(position);
    this._velocity.set(0,0,0);
  }

  _unstickIfNeeded() {
    const now = performance.now() / 1000;
    if (this._velocity.length() === 0 && (now - this._lastMovingTime) > this._stuckTimeout) {
      this.resetToStart();
    }
  }
}
