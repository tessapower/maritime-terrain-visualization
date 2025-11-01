// Mountain.ts: Manages mountain mesh creation and updates

import * as THREE from "three";
import { logger } from "../utils/Logger";
import { MountainGenerator } from "./MountainGenerator.ts";
import { BeyerErosion } from "./BeyerErosion.ts";
import type { RandomFn } from "../utils/Random.ts";
/**
 * Manages mountain mesh creation, shader material, and height generation.
 *
 * Key concepts:
 * - Uses a custom MountainGenerator for procedural heightmaps
 * - Handles mesh creation, updates, and shadow settings
 */
export class Mountain {
  private static readonly DEFAULT_SIZE = 500;
  private static readonly DEFAULT_RESOLUTION = 256;

  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.MeshStandardMaterial;
  private readonly segments: number;
  private readonly size: number;
  private readonly mountainGenerator: MountainGenerator;
  private readonly rng: RandomFn;

  constructor(
    size: number = Mountain.DEFAULT_SIZE,
    resolution: number = Mountain.DEFAULT_RESOLUTION,
    rng: RandomFn,
  ) {
    this.size = size;
    this.segments = resolution;

    // Create initial terrain
    this.material = new THREE.MeshStandardMaterial();
    this.mesh = this.createMesh();
    this.mountainGenerator = new MountainGenerator(rng);
    this.rng = rng;
    this.generateHeights();
  }

  private createMesh(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.segments,
      this.segments,
    );

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.rotation.x = -Math.PI / 2; // Rotate to lay flat
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    return mesh;
  }

  private generateHeights(): void {
    logger.log("GENERATING MOUNTAIN...");
    const heightMap = this.mountainGenerator.generateRadial(257, 257, 100);
    // const heightMap = this.mountainGenerator.generateRidgeline(
    //   this.segments + 1,
    //   this.segments + 1,
    //   100,
    //   10,
    //   1,
    //   60,
    // );

    const erosion = new BeyerErosion({
      iterations: 50000,
      inertia: 0.3,
      capacity: 8,
      minSlope: 0.01,
      erosionSpeed: 0.4,
      depositionSpeed: 0.1,
      evaporationSpeed: 0.02,
      gravity: 6,
      maxPath: 32,
      erosionRadius: 4,
      depositionRadius: 10,
      minLifetime: 0.5,
      maxLifetime: 1.5,
      minWater: 0.7,
      maxWater: 1.3,
      enableBlurring: true,
      blurRadius: 1,
      blendFactor: 0.5,
      randomFn: this.rng,
    });

    erosion.erode(heightMap, 257, 257);

    this.applyHeightMap(heightMap);

    logger.log(`MOUNTAIN: ${heightMap.length} VERTICES GENERATED`);
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
