/// CameraGUI.ts: Camera controls that register with GUIManager

import GUI from "lil-gui";
import { OrbitalCamera } from "../camera/OrbitalCamera";
import { type IGuiModule } from "./GuiManager";

export class CameraControls implements IGuiModule {
  private camera: OrbitalCamera;

  private readonly minOrbitPeriod: number = 5;
  private readonly maxOrbitPeriod: number = 240;
  private readonly orbitPeriodStep: number = 5;
  private readonly minOrbitRadius: number = 50;
  private readonly maxOrbitRadius: number = 500;
  private readonly orbitRadiusStep: number = 10;
  private readonly minOrbitHeight: number = 50;
  private readonly maxOrbitHeight: number = 350;
  private readonly orbitHeightStep: number = 10;
  private readonly minBobAmount: number = 0;
  private readonly maxBobAmount: number = 20;
  private readonly bobAmountStep: number = 1;
  private readonly minBobSpeed: number = 0;
  private readonly maxBobSpeed: number = 2.0;
  private readonly bobSpeedStep: number = 0.1;

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
        this.minOrbitPeriod,
        this.maxOrbitPeriod,
        this.orbitPeriodStep,
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
        this.minOrbitRadius,
        this.maxOrbitRadius,
        this.orbitRadiusStep,
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
        this.minOrbitHeight,
        this.maxOrbitHeight,
        this.orbitHeightStep,
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
        this.minBobAmount,
        this.maxBobAmount,
        this.bobAmountStep,
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
        this.minBobSpeed,
        this.maxBobSpeed,
        this.bobSpeedStep,
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
