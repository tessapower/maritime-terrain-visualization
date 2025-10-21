// Terrain.ts: Manages terrain mesh creation and updates

import * as THREE from "three";
import TerrainGenerator from "./TerrainGenerator";
import { logger } from "../utils/Logger";
import vertShader from "../../shaders/unified/unified.vs.glsl?raw";
import fragShader from "../../shaders/unified/unified.fs.glsl?raw";
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
  private static readonly DEFAULT_SIZE = 500;
  private static readonly DEFAULT_RESOLUTION = 256;

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
   * - u_fadeStartDistance: Distance from camera where fading starts
   * - u_fadeEndDistance: Distance from camera where lines are fully faded
   */
  private readonly topoConfig = {
    u_baseColor: { value: new THREE.Color(0xf8fbff) },
    u_lineColor: { value: new THREE.Color(0x82878c) },
    u_lineSpacing: { value: 2.0 },
    u_lineWidth: { value: 0.5 },
    u_lineIntensity: { value: 0.5 },
    u_fadeStartDistance: { value: 150.0 },
    u_fadeEndDistance: { value: 300.0 },
    u_landCutOff: { value: 1.0 },
  } as const;

  private readonly waterConfig = {
    u_seaLevel: { value: 0 },
    u_deepWater: { value: new THREE.Color(0x7293b0) },
    u_midWater: { value: new THREE.Color(0x8ea8bf) },
    u_lightWater: { value: new THREE.Color(0xe0e8f0) },
    u_waveScale: { value: 3.0 },
    u_warpOffset: { value: 0.03 },
    u_timeScalarSlow: { value: 0.009 },
    u_timeScalarFast: { value: 0.018 },
    u_numOctaves: { value: 5 },
    u_octaveGain: { value: 0.5 },
  } as const;

  constructor(
    size: number = Terrain.DEFAULT_SIZE,
    resolution: number = Terrain.DEFAULT_RESOLUTION,
  ) {
    this.size = size;
    this.segments = resolution;
    this.generator = new TerrainGenerator(
      this.size,
      this.segments + 1,
      this.segments + 1,
    );

    this.generator.landCutOff = this.topoConfig.u_landCutOff.value;

    // Create initial terrain
    this.material = this.createMaterial();
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

  private createMaterial(): THREE.ShaderMaterial {
    const uniforms = {
      ...this.topoConfig,
      ...this.waterConfig,
      u_cameraPosition: { value: new THREE.Vector3() },
      u_sunDirection: { value: new THREE.Vector3() },
      u_time: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vertShader,
      fragmentShader: fragShader,
    });

    if (material.isShaderMaterial) {
      logger.log("TERRAIN SHADER MATERIAL COMPILED ✓");
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
  updateMesh(): void {
    logger.log("UPDATING TERRAIN (SAME SEEDS)");
    const heightMap = this.generator.generateHeightMap(true);

    this.applyHeightMap(heightMap);
    logger.log("TERRAIN UPDATED");
  }

  /**
   * Updates the shaders for the terrain.
   *
   * @param time
   */
  update(time: number): void {
    if (this.material.uniforms.u_time) {
      this.material.uniforms.u_time.value = time;
    }
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
   * Updates the camera position for distance-based LOD fading
   */
  updateCameraPosition(cameraPosition: THREE.Vector3): void {
    if (!this.material.uniforms.u_cameraPosition) {
      console.error("u_cameraPosition uniform not found!");
      return;
    }
    this.material.uniforms.u_cameraPosition.value.copy(cameraPosition);
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
