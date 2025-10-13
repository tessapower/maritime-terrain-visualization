/// ShadowPlane.ts: Shadow-receiving water plane

import * as THREE from "three";

export class ShadowPlane {
  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.MeshStandardMaterial;
  private readonly size: number;
  private readonly seaLevelDelta: number;

  private readonly roughness: number = 0.9;
  private readonly metalness: number = 0.1;
  private readonly opacity: number = 0.4;

  constructor(size: number = 500, seaLevelDelta: number) {
    this.size = size;
    this.seaLevelDelta = seaLevelDelta;

    this.material = new THREE.MeshStandardMaterial({
      roughness: this.roughness,
      metalness: this.metalness,
      side: THREE.FrontSide,
      opacity: this.opacity,
      transparent: true,
    });

    this.mesh = this.createMesh();
  }

  private createMesh(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.size, this.size);

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.position.y = this.seaLevelDelta;
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    mesh.castShadow = false;

    return mesh;
  }

  /**
   * Get the Three.js mesh
   */
  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  /**
   * Update how far this plane sits above/below the water plane.
   */
  setSeaLevelDelta(delta: number): void {
    this.mesh.position.y = delta;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
