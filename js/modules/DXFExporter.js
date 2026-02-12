/**
 * Exports point data as DXF (3D POLYLINE)
 * @module modules/DXFExporter
 * @see FR-P1A-009
 */

import { DXF_LAYER_NAME, EXPORT_FILENAME_PREFIX, COORD_PRECISION } from '../config.js';
import { downloadBlob, fileTimestamp } from '../utils/dom.js';

export default class DXFExporter {
  /**
   * Exports points array to a DXF file and triggers download
   * @param {Array<{ id: number, x: number, y: number, z: number }>} points
   */
  export(points) {
    if (points.length === 0) {
      alert('出力する特徴点がありません');
      return;
    }

    const dxf = this._buildDxf(points);
    const blob = new Blob([dxf], { type: 'application/dxf' });
    const filename = `${EXPORT_FILENAME_PREFIX}_${fileTimestamp()}.dxf`;

    downloadBlob(blob, filename);
  }

  /**
   * Builds a minimal DXF string with 3D POLYLINE
   * @param {Array<{ x: number, y: number, z: number }>} points
   * @returns {string}
   */
  _buildDxf(points) {
    const lines = [];

    // SECTION: ENTITIES
    lines.push('0', 'SECTION');
    lines.push('2', 'ENTITIES');

    // POLYLINE header (70=8 → 3D polyline)
    lines.push('0', 'POLYLINE');
    lines.push('8', DXF_LAYER_NAME);
    lines.push('66', '1');
    lines.push('70', '8');

    // VERTEX entries
    points.forEach(p => {
      lines.push('0', 'VERTEX');
      lines.push('8', DXF_LAYER_NAME);
      lines.push('10', p.x.toFixed(COORD_PRECISION));
      lines.push('20', p.y.toFixed(COORD_PRECISION));
      lines.push('30', p.z.toFixed(COORD_PRECISION));
      lines.push('70', '32');
    });

    // End sequence
    lines.push('0', 'SEQEND');
    lines.push('8', DXF_LAYER_NAME);

    // Close section and file
    lines.push('0', 'ENDSEC');
    lines.push('0', 'EOF');

    return lines.join('\n') + '\n';
  }
}
