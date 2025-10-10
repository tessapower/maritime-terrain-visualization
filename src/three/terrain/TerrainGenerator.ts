/// TerrainGenerator.ts: generates a terrain procedurally

import { createNoise2D } from "simplex-noise";
import { randInRangeInt, euclideanDistance } from "../utils/Math";

export default class TerrainGenerator {
  private readonly simplex = createNoise2D();
  numIslands: number = 7;
  islandThreshold: number = 0.3;
  waterLevel: number = -10;

  private seedPoints: Array<{ x: number; y: number }> | undefined;

  private generateSeedPoints(
    width: number,
    height: number,
  ): Array<{ x: number; y: number }> {
    const halfWidth: number = Math.floor(width * 0.5);
    const halfHeight: number = Math.floor(height * 0.5);

    const points = [];
    for (let i = 0; i < this.numIslands; i++) {
      points.push({
        x: randInRangeInt(-halfWidth, halfWidth),
        y: randInRangeInt(-halfHeight, halfHeight),
      });
    }

    return points;
  }

  /**
   * Voronoi Noise: returns a value between [0, 1]
   */
  private voronoi(x: number, y: number): number {
    if (!this.seedPoints || this.seedPoints.length === 0) {
      return 0;
    }

    let minDistance: number = Number.MAX_SAFE_INTEGER;

    // TODO: figure out how to pass in bounds of terrain
    const maxDistance: number = 707;

    for (const point of this.seedPoints) {
      const distance = euclideanDistance({ x, y }, point);
      minDistance = Math.min(minDistance, distance);
    }

    // Convert distance to [0, 1] range
    // Close to seed point = high value (land/mountain peak)
    // Far from seed point = low value (water)
    const normalizedDistance = minDistance / maxDistance;

    // Inverse squared
    // const value = 1 / (1 + minDistance * minDistance / someScale);

    // Exponential falloff to create more defined islands
    const value = Math.exp(-normalizedDistance * 32);

    return value;
  }

  /**
   * Rigid Noise: returns a value between [0, 1]
   *
   * Source(s):
   */
  private ridgedNoise(x: number, y: number): number {
    // Invert valleys to become ridges
    // return Math.abs(this.simplex(x, y));
    return 1 - Math.abs(this.simplex(x, y));
  }

  /**
   * generateHeightMap() calls generate(x, y)
   *               │
   *               ▼
   *     ┌─────────────────────┐
   *     │     Domain Warp     │
   *     │     x,y → wx,wy     │
   *     └─────────────────────┘
   *               │
   *               ▼
   *     ┌─────────────────────┐
   *     │    Voronoi Noise    │
   *     │   wx,wy → islands   │  Range: [0, 1]
   *     └─────────────────────┘
   *               │
   *               ▼
   *      Is islands < threshold?
   *               │
   *          ┌────┴────┐
   *          │         │
   *         YES        NO
   *          │         │
   *          │         ▼
   *          │    ┌─────────────────────┐
   *          │    │  Terrain Features   │
   *          │    │   Perlin + Ridged   │
   *          │    └─────────────────────┘
   *          │         │
   *          ▼         ▼
   *        Water    Land heights
   *        (-10)    (weighted sum)
   */
  private generate(x: number, y: number): number {
    //---------------------------------------------------- Domain Warping ----//
    // Source(s):
    // - https://iquilezles.org/articles/warp/
    // - https://thebookofshaders.com/11/
    //
    // WITHOUT Domain Warp:
    // Input coords → Voronoi → Island shape
    //
    // Regular geometric pattern:
    //   *─────*─────*
    //   │     │     │
    //   │  A  │  B  │  C
    //   │     │     │
    //   *─────*─────*
    //
    //
    // WITH Domain Warp:
    // Input coords → Warp with noise → Voronoi → Island shape
    //
    // Organic, natural pattern:
    //     *───┐
    //    ╱     ╲
    //   │   A   *───*
    //    ╲     ╱     ╲
    //     *───┘   B   │
    //          ╲     ╱
    //           *───*
    //               C

    const warpedX = x + this.simplex(x * 0.01, y * 0.01) * 30;
    const warpedY = y + this.simplex(x * 0.01 + 100, y * 0.01) * 30;

    const islands = this.voronoi(warpedX, warpedY);

    if (islands < this.islandThreshold) {
      return this.waterLevel; // -10
    }


    if (islands < this.islandThreshold) return this.waterLevel;

    // Layer 2: terrain * 30
    // Hills and valleys (0-30 range)
    const terrain = this.simplex(x * 0.05, y * 0.05);

    // Layer 3: peaks * 20
    // Sharp mountain ridges (0-20 range)
    const peaks = this.ridgedNoise(x * 0.1, y * 0.1);

    // Total possible height: 0 to 100
    return islands * 50 + terrain * 30 + peaks * 20;
  }

  /**
   * Generates a height map for a plane with dimensions width x height.
   *
   * @param width Total width of plane to generate height map for
   * @param height Total height of plane to generate height map for
   */
  generateHeightMap(width: number, height: number): Float32Array {
    const heights = new Float32Array(width * height);
    this.seedPoints = this.generateSeedPoints(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const worldX = x - width / 2;
        const worldY = y - height / 2;

        const index = y * width + x;
        heights[index] = this.generate(worldX, worldY);
      }
    }

    return heights;
  }
}
