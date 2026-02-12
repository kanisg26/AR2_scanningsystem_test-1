/**
 * Application entry point - connects Camera, Canvas, PointManager, and UI
 * @module main
 */

import CameraManager from './modules/CameraManager.js';
import CanvasOverlay from './modules/CanvasOverlay.js';
import PointManager from './modules/PointManager.js';
import UIController from './modules/UIController.js';
import ProjectStorage from './modules/ProjectStorage.js';
import CSVExporter from './modules/CSVExporter.js';
import DXFExporter from './modules/DXFExporter.js';
import { $ } from './utils/dom.js';

class App {
  constructor() {
    this.pointManager = new PointManager();
    this.uiController = new UIController(this.pointManager);
    this.camera = new CameraManager($('camera-video'));
    this.canvas = new CanvasOverlay($('camera-overlay'), (x, y) => this._onTap(x, y));
    this.storage = new ProjectStorage();
    this.csvExporter = new CSVExporter();
    this.dxfExporter = new DXFExporter();

    this._projectName = '';
    this._metadata = { siteName: '', operator: '', pipeType: '' };

    // Canvas overlay always updates
    this.pointManager.onChange((points) => {
      this.canvas.setPoints(points);
      if (this.viewer3D) this.viewer3D.updateRoute(points);
    });

    this._bindActions();
    this._startCamera();
    this._init3D();
  }

  /** Initializes 3D viewer - isolated so failures don't block camera */
  async _init3D() {
    // Wait for Three.js CDN to be available
    if (typeof THREE === 'undefined') {
      console.warn('Three.js not loaded, 3D preview disabled');
      return;
    }

    try {
      const { default: Viewer3D } = await import('./modules/Viewer3D.js');
      this.viewer3D = new Viewer3D('viewer-container');

      const { default: GLBExporter } = await import('./modules/GLBExporter.js');
      const { default: OBJExporter } = await import('./modules/OBJExporter.js');
      this.glbExporter = new GLBExporter();
      this.objExporter = new OBJExporter();

      // Bind 3D-specific buttons
      $('btn-export-glb').addEventListener('click', () => {
        this.glbExporter.export(this.viewer3D.getScene(), this.pointManager.points);
      });
      $('btn-export-obj').addEventListener('click', () => {
        this.objExporter.export(this.pointManager.points);
      });
      document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', () => {
          this.viewer3D.setView(btn.dataset.view);
        });
      });

      // Draw current points if any already exist
      if (this.pointManager.points.length > 0) {
        this.viewer3D.updateRoute(this.pointManager.points);
      }

      console.log('3D viewer initialized');
    } catch (err) {
      console.warn('3D viewer init failed:', err.message);
    }
  }

  /** Starts the camera and handles errors */
  async _startCamera() {
    const errorEl = $('camera-error');
    const msgEl = $('camera-error-msg');

    msgEl.textContent = 'カメラを起動中...';
    errorEl.hidden = false;

    const result = await this.camera.start();
    if (result.success) {
      errorEl.hidden = true;
      // syncSize after video is ready (play() already resolved, so call directly)
      this.canvas.syncSize();
    } else {
      msgEl.textContent = result.error;
      errorEl.hidden = false;
    }
  }

  /**
   * Handles a tap on the canvas overlay
   * @param {number} screenX - CSS pixel X
   * @param {number} screenY - CSS pixel Y
   */
  async _onTap(screenX, screenY) {
    const prevCount = this.pointManager.getCount();
    const addResult = this.pointManager.addPoint(screenX, screenY);
    if (!addResult.success) {
      if (addResult.errors?.count) alert(addResult.errors.count);
      return;
    }

    // If this is the 2nd+ point, prompt for distance of the previous segment
    if (prevCount >= 1) {
      const segIndex = prevCount - 1;
      const isFirst = segIndex === 0 && this.pointManager.calibration.pixelsPerMeter === null;

      const result = await this.uiController.promptDistance(segIndex, isFirst);

      if (result.distance !== null) {
        this.pointManager.setSegmentDistance(segIndex, result.distance);

        if (isFirst) {
          this.pointManager.calibrate(segIndex, result.distance);
        }
      }

      if (result.memo) {
        this.pointManager.updateMemo(addResult.point.id, result.memo);
      }
    }
  }

  /** Binds all global button actions */
  _bindActions() {
    // Camera controls
    $('btn-camera-toggle').addEventListener('click', async () => {
      const result = await this.camera.toggleCamera();
      if (!result.success) alert(result.error);
    });

    $('btn-camera-retry').addEventListener('click', () => this._startCamera());

    $('btn-undo').addEventListener('click', () => {
      this.pointManager.undoLastPoint();
    });

    $('btn-calibrate').addEventListener('click', () => this._recalibrate());

    // Project actions
    $('btn-save').addEventListener('click', () => this._saveProject());
    $('btn-load').addEventListener('click', () => this._loadProject());
    $('btn-new').addEventListener('click', () => this._newProject());

    // Settings modal
    $('btn-settings').addEventListener('click', () => this._openSettings());
    $('btn-settings-close').addEventListener('click', () => this._closeSettings());
    $('form-settings').addEventListener('submit', (e) => {
      e.preventDefault();
      this._saveSettings();
    });
    $('modal-settings').addEventListener('click', (e) => {
      if (e.target.id === 'modal-settings') this._closeSettings();
    });

    // Export actions (CSV/DXF always available)
    $('btn-export-csv').addEventListener('click', () => {
      this.csvExporter.export(this.pointManager.points);
    });
    $('btn-export-dxf').addEventListener('click', () => {
      this.dxfExporter.export(this.pointManager.points);
    });
    // GLB/OBJ are bound in _init3D after Three.js loads
  }

  async _recalibrate() {
    if (this.pointManager.getCount() < 2) {
      alert('校正には2点以上が必要です');
      return;
    }
    const result = await this.uiController.promptDistance(0, true);
    if (result.distance !== null) {
      this.pointManager.calibrate(0, result.distance);
      this.pointManager.setSegmentDistance(0, result.distance);
    }
  }

  _openSettings() {
    $('input-project-name').value = this._projectName;
    $('input-site-name').value = this._metadata.siteName;
    $('input-operator').value = this._metadata.operator;
    $('input-pipe-type').value = this._metadata.pipeType;
    $('modal-settings').hidden = false;
  }

  _closeSettings() {
    $('modal-settings').hidden = true;
  }

  _saveSettings() {
    this._projectName = $('input-project-name').value.trim();
    this._metadata = {
      siteName: $('input-site-name').value.trim(),
      operator: $('input-operator').value.trim(),
      pipeType: $('input-pipe-type').value.trim()
    };
    this._closeSettings();
  }

  _saveProject() {
    const result = this.storage.save(
      this._projectName,
      this._metadata,
      this.pointManager.points,
      this.pointManager.calibration
    );
    alert(result.success ? '保存しました' : result.error);
  }

  _loadProject() {
    const result = this.storage.load();
    if (!result.success) {
      alert(result.error);
      return;
    }
    const { data } = result;
    this._projectName = data.projectName || '';
    this._metadata = {
      siteName: data.metadata?.siteName || '',
      operator: data.metadata?.operator || '',
      pipeType: data.metadata?.pipeType || ''
    };
    this.pointManager.loadPoints(data.points, data.calibration);
    alert('読み込みました');
  }

  _newProject() {
    if (!confirm('現在のデータを破棄して新規プロジェクトを作成しますか？')) return;
    this.pointManager.clear();
    this._projectName = '';
    this._metadata = { siteName: '', operator: '', pipeType: '' };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  console.log('PipeScanner Web v2 initialized');
});
