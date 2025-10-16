// CameraControls.ts: Camera controls that register with GuiManager

import GUI from "lil-gui";
import { OrbitalCamera } from "../camera/OrbitalCamera";
import { type IGuiModule } from "./GuiManager";

/**
 * Registers camera-related controls with the GuiManager for interactive camera
 * parameter adjustment.
 */
export class CameraControls implements IGuiModule {
  private static readonly MIN_ORBIT_PERIOD = 5;
  private static readonly MAX_ORBIT_PERIOD = 240;
  private static readonly ORBIT_PERIOD_STEP = 5;
  private static readonly MIN_ORBIT_RADIUS = 30;
  private static readonly MAX_ORBIT_RADIUS = 500;
  private static readonly ORBIT_RADIUS_STEP = 10;
  private static readonly MIN_ORBIT_HEIGHT = 50;
  private static readonly MAX_ORBIT_HEIGHT = 350;
  private static readonly ORBIT_HEIGHT_STEP = 10;
  private static readonly MIN_BOB_AMOUNT = 0;
  private static readonly MAX_BOB_AMOUNT = 20;
  private static readonly BOB_AMOUNT_STEP = 1;
  private static readonly MIN_BOB_SPEED = 0;
  private static readonly MAX_BOB_SPEED = 2.0;
  private static readonly BOB_SPEED_STEP = 0.1;

  private camera: OrbitalCamera;

  constructor(camera: OrbitalCamera) {
    this.camera = camera;
  }

  setupControls(gui: GUI): void {
    const cameraFolder = gui.addFolder("Camera");

    // Enable/disable orbit
    const enabledControl = cameraFolder
      .add({ enabled: this.camera.getEnabled() }, "enabled")
      .name("Auto Orbit")
      .onChange((value: boolean) => {
        this.camera.setEnabled(value);
      });
    enabledControl.domElement.title = "Enable/disable automatic camera orbit";

    // Orbit period (how long for full rotation)
    const periodControl = cameraFolder
      .add(
        { period: this.camera.getOrbitPeriod() },
        "period",
        CameraControls.MIN_ORBIT_PERIOD,
        CameraControls.MAX_ORBIT_PERIOD,
        CameraControls.ORBIT_PERIOD_STEP,
      )
      .name("Orbit Period (s)")
      .onChange((value: number) => {
        this.camera.setOrbitPeriod(value);
      });
    periodControl.domElement.title =
      "Time in seconds for one complete rotation";

    // Orbit radius (distance from center)
    const radiusControl = cameraFolder
      .add(
        { radius: this.camera.getOrbitRadius() },
        "radius",
        CameraControls.MIN_ORBIT_RADIUS,
        CameraControls.MAX_ORBIT_RADIUS,
        CameraControls.ORBIT_RADIUS_STEP,
      )
      .name("Orbit Radius")
      .onChange((value: number) => {
        this.camera.setOrbitRadius(value);
      });
    radiusControl.domElement.title = "Distance from center point";

    // Camera height
    const heightControl = cameraFolder
      .add(
        { height: this.camera.getHeight() },
        "height",
        CameraControls.MIN_ORBIT_HEIGHT,
        CameraControls.MAX_ORBIT_HEIGHT,
        CameraControls.ORBIT_HEIGHT_STEP,
      )
      .name("Height")
      .onChange((value: number) => {
        this.camera.setHeight(value);
      });
    heightControl.domElement.title = "Camera altitude above water";

    // Bob amount (vertical movement)
    const bobAmountControl = cameraFolder
      .add(
        { bobAmount: this.camera.getBobAmount() },
        "bobAmount",
        CameraControls.MIN_BOB_AMOUNT,
        CameraControls.MAX_BOB_AMOUNT,
        CameraControls.BOB_AMOUNT_STEP,
      )
      .name("Bob Amount")
      .onChange((value: number) => {
        this.camera.setBobAmount(value);
      });
    bobAmountControl.domElement.title =
      "Vertical bobbing distance (helicopter effect)";

    // Bob speed
    const bobSpeedControl = cameraFolder
      .add(
        { bobSpeed: this.camera.getBobSpeed() },
        "bobSpeed",
        CameraControls.MIN_BOB_SPEED,
        CameraControls.MAX_BOB_SPEED,
        CameraControls.BOB_SPEED_STEP,
      )
      .name("Bob Speed")
      .onChange((value: number) => {
        this.camera.setBobSpeed(value);
      });
    bobSpeedControl.domElement.title = "Speed of vertical bobbing";
  }

  getModuleName(): string {
    return "Camera";
  }
}
