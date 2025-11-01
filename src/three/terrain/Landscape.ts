// Landscape.ts: Manages landscape mesh creation and updates

import * as THREE from "three";
import { logger } from "../utils/Logger";
import LandscapeGenerator from "./LandscapeGenerator.ts";
import type { RandomFn } from "../utils/Random.ts";
/**
 * Manages landscape mesh creation, shader material, and height generation.
 */
export class Landscape {
  private static readonly DEFAULT_SIZE = 512;
  private static readonly DEFAULT_RESOLUTION = 256;

  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.MeshStandardMaterial;
  private readonly generator: LandscapeGenerator;
  private readonly segments: number;
  private readonly size: number;

  constructor(
    size: number = Landscape.DEFAULT_SIZE,
    resolution: number = Landscape.DEFAULT_RESOLUTION,
    rng: RandomFn,
  ) {
    this.size = size;
    this.segments = resolution;
    this.generator = new LandscapeGenerator(
      this.segments + 1,
      this.segments + 1,
      rng,
    );

    // Create initial terrain
    this.material = new THREE.MeshStandardMaterial({});
    this.mesh = this.createLandscapeMesh();
    this.generateHeights();
  }

  private createLandscapeMesh(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.segments,
      this.segments,
    );

    const mesh = new THREE.Mesh(geometry, this.material);
    // Rotate to lay flat
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    return mesh;
  }

  private generateHeights(): void {
    logger.log("GENERATING LANDSCAPE...");
    const heightMap = this.generator.generateHeightMap(true);

    this.applyHeightMap(heightMap);

    logger.log(`LANDSCAPE: ${heightMap.length} VERTICES GENERATED`);
  }

  private applyHeightMap(heightMap: Float32Array): void {
    const vertices = this.mesh.geometry.attributes.position;

    for (let i = 0; i < vertices.count; i++) {
      vertices.setZ(i, heightMap[i]);
    }

    vertices.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }

  /**
   * Gets the terrain generator for GUI access
   */
  getGenerator(): LandscapeGenerator {
    return this.generator;
  }

  /**
   * Gets the Three.js mesh
   */
  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  /**
   * Cleans up resources
   */
  dispose(): void {
    this.mesh.geometry.dispose();
    if (this.mesh.material instanceof THREE.MeshStandardMaterial) {
      this.mesh.material.dispose();
    }
  }
}
