/**
 * Exports point data as CSV (UTF-8 with BOM for Excel)
 * @module modules/CSVExporter
 * @see FR-P1A-008
 */

import { CSV_BOM, EXPORT_FILENAME_PREFIX, COORD_PRECISION } from '../config.js';
import { downloadBlob, fileTimestamp } from '../utils/dom.js';

export default class CSVExporter {
  /**
   * Exports points array to a CSV file and triggers download
   * @param {Array<{ id: number, x: number, y: number, z: number, memo: string }>} points
   */
  export(points) {
    if (points.length === 0) {
      alert('出力する特徴点がありません');
      return;
    }

    const header = 'point_id,x,y,z,memo';
    const rows = points.map(p =>
      `${p.id},${p.x.toFixed(COORD_PRECISION)},${p.y.toFixed(COORD_PRECISION)},${p.z.toFixed(COORD_PRECISION)},${this._escapeCsv(p.memo)}`
    );

    const content = CSV_BOM + header + '\n' + rows.join('\n') + '\n';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const filename = `${EXPORT_FILENAME_PREFIX}_${fileTimestamp()}.csv`;

    downloadBlob(blob, filename);
  }

  /**
   * Escapes a CSV field value (wraps in quotes if it contains commas or quotes)
   * @param {string} value
   * @returns {string}
   */
  _escapeCsv(value) {
    if (!value) return '';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
