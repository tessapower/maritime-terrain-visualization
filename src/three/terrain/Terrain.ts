// Terrain.ts: Manages terrain mesh creation and updates

import * as THREE from "three";
import TerrainGenerator from "./TerrainGenerator";
import { logger } from "../utils/Logger";
import topoVertexShader from "../../shaders/topo/topo.vs.glsl?raw";
import topoFragmentShader from "../../shaders/topo/topo.fs.glsl?raw";

/**
 * Manages terrain mesh creation, shader material, and height generation.
 *
 * Key concepts:
 * - Uses a custom TerrainGenerator for procedural heightmaps
 * - ShaderMaterial with topographic contour lines (see topo shaders)
 * - topoConfig controls contour appearance (color, spacing, width, intensity)
 * - Handles mesh creation, updates, and shadow settings
 */
export class Terrain {
  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.ShaderMaterial;
  private readonly generator: TerrainGenerator;
  private readonly segments: number;
  private readonly size: number;

  /**
   * Uniforms for controlling contour line appearance in the topo shader.
   * - u_baseColor: Base terrain color
   * - u_lineColor: Contour line color
   * - u_lineSpacing: Distance between contour lines
   * - u_lineWidth: Thickness of contour lines
   * - u_lineIntensity: Line contrast
   */
  private readonly topoConfig = {
    u_baseColor: { value: new THREE.Color(0xf8fbff) },
    u_lineColor: { value: new THREE.Color(0xaaaaaa) },
    u_lineSpacing: { value: 1.0 },
    u_lineWidth: { value: 0.1 },
    u_lineIntensity: { value: 0.5 },
  } as const;

  constructor(size: number = 500, resolution: number = 256) {
    this.size = size;
    this.segments = resolution;
    this.generator = new TerrainGenerator(
      this.size,
      this.segments + 1,
      this.segments + 1,
    );

    // Create initial terrain
    this.material = this.createTopoMaterial();
    this.mesh = this.createTerrainMesh();
    this.generateHeights();
  }

  private createTerrainMesh(): THREE.Mesh {
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

  private createTopoMaterial(): THREE.ShaderMaterial {
    const uniforms = {
      ...this.topoConfig,
      u_sunDirection: { value: new THREE.Vector3() },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: topoVertexShader,
      fragmentShader: topoFragmentShader,
    });

    if (material.isShaderMaterial) {
      logger.log("TOPO SHADER MATERIAL COMPILED ✓");
    }

    return material;
  }

  private generateHeights(): void {
    logger.log("GENERATING TERRAIN...");
    const heightMap = this.generator.generateHeightMap();

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
   * Regenerates terrain from scratch (new seed points)
   */
  regenerate(): void {
    logger.log("REGENERATING TERRAIN (NEW SEEDS)");
    const heightMap = this.generator.generateHeightMap(false);

    this.applyHeightMap(heightMap);
    logger.log("TERRAIN REGENERATED");
  }

  /**
   * Updates terrain with current parameters (same seed points)
   */
  update(): void {
    logger.log("UPDATING TERRAIN (SAME SEEDS)");
    const heightMap = this.generator.generateHeightMap(true);

    this.applyHeightMap(heightMap);
    logger.log("TERRAIN UPDATED");
  }

  /**
   * Gets the terrain generator for GUI access
   */
  getGenerator(): TerrainGenerator {
    return this.generator;
  }

  /**
   * Gets the Three.js mesh
   */
  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  /**
   * Updates shader lighting to match scene sun direction
   */
  setSunDirection(
    sunPosition: THREE.Vector3,
    targetPosition: THREE.Vector3,
  ): void {
    // Use world space direction, normals are in world space too
    const worldDirection = new THREE.Vector3()
      .subVectors(sunPosition, targetPosition)
      .normalize();

    this.material.uniforms.u_sunDirection.value.copy(worldDirection);
  }

  /**
   * Cleans up resources
   */
  dispose(): void {
    this.mesh.geometry.dispose();
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    }
  }
}
