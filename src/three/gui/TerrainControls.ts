// TerrainControls.ts: Terrain controls that register with GUIManager

import GUI from "lil-gui";
import { Terrain } from "../terrain/Terrain";
import type { IGuiModule } from "./GuiManager";

/**
 * Registers terrain-related controls with the GUI manager for interactive
 * parameter adjustment.
 */
export class TerrainControls implements IGuiModule {
  private terrain: Terrain;

  private readonly controls = {
    nIslands: { min: 1, max: 10, step: 1 },
    warpStrength: { min: 1, max: 100, step: 5 },
    warpOffset: { min: 1, max: 100, step: 5 },
    warpFrequency: { min: 0, max: 0.1, step: 0.01 },
    terrainFrequency: { min: 0, max: 0.1, step: 0.01 },
    peaksFrequency: { min: 0, max: 0.1, step: 0.01 },
    peaksAmplitude: { min: 0, max: 1, step: 0.05 },
  } as const;

  constructor(terrain: Terrain) {
    this.terrain = terrain;
  }

  setupControls(gui: GUI): void {
    const generator = this.terrain.getGenerator();

    // Islands folder
    const islands = gui.addFolder("Random Generation");
    const islandsControl = islands
      .add(
        generator,
        "numIslands",
        this.controls.nIslands.min,
        this.controls.nIslands.max,
        this.controls.nIslands.step,
      )
      .name("# of Seed Points")
      .onFinishChange(() => {
        this.terrain.regenerate();
      });
    islandsControl.domElement.title =
      'Number of "island" clusters (Voronoi seed points)';

    // Warp folder
    const warp = gui.addFolder("Warp Effect");

    warp
      .add(
        generator,
        "warpStrength",
        this.controls.warpStrength.min,
        this.controls.warpStrength.max,
        this.controls.warpStrength.step,
      )
      .name("Warp Strength").domElement.title =
      "Strength of domain warping distortion";

    warp
      .add(
        generator,
        "warpOffset",
        this.controls.warpOffset.min,
        this.controls.warpOffset.max,
        this.controls.warpOffset.step,
      )
      .name("Warp Offset").domElement.title =
      "Offset for second warp noise layer";

    warp
      .add(
        generator,
        "warpFrequency",
        this.controls.warpFrequency.min,
        this.controls.warpFrequency.max,
        this.controls.warpFrequency.step,
      )
      .name("Warp Frequency").domElement.title =
      "Frequency of warp noise (higher = more detail)";

    // Terrain features
    const terrain = gui.addFolder("Terrain Features");

    terrain
      .add(
        generator,
        "terrainFrequency",
        this.controls.terrainFrequency.min,
        this.controls.terrainFrequency.max,
        this.controls.terrainFrequency.step,
      )
      .name("Terrain Frequency").domElement.title =
      "Frequency of base terrain noise";

    terrain
      .add(
        generator,
        "peaksFrequency",
        this.controls.peaksFrequency.min,
        this.controls.peaksFrequency.max,
        this.controls.peaksFrequency.step,
      )
      .name("Peaks Frequency").domElement.title = "Frequency of mountain peaks";

    terrain
      .add(
        generator,
        "peaksAmplitude",
        this.controls.peaksAmplitude.min,
        this.controls.peaksAmplitude.max,
        this.controls.peaksAmplitude.step,
      )
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
