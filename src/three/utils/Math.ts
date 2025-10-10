// Math.ts: useful math functions

function randInRangeInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
 * Returns a linearly interpolated value based on the given range [start, end], and
 * progress through the range x [0, 1].
 *
 * @param start Beginning of the range.
 * @param end End of the range
 * @param x Progress through the range as a normalized value: [0, 1]
 */
function lerp(start: number, end: number, x: number): number {
  return start * (1 - x) + end * x;
}

export {
  randInRangeInt,
  normalize,
  euclideanDistance,
  easeInOutSine,
  lerp,
};
