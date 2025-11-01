// MountainGenerator.ts: generates various simple mountain terrains

import { createNoise2D, type NoiseFunction2D } from "simplex-noise";
import { type RandomFn } from "../utils/Random";

export class MountainGenerator {
  private readonly simplex: NoiseFunction2D;

  constructor(randomFn: RandomFn) {
    this.simplex = createNoise2D(randomFn);
  }

  /**
   * Generates a mountain ridgeline running through the center
   * @param width - Width of the terrain
   * @param height - Height of the terrain
   * @param ridgeHeight - Maximum height of the ridge (default: 100)
   * @param ridgeWidth - Width of the ridge before falloff (default: width/6)
   * @param numPeaks - Number of peaks along the ridge (default: 4)
   * @param angle - Angle of the ridge in degrees, 0 = horizontal (default: 0)
   */
  generateRidgeline(
    width: number,
    height: number,
    ridgeHeight: number = 100,
    ridgeWidth: number = width / 6,
    numPeaks: number = 4,
    angle: number = 0,
  ): Float32Array {
    const heights = new Float32Array(width * height);

    // Convert angle to radians
    const angleRad = (angle * Math.PI) / 180;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);

    const centerX = width / 2;
    const centerY = height / 2;

    // Maximum distance from ridge line (for normalization)
    const maxPerpDist = Math.max(width, height) / 2;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Translate to center
        const dx = x - centerX;
        const dy = y - centerY;

        // Calculate perpendicular distance from ridge line
        // For a line at angle θ: perpendicular distance = |dx*sin(θ) - dy*cos(θ)|
        const perpDistance = Math.abs(dx * sinAngle - dy * cosAngle);

        // Calculate parallel distance along ridge (for peaks)
        const parallelDistance = dx * cosAngle + dy * sinAngle;

        // Ridge falloff based on perpendicular distance
        let ridgeFalloff = 1.0;
        if (perpDistance > ridgeWidth) {
          const distanceBeyondRidge = perpDistance - ridgeWidth;
          const falloffDistance = maxPerpDist - ridgeWidth;
          ridgeFalloff = Math.max(0, 1 - distanceBeyondRidge / falloffDistance);
          // Smooth falloff curve
          ridgeFalloff = ridgeFalloff * ridgeFalloff * (3 - 2 * ridgeFalloff);
        }

        // Create peaks along the ridge using sine wave
        const peakFrequency =
          (numPeaks * Math.PI * 2) / Math.max(width, height);
        const peakVariation =
          (Math.sin(parallelDistance * peakFrequency) + 1) / 2;

        // Add noise for natural variation
        const noiseScale = 0.02;
        const noiseValue =
          (this.simplex(x * noiseScale, y * noiseScale) + 1) / 2;

        // Combine all factors
        const baseHeight = ridgeFalloff * ridgeHeight;
        const peakHeight = baseHeight * (0.7 + 0.3 * peakVariation);
        const finalHeight = peakHeight * (0.8 + 0.2 * noiseValue);

        heights[y * width + x] = Math.max(0, finalHeight);
      }
    }

    return heights;
  }

  /**
   * Generates a simple radial mountain (original function)
   */
  generateRadial(
    width: number,
    height: number,
    maxHeight: number = 100,
  ): Float32Array {
    const heights = new Float32Array(width * height);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(centerX, centerY);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const normalized = Math.min(distance / maxRadius, 1);

        heights[y * width + x] = maxHeight * (1 - normalized);
      }
    }

    return heights;
  }

  /**
   * Generates multiple parallel ridges
   */
  generateParallelRidges(
    width: number,
    height: number,
    numRidges: number = 3,
    spacing: number = height / 4,
    ridgeHeight: number = 100,
  ): Float32Array {
    const heights = new Float32Array(width * height);
    const centerY = height / 2;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let totalHeight = 0;

        // Calculate contribution from each ridge
        for (let i = 0; i < numRidges; i++) {
          const ridgeY = centerY + (i - (numRidges - 1) / 2) * spacing;
          const distFromRidge = Math.abs(y - ridgeY);
          const falloffDistance = spacing / 2;

          let ridgeContribution = Math.max(
            0,
            1 - distFromRidge / falloffDistance,
          );
          ridgeContribution = ridgeContribution * ridgeContribution; // Smooth falloff

          // Add peaks along the ridge
          const peakVariation = (Math.sin((x / width) * Math.PI * 6) + 1) / 2;
          const heightVariation = 0.7 + 0.3 * peakVariation;

          totalHeight += ridgeContribution * ridgeHeight * heightVariation;
        }

        // Add noise for naturalness
        const noiseScale = 0.03;
        const noiseValue =
          (this.simplex(x * noiseScale, y * noiseScale) + 1) / 2;

        heights[y * width + x] = totalHeight * (0.9 + 0.1 * noiseValue);
      }
    }

    return heights;
  }
}
