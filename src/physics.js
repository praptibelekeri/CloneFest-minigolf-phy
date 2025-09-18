// src/physics.js
import * as THREE from 'three';

export class BallPhysics {
  constructor(ballMesh, params = {}) {
    this.ball = ballMesh;
    this.radius = params.radius ?? 0.12;
    this.mass = params.mass ?? 0.045;
    this.groundY = params.groundY ?? 0;
    this.friction = params.friction ?? 1.5;
    this.restitution = params.restitution ?? 0.6;
    this.restThreshold = params.restThreshold ?? 0.02;
    this.sinkSpeedThreshold = params.sinkSpeedThreshold ?? 0.25; // ⛳ must be slow to sink

    this._velocity = new THREE.Vector3(0, 0, 0);

    this.colliders = Array.isArray(params.colliders) ? params.colliders.slice() : [];
    this._colliderBoxes = this.colliders.map(m => new THREE.Box3().setFromObject(m));

    this.hole = params.hole ?? { position: new THREE.Vector3(5, 0, 0), radius: 0.25 };

    // callbacks
    this.onHole = params.onHole ?? (() => {});
    this.onStroke = params.onStroke ?? (() => {});
    this.onMove = params.onMove ?? (() => {});
    this.onStop = params.onStop ?? (() => {});
    this.onSinkSound = params.onSinkSound ?? (() => {}); // 🔊 added

    this.strokes = params.initialStrokes ?? 0;

    this._lastMovingTime = performance.now() / 1000;
    this._stuckTimeout = params.stuckTimeout ?? 4.0;

    this.startPosition = (params.startPosition && params.startPosition.clone)
      ? params.startPosition.clone()
      : this.ball.position.clone();

    this._prevPos = this.ball.position.clone();
    this._captured = false;
  }

  get velocity() { return this._velocity; }

  setColliders(meshArray) {
    this.colliders = meshArray.slice();
    this._colliderBoxes = this.colliders.map(m => new THREE.Box3().setFromObject(m));
  }

  setHole(holeSpec) {
    if (!holeSpec) return;
    if (holeSpec.position && holeSpec.position.isVector3) {
      this.hole = { position: holeSpec.position.clone(), radius: holeSpec.radius ?? this.hole.radius };
    }
    this._captured = false;
  }

  applyShot(direction, power) {
    if (this._captured) return;
    const dir = direction.clone();
    dir.y = 0;
    if (dir.lengthSq() === 0) return;
    dir.normalize();
    this._velocity.copy(dir.multiplyScalar(Math.max(0, power)));
    this.strokes += 1;
    try { this.onStroke(this.strokes); } catch {}
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
      if (this._captured) break;
    }
    this._unstickIfNeeded();
  }

  _updateStep(dt) {
    const prev = this._prevPos.clone();
    prev.copy(this.ball.position);

    const disp = this._velocity.clone().multiplyScalar(dt);
    const nextPos = prev.clone().add(disp);

    // Hole check
    if (!this._captured && this._segmentIntersectsHole(prev, nextPos)) {
      if (this._velocity.length() <= this.sinkSpeedThreshold) {
        this.ball.position.set(this.hole.position.x, this.groundY + this.radius, this.hole.position.z);
        this._velocity.set(0, 0, 0);
        this._captured = true;

        // ✅ trigger callbacks
        try { this.onHole({ strokes: this.strokes }); } catch {}
        try { this.onSinkSound(); } catch {}

        this._prevPos.copy(this.ball.position);
        return;
      }
      // too fast → skip hole
    }

    this.ball.position.copy(nextPos);

    // clamp to ground
    if (this.ball.position.y - this.radius < this.groundY) {
      this.ball.position.y = this.groundY + this.radius;
      if (this._velocity.y < 0) this._velocity.y = 0;
    }

    // collisions
    for (let i = 0; i < this._colliderBoxes.length; i++) {
      this._collideSphereAABB(this._colliderBoxes[i]);
    }

    // friction
    this._velocity.multiplyScalar(Math.exp(-this.friction * dt));

    if (this._velocity.length() < this.restThreshold) {
      if (this._velocity.length() !== 0) {
        this._velocity.set(0, 0, 0);
        try { this.onStop(); } catch {}
      }
    } else {
      this._lastMovingTime = performance.now() / 1000;
      try { this.onMove(); } catch {}
    }

    this._prevPos.copy(this.ball.position);
  }

  _segmentIntersectsHole(prev, next) {
    const cx = this.hole.position.x, cz = this.hole.position.z;
    const r = this.hole.radius;

    const vx = next.x - prev.x;
    const vz = next.z - prev.z;
    const segLen2 = vx * vx + vz * vz;
    if (segLen2 === 0) {
      const dx = prev.x - cx, dz = prev.z - cz;
      return (dx * dx + dz * dz) <= r * r;
    }
    const t = ((cx - prev.x) * vx + (cz - prev.z) * vz) / segLen2;
    const tc = Math.max(0, Math.min(1, t));
    const closestX = prev.x + tc * vx;
    const closestZ = prev.z + tc * vz;
    const dx = closestX - cx;
    const dz = closestZ - cz;
    return (dx * dx + dz * dz) <= r * r;
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

  resetToStart() {
    this.ball.position.copy(this.startPosition);
    this._velocity.set(0, 0, 0);
    this.strokes = 0;
    this._captured = false;
    try { this.onStroke(this.strokes); } catch {}
  }

  teleport(position) {
    this.ball.position.copy(position);
    this.startPosition.copy(position);
    this._velocity.set(0, 0, 0);
    this._captured = false;
  }

  _unstickIfNeeded() {
    const now = performance.now() / 1000;
    if (this._velocity.length() === 0 && (now - this._lastMovingTime) > this._stuckTimeout) {
      this.resetToStart();
    }
  }
}
