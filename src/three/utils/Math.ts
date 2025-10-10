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

export { randInRangeInt, normalize, euclideanDistance };
