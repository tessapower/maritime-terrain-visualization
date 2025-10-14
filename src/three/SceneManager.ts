// SceneManager.ts: Three.js scene setup and orchestration

import * as THREE from "three";
import { CameraControls } from "./gui/CameraControls";
import { Grid } from "./grid/Grid.ts";
import { GuiManager } from "./gui/GuiManager";
import { logger } from "./utils/Logger.ts";
import { OrbitalCamera } from "./camera/OrbitalCamera";
import { ShadowPlane } from "./water/ShadowPlane.ts";
import { TerrainControls } from "./gui/TerrainControls";
import { Terrain } from "./terrain/Terrain";
import { Water } from "./water/Water";

/**
 * Orchestrates the Three.js scene, including terrain, water, grid, lighting,
 * camera, and GUI modules. Handles initialization, animation loop, resizing,
 * and resource cleanup.
 */
export class SceneManager {
  private readonly canvas: HTMLCanvasElement;
  private readonly scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private animationId: number | null = null;

  private readonly terrain: Terrain;
  private water: Water;
  private shadowPlane: ShadowPlane;
  private grid: Grid;
  private guiManager: GuiManager;

  private readonly size: number = 500;
  private readonly resolution: number = 256;

  // Camera
  private readonly orbitalCamera: OrbitalCamera;

  // Lighting
  private readonly lightingConfig = {
    ambient: {
      color: 0xffffff,
      intensity: 1,
    },
    sun: {
      color: 0xffffff,
      intensity: 3,
      position: new THREE.Vector3(350, 150, 0),
      targetPosition: new THREE.Vector3(0, 0, 0),
    },
    shadow: {
      mapSize: 2048,
      cameraNear: 0.5,
      cameraFar: 800,
      cameraBounds: 600,
      bias: -0.0005,
      normalBias: 0.05,
      radius: 15,
    },
    hemisphere: {
      skyColor: 0xffffff,
      groundColor: 0xf5f5f5,
      intensity: 0.3,
    },
  } as const;

  constructor(canvas: HTMLCanvasElement) {
    logger.log("SYSTEM: INITIALIZING SCENE MANAGER");

    this.canvas = canvas;
    this.scene = new THREE.Scene();

    this.orbitalCamera = new OrbitalCamera(
      window.innerWidth / window.innerHeight,
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });

    // Set up renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Enable shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Handle resize
    window.addEventListener("resize", this.handleResize);

    logger.log("RENDERER: INITIALIZED ✓");

    // Create scene objects
    // TODO: remove hardcoded sizes
    this.terrain = new Terrain(this.size, this.resolution);
    this.water = new Water(this.size * 5, 0);
    this.shadowPlane = new ShadowPlane(this.size * 5, 0.2);
    this.grid = new Grid(this.size * 5, 1000, 0.8);

    // Create GUI manager
    this.guiManager = new GuiManager();

    // Register GUI modules
    this.guiManager.register("terrain", new TerrainControls(this.terrain));
    if (import.meta.env.VITE_DEBUG_MODE === "true") {
      this.guiManager.register(
        "camera",
        new CameraControls(this.orbitalCamera),
      );
    }

    this.setupScene();
    logger.log("SCENE: SETUP COMPLETE ✓");
  }

  private setupScene(): void {
    this.scene.background = new THREE.Color(0x232935);

    this.scene.add(this.terrain.getMesh());
    this.scene.add(this.shadowPlane.getMesh());
    this.scene.add(this.water.getMesh());
    this.scene.add(this.grid.getMesh());

    // Setup lighting
    this.setupLighting();
  }

  private setupLighting(): void {
    logger.log("LIGHTING: CONFIGURING");

    const { ambient, sun, shadow, hemisphere } = this.lightingConfig;

    // Ambient light provides base illumination
    const ambientLight = new THREE.AmbientLight(
      ambient.color,
      ambient.intensity,
    );

    // Directional light simulates sunlight
    const sunLight = new THREE.DirectionalLight(sun.color, sun.intensity);
    sunLight.position.copy(sun.position);
    sunLight.castShadow = true;

    // Create a dedicated Object3D for the sun's target at the center of the terrain
    // This ensures shadows remain fixed and do not shift with camera movement
    const sunTarget = new THREE.Object3D();
    sunTarget.position.copy(sun.targetPosition);
    this.scene.add(sunTarget);
    sunLight.target = sunTarget;

    // Configure shadow camera bounds to cover the terrain
    // Large bounds help prevent shadow "swimming" artifacts
    sunLight.shadow.mapSize.width = shadow.mapSize;
    sunLight.shadow.mapSize.height = shadow.mapSize;
    sunLight.shadow.camera.near = shadow.cameraNear;
    sunLight.shadow.camera.far = shadow.cameraFar;
    sunLight.shadow.camera.left = -shadow.cameraBounds;
    sunLight.shadow.camera.right = shadow.cameraBounds;
    sunLight.shadow.camera.top = shadow.cameraBounds;
    sunLight.shadow.camera.bottom = -shadow.cameraBounds;
    sunLight.shadow.bias = shadow.bias;
    sunLight.shadow.normalBias = shadow.normalBias;
    sunLight.shadow.radius = shadow.radius;

    // Hemisphere light simulates sky and ground lighting
    const hemiLight = new THREE.HemisphereLight(
      hemisphere.skyColor,
      hemisphere.groundColor,
      hemisphere.intensity,
    );

    this.scene.add(sunLight, ambientLight, hemiLight);

    // Update terrain shader with sun direction
    this.terrain.setSunDirection(sun.position, sun.targetPosition);
    logger.log("LIGHTING: COMPLETE ✓");
  }

  start(): void {
    logger.log("ANIMATION: STARTED");
    this.animate();
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const time = performance.now() * 0.001; // Convert to seconds

    this.orbitalCamera.update(time);
    this.water.update(time);

    this.renderer.render(this.scene, this.orbitalCamera.getCamera());
  };

  private handleResize = (): void => {
    this.orbitalCamera.updateAspectRatio(window.innerWidth, window.innerHeight);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  dispose(): void {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);

    window.removeEventListener("resize", this.handleResize);

    // Dispose scene objects
    this.terrain.dispose();
    this.shadowPlane.dispose();
    this.water.dispose();
    this.grid.dispose();
    this.guiManager.dispose();

    this.renderer.dispose();
  }
}
