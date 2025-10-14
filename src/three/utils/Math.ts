/*
 * Math.ts: Utility math functions for terrain and graphics.
 *
 * Key concepts:
 * - randInRangeInt: Random integer in [min, max]
 * - normalize: Map value to [0, 1] range
 * - euclideanDistance: 2D distance formula
 * - lerp: Linear interpolation between a and b
 * - easeInOutSine: Sine-based easing for smooth transitions
 */

/**
 * Returns a random integer between min and max, inclusive.
 *
 * @param min Minimum value (inclusive)
 * @param max Maximum value (inclusive)
 */
function randInRangeInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Normalizes a number n within the range [min, max] to a value between 0 and 1.
 *
 * @param n Number to normalize
 * @param min Minimum of the range
 * @param max Maximum of the range
 */
function normalize(n: number, min: number, max: number) {
  return (n - min) / (max - min);
}

/**
 * Returns the Euclidean distance between two points in a 2D plane.
 *
 * @param pointA
 * @param pointB
 * @private
 */
function euclideanDistance(
  pointA: { x: number; y: number },
  pointB: { x: number; y: number },
): number {
  // dist = sqrt((pointB.x - pointA.x)^2 + (pointB.y - pointA.y)^2)
  return Math.sqrt(
    Math.pow(pointB.x - pointA.x, 2) + Math.pow(pointB.y - pointA.y, 2),
  );
}

/**
 * An easing function, based on the Sine function.
 * Returns a value between [0, 1].
 *
 * Source: https://easings.net/#easeInOutSine
 *
 * @param x Absolute progress through the range in the bounds of 0
 * (beginning) and 1 (end).
 */
function easeInOutSine(x: number): number {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

/**
 * Linear interpolation between a and b by t (0 <= t <= 1).
 * lerp(a, b, t) = a + (b - a) * t
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export { randInRangeInt, normalize, euclideanDistance, easeInOutSine, lerp };
