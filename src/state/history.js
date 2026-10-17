/* История вычислений в localStorage.
 *
 * В Python-версии это core/history.py с файловым JSON. В браузере файл не
 * нужен: localStorage даёт ту же персистентность без синхронного I/O
 * в обработчике кнопки.
 */
'use strict';
window.CW = window.CW || {};
window.CW.history = (function () {
  const KEY = 'cw.history.v1';
  const MAX = 200;

  function History() {
    this.entries = [];
    this._load();
  }

  History.prototype._load = function () {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        return;
      }
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) {
        return;
      }
      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        if (d && typeof d.expr === 'string' && typeof d.result === 'string') {
          this.entries.push({
            expr: d.expr,
            result: d.result,
            ts: d.ts || Date.now() / 1000,
            fav: !!d.fav,
          });
        }
      }
    } catch (e) {
      // Битое хранилище не должно мешать работать — просто начинаем с нуля.
      this.entries = [];
    }
  };

  History.prototype._save = function () {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.entries.slice(-MAX)));
    } catch (e) {
      // Приватный режим или переполнение квоты — не критично.
    }
  };

  History.prototype.add = function (expr, result) {
    if (!expr) {
      return;
    }
    // Дедупликация: одинаковый expr+result не должен расти в списке.
    // Флаг «избранное» при этом сохраняем.
    let fav = false;
    for (let i = this.entries.length - 1; i >= 0; i--) {
      if (this.entries[i].expr === expr && this.entries[i].result === result) {
        fav = fav || !!this.entries[i].fav;
        this.entries.splice(i, 1);
      }
    }
    this.entries.push({ expr: expr, result: result, ts: Date.now() / 1000, fav: fav });
    if (this.entries.length > MAX) {
      this.entries.splice(0, this.entries.length - MAX);
    }
    this._save();
  };

  /** Переключить «избранное» у записи. Возвращает новое состояние флага. */
  History.prototype.toggleFav = function (expr, result) {
    for (let i = this.entries.length - 1; i >= 0; i--) {
      const e = this.entries[i];
      if (e.expr === expr && e.result === result) {
        e.fav = !e.fav;
        this._save();
        return e.fav;
      }
    }
    return false;
  };

  History.prototype.all = function () {
    return this.entries.slice();
  };

  /** Импорт записей из массива (например, из экспортированного JSON). */
  History.prototype.importAll = function (data) {
    if (!Array.isArray(data)) {
      return 0;
    }
    let n = 0;
    for (const d of data) {
      if (d && typeof d.expr === 'string' && typeof d.result === 'string') {
        this.add(d.expr, d.result);
        n++;
      }
    }
    return n;
  };

  History.prototype.clear = function () {
    this.entries = [];
    this._save();
  };

  return { History: History };
})();
