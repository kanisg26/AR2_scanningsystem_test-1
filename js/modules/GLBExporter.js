/**
 * Exports 3D scene as GLB (glTF 2.0 Binary)
 * @module modules/GLBExporter
 * @see FR-P1A-009B
 */

import { EXPORT_FILENAME_PREFIX } from '../config.js';
import { downloadBlob, fileTimestamp } from '../utils/dom.js';
import { totalRouteLength, segmentLengths } from '../utils/math.js';

/* global THREE */

export default class GLBExporter {
  /**
   * Exports the 3D scene to a GLB file
   * @param {THREE.Scene} scene - The Three.js scene
   * @param {Array<{ x: number, y: number, z: number }>} points - Point data for metadata
   */
  export(scene, points) {
    if (points.length === 0) {
      alert('出力する特徴点がありません');
      return;
    }

    if (typeof THREE.GLTFExporter === 'undefined') {
      alert('GLTFExporterが読み込まれていません');
      console.error('THREE.GLTFExporter is not available');
      return;
    }

    // Embed metadata in scene userData
    scene.userData = {
      totalLength: totalRouteLength(points),
      pointCount: points.length,
      segments: segmentLengths(points)
    };

    const exporter = new THREE.GLTFExporter();
    exporter.parse(
      scene,
      (result) => {
        const blob = new Blob([result], { type: 'application/octet-stream' });
        const filename = `${EXPORT_FILENAME_PREFIX}_${fileTimestamp()}.glb`;
        downloadBlob(blob, filename);
      },
      (error) => {
        console.error('GLB export failed:', error);
        alert('GLB出力に失敗しました');
      },
      { binary: true }
    );
  }
}
