/// Terrain.ts: Manages terrain mesh creation and updates

import * as THREE from "three";
import TerrainGenerator from "./TerrainGenerator";
import { logger } from "../utils/Logger";

export class Terrain {
  private mesh: THREE.Mesh;
  private generator: TerrainGenerator;
  private readonly resolution: number;
  private readonly size: number;

  constructor(size: number = 500, resolution: number = 256) {
    this.size = size;
    this.resolution = resolution;
    this.generator = new TerrainGenerator();

    // Create initial terrain
    this.mesh = this.createTerrainMesh();
    this.generateHeights();
  }

  private createTerrainMesh(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.resolution,
      this.resolution,
    );

    const material = new THREE.MeshStandardMaterial({
      color: 0xacff24,
      side: THREE.FrontSide,
      wireframe: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Rotate to lay flat
    mesh.receiveShadow = true;

    return mesh;
  }

  private generateHeights(): void {
    logger.log("GENERATING TERRAIN...");
    const heightMap = this.generator.generateHeightMap(
      this.resolution + 1,
      this.resolution + 1,
    );

    this.applyHeightMap(heightMap);

    logger.log(`TERRAIN: ${heightMap.length} VERTICES GENERATED`);
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
   * Regenerate terrain from scratch (new seed points)
   */
  regenerate(): void {
    logger.log("REGENERATING TERRAIN (NEW SEEDS)");
    const heightMap = this.generator.generateHeightMap(
      this.resolution + 1,
      this.resolution + 1,
    );

    this.applyHeightMap(heightMap);
    logger.log("TERRAIN REGENERATED");
  }

  /**
   * Update terrain with current parameters (same seed points)
   */
  update(): void {
    logger.log("UPDATING TERRAIN (SAME SEEDS)");
    const heightMap = this.generator.regenerateHeightMap(
      this.resolution + 1,
      this.resolution + 1,
    );

    this.applyHeightMap(heightMap);
    logger.log("TERRAIN UPDATED");
  }

  /**
   * Get the terrain generator for GUI access
   */
  getGenerator(): TerrainGenerator {
    return this.generator;
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
