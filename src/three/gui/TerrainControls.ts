/// TerrainControls.ts: Terrain controls that register with GUIManager

import GUI from "lil-gui";
import { Terrain } from "../terrain/Terrain";
import type { IGuiModule } from "./GuiManager";

export class TerrainControls implements IGuiModule {
  private terrain: Terrain;

  constructor(terrain: Terrain) {
    this.terrain = terrain;
  }

  setupControls(gui: GUI): void {
    const generator = this.terrain.getGenerator();

    // Islands folder
    const islands = gui.addFolder("Random Generation");

    const islandsControl = islands
      .add(generator, "numIslands", 1, 10, 1)
      .name("# of Seed Points")
      .onFinishChange(() => {
        this.terrain.regenerate();
      });
    islandsControl.domElement.title =
      'Number of "island" clusters (Voronoi seed points)';

    // Warp folder
    const warp = gui.addFolder("Warp Effect");

    warp
      .add(generator, "warpStrength", 0, 100, 5)
      .name("Warp Strength").domElement.title =
      "Strength of domain warping distortion";

    warp
      .add(generator, "warpOffset", 0, 100, 5)
      .name("Warp Offset").domElement.title =
      "Offset for second warp noise layer";

    warp
      .add(generator, "warpFrequency", 0, 0.1, 0.01)
      .name("Warp Frequency").domElement.title =
      "Frequency of warp noise (higher = more detail)";

    // Terrain features
    const terrain = gui.addFolder("Terrain Features");

    terrain
      .add(generator, "terrainFrequency", 0.0, 0.1, 0.01)
      .name("Terrain Frequency").domElement.title =
      "Frequency of base terrain noise";

    terrain
      .add(generator, "peaksFrequency", 0.0, 0.1, 0.01)
      .name("Peaks Frequency").domElement.title = "Frequency of mountain peaks";

    terrain
      .add(generator, "peaksAmplitude", 0.0, 1.0, 0.05)
      .name("Peaks Amplitude").domElement.title =
      "Height contribution of ridged peaks";

    // Add a button to regenerate the terrain with new seed points
    const regenerateControl = {
      regenerate: () => {
        this.terrain.regenerate();
      },
    };
    terrain.add(regenerateControl, "regenerate").name("Regenerate Terrain");

    // Global change listener
    gui.onFinishChange(() => {
      this.terrain.update();
    });
  }

  getModuleName(): string {
    return "Terrain";
  }
}
