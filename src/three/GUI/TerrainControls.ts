/// TerrainGUI.ts: Manages lil-gui controls for terrain

import GUI from "lil-gui";
import { Terrain } from "../terrain/Terrain";

export class TerrainControls {
  private gui: GUI;
  private terrain: Terrain;

  constructor(terrain: Terrain) {
    this.terrain = terrain;
    this.gui = new GUI();
    this.setupControls();
  }

  private setupControls(): void {
    const generator = this.terrain.getGenerator();

    // Islands folder
    const islands = this.gui.addFolder("Islands");

    const islandsControl = islands
      .add(generator, "numIslands", 1, 100, 1)
      .name("# of Islands")
      .onFinishChange(() => {
        this.terrain.regenerate();
      });
    islandsControl.domElement.title =
      "Number of island clusters (Voronoi seed points)";

    const thresholdControl = islands
      .add(generator, "islandThreshold", 0.1, 1.0, 0.1)
      .name("Threshold");
    thresholdControl.domElement.title =
      "Land/water cutoff. Lower values = more ocean";

    // Warp folder
    const warp = this.gui.addFolder("Warp Effect");

    warp
      .add(generator, "warpStrength", 0, 100, 5)
      .name("Warp Strength").domElement.title =
      "Strength of domain warping distortion";

    warp
      .add(generator, "warpOffset", 0, 500, 10)
      .name("Warp Offset").domElement.title =
      "Offset for second warp noise layer";

    warp
      .add(generator, "warpFrequency", 0, 1.0, 0.01)
      .name("Warp Frequency").domElement.title =
      "Frequency of warp noise (higher = more detail)";

    // Terrain folder
    const terrain = this.gui.addFolder("Terrain");

    terrain
      .add(generator, "terrainFrequency", 0.0, 1.0, 0.01)
      .name("Terrain Frequency").domElement.title =
      "Frequency of base terrain noise";

    terrain
      .add(generator, "peaksFrequency", 0.0, 1.0, 0.01)
      .name("Peaks Frequency").domElement.title = "Frequency of mountain peaks";

    terrain
      .add(generator, "peaksAmplitude", 0.0, 1.0, 0.05)
      .name("Peaks Amplitude").domElement.title =
      "Height contribution of ridged peaks";

    // Water folder
    const water = this.gui.addFolder("Water");

    water
      .add(generator, "seaFloor", -100, 100, 10)
      .name("Sea Floor").domElement.title = "Height of underwater terrain";

    // Global change listener
    this.gui.onFinishChange(() => {
      this.terrain.update();
    });

    // TODO: Add preset system
    // this.gui
    //   .add({ reset: () => this.resetToDefaults() }, "reset")
    //   .name("Reset Values");
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.gui.destroy();
  }
}
