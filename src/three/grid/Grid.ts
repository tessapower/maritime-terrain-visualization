// Grid.ts: Manages grid overlay above water

import * as THREE from "three";

/**
 * Manages the grid overlay above the water.
 */
export class Grid {
  private readonly mesh: THREE.LineSegments;
  private readonly size: number;
  private readonly divisions: number;
  private readonly height: number;

  constructor(
    size: number = 500,
    divisions: number = 20,
    height: number = 0.5,
  ) {
    this.size = size;
    this.divisions = divisions;
    this.height = height;

    this.mesh = this.createGridMesh();
  }

  private createGridMesh(): THREE.LineSegments {
    // Create grid geometry
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];

    const halfSize = this.size / 2;
    const step = this.size / this.divisions;

    // Create grid lines (vertical and horizontal)
    for (let i = 0; i <= this.divisions; ++i) {
      const pos = -halfSize + i * step;

      vertices.push(-halfSize, 0, pos);
      vertices.push(halfSize, 0, pos);

      vertices.push(pos, 0, -halfSize);
      vertices.push(pos, 0, halfSize);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );

    const material = new THREE.LineBasicMaterial({
      color: 0x88a0b8,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });

    const mesh = new THREE.LineSegments(geometry, material);
    mesh.position.y = this.height;
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    return mesh;
  }

  /**
   * Get the Three.js mesh
   */
  getMesh(): THREE.LineSegments {
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
