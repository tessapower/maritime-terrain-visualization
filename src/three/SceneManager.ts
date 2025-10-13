/// SceneManager.ts: Three.js scene setup and orchestration

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

  // Camera constants
  private readonly orbitalCamera: OrbitalCamera;
  private readonly defaultOrbitRadius: number = 50;
  private readonly defaultOrbitPeriod: number = 240;
  private readonly defaultOrbitHeight: number = 300;
  private readonly defaultBobAmount: number = 1;
  private readonly defaultBobSpeed: number = 1.0;

  // Lighting
  private readonly lightingConfig = {
    ambient: {
      color: 0xffffff,
      intensity: 0.6,
    },
    sun: {
      color: 0xffffff,
      intensity: 0.8,
      position: new THREE.Vector3(20, 15, 20),
    },
    shadow: {
      mapSize: 2048,
      cameraNear: 0.5,
      cameraFar: 600,
      cameraBounds: 400,
      bias: -0.0005,
      normalBias: 0.05,
      radius: 15,
    },
    hemisphere: {
      skyColor: 0x8090a0,
      groundColor: 0x2a3a4a,
      intensity: 0.4,
    },
  } as const;

  constructor(canvas: HTMLCanvasElement) {
    logger.log("SYSTEM: INITIALIZING SCENE MANAGER");

    this.canvas = canvas;
    this.scene = new THREE.Scene();

    this.orbitalCamera = new OrbitalCamera(
      window.innerWidth / window.innerHeight,
      {
        orbitRadius: this.defaultOrbitRadius,
        orbitPeriod: this.defaultOrbitPeriod,
        height: this.defaultOrbitHeight,
        bobAmount: this.defaultBobAmount,
        bobSpeed: this.defaultBobSpeed,
        enabled: true,
      },
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });

    // Enable shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.init();
    logger.log("RENDERER: INITIALIZED");

    // Create scene objects
    this.terrain = new Terrain(this.size, this.resolution);
    // TODO: replace these magic numbers!
    this.water = new Water(this.size * 1.5, 0);
    this.shadowPlane = new ShadowPlane(this.size * 1.5, 0.2);
    this.grid = new Grid(this.size * 1.5, 200, 0.8);

    // Create GUI manager
    this.guiManager = new GuiManager();

    // Register GUI modules
    this.guiManager.register("terrain", new TerrainControls(this.terrain));
    this.guiManager.register("camera", new CameraControls(this.orbitalCamera));

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

    const ambientLight = new THREE.AmbientLight(
      ambient.color,
      ambient.intensity,
    );

    const sunLight = new THREE.DirectionalLight(sun.color, sun.intensity);
    sunLight.position.copy(sun.position);
    sunLight.castShadow = true;

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

    const hemiLight = new THREE.HemisphereLight(
      hemisphere.skyColor,
      hemisphere.groundColor,
      hemisphere.intensity,
    );

    this.scene.add(sunLight, ambientLight, hemiLight);
    logger.log("LIGHTING: COMPLETE");
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
