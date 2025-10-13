/// Water.ts: Manages water plane creation

import * as THREE from "three";
import { logger } from "../utils/Logger.ts";
import vertexShader from "../../shaders/water/water.vs.glsl?raw";
import fragmentShader from "../../shaders/water/water.fs.glsl?raw";

export class Water {
  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.ShaderMaterial;
  private readonly size: number;
  private readonly seaLevel: number;

  constructor(size: number = 500, seaLevel: number = 0) {
    this.size = size;
    this.seaLevel = seaLevel;

    const uniforms = {
      u_time: { value: 0.0 },
      u_resolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
    };

    this.material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.FrontSide,
    });

    if (this.material.isShaderMaterial) {
      logger.log("SHADER MATERIAL COMPILED SUCCESSFULLY");
    }

    this.mesh = this.createWaterMesh();
  }

  private createWaterMesh(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.size, this.size);

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.position.y = this.seaLevel;
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;

    return mesh;
  }

  /**
   * Updates shader uniforms
   */
  update(time: number): void {
    this.material.uniforms.u_time.value = time;
  }

  /**
   * Updates resolution uniform
   */
  updateResolution(width: number, height: number): void {
    this.material.uniforms.u_resolution.value.set(width, height);
  }

  /**
   * Updates water level height
   */
  setSeaLevel(level: number): void {
    this.mesh.position.y = level;
    logger.log(`WATER LEVEL: ${level.toFixed(2)}`);
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
