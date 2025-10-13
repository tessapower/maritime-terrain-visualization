/// CameraGUI.ts: Camera controls that register with GUIManager

import GUI from "lil-gui";
import { OrbitalCamera } from "../camera/OrbitalCamera";
import { type IGuiModule } from "./GuiManager";

export class CameraControls implements IGuiModule {
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
      .add({ period: this.camera.getOrbitPeriod() }, "period", 20, 180, 5)
      .name("Orbit Period (s)")
      .onChange((value: number) => {
        this.camera.setOrbitPeriod(value);
      });
    periodControl.domElement.title =
      "Time in seconds for one complete rotation";

    // Orbit radius (distance from center)
    const radiusControl = cameraFolder
      .add({ radius: this.camera.getOrbitRadius() }, "radius", 100, 500, 10)
      .name("Orbit Radius")
      .onChange((value: number) => {
        this.camera.setOrbitRadius(value);
      });
    radiusControl.domElement.title = "Distance from center point";

    // Camera height
    const heightControl = cameraFolder
      .add({ height: this.camera.getHeight() }, "height", 50, 300, 10)
      .name("Height")
      .onChange((value: number) => {
        this.camera.setHeight(value);
      });
    heightControl.domElement.title = "Camera altitude above water";

    // Bob amount (vertical movement)
    const bobAmountControl = cameraFolder
      .add({ bobAmount: this.camera.getBobAmount() }, "bobAmount", 0, 20, 1)
      .name("Bob Amount")
      .onChange((value: number) => {
        this.camera.setBobAmount(value);
      });
    bobAmountControl.domElement.title =
      "Vertical bobbing distance (helicopter effect)";

    // Bob speed
    const bobSpeedControl = cameraFolder
      .add({ bobSpeed: this.camera.getBobSpeed() }, "bobSpeed", 0, 2, 0.1)
      .name("Bob Speed")
      .onChange((value: number) => {
        this.camera.setBobSpeed(value);
      });
    bobSpeedControl.domElement.title = "Speed of vertical bobbing";

    cameraFolder.close(); // Start collapsed
  }

  getFolderName(): string {
    return "Camera";
  }
}
