/**
 * Exports point data as Wavefront OBJ
 * @module modules/OBJExporter
 * @see FR-P1A-009C
 */

import { EXPORT_FILENAME_PREFIX, COORD_PRECISION } from '../config.js';
import { downloadBlob, fileTimestamp } from '../utils/dom.js';
import { totalRouteLength, segmentLengths, formatCoord } from '../utils/math.js';

export default class OBJExporter {
  /**
   * Exports points array to an OBJ file and triggers download
   * @param {Array<{ id: number, x: number, y: number, z: number }>} points
   */
  export(points) {
    if (points.length === 0) {
      alert('出力する特徴点がありません');
      return;
    }

    const obj = this._buildObj(points);
    const blob = new Blob([obj], { type: 'text/plain' });
    const filename = `${EXPORT_FILENAME_PREFIX}_${fileTimestamp()}.obj`;

    downloadBlob(blob, filename);
  }

  /**
   * Builds an OBJ string with vertices, lines, and metadata comments
   * @param {Array<{ x: number, y: number, z: number }>} points
   * @returns {string}
   */
  _buildObj(points) {
    const lines = [];
    const total = totalRouteLength(points);
    const segments = segmentLengths(points);
    const segStr = segments.map(s => `${formatCoord(s)}m`).join(', ');

    // Header comments with metadata
    lines.push('# PipeScanner Export');
    lines.push(`# Total Length: ${formatCoord(total)}m`);
    lines.push(`# Point Count: ${points.length}`);
    if (segments.length > 0) {
      lines.push(`# Segment Lengths: ${segStr}`);
    }
    lines.push('');

    // Vertices
    points.forEach(p => {
      lines.push(`v ${p.x.toFixed(COORD_PRECISION)} ${p.y.toFixed(COORD_PRECISION)} ${p.z.toFixed(COORD_PRECISION)}`);
    });

    // Line segments (OBJ vertex indices are 1-based)
    if (points.length >= 2) {
      lines.push('');
      for (let i = 1; i < points.length; i++) {
        lines.push(`l ${i} ${i + 1}`);
      }
    }

    return lines.join('\n') + '\n';
  }
}
