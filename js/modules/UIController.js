/**
 * Controls camera UI, point list, and distance dialog interactions
 * @module modules/UIController
 */

import { $, setText, createElement } from '../utils/dom.js';
import { formatDistance } from '../utils/math.js';

export default class UIController {
  /**
   * @param {import('./PointManager.js').default} pointManager
   */
  constructor(pointManager) {
    this._pm = pointManager;
    this._listContainer = $('point-list');

    // Distance dialog state
    this._distanceResolve = null;
    this._pendingSegmentIndex = null;

    this._bindDistanceDialog();
    this._pm.onChange(() => this._renderList());
  }

  /** Binds the distance input dialog events */
  _bindDistanceDialog() {
    $('form-distance').addEventListener('submit', (e) => {
      e.preventDefault();
      this._submitDistance();
    });
    $('btn-distance-skip').addEventListener('click', () => {
      this._resolveDistance(null);
    });
    $('modal-distance').addEventListener('click', (e) => {
      if (e.target.id === 'modal-distance') this._resolveDistance(null);
    });
  }

  /**
   * Opens the distance dialog and returns a Promise with the entered value
   * @param {number} segmentIndex - Which segment (for estimating)
   * @param {boolean} isFirst - Whether this is the first segment (calibration)
   * @returns {Promise<{ distance: number|null, memo: string }>}
   */
  promptDistance(segmentIndex, isFirst) {
    return new Promise((resolve) => {
      this._distanceResolve = resolve;
      this._pendingSegmentIndex = segmentIndex;

      const title = isFirst
        ? '最初の区間: 実測距離を入力（校正基準）'
        : `区間 ${segmentIndex + 1} の距離`;
      setText('distance-dialog-title', title);

      // Show estimated distance if calibrated
      const estimated = this._pm.estimateDistance(segmentIndex);
      const estimatedEl = $('distance-estimated');
      if (estimated !== null) {
        $('distance-estimated-value').textContent = `${formatDistance(estimated)}m`;
        estimatedEl.hidden = false;
        $('input-distance').placeholder = formatDistance(estimated);
      } else {
        estimatedEl.hidden = true;
        $('input-distance').placeholder = '例: 0.52';
      }

      $('input-distance').value = '';
      $('input-point-memo').value = '';
      $('modal-distance').hidden = false;
      $('input-distance').focus();
    });
  }

  /** Handles distance form submission */
  _submitDistance() {
    const rawVal = $('input-distance').value.trim();
    const memo = $('input-point-memo').value.trim();

    let distance = null;
    if (rawVal !== '') {
      distance = parseFloat(rawVal);
      if (isNaN(distance) || distance < 0) {
        alert('有効な距離を入力してください');
        return;
      }
    } else {
      // Use estimated distance if available
      const estimated = this._pm.estimateDistance(this._pendingSegmentIndex);
      distance = estimated;
    }

    this._resolveDistance({ distance, memo });
  }

  /**
   * Resolves the distance dialog promise and hides the dialog
   * @param {{ distance: number|null, memo: string }|null} result
   */
  _resolveDistance(result) {
    $('modal-distance').hidden = true;
    if (this._distanceResolve) {
      this._distanceResolve(result || { distance: null, memo: '' });
      this._distanceResolve = null;
    }
  }

  /** Re-renders the point list from current PointManager data */
  _renderList() {
    const points = this._pm.points;
    const count = points.length;
    const total = this._pm.getTotalLength();

    setText('point-count', `(${count}点)`);
    setText('total-length', `総延長: ${formatDistance(total)}m`);

    this._listContainer.innerHTML = '';

    if (count === 0) {
      this._listContainer.innerHTML =
        '<p class="empty-message">ポイントが登録されていません</p>';
      return;
    }

    points.forEach((p, i) => {
      const distText = p.distanceToNext !== null
        ? `→ ${formatDistance(p.distanceToNext)}m`
        : (i < count - 1 ? '→ --' : '');

      const btnDel = createElement('button', { type: 'button' }, ['削除']);
      btnDel.addEventListener('click', () => {
        if (confirm(`ポイント ${p.id} を削除しますか？`)) {
          this._pm.removePoint(p.id);
        }
      });

      const item = createElement('div', { className: 'point-item' }, [
        createElement('div', { className: 'point-item-info' }, [
          createElement('span', { className: 'point-item-id' }, [`${i + 1}.`]),
          p.memo
            ? createElement('span', { className: 'point-item-memo' }, [p.memo])
            : null,
          distText
            ? createElement('span', { className: 'point-item-distance' }, [distText])
            : null
        ]),
        createElement('div', { className: 'point-item-actions' }, [btnDel])
      ]);

      this._listContainer.appendChild(item);
    });
  }
}
