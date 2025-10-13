/// OrbitalCamera.ts: Manages camera with orbital movement

import * as THREE from "three";

interface OrbitalCameraConfig {
  orbitRadius?: number;
  orbitSpeed?: number;
  height?: number;
  orbitPeriod?: number; // Seconds for full rotation
  bobAmount?: number; // Vertical bobbing amount
  bobSpeed?: number; // Vertical bobbing speed
  enabled?: boolean;
}

export class OrbitalCamera {
  private readonly camera: THREE.PerspectiveCamera;
  private orbitRadius: number;
  private orbitSpeed: number;
  private height: number;
  private orbitPeriod: number;
  private bobAmount: number;
  private bobSpeed: number;
  enabled: boolean;
  private angle: number = 0;

  constructor(aspectRatio: number, config: OrbitalCameraConfig = {}) {
    // Create camera
    this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);

    // Apply config with defaults
    this.orbitRadius = config.orbitRadius ?? 300;
    this.orbitSpeed = config.orbitSpeed ?? 0.05;
    this.height = config.height ?? 150;
    this.orbitPeriod = config.orbitPeriod ?? 60.0; // 60 seconds default
    this.bobAmount = config.bobAmount ?? 5;
    this.bobSpeed = config.bobSpeed ?? 0.5;
    this.enabled = config.enabled ?? true;

    // Set initial position
    this.updatePosition(0);
  }

  /**
   * Update camera position based on time
   */
  update(time: number): void {
    if (!this.enabled) return;

    this.updatePosition(time);
  }

  private updatePosition(time: number): void {
    // Calculate orbit angle based on time and period
    this.angle = (time / this.orbitPeriod) * Math.PI * 2;

    // Horizontal orbit position
    const x = Math.cos(this.angle) * this.orbitRadius;
    const z = Math.sin(this.angle) * this.orbitRadius;

    // Vertical position with optional bobbing
    const bob = Math.sin(time * this.bobSpeed) * this.bobAmount;
    const y = this.height + bob;

    // Update camera position
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0); // Always look at center
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

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setOrbitRadius(radius: number): void {
    this.orbitRadius = radius;
  }

  setOrbitSpeed(speed: number): void {
    this.orbitSpeed = speed;
  }

  setOrbitPeriod(period: number): void {
    this.orbitPeriod = period;
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

  getOrbitSpeed(): number {
    return this.orbitSpeed;
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
