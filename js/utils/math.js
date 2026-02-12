/**
 * Coordinate math utilities
 * @module utils/math
 * @see FR-P1A-004
 */

import { COORD_PRECISION } from '../config.js';

/**
 * Calculates 3D Euclidean distance between two points
 * @param {{ x: number, y: number, z: number }} p1 - First point
 * @param {{ x: number, y: number, z: number }} p2 - Second point
 * @returns {number} Distance in meters
 */
export function distance3D(p1, p2) {
  return Math.sqrt(
    (p2.x - p1.x) ** 2 +
    (p2.y - p1.y) ** 2 +
    (p2.z - p1.z) ** 2
  );
}

/**
 * Calculates total route length from an array of points
 * @param {Array<{ x: number, y: number, z: number }>} points - Ordered points
 * @returns {number} Total length in meters
 */
export function totalRouteLength(points) {
  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += distance3D(points[i - 1], points[i]);
  }
  return total;
}

/**
 * Calculates individual segment lengths between consecutive points
 * @param {Array<{ x: number, y: number, z: number }>} points - Ordered points
 * @returns {number[]} Array of segment lengths in meters
 */
export function segmentLengths(points) {
  const lengths = [];
  for (let i = 1; i < points.length; i++) {
    lengths.push(distance3D(points[i - 1], points[i]));
  }
  return lengths;
}

/**
 * Rounds a number to the configured coordinate precision
 * @param {number} value - Value to round
 * @returns {number} Rounded value
 */
export function roundCoord(value) {
  const factor = 10 ** COORD_PRECISION;
  return Math.round(value * factor) / factor;
}

/**
 * Formats a number to fixed decimal string for display
 * @param {number} value - Value to format
 * @param {number} [digits=COORD_PRECISION] - Decimal places
 * @returns {string} Formatted string (e.g. "0.523")
 */
export function formatCoord(value, digits = COORD_PRECISION) {
  return value.toFixed(digits);
}
