/**
 * Application entry point - initializes and connects all modules
 * @module main
 */

import PointManager from './modules/PointManager.js';
import UIController from './modules/UIController.js';

class App {
  constructor() {
    /** @type {PointManager} */
    this.pointManager = new PointManager();

    /** @type {UIController} */
    this.uiController = new UIController(this.pointManager);

    /** @type {import('./modules/Viewer3D.js').default|null} */
    this.viewer3D = null;

    this._bindGlobalActions();
  }

  /** Binds project management and export buttons (stubs until later steps) */
  _bindGlobalActions() {
    // Project actions
    const btnSave = document.getElementById('btn-save');
    const btnLoad = document.getElementById('btn-load');
    const btnNew = document.getElementById('btn-new');

    btnSave.addEventListener('click', () => this._saveProject());
    btnLoad.addEventListener('click', () => this._loadProject());
    btnNew.addEventListener('click', () => this._newProject());

    // Export actions (stubs - implemented in Step 5)
    document.getElementById('btn-export-csv').addEventListener('click', () => {
      alert('CSV出力はStep 5で実装予定です');
    });
    document.getElementById('btn-export-dxf').addEventListener('click', () => {
      alert('DXF出力はStep 5で実装予定です');
    });
    document.getElementById('btn-export-glb').addEventListener('click', () => {
      alert('GLB出力はStep 5で実装予定です');
    });
    document.getElementById('btn-export-obj').addEventListener('click', () => {
      alert('OBJ出力はStep 5で実装予定です');
    });

    // View preset buttons (stubs - connected in Step 4)
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (this.viewer3D) {
          this.viewer3D.setView(view);
        }
      });
    });
  }

  /** Saves current project to LocalStorage (stub - Step 6) */
  _saveProject() {
    try {
      const data = {
        version: '1.0.0',
        updatedAt: new Date().toISOString(),
        points: this.pointManager.points
      };
      localStorage.setItem('pipe_scanner_project', JSON.stringify(data));
      alert('保存しました');
    } catch (error) {
      console.error('Save failed:', error);
      alert('保存に失敗しました');
    }
  }

  /** Loads project from LocalStorage (stub - Step 6) */
  _loadProject() {
    try {
      const raw = localStorage.getItem('pipe_scanner_project');
      if (!raw) {
        alert('保存されたプロジェクトがありません');
        return;
      }
      const data = JSON.parse(raw);
      if (data.points && Array.isArray(data.points)) {
        this.pointManager.loadPoints(data.points);
        alert('読み込みました');
      }
    } catch (error) {
      console.error('Load failed:', error);
      alert('読み込みに失敗しました');
    }
  }

  /** Creates a new empty project */
  _newProject() {
    if (!confirm('現在のデータを破棄して新規プロジェクトを作成しますか？')) return;
    this.pointManager.clear();
    this.uiController.resetForm();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  console.log('PipeScanner Web initialized');
});
