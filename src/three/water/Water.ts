// Water.ts: Manages water plane creation

import * as THREE from "three";
import { logger } from "../utils/Logger.ts";
import vertexShader from "../../shaders/water/water.vs.glsl?raw";
import fragmentShader from "../../shaders/water/water.fs.glsl?raw";

/**
 * Manages the creation and animation of the water plane in the scene.
 * Handles shader material setup and mesh generation for water effects.
 */
export class Water {
  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.ShaderMaterial;
  private readonly size: number;
  private readonly seaLevel: number;

  private readonly waterColors = {
    u_deepWater: { value: new THREE.Color(0x7293b0) },
    u_midWater: { value: new THREE.Color(0x7b97b0) },
    u_lightWater: { value: new THREE.Color(0xe0e8f0) },
  } as const;

  constructor(size: number = 500, seaLevel: number = 0) {
    this.size = size;
    this.seaLevel = seaLevel;

    this.material = this.createWaterMaterial();
    this.mesh = this.createWaterMesh();
  }

  private createWaterMaterial(): THREE.ShaderMaterial {
    const uniforms = {
      u_time: { value: 0.0 },
      ...this.waterColors,
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.FrontSide,
    });

    if (material.isShaderMaterial) {
      logger.log("SHADER MATERIAL COMPILED ✓");
    }

    return material;
  }

  private createWaterMesh(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.size, this.size);

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.position.y = this.seaLevel;
    mesh.rotation.x = -Math.PI / 2;

    return mesh;
  }

  /**
   * Updates shader uniforms
   */
  update(time: number): void {
    if (this.material.uniforms.u_time) {
      this.material.uniforms.u_time.value = time;
    }
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
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    }
  }
}
