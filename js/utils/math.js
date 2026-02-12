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
 * Converts distance-based points to 3D positions along the X axis
 * @param {Array<{ distanceToNext: number|null }>} points
 * @returns {Array<{ x: number, y: number, z: number }>} 3D positions
 */
export function pointsToPositions(points) {
  const positions = [];
  let x = 0;
  for (let i = 0; i < points.length; i++) {
    positions.push({ x, y: 0, z: 0 });
    const dist = points[i].distanceToNext;
    if (dist !== null && dist !== undefined && i < points.length - 1) {
      x += dist;
    } else if (i < points.length - 1) {
      x += 1; // 1m default for unknown distances
    }
  }
  return positions;
}
