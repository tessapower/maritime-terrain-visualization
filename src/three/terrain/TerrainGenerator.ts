// TerrainGenerator.ts: generates a terrain procedurally

import { createNoise2D } from "simplex-noise";
import {
  randInRangeInt,
  normalize,
  euclideanDistance,
  lerp,
  easeInOutSine,
} from "../utils/Math";
import { logger } from "../utils/Logger.ts";

/**
 * Generates procedural terrain heightmaps using noise,
 * Voronoi, warping, and peaks.
 *
 * Key concepts:
 * - Simplex noise for organic terrain variation
 * - Voronoi falloff for island shapes
 * - Domain warping for more natural, less grid-like features
 * - Peaks for mountainous regions
 *
 * Parameters:
 * - numIslands: Number of Voronoi seed points for islands
 * - islandThreshold: Controls land/sea boundary
 * - voronoiFalloff: Controls how sharply islands fall off into sea
 * - warpStrength, warpFrequency: Control domain warping
 * - peaksFrequency, peaksAmplitude: Control peak generation
 * - terrainFrequency: Controls base terrain variation
 * - islandsWeight, terrainWeight, peaksWeight: Blend weights for each feature
 */
export default class TerrainGenerator {
  private static readonly DEFAULT_SIZE = 500;
  private static readonly DEFAULT_WIDTH_SEGMENTS = 257;
  private static readonly DEFAULT_HEIGHT_SEGMENTS = 257;
  private static readonly DEFAULT_NUM_ISLANDS = 4;
  private static readonly DEFAULT_ISLAND_THRESHOLD = 0.3;
  private static readonly DEFAULT_SEA_FLOOR = -10;
  private static readonly DEFAULT_VORONOI_FALLOFF = 12;
  private static readonly DEFAULT_WARP_STRENGTH = 50;
  private static readonly DEFAULT_WARP_OFFSET = 60;
  private static readonly DEFAULT_WARP_FREQUENCY = 0.01;
  private static readonly DEFAULT_PEAKS_FREQUENCY = 0.06;
  private static readonly DEFAULT_PEAKS_AMPLITUDE = 0.45;
  private static readonly DEFAULT_TERRAIN_FREQUENCY = 0.03;
  private static readonly DEFAULT_ISLANDS_WEIGHT = 30;
  private static readonly DEFAULT_TERRAIN_WEIGHT = 20;
  private static readonly DEFAULT_PEAKS_WEIGHT = 10;
  private static readonly DEFAULT_EDGE_FALLOFF = 0.15;

  // returns a value between -1 and 1
  private readonly simplex = createNoise2D();

  private readonly size: number;
  private readonly widthSegments: number;
  private readonly heightSegments: number;

  numIslands: number = TerrainGenerator.DEFAULT_NUM_ISLANDS;
  islandThreshold: number = TerrainGenerator.DEFAULT_ISLAND_THRESHOLD;
  private landTransition: { start: number; end: number } = {
    start: this.islandThreshold + 0.1,
    end: this.islandThreshold - 0.05,
  };
  seaFloor: number = TerrainGenerator.DEFAULT_SEA_FLOOR;

  voronoiFalloff: number = TerrainGenerator.DEFAULT_VORONOI_FALLOFF;
  warpStrength: number = TerrainGenerator.DEFAULT_WARP_STRENGTH;
  warpOffset: number = TerrainGenerator.DEFAULT_WARP_OFFSET;
  // Oscillations per distance. Doubling makes everything half the size.
  warpFrequency: number = TerrainGenerator.DEFAULT_WARP_FREQUENCY;

  peaksFrequency: number = TerrainGenerator.DEFAULT_PEAKS_FREQUENCY;
  peaksAmplitude: number = TerrainGenerator.DEFAULT_PEAKS_AMPLITUDE;
  terrainFrequency: number = TerrainGenerator.DEFAULT_TERRAIN_FREQUENCY;

  islandsWeight: number = TerrainGenerator.DEFAULT_ISLANDS_WEIGHT;
  terrainWeight: number = TerrainGenerator.DEFAULT_TERRAIN_WEIGHT;
  peaksWeight: number = TerrainGenerator.DEFAULT_PEAKS_WEIGHT;

  // Edge falloff: 0 = no falloff, 1 = entire plane is falloff zone
  edgeFalloff: number = TerrainGenerator.DEFAULT_EDGE_FALLOFF;

  /**
   * Voronoi seed points for islands. Used to calculate distance-based falloff.
   */
  private seedPoints: Array<{ x: number; y: number }> | undefined;

  constructor(
    size: number = TerrainGenerator.DEFAULT_SIZE,
    widthSegments: number = TerrainGenerator.DEFAULT_WIDTH_SEGMENTS,
    heightSegments: number = TerrainGenerator.DEFAULT_HEIGHT_SEGMENTS,
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
   * Returns a value between [0, 1]
   *
   * Calculates the minimum distance from (x, y) to any seed point.
   * The result is normalized and exponentiated to create island shapes.
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
   * Returns a value between [0, 1]
   *
   * Inverts valleys to become ridges for sharper terrain features.
   * Source(s): https://www.redblobgames.com/maps/terrain-from-noise/#ridged
   */
  private ridgedNoise(x: number, y: number): number {
    // Invert valleys to become ridges
    // return Math.abs(this.simplex(x, y));
    return 1 - Math.abs(this.simplex(x, y));
  }

  /**
   * Returns a value between [0, 1] representing edge falloff.
   *
   * Calculates how close the point is to the edge of the plane.
   * Returns 1.0 in the center, smoothly transitioning to 0.0 at the edges.
   * This prevents terrain features from extending to the plane boundaries.
   *
   * @param x World x coordinate (centered at 0)
   * @param y World y coordinate (centered at 0)
   */
  private calculateEdgeFalloff(x: number, y: number): number {
    if (this.edgeFalloff <= 0) {
      return 1.0; // No falloff
    }

    const halfWidth = this.widthSegments / 2;
    const halfHeight = this.heightSegments / 2;

    // Calculate distance from edge as a fraction [0, 1]
    // 0 = at edge, 1 = at center
    const distanceFromEdgeX = 1 - Math.abs(x) / halfWidth;
    const distanceFromEdgeY = 1 - Math.abs(y) / halfHeight;

    // Use the minimum (closest edge determines falloff)
    const minDistanceFromEdge = Math.min(distanceFromEdgeX, distanceFromEdgeY);

    // Calculate falloff: if we're within the falloff zone, blend to 0
    // edgeFalloff is the fraction of the plane that should fade out

    if (minDistanceFromEdge >= this.edgeFalloff) {
      return 1.0; // Outside falloff zone, no reduction
    }

    // Inside falloff zone: smoothly interpolate from 1 to 0
    const t = minDistanceFromEdge / this.edgeFalloff;

    // Apply easing for smooth transition
    return easeInOutSine(t);
  }

  /**
   * Generates a height value for given x,y coordinates.
   *
   * This function combines domain warping, Voronoi islands, Perlin terrain, and ridged peaks.
   * The result is a weighted sum, with smooth transitions between land and water.
   *
   * Domain warping distorts the input coordinates to create more organic shapes.
   * Voronoi noise creates islands. Perlin and ridged noise add terrain and peaks.
   *
   * See below for a flowchart of the logic.
   *
   * <pre>
   *   generateHeightMap() calls generate(x, y)
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
   * </pre>
   */
  private generate(x: number, y: number): number {
    //---------------------------------------------------- Domain Warping ----//
    // Source(s):
    // - https://iquilezles.org/articles/warp/
    // - https://thebookofshaders.com/11/
    // - https://paulbourke.net/fractals/noise/
    // - https://www.redblobgames.com/maps/terrain-from-noise/
    // - https://www.redblobgames.com/articles/noise/introduction.html

    // WITHOUT Domain Warp: Input coords → Voronoi → Island shape
    //
    // Regular geometric pattern:
    //   *─────*─────*
    //   │     │     │
    //   │  A  │  B  │  C
    //   │     │     │
    //   *─────*─────*
    //
    // WITH Domain Warp: Input coords → Warp with noise → Voronoi → Island shape
    //
    // Organic, natural pattern:
    //     *───┐
    //    ╱     ╲
    //   │   A   *───*
    //    ╲     ╱     ╲
    //     *───┘   B   │
    //          ╲     ╱
    //           *───*

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

    // Apply edge falloff to prevent hills near edges
    const edgeFalloffMultiplier = this.calculateEdgeFalloff(x, y);

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
      const heightWithTransition = lerp(this.seaFloor, landHeight, easedT);
      // Apply edge falloff (blend toward sea floor at edges)
      return lerp(this.seaFloor, heightWithTransition, edgeFalloffMultiplier);
    }

    // Total possible height: 0 to 100
    // Apply edge falloff to gradually reduce terrain height near edges
    return lerp(this.seaFloor, landHeight, edgeFalloffMultiplier);
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
