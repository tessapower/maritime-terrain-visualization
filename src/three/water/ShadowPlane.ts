// ShadowPlane.ts: Shadow-receiving water plane

import * as THREE from "three";

/**
 * Represents a transparent plane above/below the water that receives shadows.
 * Used to create realistic shadow effects on water surfaces.
 */
export class ShadowPlane {
  private static readonly DEFAULT_ROUGHNESS = 0.9;
  private static readonly DEFAULT_METALNESS = 0.1;
  private static readonly DEFAULT_OPACITY = 0.4;

  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.MeshStandardMaterial;
  private readonly size: number;
  private readonly seaLevelDelta: number;

  constructor(size: number = 500, seaLevelDelta: number) {
    this.size = size;
    this.seaLevelDelta = seaLevelDelta;

    this.material = new THREE.MeshStandardMaterial({
      roughness: ShadowPlane.DEFAULT_ROUGHNESS,
      metalness: ShadowPlane.DEFAULT_METALNESS,
      side: THREE.FrontSide,
      opacity: ShadowPlane.DEFAULT_OPACITY,
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
   * Clean up resources
   */
  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
