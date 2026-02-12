/**
 * Input validation utilities
 * @module utils/validation
 * @see FR-P1A-002
 */

import { COORD_MIN, COORD_MAX, MEMO_MAX_LENGTH, MAX_POINTS } from '../config.js';

/**
 * Validates a coordinate value
 * @param {*} value - The value to validate
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export function validateCoordinate(value) {
  if (value === '' || value === null || value === undefined) {
    return { valid: false, error: '座標を入力してください' };
  }

  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, error: '数値を入力してください' };
  }

  if (num < COORD_MIN || num > COORD_MAX) {
    return {
      valid: false,
      error: `座標は${COORD_MIN}～${COORD_MAX}の範囲で入力してください`
    };
  }

  return { valid: true };
}

/**
 * Validates all three coordinates at once
 * @param {*} x - X coordinate
 * @param {*} y - Y coordinate
 * @param {*} z - Z coordinate
 * @returns {{ valid: boolean, errors: { x?: string, y?: string, z?: string } }}
 */
export function validateCoordinates(x, y, z) {
  const xResult = validateCoordinate(x);
  const yResult = validateCoordinate(y);
  const zResult = validateCoordinate(z);

  const errors = {};
  if (!xResult.valid) errors.x = xResult.error;
  if (!yResult.valid) errors.y = yResult.error;
  if (!zResult.valid) errors.z = zResult.error;

  return {
    valid: xResult.valid && yResult.valid && zResult.valid,
    errors
  };
}

/**
 * Validates a memo string
 * @param {string} memo - The memo to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateMemo(memo) {
  if (typeof memo !== 'string') {
    return { valid: false, error: 'メモは文字列で入力してください' };
  }

  if (memo.length > MEMO_MAX_LENGTH) {
    return {
      valid: false,
      error: `メモは${MEMO_MAX_LENGTH}文字以内で入力してください`
    };
  }

  return { valid: true };
}

/**
 * Checks if point count has reached the maximum
 * @param {number} currentCount - Current number of points
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePointCount(currentCount) {
  if (currentCount >= MAX_POINTS) {
    return {
      valid: false,
      error: `特徴点は最大${MAX_POINTS}個までです`
    };
  }

  return { valid: true };
}
