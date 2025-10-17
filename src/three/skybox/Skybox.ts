// filepath: c:\Users\tp\Developer\projects\maritime-terrain-visualization\src\three\skybox\Skybox.ts

import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";

/**
 * Skybox with a gradient sky using Three.js Sky shader.
 * Configured to simulate a sunset atmosphere with the sun positioned
 * to match the directional light in the scene.
 */
export class Skybox {
  private readonly sky: Sky;
  private readonly sun: THREE.Vector3;

  private static readonly CONFIG = {
    scale: 10000,
    // Haziness of the sky (higher = more hazy)
    // Higher turbidity creates darker, more atmospheric colors near the horizon
    turbidity: 20,
    // Scattering coefficient (affects blue/red tones)
    // Lower values give warmer, more orange/red tones typical of sunset
    // Reduced to darken the sky and reduce brightness
    rayleigh: 0.5,
    // Affects the size and intensity of the sun's glow
    // Lower values create a smaller, tighter glow
    mieCoefficient: 0.001,
    // Mie directional: affects how directional the sun's glow is
    mieDirectionalG: 0.8,
    // Default sun position
    sunPosition: new THREE.Vector3(0, 150, 0),
  } as const;

  constructor() {
    // Create the Sky object
    this.sky = new Sky();
    this.sky.scale.setScalar(Skybox.CONFIG.scale);

    // Sun position vector (will be normalized by the shader)
    this.sun = new THREE.Vector3();

    const uniforms = this.sky.material.uniforms;

    uniforms["turbidity"].value = Skybox.CONFIG.turbidity;
    uniforms["rayleigh"].value = Skybox.CONFIG.rayleigh;
    uniforms["mieCoefficient"].value = Skybox.CONFIG.mieCoefficient;
    uniforms["mieDirectionalG"].value = Skybox.CONFIG.mieDirectionalG;

    this.setSunPosition(Skybox.CONFIG.sunPosition);
  }

  getMesh(): Sky {
    return this.sky;
  }

  /**
   * Update the sun position if needed
   * @param position - The sun's position in world coordinates
   */
  setSunPosition(position: THREE.Vector3): void {
    const phi = Math.PI / 2 - Math.atan2(
      position.y,
      Math.sqrt(position.x * position.x + position.z * position.z),
    );
    const theta = Math.atan2(position.x, position.z);

    this.sun.setFromSphericalCoords(1, phi, theta);
    this.sky.material.uniforms["sunPosition"].value.copy(this.sun);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.sky.geometry.dispose();
    this.sky.material.dispose();
  }
}
