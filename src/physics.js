// src/physics.js
import * as THREE from 'three';

/**
 * BallPhysics: ball mesh + simple physics for mini-golf
 */
export class BallPhysics {
  constructor(ballMesh, params = {}) {
    this.ball = ballMesh;
    this.radius = params.radius ?? 0.12;
    this.mass = params.mass ?? 0.045;
    this.groundY = params.groundY ?? 0;
    this.friction = params.friction ?? 1.5;
    this.restitution = params.restitution ?? 0.6;
    this.restThreshold = params.restThreshold ?? 0.02;
    this._velocity = new THREE.Vector3(0, 0, 0);

    this.colliders = Array.isArray(params.colliders) ? params.colliders.slice() : [];
    this._colliderBoxes = this.colliders.map(m => new THREE.Box3().setFromObject(m));

    // hole specification
    this.hole = params.hole ?? { position: new THREE.Vector3(5, 0, 0), radius: 0.25 };

    // callbacks
    this.onHole = params.onHole ?? (() => {});
    this.onStroke = params.onStroke ?? (() => {});
    this.onMove = params.onMove ?? (() => {});
    this.onStop = params.onStop ?? (() => {});

    this.strokes = params.initialStrokes ?? 0;

    // raycaster for slopes
    this._ray = new THREE.Raycaster();
    this._lastMovingTime = performance.now() / 1000;
    this._stuckTimeout = params.stuckTimeout ?? 4.0;

    this.startPosition = (params.startPosition && params.startPosition.clone)
      ? params.startPosition.clone()
      : this.ball.position.clone();
  }

  get velocity() {
    return this._velocity;
  }

  setColliders(meshArray) {
    this.colliders = meshArray.slice();
    this._colliderBoxes = this.colliders.map(m => new THREE.Box3().setFromObject(m));
  }

  setHole(holeSpec) {
    this.hole = holeSpec;
  }

  applyShot(direction, power) {
    const dir = direction.clone();
    dir.y = 0;
    if (dir.lengthSq() === 0) return;
    dir.normalize();
    const speed = Math.max(0, power);
    this._velocity.copy(dir.multiplyScalar(speed));
    this.strokes += 1;
    try { this.onStroke(this.strokes); } catch (e) {}
    this._lastMovingTime = performance.now() / 1000;
  }

  update(delta) {
    if (delta <= 0) return;

    const maxStep = 1 / 120;
    let remaining = delta;
    while (remaining > 0) {
      const dt = Math.min(remaining, maxStep);
      this._updateStep(dt);
      remaining -= dt;
    }
    this._unstickIfNeeded();
  }

  _updateStep(dt) {
    // integrate horizontal movement
    const disp = this._velocity.clone().multiplyScalar(dt);
    this.ball.position.add(disp);

    // clamp to ground
    if (this.ball.position.y - this.radius < this.groundY) {
      this.ball.position.y = this.groundY + this.radius;
      if (this._velocity.y < 0) this._velocity.y = 0;
    }

    // collisions with walls
    for (let i = 0; i < this._colliderBoxes.length; i++) {
      this._collideSphereAABB(this._colliderBoxes[i]);
    }

    // apply friction
    const factor = Math.exp(-this.friction * dt);
    this._velocity.multiplyScalar(factor);

    // stop if very slow
    if (this._velocity.length() < this.restThreshold) {
      if (this._velocity.length() !== 0) {
        this._velocity.set(0, 0, 0);
        try { this.onStop(); } catch (e) {}
      }
    } else {
      this._lastMovingTime = performance.now() / 1000;
      try { this.onMove(); } catch (e) {}
    }

    // ✅ hole detection
    if (this._checkHole()) {
      this._velocity.set(0, 0, 0);
      try { this.onHole({ strokes: this.strokes }); } catch (e) {}
    }
  }

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
      this.ball.position.add(normal.clone().multiplyScalar(penetration + 1e-6));

      const v = this._velocity;
      const vn = normal.clone().multiplyScalar(v.dot(normal));
      const vt = v.clone().sub(vn);

      this._velocity.copy(vt.sub(vn.multiplyScalar(this.restitution)));
      this._velocity.multiplyScalar(0.95);
    }
  }

  _checkHole() {
  const d2 = this.ball.position.distanceToSquared(this.hole.position);
  const inside = d2 <= (this.hole.radius * this.hole.radius);
  const slowEnough = this._velocity.length() < 0.25; // This is the key condition
  
  return inside && slowEnough;
}

  resetToStart() {
    this.ball.position.copy(this.startPosition);
    this._velocity.set(0, 0, 0);
    this.strokes = 0;
    try { this.onStroke(this.strokes); } catch (e) {}
  }

  teleport(position) {
    this.ball.position.copy(position);
    this.startPosition.copy(position);
    this._velocity.set(0, 0, 0);
  }

  _unstickIfNeeded() {
    const now = performance.now() / 1000;
    if (this._velocity.length() === 0 && (now - this._lastMovingTime) > this._stuckTimeout) {
      this.resetToStart();
    }
  }
}
