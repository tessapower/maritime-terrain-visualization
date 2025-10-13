/// SceneManager.ts: Three.js scene setup and orchestration

import * as THREE from "three";
import { Terrain } from "./terrain/Terrain";
import { Water } from "./water/Water";
import { TerrainControls } from "./gui/TerrainControls";
import { logger } from "./utils/Logger.ts";

export class SceneManager {
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationId: number | null = null;

  private terrain: Terrain;
  private water: Water;
  private gui: TerrainControls;

  private readonly size: number = 500;
  private readonly resolution: number = 256;

  constructor(canvas: HTMLCanvasElement) {
    logger.log("SYSTEM: INITIALIZING SCENE MANAGER");

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

    this.init();
    logger.log("RENDERER: INITIALIZED");

    // Create scene objects
    this.terrain = new Terrain(this.size, this.resolution);
    this.water = new Water(this.size * 1.5, 0);
    this.gui = new TerrainControls(this.terrain);

    this.setupScene();
    logger.log("SCENE SETUP: COMPLETE");
  }

  private init(): void {
    // Set up renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Handle resize
    window.addEventListener("resize", this.handleResize);
  }

  private setupScene(): void {
    // Set scene background
    this.scene.background = new THREE.Color(0x232935);

    // Add terrain to scene
    this.scene.add(this.terrain.getMesh());

    // Add water to scene
    this.scene.add(this.water.getMesh());

    // Setup lighting
    this.setupLighting();

    // Setup camera
    this.setupCamera();
  }

  private setupLighting(): void {
    logger.log("LIGHTING: CONFIGURING");
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);

    // Directional light (sun)
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;

    // Shadow camera frustum
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    this.scene.add(sun, ambientLight);

    logger.log("LIGHTING: COMPLETE");
  }

  private setupCamera(): void {
    this.camera.position.set(0, 200, 200); // Bird's eye view
    this.camera.lookAt(0, 0, 0);
    logger.log("CAMERA: POSITIONED");
  }

  start(): void {
    logger.log("ANIMATION: STARTED");
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

    // Dispose scene objects
    this.terrain.dispose();
    this.water.dispose();
    this.gui.dispose();

    this.renderer.dispose();
  }
}
