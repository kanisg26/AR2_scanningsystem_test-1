/**
 * Application entry point - connects Camera, Canvas, PointManager, and UI
 * Supports two modes: Snapshot (all devices) and WebXR AR (Android+ARCore)
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
    this._frozen = false;
    this._mode = 'snapshot'; // 'snapshot' or 'ar'
    this._xrManager = null;
    this._arDistanceResolve = null;

    // Canvas overlay always updates (snapshot mode)
    this.pointManager.onChange((points) => {
      this.canvas.setPoints(points);
      if (this.viewer3D) {
        try {
          this.viewer3D.updateRoute(points);
        } catch (err) {
          console.error('3D updateRoute error:', err);
        }
      }
    });

    this._bindActions();
    this._selectMode();
    this._init3D();
  }

  // ─── Mode Selection ───────────────────────────────────────

  async _selectMode() {
    let arSupported = false;
    try {
      const { default: WebXRManager } = await import('./modules/WebXRManager.js');
      arSupported = await WebXRManager.isSupported();
    } catch {
      arSupported = false;
    }

    if (arSupported) {
      // Show mode selection dialog
      $('modal-mode-select').hidden = false;
      $('btn-mode-snapshot').addEventListener('click', () => {
        $('modal-mode-select').hidden = true;
        this._startSnapshotMode();
      });
      $('btn-mode-ar').addEventListener('click', () => {
        $('modal-mode-select').hidden = true;
        this._startARMode();
      });
    } else {
      // Non-AR device: go directly to snapshot mode
      this._startSnapshotMode();
    }
  }

  _startSnapshotMode() {
    this._mode = 'snapshot';
    this._startCamera();
    console.log('Mode: Snapshot');
  }

  async _startARMode() {
    this._mode = 'ar';

    // Wait for Three.js
    if (typeof THREE === 'undefined') {
      const loaded = await this._waitForThreeJS(5000);
      if (!loaded) {
        alert('Three.jsの読み込みに失敗しました。通常モードで起動します。');
        this._startSnapshotMode();
        return;
      }
    }

    try {
      const { default: WebXRManager } = await import('./modules/WebXRManager.js');
      this._xrManager = new WebXRManager((anchorIdx) => this._onARTap(anchorIdx));

      // Hide main UI, show AR overlay
      $('app-main').hidden = true;
      $('app-header').hidden = true;
      const arOverlay = $('ar-overlay');
      arOverlay.hidden = false;

      this._bindARActions();

      const result = await this._xrManager.start(arOverlay);
      if (!result.success) {
        alert(result.error);
        this._exitARMode();
        return;
      }

      console.log('Mode: WebXR AR');
    } catch (err) {
      alert(`ARモードの起動に失敗しました: ${err.message}`);
      this._exitARMode();
    }
  }

  /** Exits AR and switches to snapshot mode */
  _exitARMode() {
    if (this._xrManager) {
      this._xrManager.stop();
      this._xrManager.dispose();
      this._xrManager = null;
    }
    $('ar-overlay').hidden = true;
    $('app-main').hidden = false;
    $('app-header').hidden = false;
    this._mode = 'snapshot';

    // Recover 3D viewer from hidden state
    if (this.viewer3D) {
      this.viewer3D.forceResize();
      if (this.pointManager.points.length > 0) {
        this.viewer3D.updateRoute(this.pointManager.points);
      }
    }

    this._startSnapshotMode();
  }

  // ─── AR Mode Handlers ─────────────────────────────────────

  _bindARActions() {
    $('btn-ar-undo').addEventListener('click', () => {
      if (this._xrManager) {
        this._xrManager.undoLastAnchor();
        this.pointManager.undoLastPoint();
        $('ar-point-count').textContent = `${this._xrManager.anchorCount}点`;
      }
    });

    $('btn-ar-done').addEventListener('click', () => this._exitARMode());

    $('btn-ar-distance-ok').addEventListener('click', () => this._submitARDistance());
    $('btn-ar-distance-skip').addEventListener('click', () => {
      this._resolveARDistance({ distance: null, memo: '' });
    });
  }

  /**
   * Called when an anchor is placed in AR mode
   * @param {number} anchorIdx - 0-based index of the new anchor
   */
  async _onARTap(anchorIdx) {
    // Add a point with dummy screen coords (AR doesn't use screen coords)
    const addResult = this.pointManager.addPoint(0, 0);
    if (!addResult.success) return;

    $('ar-point-count').textContent = `${this._xrManager.anchorCount}点`;

    // If 2nd+ anchor, prompt for distance
    if (anchorIdx >= 1) {
      const segIndex = anchorIdx - 1;
      const measured = this._xrManager.getAnchorDistance(segIndex);

      const result = await this._promptARDistance(segIndex, measured);

      const dist = result.distance !== null ? result.distance : measured;
      if (dist !== null) {
        this.pointManager.setSegmentDistance(segIndex, dist);
      }
      if (result.memo) {
        this.pointManager.updateMemo(addResult.point.id, result.memo);
      }
    }
  }

  /**
   * Shows floating distance dialog in AR mode
   * @param {number} segIndex
   * @param {number|null} measured - AR-measured distance
   * @returns {Promise<{ distance: number|null, memo: string }>}
   */
  _promptARDistance(segIndex, measured) {
    return new Promise((resolve) => {
      this._arDistanceResolve = resolve;
      $('ar-distance-title').textContent = `区間 ${segIndex + 1}`;
      $('ar-distance-measured').textContent = measured !== null
        ? `AR計測: ${measured.toFixed(3)}m`
        : 'AR計測: --';
      $('ar-input-distance').value = '';
      $('ar-input-memo').value = '';
      $('ar-distance-dialog').hidden = false;
    });
  }

  _submitARDistance() {
    const rawVal = $('ar-input-distance').value.trim();
    const memo = $('ar-input-memo').value.trim();
    let distance = null;
    if (rawVal !== '') {
      distance = parseFloat(rawVal);
      if (isNaN(distance) || distance < 0) {
        alert('有効な距離を入力してください');
        return;
      }
    }
    this._resolveARDistance({ distance, memo });
  }

  _resolveARDistance(result) {
    $('ar-distance-dialog').hidden = true;
    if (this._arDistanceResolve) {
      this._arDistanceResolve(result);
      this._arDistanceResolve = null;
    }
  }

  // ─── 3D Viewer ────────────────────────────────────────────

  async _init3D() {
    const container = $('viewer-container');
    const statusEl = document.createElement('p');
    statusEl.id = 'viewer-status';
    statusEl.style.cssText = 'color:#888;text-align:center;padding:16px;margin:0;';
    statusEl.textContent = '3Dプレビューを読み込み中...';
    container.appendChild(statusEl);

    const loaded = await this._waitForThreeJS(8000);
    if (!loaded) {
      console.warn('Three.js not loaded after timeout, 3D preview disabled');
      statusEl.textContent = '3Dプレビュー: Three.jsの読み込みに失敗しました';
      statusEl.style.color = '#f44336';
      return;
    }

    try {
      const { default: Viewer3D } = await import('./modules/Viewer3D.js');
      this.viewer3D = new Viewer3D('viewer-container');

      // Remove status message once renderer canvas is added
      if (statusEl.parentElement) statusEl.remove();

      const { default: GLBExporter } = await import('./modules/GLBExporter.js');
      const { default: OBJExporter } = await import('./modules/OBJExporter.js');
      this.glbExporter = new GLBExporter();
      this.objExporter = new OBJExporter();

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

      // Always sync with current points (handles race condition)
      if (this.pointManager.points.length > 0) {
        this.viewer3D.updateRoute(this.pointManager.points);
      }

      console.log('3D viewer initialized (OrbitControls: ' +
        (typeof THREE.OrbitControls === 'function') + ')');
    } catch (err) {
      console.error('3D viewer init failed:', err);
      statusEl.textContent = `3Dプレビュー: 初期化エラー (${err.message})`;
      statusEl.style.color = '#f44336';
    }
  }

  _waitForThreeJS(timeoutMs) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        // Check that THREE core is available (OrbitControls is optional)
        if (typeof THREE !== 'undefined' && typeof THREE.Scene === 'function') {
          return resolve(true);
        }
        if (Date.now() - start > timeoutMs) return resolve(false);
        setTimeout(check, 100);
      };
      check();
    });
  }

  // ─── Camera (Snapshot Mode) ───────────────────────────────

  async _startCamera() {
    const errorEl = $('camera-error');
    const msgEl = $('camera-error-msg');

    msgEl.textContent = 'カメラを起動中...';
    errorEl.hidden = false;

    const result = await this.camera.start();
    if (result.success) {
      errorEl.hidden = true;
      this.canvas.syncSize();
    } else {
      msgEl.textContent = result.error;
      errorEl.hidden = false;
    }
  }

  async _onTap(screenX, screenY) {
    // Freeze camera on first tap (snapshot mode)
    if (!this._frozen && this.camera.isStarted) {
      const frame = this.camera.captureFrame();
      if (frame) {
        this.canvas.setSnapshot(frame);
        this._frozen = true;
        $('btn-camera-resume').hidden = false;
      }
    }

    const prevCount = this.pointManager.getCount();
    const addResult = this.pointManager.addPoint(screenX, screenY);
    if (!addResult.success) {
      if (addResult.errors?.count) alert(addResult.errors.count);
      return;
    }

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

  // ─── Global Button Actions ────────────────────────────────

  _bindActions() {
    $('btn-camera-toggle').addEventListener('click', async () => {
      const result = await this.camera.toggleCamera();
      if (!result.success) alert(result.error);
    });

    $('btn-camera-retry').addEventListener('click', () => this._startCamera());

    $('btn-camera-resume').addEventListener('click', () => this._resumeCamera());

    $('btn-undo').addEventListener('click', () => {
      this.pointManager.undoLastPoint();
    });

    $('btn-calibrate').addEventListener('click', () => this._recalibrate());

    $('btn-save').addEventListener('click', () => this._saveProject());
    $('btn-load').addEventListener('click', () => this._loadProject());
    $('btn-new').addEventListener('click', () => this._newProject());

    $('btn-settings').addEventListener('click', () => this._openSettings());
    $('btn-settings-close').addEventListener('click', () => this._closeSettings());
    $('form-settings').addEventListener('submit', (e) => {
      e.preventDefault();
      this._saveSettings();
    });
    $('modal-settings').addEventListener('click', (e) => {
      if (e.target.id === 'modal-settings') this._closeSettings();
    });

    $('btn-export-csv').addEventListener('click', () => {
      this.csvExporter.export(this.pointManager.points);
    });
    $('btn-export-dxf').addEventListener('click', () => {
      this.dxfExporter.export(this.pointManager.points);
    });
  }

  _resumeCamera() {
    this.canvas.setSnapshot(null);
    this._frozen = false;
    $('btn-camera-resume').hidden = true;
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
  console.log('PipeScanner Web v2.1 initialized');
});
