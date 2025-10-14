// OrbitalCamera.ts: Manages camera with orbital movement

import * as THREE from "three";

interface OrbitalCameraConfig {
  orbitRadius?: number;
  height?: number;
  // Seconds for full rotation
  orbitPeriod?: number;
  // Vertical bobbing amount
  bobAmount?: number;
  // Vertical bobbing speed
  bobSpeed?: number;
  enabled?: boolean;
}

/**
 * Manages a Three.js camera with orbital movement and vertical bobbing.
 *
 * Key concepts:
 * - Camera orbits around the origin in the XZ plane
 * - Vertical bobbing simulates natural movement (e.g., ship or drone)
 * - orbitPeriod controls speed of full rotation
 * - bobAmount and bobSpeed control amplitude and frequency of bobbing
 */
export class OrbitalCamera {
  private readonly camera: THREE.PerspectiveCamera;
  private orbitRadius: number;
  private height: number;
  private orbitPeriod: number;
  private bobAmount: number;
  private bobSpeed: number;
  enabled: boolean;
  private angle: number = 0;

  // Track last angle and time for smooth orbit resume
  private lastAngle: number = 0;
  private lastOrbitTime: number = 0;

  constructor(aspectRatio: number, config: OrbitalCameraConfig = {}) {
    // Create camera
    this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);

    // Apply config with defaults
    this.orbitRadius = config.orbitRadius ?? 100;
    this.height = config.height ?? 100;
    this.orbitPeriod = config.orbitPeriod ?? 60;
    this.bobAmount = config.bobAmount ?? 2;
    this.bobSpeed = config.bobSpeed ?? 1.0;
    this.enabled = config.enabled ?? true;

    // Initialize orbit state
    this.angle = 0;
    this.lastAngle = 0;
    this.lastOrbitTime = performance.now() * 0.001;

    // Set initial position
    this.updatePositionWithAngle(this.angle, this.lastOrbitTime);
  }

  /**
   * Update camera position based on time. The camera orbits around the origin
   * in the XZ plane, with vertical bobbing for realism.
   *
   * If auto-orbit is enabled, increment angle based on elapsed time since last enabled.
   * If disabled, keep current angle and allow manual controls to update position.
   */
  update(time: number): void {
    if (this.enabled) {
      // Calculate delta time since auto-orbit was enabled
      const deltaTime = time - this.lastOrbitTime;
      // Advance angle from lastAngle
      this.angle =
        this.lastAngle + (deltaTime / this.orbitPeriod) * Math.PI * 2;
      this.updatePositionWithAngle(this.angle, time);
    } else {
      // If auto-orbit is disabled, just update position with current angle and time (for bobbing)
      this.updatePositionWithAngle(this.angle, time);
    }
  }

  /**
   * Update camera position based on angle and time (for bobbing).
   */
  private updatePositionWithAngle(angle: number, time: number): void {
    const x = Math.cos(angle) * this.orbitRadius;
    const z = Math.sin(angle) * this.orbitRadius;
    const bob = Math.sin(time * this.bobSpeed) * this.bobAmount;
    const y = this.height + bob;
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Update aspect ratio (call on window resize)
   */
  updateAspectRatio(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
  /**
   * Get the Three.js camera
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  //======================================================== GUI Setters ====//

  /**
   * When toggling auto-orbit, store the current angle and time for smooth resume.
   */
  setEnabled(enabled: boolean): void {
    if (enabled && !this.enabled) {
      // Resuming auto-orbit: store current time and angle
      this.lastOrbitTime = performance.now() * 0.001;
      this.lastAngle = this.angle;
    }
    this.enabled = enabled;
  }

  setOrbitRadius(radius: number): void {
    this.orbitRadius = radius;
  }

  setOrbitPeriod(period: number): void {
    // Get current time
    const now = performance.now() * 0.001;
    // Update orbitPeriod before calculating angle
    this.orbitPeriod = period;
    // Calculate current angle based on new period
    if (this.enabled) {
      const deltaTime = now - this.lastOrbitTime;
      this.lastAngle =
        this.lastAngle + (deltaTime / this.orbitPeriod) * Math.PI * 2;
      this.lastOrbitTime = now;
    }
    this.updatePositionWithAngle(this.enabled ? this.lastAngle : this.angle, now);
  }

  setHeight(height: number): void {
    this.height = height;
  }

  setBobAmount(amount: number): void {
    this.bobAmount = amount;
  }

  setBobSpeed(speed: number): void {
    this.bobSpeed = speed;
  }

  //======================================================== GUI Getters ====//

  getEnabled(): boolean {
    return this.enabled;
  }

  getOrbitRadius(): number {
    return this.orbitRadius;
  }

  getOrbitPeriod(): number {
    return this.orbitPeriod;
  }

  getHeight(): number {
    return this.height;
  }

  getBobAmount(): number {
    return this.bobAmount;
  }

  getBobSpeed(): number {
    return this.bobSpeed;
  }
}
