/// Water.ts: Manages water plane creation

import * as THREE from "three";
import { logger } from "../utils/Logger.ts";

export class Water {
  private readonly mesh: THREE.Mesh;
  private readonly size: number;
  private readonly seaLevel: number;

  constructor(size: number = 500, seaLevel: number = 0) {
    this.size = size;
    this.seaLevel = seaLevel;

    this.mesh = this.createWaterMesh();
  }

  private createWaterMesh(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.size * 1.5, this.size * 1.5);

    const material = new THREE.MeshStandardMaterial({
      color: 0x4a6a8a, // Blue-gray water
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = this.seaLevel;
    mesh.rotation.x = -Math.PI / 2; // Lay flat

    return mesh;
  }

  /**
   * Update water level height
   */
  setSeaLevel(level: number): void {
    this.mesh.position.y = level;
    logger.log(`WATER LEVEL: ${level.toFixed(2)}`);
  }

  /**
   * Get the Three.js mesh
   */
  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.mesh.geometry.dispose();
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    }
  }
}
