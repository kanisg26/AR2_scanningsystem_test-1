/**
 * Controls form inputs, point list rendering, and UI events
 * @module modules/UIController
 * @see FR-P1A-001, FR-P1A-003
 */

import { $, setText, showFieldError, clearFieldErrors, createElement } from '../utils/dom.js';
import { formatCoord } from '../utils/math.js';

export default class UIController {
  /**
   * @param {import('./PointManager.js').default} pointManager
   */
  constructor(pointManager) {
    this._pm = pointManager;
    this._editingId = null;

    // DOM references
    this._form = $('form-point');
    this._inputX = $('input-x');
    this._inputY = $('input-y');
    this._inputZ = $('input-z');
    this._inputMemo = $('input-memo');
    this._inputId = $('input-point-id');
    this._btnAdd = $('btn-add-point');
    this._listContainer = $('point-list');

    this._bindEvents();
    this._updateNextId();
  }

  /** Binds form and button events */
  _bindEvents() {
    // Form submit → add or update
    this._form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleSubmit();
    });

    // Clear button
    $('btn-clear-form').addEventListener('click', () => this.resetForm());

    // Listen to PointManager changes → re-render list
    this._pm.onChange(() => this._renderList());
  }

  /** Reads coordinate values from form inputs */
  _getFormValues() {
    return {
      x: this._inputX.value,
      y: this._inputY.value,
      z: this._inputZ.value,
      memo: this._inputMemo.value
    };
  }

  /** Handles form submit (add new or update existing) */
  _handleSubmit() {
    clearFieldErrors(this._form);
    const { x, y, z, memo } = this._getFormValues();

    let result;
    if (this._editingId !== null) {
      result = this._pm.updatePoint(this._editingId, { x, y, z, memo });
    } else {
      result = this._pm.addPoint(x, y, z, memo);
    }

    if (!result.success) {
      this._showErrors(result.errors);
      return;
    }

    this.resetForm();
  }

  /**
   * Displays validation errors on form fields
   * @param {Object} errors
   */
  _showErrors(errors) {
    if (errors.x) showFieldError('error-x', errors.x);
    if (errors.y) showFieldError('error-y', errors.y);
    if (errors.z) showFieldError('error-z', errors.z);
    if (errors.memo || errors.count) {
      const msg = errors.memo || errors.count;
      alert(msg);
    }
  }

  /** Resets form to default state */
  resetForm() {
    this._editingId = null;
    this._inputX.value = '0.000';
    this._inputY.value = '0.000';
    this._inputZ.value = '0.000';
    this._inputMemo.value = '';
    this._btnAdd.textContent = '追加';
    clearFieldErrors(this._form);
    this._updateNextId();
  }

  /** Updates the point ID display field */
  _updateNextId() {
    const next = this._pm.getNextId();
    this._inputId.value = `自動 (次: ${next})`;
  }

  /**
   * Populates form with existing point data for editing
   * @param {number} id - Point ID to edit
   */
  editPoint(id) {
    const point = this._pm.getPoint(id);
    if (!point) return;

    this._editingId = id;
    this._inputX.value = formatCoord(point.x);
    this._inputY.value = formatCoord(point.y);
    this._inputZ.value = formatCoord(point.z);
    this._inputMemo.value = point.memo;
    this._inputId.value = `編集中: ${point.id}`;
    this._btnAdd.textContent = '更新';

    // Scroll to form
    this._form.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Asks for confirmation then removes a point
   * @param {number} id - Point ID to delete
   */
  deletePoint(id) {
    if (!confirm(`点 ${id} を削除しますか？`)) return;
    this._pm.removePoint(id);

    // If we were editing this point, reset form
    if (this._editingId === id) {
      this.resetForm();
    }
  }

  /** Re-renders the point list from current PointManager data */
  _renderList() {
    const points = this._pm.points;
    const count = points.length;
    const total = this._pm.getTotalLength();

    // Update header stats
    setText('point-count', `(${count}点)`);
    setText('total-length', `総延長: ${formatCoord(total)}m`);
    this._updateNextId();

    // Clear container
    this._listContainer.innerHTML = '';

    if (count === 0) {
      this._listContainer.innerHTML =
        '<p class="empty-message">特徴点が登録されていません</p>';
      return;
    }

    // Build list items
    points.forEach((p) => {
      const coords = `(${formatCoord(p.x)}, ${formatCoord(p.y)}, ${formatCoord(p.z)})`;

      const btnEdit = createElement('button', { type: 'button' }, ['編集']);
      btnEdit.addEventListener('click', () => this.editPoint(p.id));

      const btnDel = createElement('button', { type: 'button' }, ['削除']);
      btnDel.addEventListener('click', () => this.deletePoint(p.id));

      const item = createElement('div', { className: 'point-item' }, [
        createElement('div', { className: 'point-item-info' }, [
          createElement('span', { className: 'point-item-id' }, [`${p.id}.`]),
          createElement('span', { className: 'point-item-coords' }, [coords]),
          p.memo
            ? createElement('span', { className: 'point-item-memo' }, [p.memo])
            : null
        ]),
        createElement('div', { className: 'point-item-actions' }, [btnEdit, btnDel])
      ]);

      this._listContainer.appendChild(item);
    });
  }
}
