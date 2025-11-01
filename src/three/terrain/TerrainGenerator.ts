// TerrainGenerator.ts: generates a terrain procedurally

import { createNoise2D, type NoiseFunction2D } from "simplex-noise";
import {
  randInRangeInt,
  normalize,
  euclideanDistance,
  lerp,
} from "../utils/Math";
import { logger } from "../utils/Logger.ts";
import type { RandomFn } from "../utils/Random.ts";

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
  private static readonly DEFAULT_SIZE: number = 500;
  private static readonly DEFAULT_WIDTH_SEGMENTS: number = 257;
  private static readonly DEFAULT_HEIGHT_SEGMENTS: number = 257;

  private static readonly DEFAULT_NUM_ISLANDS: number = 6;
  private static readonly DEFAULT_VORONOI_FALLOFF: number = 50;

  private static readonly DEFAULT_LAND_TRANSITION_START: number = 0.08;
  private static readonly DEFAULT_LAND_TRANSITION_END: number = 0.02;
  private static readonly DEFAULT_LAND_CUTOFF: number = 1.0;

  private static readonly DEFAULT_WATER_LEVEL: number = 0;

  private static readonly DEFAULT_WARP_STRENGTH: number = 50;
  private static readonly DEFAULT_WARP_OFFSET: number = 60;
  private static readonly DEFAULT_WARP_FREQUENCY: number = 0.01;

  private static readonly DEFAULT_PEAKS_FREQUENCY: number = 0.06;
  private static readonly DEFAULT_PEAKS_AMPLITUDE: number = 0.45;

  private static readonly DEFAULT_TERRAIN_FREQUENCY: number = 0.03;

  private static readonly DEFAULT_ISLANDS_WEIGHT: number = 80;
  private static readonly DEFAULT_TERRAIN_WEIGHT: number = 10;
  private static readonly DEFAULT_PEAKS_WEIGHT: number = 10;

  private static readonly DEFAULT_EDGE_FALLOFF: number = 0.2;

  // returns a value between -1 and 1
  private readonly simplex: NoiseFunction2D;

  private readonly size: number;
  private readonly widthSegments: number;
  private readonly heightSegments: number;
  private readonly rng: RandomFn;

  // Non-editable parameters
  private readonly waterLevel: number = TerrainGenerator.DEFAULT_WATER_LEVEL;
  private readonly landTransitionStart: number =
    TerrainGenerator.DEFAULT_LAND_TRANSITION_START;
  private readonly landTransitionEnd: number =
    TerrainGenerator.DEFAULT_LAND_TRANSITION_END;
  // Edge falloff: 0 = no falloff, 1 = entire plane is falloff zone
  private readonly edgeFalloff: number = TerrainGenerator.DEFAULT_EDGE_FALLOFF;

  landCutOff: number = TerrainGenerator.DEFAULT_LAND_CUTOFF;

  // Parameters editable in the GUI
  numIslands: number = TerrainGenerator.DEFAULT_NUM_ISLANDS;

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

  /**
   * Voronoi seed points for islands. Used to calculate distance-based falloff.
   */
  private seedPoints: Array<{ x: number; y: number }> | undefined;

  constructor(
    size: number = TerrainGenerator.DEFAULT_SIZE,
    widthSegments: number = TerrainGenerator.DEFAULT_WIDTH_SEGMENTS,
    heightSegments: number = TerrainGenerator.DEFAULT_HEIGHT_SEGMENTS,
    rng: RandomFn,
  ) {
    logger.log("SYSTEM: INITIALIZING TERRAIN GENERATOR");

    this.size = size;
    this.widthSegments = widthSegments;
    this.heightSegments = heightSegments;

    this.rng = rng;
    this.simplex = createNoise2D(this.rng);

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

    // Exponential falloff to create more defined islands
    return Math.exp(-normalizedDistance * this.voronoiFalloff);
  }

  /**
   * Smooths a value using neighboring samples to reduce jaggedness.
   * This is essentially a blur operation in noise space.
   */
  private smoothVoronoi(x: number, y: number): number {
    const baseValue = this.voronoi(x, y);

    // Sample neighboring points and average them
    const sampleRadius = 3; // Adjust for more/less smoothing
    const samples = [
      this.voronoi(x + sampleRadius, y),
      this.voronoi(x - sampleRadius, y),
      this.voronoi(x, y + sampleRadius),
      this.voronoi(x, y - sampleRadius),
      this.voronoi(x + sampleRadius, y + sampleRadius),
      this.voronoi(x - sampleRadius, y - sampleRadius),
      this.voronoi(x + sampleRadius, y - sampleRadius),
      this.voronoi(x - sampleRadius, y + sampleRadius),
    ];

    // Weighted average: center point has more influence
    const centerWeight = 2.0;
    const totalWeight = centerWeight + samples.length;

    return (
      (baseValue * centerWeight + samples.reduce((sum, val) => sum + val, 0)) /
      totalWeight
    );
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
    if (this.edgeFalloff <= 0) return 1.0; // No falloff

    const halfWidth = this.widthSegments / 2;
    const halfHeight = this.heightSegments / 2;

    // Rectangular falloff
    // Calculate distance from edge as a fraction [0, 1]
    // 0 = at edge, 1 = at center
    const distanceFromEdgeX = 1 - Math.abs(x) / halfWidth;
    const distanceFromEdgeY = 1 - Math.abs(y) / halfHeight;

    // Use the minimum (closest edge determines falloff)
    const minDistanceFromEdge = Math.min(distanceFromEdgeX, distanceFromEdgeY);

    // Radial falloff from center
    const distanceFromCenter = Math.sqrt(x ** 2 + y ** 2);
    const maxDistance = Math.sqrt(halfWidth ** 2 + halfHeight ** 2);
    const radialFalloff = 1 - distanceFromCenter / maxDistance;

    const combinedFalloff = Math.min(minDistanceFromEdge, radialFalloff);

    // Calculate falloff: if we're within the falloff zone, blend to 0
    // edgeFalloff is the fraction of the plane that should fade out
    if (combinedFalloff >= this.edgeFalloff) return 1.0;

    // Inside falloff zone: smoothly interpolate from 1 to 0
    const t = combinedFalloff / this.edgeFalloff;

    const smoothT = t * t * (3 - 2 * t);
    return smoothT * smoothT * smoothT;
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
    //                C

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

    // Base island shape
    //const islands = this.smoothVoronoi(warpedX, warpedY);
    const islands = this.voronoi(warpedX, warpedY);

    // Hills and valleys
    const terrain = this.simplex(
      x * this.terrainFrequency,
      y * this.terrainFrequency,
    );

    // Sharp mountain ridges
    const peaks =
      this.peaksAmplitude *
      this.ridgedNoise(x * this.peaksFrequency, y * this.peaksFrequency);

    // TODO: introduce islands : terrain : peaks noise ratios
    let landHeight =
      islands * this.islandsWeight +
      terrain * this.terrainWeight +
      // TODO: Decide if ridgedNoise is worth keeping around after introducing erosion
      // this.peaks * this.peaksWeight;
      this.peaksAmplitude * this.peaksWeight;

    // Apply edge falloff
    const edgeFalloffMultiplier = this.calculateEdgeFalloff(x, y);
    landHeight = lerp(this.waterLevel, landHeight, edgeFalloffMultiplier);

    // Check if we need to start easing into the water
    if (islands <= this.landTransitionStart) {
      // Normalize islands between start and end of land transition zone
      const t = normalize(
        islands,
        this.landTransitionEnd,
        this.landTransitionStart,
      );

      const clampedT = Math.max(0, Math.min(1, t));

      const easedT = clampedT ** 4;

      const easedLandHeight = lerp(this.waterLevel, landHeight, easedT);

      return easedLandHeight <= 1.0 ? this.waterLevel : easedLandHeight;
    }

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
