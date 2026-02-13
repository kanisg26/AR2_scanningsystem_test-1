/**
 * Math utilities for distance calculation
 * @module utils/math
 */

import { DISTANCE_PRECISION } from '../config.js';

/**
 * Calculates 2D Euclidean distance between two screen points (pixels)
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number} Distance in pixels
 */
export function pixelDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Calculates total route length from point distanceToNext values
 * @param {Array<{ distanceToNext: number|null }>} points
 * @returns {number} Total length in meters
 */
export function totalRouteLength(points) {
  let total = 0;
  for (const p of points) {
    if (p.distanceToNext !== null && p.distanceToNext !== undefined) {
      total += p.distanceToNext;
    }
  }
  return total;
}

/**
 * Formats a distance value for display
 * @param {number} value - Distance in meters
 * @param {number} [digits=DISTANCE_PRECISION]
 * @returns {string}
 */
export function formatDistance(value, digits = DISTANCE_PRECISION) {
  return value.toFixed(digits);
}

/**
 * Converts points to 3D positions on the XZ plane using screen tap direction.
 * screenX → X (horizontal), screenY → Z (depth).
 * Falls back to X-axis linear layout when screen coords are unavailable (AR mode).
 * @param {Array<{ screenX: number, screenY: number, distanceToNext: number|null }>} points
 * @returns {Array<{ x: number, y: number, z: number }>} 3D positions
 */
export function pointsToPositions(points) {
  const positions = [];
  let x = 0, z = 0;

  for (let i = 0; i < points.length; i++) {
    positions.push({ x, y: 0, z });

    if (i >= points.length - 1) break;

    const dist = points[i].distanceToNext;
    const d = (dist !== null && dist !== undefined) ? dist : 1;
    const p1 = points[i];
    const p2 = points[i + 1];
    const dx = p2.screenX - p1.screenX;
    const dy = p2.screenY - p1.screenY;
    const screenDist = Math.sqrt(dx * dx + dy * dy);

    if (screenDist > 1) {
      // Use tap direction: screenX→X, screenY→Z
      x += (dx / screenDist) * d;
      z += (dy / screenDist) * d;
    } else {
      // No direction info (AR mode or same-point tap): extend along X
      x += d;
    }
  }
  return positions;
}
