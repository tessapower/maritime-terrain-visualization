// ErosionSimulator.ts: Applies hydraulic erosion to terrain heightmaps

import { logger } from "../utils/Logger";

/**
 * Simulates hydraulic erosion on terrain heightmaps.
 *
 * Simulates water droplets flowing downhill, eroding soil where water flows
 * fast and depositing sediment where water slows down. Creates realistic
 * valleys, drainage patterns, and natural-looking geological features.
 *
 * Based on Sebastian Lague's algorithm:
 * https://github.com/SebLague/Hydraulic-Erosion
 */
export class ErosionSimulator {
  // Default params
  private static readonly DEFAULT_ITERATIONS: number = 300000;
  //private static readonly DEFAULT_EROSION_RADIUS: number = 3;
  private static readonly DEFAULT_INERTIA: number = 0.8;

  private static readonly DEFAULT_SEDIMENT_CAPACITY_FACTOR: number = 0.6;
  private static readonly DEFAULT_MIN_SEDIMENT_CAPACITY: number = 0.01;

  private static readonly DEFAULT_ERODE_SPEED: number = 0.3;
  private static readonly DEFAULT_DEPOSIT_SPEED: number = 0.1;
  private static readonly DEFAULT_EVAPORATE_SPEED: number = 0.05;
  private static readonly DEFAULT_MAX_DROPLET_LIFETIME: number = 50;

  private static readonly DEFAULT_GRAVITY: number = 1.5;
  private static readonly DEFAULT_INITIAL_WATER_VOLUME: number = 1;
  private static readonly DEFAULT_INITIAL_SPEED: number = 1;

  private static readonly DEFAULT_MARGIN_FACTOR: number = 0.1;

  // Public params
  iterations: number = ErosionSimulator.DEFAULT_ITERATIONS;
  //erosionRadius: number = ErosionSimulator.DEFAULT_EROSION_RADIUS;
  inertia: number = ErosionSimulator.DEFAULT_INERTIA;
  sedimentCapacityFactor: number =
    ErosionSimulator.DEFAULT_SEDIMENT_CAPACITY_FACTOR;
  minSedimentCapacity: number = ErosionSimulator.DEFAULT_MIN_SEDIMENT_CAPACITY;
  erodeSpeed: number = ErosionSimulator.DEFAULT_ERODE_SPEED;
  depositSpeed: number = ErosionSimulator.DEFAULT_DEPOSIT_SPEED;
  evaporateSpeed: number = ErosionSimulator.DEFAULT_EVAPORATE_SPEED;
  gravity: number = ErosionSimulator.DEFAULT_GRAVITY;
  maxDropletLifetime: number = ErosionSimulator.DEFAULT_MAX_DROPLET_LIFETIME;
  initialWaterVolume: number = ErosionSimulator.DEFAULT_INITIAL_WATER_VOLUME;
  initialSpeed: number = ErosionSimulator.DEFAULT_INITIAL_SPEED;
  marginFactor: number = ErosionSimulator.DEFAULT_MARGIN_FACTOR;

  /**
   * Applies hydraulic erosion to the given heightmap, updating the heights
   * in-place.
   */
  erode(
    heights: Float32Array,
    width: number,
    height: number,
    landMask?: Float32Array,
  ): void {
    logger.log(`EROSION: STARTING ${this.iterations} ITERATIONS`);

    const startTime = performance.now();

    // Determine the original height range of land areas
    let originalMinHeight = Infinity;
    let originalMaxHeight = -Infinity;

    for (let i = 0; i < heights.length; i++) {
      if (!landMask || landMask[i] > 0.5) {
        originalMinHeight = Math.min(originalMinHeight, heights[i]);
        originalMaxHeight = Math.max(originalMaxHeight, heights[i]);
      }
    }

    const originalRange = originalMaxHeight - originalMinHeight;

    // Normalize heights to erosion-friendly scale
    const targetMaxHeight = 30;
    const needsScaling =
      originalRange > 0 && originalMaxHeight > targetMaxHeight * 1.5;

    if (needsScaling) {
      for (let i = 0; i < heights.length; i++) {
        if (!landMask || landMask[i] > 0.5) {
          heights[i] =
            ((heights[i] - originalMinHeight) / originalRange) *
            targetMaxHeight;
        }
      }
    }

    // Apply erosion
    // Derived safety limits (based on configured parameters)
    const maxErosionPerStep = this.erodeSpeed * 3; // Proportional to erode speed
    const maxDepositPerStep = this.depositSpeed * 3; // Proportional to deposit speed
    const maxSpeed = this.initialSpeed * 10; // 10x initial speed seems reasonable
    const maxSediment = this.sedimentCapacityFactor * 25; // Based on capacity factor
    const terrainHeightRange = 250; // Reasonable max terrain height
    const minTerrainHeight = -50; // Prevent overly deep holes

    for (let it = 0; it < this.iterations; it++) {
      // Spawn droplet with margin
      const margin = width * this.marginFactor;
      let posX: number = 0;
      let posY: number = 0;

      // If we have a land mask, try to spawn on land
      if (landMask) {
        let attempts = 0;
        let spawnedOnLand = false;

        while (attempts < 20 && !spawnedOnLand) {
          posX = margin + Math.random() * (width - 2 * margin);
          posY = margin + Math.random() * (height - 2 * margin);

          const index = Math.floor(posY) * width + Math.floor(posX);
          if (landMask[index] > 0.5) {
            // On land
            spawnedOnLand = true;
          }
          attempts++;
        }

        // Skip this iteration if we couldn't find land after 20 attempts
        if (!spawnedOnLand) {
          continue;
        }
      } else {
        // No mask, spawn anywhere
        posX = margin + Math.random() * (width - 2 * margin);
        posY = margin + Math.random() * (height - 2 * margin);
      }

      let dirX = 0;
      let dirY = 0;
      let speed = this.initialSpeed;
      let water = this.initialWaterVolume;
      let sediment = 0;

      for (let lifetime = 0; lifetime < this.maxDropletLifetime; lifetime++) {
        const nodeX = Math.floor(posX);
        const nodeY = Math.floor(posY);

        // Stop if at edge (need 1 cell border for interpolation)
        if (
          nodeX < 1 ||
          nodeX >= width - 2 ||
          nodeY < 1 ||
          nodeY >= height - 2
        ) {
          break;
        }

        // Calculate droplet's height and gradient
        const {
          height: dropletHeight,
          gradientX,
          gradientY,
        } = this.calculateHeightAndGradient(heights, posX, posY, width, height);

        // Calculate new direction (blend of gradient and previous direction)
        dirX = dirX * this.inertia - gradientX * (1 - this.inertia);
        dirY = dirY * this.inertia - gradientY * (1 - this.inertia);

        // Normalize direction
        const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
        if (dirLength > 0) {
          dirX /= dirLength;
          dirY /= dirLength;
        }

        // Move droplet
        posX += dirX;
        posY += dirY;

        // Stop if moved off map
        if (posX < 0 || posX >= width - 1 || posY < 0 || posY >= height - 1) {
          break;
        }

        // Get new height at new position
        const newHeight = this.calculateHeightAndGradient(
          heights,
          posX,
          posY,
          width,
          height,
        ).height;

        // Calculate height change
        const deltaHeight = newHeight - dropletHeight;

        // Calculate how much sediment this droplet can carry
        const sedimentCapacity = Math.max(
          -deltaHeight * speed * water * this.sedimentCapacityFactor,
          this.minSedimentCapacity,
        );

        // Deposit or erode
        if (sediment > sedimentCapacity || deltaHeight > 0) {
          // DEPOSIT: Droplet is oversaturated or moving uphill
          const depositAmount =
            deltaHeight > 0
              ? Math.min(deltaHeight, sediment) // Deposit enough to fill the height difference
              : (sediment - sedimentCapacity) * this.depositSpeed;

          // Clamp to prevent extreme deposits
          const clampedDeposit = Math.max(
            -maxDepositPerStep,
            Math.min(maxDepositPerStep, depositAmount),
          );

          this.depositOrErode(
            heights,
            posX,
            posY,
            width,
            height,
            clampedDeposit,
          );
          sediment -= clampedDeposit;
        } else {
          // ERODE: Droplet can carry more sediment
          const erodeAmount = Math.min(
            (sedimentCapacity - sediment) * this.erodeSpeed,
            -deltaHeight, // Can't erode more than the height difference
          );

          // Clamp to prevent extreme erosion
          const clampedErode = Math.max(
            -maxErosionPerStep,
            Math.min(maxErosionPerStep, erodeAmount),
          );

          this.depositOrErode(
            heights,
            posX,
            posY,
            width,
            height,
            -clampedErode,
          );
          sediment += clampedErode;
        }

        // Update droplet speed (accelerates downhill, decelerates uphill)
        const speedSquared = speed * speed + deltaHeight * this.gravity;
        speed = Math.sqrt(Math.max(0, speedSquared)); // Prevent sqrt of negative

        // Clamp speed to prevent runaway acceleration
        speed = Math.min(speed, maxSpeed);

        // Ensure minimum speed to prevent stalling
        if (speed < 0.01) {
          speed = 0.01;
        }

        // Safety check on speed
        if (!isFinite(speed) || isNaN(speed)) break;

        // Clamp sediment to reasonable range
        sediment = Math.max(0, Math.min(maxSediment, sediment));

        // Safety check on sediment
        if (!isFinite(sediment) || isNaN(sediment)) break;

        // Evaporate water
        water *= 1 - this.evaporateSpeed;

        // Safety check on water
        // Droplet has evaporated
        if (!isFinite(water) || isNaN(water) || water < 0.01) break;
      }
    }

    // Clean up heightmap: remove NaN/Infinity and clamp to reasonable range
    const effectiveMinHeight = needsScaling ? -5 : minTerrainHeight;
    const effectiveMaxHeight = needsScaling ? 35 : terrainHeightRange;

    for (let i = 0; i < heights.length; i++) {
      if (!isFinite(heights[i]) || isNaN(heights[i])) {
        heights[i] = 0;
      }
      heights[i] = Math.max(
        effectiveMinHeight,
        Math.min(effectiveMaxHeight, heights[i]),
      );
    }

    // Scale back to original height range
    if (needsScaling) {
      for (let i = 0; i < heights.length; i++) {
        if (!landMask || landMask[i] > 0.5) {
          // Map from [0, targetMaxHeight] back to [originalMinHeight, originalMaxHeight]
          heights[i] =
            (heights[i] / targetMaxHeight) * originalRange + originalMinHeight;
        }
      }
    }

    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    logger.log(`EROSION: COMPLETE (${elapsed}s)`);
  }

  /**
   * Calculates the height gradient at a position using bilinear interpolation.
   *
   * Bilinear interpolation estimates values at positions between grid
   * points by smoothly blending the values of the 4 nearest neighbors.
   */
  private calculateHeightAndGradient(
    heights: Float32Array,
    posX: number,
    posY: number,
    width: number,
    height: number,
  ): {
    height: number;
    gradientX: number;
    gradientY: number;
  } {
    const coordX = Math.floor(posX);
    const coordY = Math.floor(posY);

    // Clamp coordinates to valid grid bounds (width - 2, height - 2 to ensure
    // we have a cell to interpolate)
    const x = Math.max(0, Math.min(coordX, width - 2));
    const y = Math.max(0, Math.min(coordY, height - 2));

    // Calculate fractional position within grid cell -> [0, 1]
    const u = posX - x;
    const v = posY - y;

    // Sample the four corner heights of the grid cell
    // h00      h10
    //    (x, y)
    // h01      h11
    // Closer corners have more influence over result
    const h00 = heights[y * width + x];
    const h10 = heights[y * width + x + 1];
    const h01: number = heights[(y + 1) * width + x];
    const h11: number = heights[(y + 1) * width + x + 1];

    // Bilinearly interpolate height at exact position
    const heightInterpolated =
      h00 * (1 - u) * (1 - v) +
      h10 * u * (1 - v) +
      h01 * (1 - u) * v +
      h11 * u * v;

    {
      // THE GEOMETRIC ORIGIN
      // The above calculations, A.K.A. bilinear basis functions come from the
      // geometric principle of area-based interpolation. These weights come
      // from finite element analysis and are the simplest 2D interpolation
      // functions that are continuous (no jumps), sum to 1 at every point
      // (partition of unity), are 1 at their corner and 0 at all other corners.
      //
      // EXAMPLE
      // When you have a droplet at position (1.7, 0.4) within a grid
      // square, we think of it as dividing that square into four areas:
      //
      // Grid square from (1,0) to (2,1):
      //
      // (1,0)           (2,0)
      //   ┌──────┬──────┐
      //   │  C   │   D  │
      //   │      │      │
      //   ├──────→ ★ ←──┤ (1.7, 0.4)
      //   │  A   │   B  │
      //   │      │      │
      //   └──────┴──────┘
      // (1,1)           (2,1)
      //
      // With:
      // u = 0.7 (horizontal distance (%) from left)
      // v = 0.4 (vertical distance (%) from top)
      //
      // Then:
      // Rect A: Bottom-left influence
      //    Width:  1 - u = 0.3
      //   Height:      v = 0.4
      //     Area: 0.3 * 0.4 = 0.12 -> Weight for (1, 1)
      //
      // Rect B: Bottom-right influence
      //    Width: u = 0.7
      //   Height: v = 0.4
      //     Area: 0.7 * 0.4 = 0.28 -> Weight for (2, 1)
      //
      // Rect C: Top-left influence
      //    Width: 1 - u = 0.3
      //   Height: 1 - v = 0.6
      //     Area: 0.3 * 0.6 = 0.18 -> Weight for (1, 0)
      //
      // Rect D: Top-right influence
      //    Width:     u = 0.7
      //   Height: 1 - v = 0.6
      //     Area: 0.7 * 0.6 = 0.42 -> Weight for (2, 0)
      //
      // All four weights sum to 1.
    }

    // Calculate horizontal slope
    const gradientX = (h10 - h00) * (1 - v) + (h11 - h01) * v;
    // Calculate vertical slope
    const gradientY = (h01 - h00) * (1 - u) + (h11 - h10) * u;

    // Safety check for NaN
    if (isNaN(gradientX) || isNaN(gradientY) || isNaN(heightInterpolated)) {
      return { height: 0, gradientX: 0, gradientY: 0 };
    }

    const gradientMagnitude = Math.sqrt(
      gradientX * gradientX + gradientY * gradientY,
    );

    // If gradient is extreme, clamp it
    if (gradientMagnitude > 10) {
      const scale = 10 / gradientMagnitude;
      return {
        height: heightInterpolated,
        gradientX: gradientX * scale,
        gradientY: gradientY * scale,
      };
    }

    return {
      height: heightInterpolated,
      gradientX,
      gradientY,
    };
  }

  /**
   * Deposits or erodes sediment in a radius around the given position.
   *
   * Uses bilinear distribution to distribute/erode across neighboring grid
   * points, weighted by distance.
   */
  private depositOrErode(
    heights: Float32Array,
    posX: number,
    posY: number,
    width: number,
    height: number,
    amount: number,
  ): void {
    const coordX = Math.floor(posX);
    const coordY = Math.floor(posY);

    // Safety check for NaN or infinite amounts
    if (!isFinite(amount) || isNaN(amount)) {
      console.warn("Invalid amount in depositOrErode:", amount);
      return;
    }

    // Clamp amount to prevent extreme changes per deposit/erode
    const maxChange = 0.5;
    const clampedAmount = Math.max(-maxChange, Math.min(maxChange, amount));

    // Skip if amount is negligible
    if (Math.abs(clampedAmount) < 0.0001) {
      return;
    }

    const u = posX - coordX;
    const v = posY - coordY;

    const cellOffsets = [
      { x: 0, y: 0, weight: (1 - u) * (1 - v) },
      { x: 1, y: 0, weight: u * (1 - v) },
      { x: 0, y: 1, weight: (1 - u) * v },
      { x: 1, y: 1, weight: u * v },
    ];

    for (const offset of cellOffsets) {
      const x = coordX + offset.x;
      const y = coordY + offset.y;

      if (x >= 0 && x < width && y >= 0 && y < height) {
        const index = y * width + x;
        const oldHeight = heights[index];
        const change = clampedAmount * offset.weight;

        heights[index] += change;

        // Clamp the resulting height to reasonable bounds
        const minHeight = -10; // Prevent deep pits
        const maxHeight = 50; // Prevent extreme peaks
        heights[index] = Math.max(
          minHeight,
          Math.min(maxHeight, heights[index]),
        );

        // Safety check for NaN after modification
        if (!isFinite(heights[index]) || isNaN(heights[index])) {
          console.warn(`NaN detected at (${x}, ${y}), reverting`);
          heights[index] = oldHeight;
        }
      }
    }
  }
}
