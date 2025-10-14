/// TerrainGenerator.ts: generates a terrain procedurally

import { createNoise2D } from "simplex-noise";
import {
  randInRangeInt,
  normalize,
  euclideanDistance,
  lerp,
  easeInOutSine,
} from "../utils/Math";
import { logger } from "../utils/Logger.ts";

export default class TerrainGenerator {
  // returns a value between -1 and 1
  private readonly simplex = createNoise2D();

  private readonly size: number;
  private readonly widthSegments: number;
  private readonly heightSegments: number;

  numIslands: number = 4;
  islandThreshold: number = 0.3;
  private landTransition: { start: number; end: number } = {
    start: this.islandThreshold + 0.1,
    end: this.islandThreshold - 0.05,
  };
  seaFloor: number = -10;

  voronoiFalloff: number = 12;
  warpStrength: number = 50;
  warpOffset: number = 100;
  // Oscillations per distance. Doubling makes everything half the size.
  warpFrequency: number = 0.01;

  peaksFrequency: number = 0.5;
  peaksAmplitude: number = 0.45;
  terrainFrequency: number = 0.03;

  islandsWeight: number = 30;
  terrainWeight: number = 20;
  peaksWeight: number = 10;

  private seedPoints: Array<{ x: number; y: number }> | undefined;

  constructor(
    size: number = 500,
    widthSegments: number = 256 + 1,
    heightSegments: number = 256 + 1,
  ) {
    logger.log("SYSTEM: INITIALIZING TERRAIN GENERATOR");

    this.size = size;
    this.widthSegments = widthSegments;
    this.heightSegments = heightSegments;

    this.seedPoints = this.generateSeedPoints(widthSegments, heightSegments);
  }

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

    logger.log(`SEED POINTS GENERATED: ${points.length} ISLANDS`);
    return points;
  }

  /**
   * Voronoi Noise: returns a value between [0, 1]
   *
   * Source(s): https://iquilezles.org/articles/cellularffx/
   */
  private voronoi(x: number, y: number): number {
    if (!this.seedPoints || this.seedPoints.length === 0) {
      return 0;
    }

    let minDistance: number = Number.MAX_SAFE_INTEGER;

    const maxDistance: number = Math.sqrt(this.size ** 2 + this.size ** 2);

    for (const point of this.seedPoints) {
      const distance = euclideanDistance({ x, y }, point);
      minDistance = Math.min(minDistance, distance);
    }

    // Convert distance to [0, 1] range
    // Close to seed point = high value (land/mountain peak)
    // Far from seed point = low value (water)
    const normalizedDistance = minDistance / maxDistance;

    // Inverse squared: uncomment to use inverse squared falloff
    // const value = 1 / (1 + minDistance * minDistance / 100);

    // Exponential falloff to create more defined islands
    return Math.exp(-normalizedDistance * this.voronoiFalloff);
  }

  /**
   * Ridged Noise: returns a value between [0, 1]
   *
   * Source(s): https://www.redblobgames.com/maps/terrain-from-noise/#ridged
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

  /**
   * Generates a height value for given x,y coordinates.
   */
  private generate(x: number, y: number): number {
    //---------------------------------------------------- Domain Warping ----//
    // Source(s):
    // - https://iquilezles.org/articles/warp/
    // - https://thebookofshaders.com/11/
    // - https://paulbourke.net/fractals/noise/
    // - https://www.redblobgames.com/maps/terrain-from-noise/
    // - https://www.redblobgames.com/articles/noise/introduction.html

    // Domain Warping:
    // WITHOUT: Input coords → Voronoi → Island shape
    //
    // Regular geometric pattern:
    //   *─────*─────*
    //   │     │     │
    //   │  A  │  B  │  C
    //   │     │     │
    //   *─────*─────*
    //
    //
    // WITH: Input coords → Warp with noise → Voronoi → Island shape
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

    const warpedX =
      x +
      this.simplex(x * this.warpFrequency, y * this.warpFrequency) *
        this.warpStrength;
    const warpedY =
      y +
      this.simplex(
        x * this.warpFrequency + this.warpOffset,
        y * this.warpFrequency,
      ) *
        this.warpStrength;

    // Base island shape (0-50 range)
    const islands = this.voronoi(warpedX, warpedY);

    if (islands <= this.landTransition.end) {
      // Definitely water
      return this.seaFloor;
    }

    // Hills and valleys (0-30 range)
    const terrain = this.simplex(
      x * this.terrainFrequency,
      y * this.terrainFrequency,
    );

    // Sharp mountain ridges (0-20 range)
    const peaks =
      this.peaksAmplitude *
      this.ridgedNoise(x * this.peaksFrequency, y * this.peaksFrequency);

    // TODO: introduce islands : terrain : peaks noise ratios
    const landHeight =
      islands * this.islandsWeight +
      terrain * this.terrainWeight +
      peaks * this.peaksWeight;

    // Check if we need to start easing into the water
    if (islands <= this.landTransition.start) {
      // Normalize islands between start and end of land transition zone
      const t = normalize(
        islands,
        this.landTransition.end,
        this.landTransition.start,
      );
      // Eased value indicates progress between start and end of land transition
      const easedT = easeInOutSine(t);
      return lerp(this.seaFloor, landHeight, easedT);
    }

    // Total possible height: 0 to 100
    return landHeight;
  }

  /**
   * Generates a heightSegments map for a plane with widthSegments x heightSegments.
   *
   * @param sameSeed If true, uses the same seed points as last time to generate similar islands
   */
  generateHeightMap(sameSeed: boolean = false): Float32Array {
    logger.log(
      `HEIGHTMAP: ${this.widthSegments}x${this.heightSegments} = ${this.widthSegments * this.heightSegments} POINTS`,
    );
    if (!sameSeed || !this.seedPoints) {
      this.seedPoints = this.generateSeedPoints(
        this.widthSegments,
        this.heightSegments,
      );
    }
    const heights = new Float32Array(this.widthSegments * this.heightSegments);
    this.generateHeights(this.widthSegments, this.heightSegments, heights);

    return heights;
  }

  private generateHeights(
    width: number,
    height: number,
    heights: Float32Array,
  ): void {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const worldX = x - width / 2;
        const worldY = y - height / 2;

        const index = y * width + x;
        heights[index] = this.generate(worldX, worldY);
      }
    }
  }
}
