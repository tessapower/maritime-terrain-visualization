/// SceneManager.ts: Three.js scene setup and orchestration

import * as THREE from "three";
import TerrainGenerator from "./terrain/TerrainGenerator";

export class SceneManager {
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;

  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private terrain: THREE.Mesh;
  private terrainGenerator: TerrainGenerator;
  private readonly resolution: number = 256;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.terrainGenerator = new TerrainGenerator();

    // To be initialized in init()
    this.terrain = null!;

    this.init();
  }

  init(): void {
    // Set up renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Set up scene
    this.setUpScene();

    // Handle resize
    window.addEventListener("resize", this.handleResize);
  }

  private setUpScene(): void {
    // Set scene background
    this.scene.background = new THREE.Color(0x232935);

    //------------------------------------------------------ TerrainPlane ----//
    {
      const planeGeometry = new THREE.PlaneGeometry(
        500,
        500,
        this.resolution,
        this.resolution,
      );

      const heightMap = this.terrainGenerator.generateHeightMap(
        this.resolution + 1,
        this.resolution + 1,
      );

      console.log("Min height:", Math.min(...heightMap));
      console.log("Max height:", Math.max(...heightMap));
      console.log(
        "Average height:",
        heightMap.reduce((a, b) => a + b, 0) / heightMap.length,
      );
      console.log("Sample heights:", heightMap.slice(0, 20));

      // Set the vertex heights
      const vertices = planeGeometry.attributes.position;
      for (let i = 0; i < vertices.count; i++) {
        vertices.setZ(i, heightMap[i] * 45);
      }

      vertices.needsUpdate = true;

      // Recalculate normals for proper lighting
      planeGeometry.computeVertexNormals();

      const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0xacff24,
        side: THREE.FrontSide,
        wireframe: false, // Enable wireframe to see structure
      });

      this.terrain = new THREE.Mesh(planeGeometry, planeMaterial);
      this.terrain.rotation.x = -Math.PI / 2; // Rotate to lay flat
      this.terrain.receiveShadow = true;
      this.scene.add(this.terrain);
    }

    //---------------------------------------------------------- Lighting ----//
    {
      // Ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);

      // Directional light to simulate sun
      const sun = new THREE.DirectionalLight(0xffffff, 0.8);
      sun.position.set(10, 20, 10);
      sun.castShadow = true;

      // Shadow camera's frustum
      sun.shadow.camera.left = -25;
      sun.shadow.camera.right = 25;
      sun.shadow.camera.top = 25;
      sun.shadow.camera.bottom = -25;

      // Uncomment to see shadow camera rendering volume
      // const shadowCameraHelper = new THREE.CameraHelper(sun.shadow.camera);
      // scene.add(shadowCameraHelper);

      this.scene.add(sun);
    }

    //------------------------------------------------------------ Camera ----//
    //this.camera.position.set(50, 40, 50);
    this.camera.position.set(0, 200, 200); // Bird's eye view
    this.camera.lookAt(0, 0, 0);
  }

  start(): void {
    this.animate();
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    this.renderer.render(this.scene, this.camera);
  };

  private handleResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  dispose(): void {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);

    window.removeEventListener("resize", this.handleResize);
    this.renderer.dispose();
  }
}
