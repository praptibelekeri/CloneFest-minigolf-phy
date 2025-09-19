// src/trajectoryVisualizer.js
import * as THREE from 'three';

export class TrajectoryVisualizer {
  constructor(scene, ballPhysics) {
    this.scene = scene;
    this.ballPhysics = ballPhysics;
    this.trajectoryLine = null;
    this.trajectoryPoints = [];
    this.powerIndicators = [];
    this.isVisible = false;
    this.enabled = true;
    
    this.createTrajectoryMaterials();
  }

  createTrajectoryMaterials() {
    // Create gradient material for trajectory line
    this.trajectoryMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.8,
      linewidth: 3
    });

    // Create material for power indicators
    this.powerIndicatorMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.6
    });

    // Create pulsing animation material
    this.pulsingMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.8
    });
  }

  predictTrajectory(startPos, direction, power) {
    if (!this.enabled) return [];
    
    const points = [];
    const timeStep = 0.1;
    const maxTime = 8.0;
    const friction = this.ballPhysics.friction;
    const ballRadius = this.ballPhysics.radius;
    
    // Initial conditions
    let pos = startPos.clone();
    let vel = direction.clone().multiplyScalar(power);
    vel.y = 0; // Keep it on the ground
    
    for (let t = 0; t < maxTime; t += timeStep) {
      // Apply friction
      const frictionFactor = Math.exp(-friction * timeStep);
      vel.multiplyScalar(frictionFactor);
      
      // Update position
      const displacement = vel.clone().multiplyScalar(timeStep);
      pos.add(displacement);
      
      // Simple collision detection with walls
      const collisionPoint = this.checkWallCollisions(pos, ballRadius);
      if (collisionPoint) {
        points.push(collisionPoint.clone());
        break;
      }
      
      points.push(pos.clone());
      
      // Stop if velocity is too low
      if (vel.length() < 0.1) break;
    }
    
    return points;
  }

  checkWallCollisions(pos, radius) {
    // Check collision with current level's colliders
    for (const collider of this.ballPhysics.colliders) {
      const box = new THREE.Box3().setFromObject(collider);
      
      // Expand box by ball radius
      box.expandByScalar(radius);
      
      if (box.containsPoint(pos)) {
        // Find collision point on box surface
        const closestPoint = box.clampPoint(pos, new THREE.Vector3());
        return closestPoint;
      }
    }
    
    return null;
  }

  showTrajectory(startPos, direction, power) {
    if (!this.enabled) return;
    
    this.hideTrajectory();
    
    const points = this.predictTrajectory(startPos, direction, power);
    if (points.length < 2) return;
    
    // Create trajectory line
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    this.trajectoryLine = new THREE.Line(geometry, this.trajectoryMaterial);
    this.scene.add(this.trajectoryLine);
    
    // Create power indicators along the path
    this.createPowerIndicators(points, power);
    
    // Create endpoint indicator
    this.createEndpointIndicator(points[points.length - 1]);
    
    this.isVisible = true;
  }

  createPowerIndicators(points, power) {
    const indicatorCount = Math.min(5, Math.floor(points.length / 3));
    const indicatorGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    
    for (let i = 0; i < indicatorCount; i++) {
      const pointIndex = Math.floor((i + 1) * points.length / (indicatorCount + 1));
      if (pointIndex >= points.length) break;
      
      const indicator = new THREE.Mesh(indicatorGeometry, this.powerIndicatorMaterial.clone());
      indicator.position.copy(points[pointIndex]);
      indicator.position.y += 0.05; // Slightly above ground
      
      // Scale based on remaining velocity
      const velocityFactor = 1 - (i / indicatorCount);
      const scale = 0.5 + velocityFactor * 1.5;
      indicator.scale.setScalar(scale);
      
      // Color based on power
      const hue = (1 - power / 30) * 0.3; // Green to red gradient
      indicator.material.color.setHSL(hue, 1, 0.6);
      
      this.powerIndicators.push(indicator);
      this.scene.add(indicator);
    }
  }

  createEndpointIndicator(endPos) {
    // Create pulsing sphere at trajectory end
    const endGeometry = new THREE.SphereGeometry(0.08, 12, 12);
    const endIndicator = new THREE.Mesh(endGeometry, this.pulsingMaterial.clone());
    endIndicator.position.copy(endPos);
    endIndicator.position.y += 0.1;
    
    // Add pulsing animation
    const startTime = performance.now();
    const animate = () => {
      if (!this.isVisible) return;
      
      const elapsed = (performance.now() - startTime) / 1000;
      const pulse = 0.8 + 0.4 * Math.sin(elapsed * 4);
      endIndicator.scale.setScalar(pulse);
      endIndicator.material.opacity = pulse * 0.8;
      
      requestAnimationFrame(animate);
    };
    animate();
    
    this.powerIndicators.push(endIndicator);
    this.scene.add(endIndicator);
  }

  hideTrajectory() {
    if (this.trajectoryLine) {
      this.scene.remove(this.trajectoryLine);
      this.trajectoryLine.geometry.dispose();
      this.trajectoryLine = null;
    }
    
    // Remove power indicators
    this.powerIndicators.forEach(indicator => {
      this.scene.remove(indicator);
      indicator.geometry.dispose();
      indicator.material.dispose();
    });
    this.powerIndicators = [];
    
    this.isVisible = false;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled && this.isVisible) {
      this.hideTrajectory();
    }
  }

  // Create trajectory preview for aiming
  updateTrajectoryPreview(startPos, direction, power) {
    if (!this.enabled || power === 0) {
      this.hideTrajectory();
      return;
    }
    
    // Throttle updates to avoid performance issues
    if (!this.lastUpdateTime || performance.now() - this.lastUpdateTime > 50) {
      this.showTrajectory(startPos, direction, power);
      this.lastUpdateTime = performance.now();
    }
  }

  // Create arc trajectory for putting (more realistic)
  createArcTrajectory(startPos, direction, power) {
    const points = [];
    const segments = 30;
    const maxHeight = power * 0.02; // Small arc for putting
    const distance = power * 0.5;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pos = startPos.clone();
      
      // Move along direction
      pos.add(direction.clone().multiplyScalar(distance * t));
      
      // Add small arc
      pos.y += maxHeight * Math.sin(t * Math.PI);
      
      points.push(pos);
    }
    
    return points;
  }

  // Wind effect visualization (for bonus features)
  showWindEffect(windVector) {
    // Create wind particles
    const particleCount = 50;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 5 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const windMaterial = new THREE.PointsMaterial({
      color: 0xaaaaff,
      size: 0.05,
      transparent: true,
      opacity: 0.6
    });
    
    const windParticles = new THREE.Points(particles, windMaterial);
    this.scene.add(windParticles);
    
    // Animate particles based on wind
    const animateWind = () => {
      const positions = windParticles.geometry.attributes.position.array;
      
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += windVector.x * 0.01;
        positions[i * 3 + 2] += windVector.z * 0.01;
        
        // Reset particles that go too far
        if (Math.abs(positions[i * 3]) > 10 || Math.abs(positions[i * 3 + 2]) > 10) {
          positions[i * 3] = (Math.random() - 0.5) * 20;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
      }
      
      windParticles.geometry.attributes.position.needsUpdate = true;
    };
    
    // Store animation function for cleanup
    this.windAnimation = animateWind;
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.scene.remove(windParticles);
      windParticles.geometry.dispose();
      windMaterial.dispose();
      this.windAnimation = null;
    }, 5000);
  }

  // Hole targeting visualization
  showHoleTarget(holePosition, holeRadius) {
    // Create targeting circles around the hole
    const targetGeometry = new THREE.RingGeometry(holeRadius * 1.2, holeRadius * 2, 32);
    const targetMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    const targetRing = new THREE.Mesh(targetGeometry, targetMaterial);
    targetRing.position.copy(holePosition);
    targetRing.rotation.x = -Math.PI / 2;
    
    // Pulsing animation
    const startTime = performance.now();
    const animate = () => {
      if (!this.scene.getObjectById(targetRing.id)) return;
      
      const elapsed = (performance.now() - startTime) / 1000;
      const pulse = 1 + 0.3 * Math.sin(elapsed * 3);
      targetRing.scale.setScalar(pulse);
      targetMaterial.opacity = 0.3 + 0.2 * Math.sin(elapsed * 3);
      
      requestAnimationFrame(animate);
    };
    animate();
    
    this.scene.add(targetRing);
    
    // Store for cleanup
    this.holeTarget = targetRing;
    
    return targetRing;
  }

  hideHoleTarget() {
    if (this.holeTarget) {
      this.scene.remove(this.holeTarget);
      this.holeTarget.geometry.dispose();
      this.holeTarget.material.dispose();
      this.holeTarget = null;
    }
  }

  // Cleanup method
  dispose() {
    this.hideTrajectory();
    this.hideHoleTarget();
    
    if (this.trajectoryMaterial) this.trajectoryMaterial.dispose();
    if (this.powerIndicatorMaterial) this.powerIndicatorMaterial.dispose();
    if (this.pulsingMaterial) this.pulsingMaterial.dispose();
  }
}