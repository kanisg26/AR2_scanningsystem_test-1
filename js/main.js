/**
 * Application entry point - initializes and connects all modules
 * @module main
 */

import PointManager from './modules/PointManager.js';
import UIController from './modules/UIController.js';
import Viewer3D from './modules/Viewer3D.js';
import ProjectStorage from './modules/ProjectStorage.js';
import CSVExporter from './modules/CSVExporter.js';
import DXFExporter from './modules/DXFExporter.js';
import GLBExporter from './modules/GLBExporter.js';
import OBJExporter from './modules/OBJExporter.js';
import { $ } from './utils/dom.js';

class App {
  constructor() {
    /** @type {PointManager} */
    this.pointManager = new PointManager();

    /** @type {UIController} */
    this.uiController = new UIController(this.pointManager);

    /** @type {Viewer3D} */
    this.viewer3D = new Viewer3D('viewer-container');

    /** @type {ProjectStorage} */
    this.storage = new ProjectStorage();

    /** @type {CSVExporter} */
    this.csvExporter = new CSVExporter();
    /** @type {DXFExporter} */
    this.dxfExporter = new DXFExporter();
    /** @type {GLBExporter} */
    this.glbExporter = new GLBExporter();
    /** @type {OBJExporter} */
    this.objExporter = new OBJExporter();

    /** @type {string} Current project name */
    this._projectName = '';
    /** @type {{ siteName: string, operator: string, pipeType: string }} */
    this._metadata = { siteName: '', operator: '', pipeType: '' };

    // Connect PointManager changes → 3D viewer update
    this.pointManager.onChange((points) => {
      this.viewer3D.updateRoute(points);
    });

    this._bindGlobalActions();
  }

  /** Binds project management, export, and view preset buttons */
  _bindGlobalActions() {
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
    // Close modal on overlay click
    $('modal-settings').addEventListener('click', (e) => {
      if (e.target.id === 'modal-settings') this._closeSettings();
    });

    // Export actions
    $('btn-export-csv').addEventListener('click', () => {
      this.csvExporter.export(this.pointManager.points);
    });
    $('btn-export-dxf').addEventListener('click', () => {
      this.dxfExporter.export(this.pointManager.points);
    });
    $('btn-export-glb').addEventListener('click', () => {
      this.glbExporter.export(this.viewer3D.getScene(), this.pointManager.points);
    });
    $('btn-export-obj').addEventListener('click', () => {
      this.objExporter.export(this.pointManager.points);
    });

    // View preset buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (this.viewer3D) this.viewer3D.setView(view);
      });
    });
  }

  /** Opens the settings modal and populates current values */
  _openSettings() {
    $('input-project-name').value = this._projectName;
    $('input-site-name').value = this._metadata.siteName;
    $('input-operator').value = this._metadata.operator;
    $('input-pipe-type').value = this._metadata.pipeType;
    $('modal-settings').hidden = false;
  }

  /** Closes the settings modal */
  _closeSettings() {
    $('modal-settings').hidden = true;
  }

  /** Reads settings form values into app state and closes modal */
  _saveSettings() {
    this._projectName = $('input-project-name').value.trim();
    this._metadata = {
      siteName: $('input-site-name').value.trim(),
      operator: $('input-operator').value.trim(),
      pipeType: $('input-pipe-type').value.trim()
    };
    this._closeSettings();
  }

  /** Saves current project to LocalStorage (FR-P1A-010) */
  _saveProject() {
    const result = this.storage.save(
      this._projectName,
      this._metadata,
      this.pointManager.points
    );
    alert(result.success ? '保存しました' : result.error);
  }

  /** Loads project from LocalStorage (FR-P1A-011) */
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
    this.pointManager.loadPoints(data.points);
    alert('読み込みました');
  }

  /** Creates a new empty project */
  _newProject() {
    if (!confirm('現在のデータを破棄して新規プロジェクトを作成しますか？')) return;
    this.pointManager.clear();
    this.uiController.resetForm();
    this._projectName = '';
    this._metadata = { siteName: '', operator: '', pipeType: '' };
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  console.log('PipeScanner Web initialized');
});
