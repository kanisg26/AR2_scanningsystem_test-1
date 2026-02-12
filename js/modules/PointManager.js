/**
 * Manages feature points (add, edit, delete)
 * @module modules/PointManager
 * @see FR-P1A-002, FR-P1A-003, FR-P1A-004
 */

import { validateCoordinates, validateMemo, validatePointCount } from '../utils/validation.js';
import { roundCoord, totalRouteLength, segmentLengths } from '../utils/math.js';

export default class PointManager {
  constructor() {
    this.points = [];
    this._nextId = 1;
    this._listeners = [];
  }

  /**
   * Registers a callback invoked whenever points change
   * @param {Function} fn - Callback receiving the current points array
   */
  onChange(fn) {
    this._listeners.push(fn);
  }

  /** Notifies all registered listeners */
  _notify() {
    const snapshot = [...this.points];
    this._listeners.forEach(fn => fn(snapshot));
  }

  /**
   * Adds a new feature point
   * @param {number} x - X coordinate (meters)
   * @param {number} y - Y coordinate (meters)
   * @param {number} z - Z coordinate (meters)
   * @param {string} [memo=''] - Optional note
   * @returns {{ success: boolean, point?: Object, errors?: Object }}
   */
  addPoint(x, y, z, memo = '') {
    // Validate point count
    const countResult = validatePointCount(this.points.length);
    if (!countResult.valid) {
      return { success: false, errors: { count: countResult.error } };
    }

    // Validate coordinates
    const coordResult = validateCoordinates(x, y, z);
    if (!coordResult.valid) {
      return { success: false, errors: coordResult.errors };
    }

    // Validate memo
    const memoResult = validateMemo(memo);
    if (!memoResult.valid) {
      return { success: false, errors: { memo: memoResult.error } };
    }

    const point = {
      id: this._nextId++,
      x: roundCoord(Number(x)),
      y: roundCoord(Number(y)),
      z: roundCoord(Number(z)),
      memo: memo.trim(),
      createdAt: new Date().toISOString()
    };

    this.points.push(point);
    this._notify();
    return { success: true, point };
  }

  /**
   * Updates an existing point by ID
   * @param {number} id - Point ID
   * @param {{ x?: number, y?: number, z?: number, memo?: string }} data - Fields to update
   * @returns {{ success: boolean, point?: Object, errors?: Object }}
   */
  updatePoint(id, data) {
    const index = this.points.findIndex(p => p.id === id);
    if (index === -1) {
      return { success: false, errors: { id: '指定された点が見つかりません' } };
    }

    const current = this.points[index];
    const x = data.x !== undefined ? data.x : current.x;
    const y = data.y !== undefined ? data.y : current.y;
    const z = data.z !== undefined ? data.z : current.z;
    const memo = data.memo !== undefined ? data.memo : current.memo;

    // Validate coordinates
    const coordResult = validateCoordinates(x, y, z);
    if (!coordResult.valid) {
      return { success: false, errors: coordResult.errors };
    }

    // Validate memo
    const memoResult = validateMemo(memo);
    if (!memoResult.valid) {
      return { success: false, errors: { memo: memoResult.error } };
    }

    this.points[index] = {
      ...current,
      x: roundCoord(Number(x)),
      y: roundCoord(Number(y)),
      z: roundCoord(Number(z)),
      memo: typeof memo === 'string' ? memo.trim() : memo
    };

    this._notify();
    return { success: true, point: this.points[index] };
  }

  /**
   * Removes a point by ID
   * @param {number} id - Point ID
   * @returns {{ success: boolean, error?: string }}
   */
  removePoint(id) {
    const index = this.points.findIndex(p => p.id === id);
    if (index === -1) {
      return { success: false, error: '指定された点が見つかりません' };
    }

    this.points.splice(index, 1);
    this._notify();
    return { success: true };
  }

  /**
   * Returns a point by ID
   * @param {number} id - Point ID
   * @returns {Object|null}
   */
  getPoint(id) {
    return this.points.find(p => p.id === id) || null;
  }

  /**
   * Returns total route length in meters
   * @returns {number}
   */
  getTotalLength() {
    return totalRouteLength(this.points);
  }

  /**
   * Returns individual segment lengths
   * @returns {number[]}
   */
  getSegmentLengths() {
    return segmentLengths(this.points);
  }

  /**
   * Returns the next auto-increment point number for display
   * @returns {number}
   */
  getNextId() {
    return this._nextId;
  }

  /**
   * Returns current point count
   * @returns {number}
   */
  getCount() {
    return this.points.length;
  }

  /**
   * Replaces all points (used for project load)
   * @param {Array<Object>} points - Points array from saved data
   */
  loadPoints(points) {
    this.points = points.map(p => ({
      id: p.id,
      x: roundCoord(Number(p.x)),
      y: roundCoord(Number(p.y)),
      z: roundCoord(Number(p.z)),
      memo: p.memo || '',
      createdAt: p.createdAt || new Date().toISOString()
    }));

    // Update next ID to avoid collisions
    const maxId = this.points.reduce((max, p) => Math.max(max, p.id), 0);
    this._nextId = maxId + 1;

    this._notify();
  }

  /** Removes all points */
  clear() {
    this.points = [];
    this._nextId = 1;
    this._notify();
  }
}
