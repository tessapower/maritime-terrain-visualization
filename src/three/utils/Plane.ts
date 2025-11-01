// Plane.ts: Manages a simple plane mesh creation

import * as THREE from "three";

export function createPlaneMesh(
  size: number,
  segments: number,
  material: THREE.Material,
): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2; // Rotate to lay flat
  mesh.receiveShadow = true;
  mesh.castShadow = true;

  return mesh;
}
