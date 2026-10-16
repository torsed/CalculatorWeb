/* График на Canvas 2D.
 *
 * Два анти-паттерна из Python-версии здесь закрыты сразу:
 *  - подписи осей идут степенным шагом, а не для каждого целого, иначе
 *    zoom-out на 10^6 итераций полностью вешал интерфейс;
 *  - wheelEvent ограничивает диапазон, иначе разгоняется до 10^8.
 */
'use strict';
window.CW = window.CW || {};
window.CW.graph = (function () {
  const t = window.CW.i18n.t;
  const COLORS = ['#ff9f0a', '#ff3b30', '#30d158', '#007aff', '#af52de', '#ff9500'];

  // Границы диапазона: за ними ось перестаёт осмысленно читаться.
  const MIN_SPAN = 1e-6;
  const MAX_SPAN = 1e7;

  function clampSpan(span) {
    return Math.min(Math.max(span, MIN_SPAN), MAX_SPAN);
  }

  function GraphView(canvas, onChange) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onChange = onChange || function () {};
    this.functions = [];
    this.xmin = -10;
    this.xmax = 10;
    this.ymin = -5;
    this.ymax = 5;
    this.hover = null;
    this._bind();
  }

  GraphView.prototype._bind = function () {
    const self = this;
    const c = this.canvas;

    c.addEventListener(
      'wheel',
      function (ev) {
        ev.preventDefault();
        const factor = ev.deltaY > 0 ? 1.25 : 0.8;
        const rect = c.getBoundingClientRect();
        const cx = ev.clientX - rect.left;
        const cy = ev.clientY - rect.top;
        // Зум к курсору: точка под мышью остаётся на месте.
        const wx = self._toWorldX(cx);
        const wy = self._toWorldY(cy);

        self.xmin = wx + (self.xmin - wx) * factor;
        self.xmax = wx + (self.xmax - wx) * factor;
        self.ymin = wy + (self.ymin - wy) * factor;
        self.ymax = wy + (self.ymax - wy) * factor;
        self._clamp();
        self.render();
        self.onChange();
      },
      { passive: false }
    );

    let drag = null;
    c.addEventListener('mousedown', function (ev) {
      if (ev.button === 2) {
        self.resetView();
        return;
      }
      drag = {
        x: ev.clientX,
        y: ev.clientY,
        xmin: self.xmin,
        xmax: self.xmax,
        ymin: self.ymin,
        ymax: self.ymax,
      };
    });
    window.addEventListener('mouseup', function () {
      drag = null;
    });
    c.addEventListener('mousemove', function (ev) {
      const rect = c.getBoundingClientRect();
      if (drag) {
        const dx = ev.clientX - drag.x;
        const dy = ev.clientY - drag.y;
        const w = rect.width,
          h = rect.height;
        if (w > 0 && h > 0) {
          self.xmin = drag.xmin - (dx / w) * (drag.xmax - drag.xmin);
          self.xmax = drag.xmax - (dx / w) * (drag.xmax - drag.xmin);
          self.ymin = drag.ymin + (dy / h) * (drag.ymax - drag.ymin);
          self.ymax = drag.ymax + (dy / h) * (drag.ymax - drag.ymin);
          self._clamp();
          self.render();
          self.onChange();
        }
        return;
      }
      self._updateHover(ev.clientX - rect.left, ev.clientY - rect.top);
    });
    c.addEventListener('mouseleave', function () {
      self.hover = null;
      self.render();
    });
    c.addEventListener('contextmenu', function (ev) {
      ev.preventDefault();
    });
  };

  GraphView.prototype._clamp = function () {
    const xs = clampSpan(this.xmax - this.xmin);
    const cx = (this.xmin + this.xmax) / 2;
    this.xmin = cx - xs / 2;
    this.xmax = cx + xs / 2;
    const ys = clampSpan(this.ymax - this.ymin);
    const cy = (this.ymin + this.ymax) / 2;
    this.ymin = cy - ys / 2;
    this.ymax = cy + ys / 2;
  };

  GraphView.prototype.resetView = function () {
    this.xmin = -10;
    this.xmax = 10;
    this.ymin = -5;
    this.ymax = 5;
    this.render();
    this.onChange();
  };

  GraphView.prototype.setRange = function (xmin, xmax, ymin, ymax) {
    if (
      !Number.isFinite(xmin) ||
      !Number.isFinite(xmax) ||
      !Number.isFinite(ymin) ||
      !Number.isFinite(ymax)
    ) {
      throw new Error(t('graph.err.range'));
    }
    if (xmin >= xmax) {
      throw new Error(t('graph.err.xmin'));
    }
    if (ymin >= ymax) {
      throw new Error(t('graph.err.ymin'));
    }
    this.xmin = xmin;
    this.xmax = xmax;
    this.ymin = ymin;
    this.ymax = ymax;
    this._clamp();
  };

  GraphView.prototype.setLogScale = function (axis, enabled) {
    if (axis === 'x') {
      this.logX = !!enabled;
    } else if (axis === 'y') {
      this.logY = !!enabled;
    }
    // Ensure valid range for log scale
    if (this.logX && this.xmin <= 0) {
      this.xmin = 1e-6;
    }
    if (this.logY && this.ymin <= 0) {
      this.ymin = 1e-6;
    }
    this.render();
    this.onChange();
  };

  /** Степенной шаг подписи: 1, 2, 5 × 10ⁿ. */
  function niceStep(span, targetTicks) {
    if (!(span > 0) || !Number.isFinite(span)) {
      return 1;
    }
    const rough = span / Math.max(1, targetTicks);
    const exp = Math.floor(Math.log10(rough));
    const base = Math.pow(10, exp);
    const f = rough / base;
    const mult = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
    return mult * base;
  }

  function formatTick(v, step) {
    const abs = Math.abs(v);
    let places = 0;
    if (abs < 1e-10) {
      return '0';
    }
    if (step < 1) {
      places = Math.min(12, Math.ceil(-Math.log10(step)));
    }
    let s = v.toFixed(places);
    // 1.5000000000000002 → 1.5
    if (s.indexOf('.') >= 0) {
      s = s.replace(/0+$/, '').replace(/\.$/, '');
    }
    return s;
  }

  GraphView.prototype._resize = function () {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth || 600;
    const h = this.canvas.clientHeight || 340;
    if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h };
  };

  GraphView.prototype._toWorldX = function (px) {
    const w = this.canvas.clientWidth || 1;
    if (this.logX) {
      const logMin = Math.log10(this.xmin);
      const logMax = Math.log10(this.xmax);
      return Math.pow(10, logMin + (px / w) * (logMax - logMin));
    }
    return this.xmin + (px / w) * (this.xmax - this.xmin);
  };
  GraphView.prototype._toWorldY = function (py) {
    const h = this.canvas.clientHeight || 1;
    if (this.logY) {
      const logMin = Math.log10(this.ymin);
      const logMax = Math.log10(this.ymax);
      return Math.pow(10, logMax - (py / h) * (logMax - logMin));
    }
    return this.ymax - (py / h) * (this.ymax - this.ymin);
  };
  GraphView.prototype._toPxX = function (wx) {
    const w = this.canvas.clientWidth || 1;
    if (this.logX) {
      const logMin = Math.log10(this.xmin);
      const logMax = Math.log10(this.xmax);
      return ((Math.log10(wx) - logMin) / (logMax - logMin)) * w;
    }
    return ((wx - this.xmin) / (this.xmax - this.xmin)) * w;
  };
  GraphView.prototype._toPxY = function (wy) {
    const h = this.canvas.clientHeight || 1;
    if (this.logY) {
      const logMin = Math.log10(this.ymin);
      const logMax = Math.log10(this.ymax);
      return (1 - (Math.log10(wy) - logMin) / (logMax - logMin)) * h;
    }
    return (1 - (wy - this.ymin) / (this.ymax - this.ymin)) * h;
  };

  GraphView.prototype._style = function () {
    const s = getComputedStyle(document.documentElement);
    return {
      grid: s.getPropertyValue('--grid').trim() || '#333',
      sub: s.getPropertyValue('--sub').trim() || '#888',
      fg: s.getPropertyValue('--fg').trim() || '#fff',
    };
  };

  GraphView.prototype.render = function () {
    const ctx = this.ctx;
    const dim = this._resize();
    const st = this._style();
    const self = this;
    const w = dim.w,
      h = dim.h;

    ctx.clearRect(0, 0, w, h);

    // ── Сетка и подписи осей ──
    let xStep, yStep, x0, y0;
    if (this.logX) {
      // Log scale: grid at powers of 10
      const logMin = Math.log10(this.xmin);
      x0 = Math.pow(10, Math.ceil(logMin));
      xStep = 10; // multiplicative step
    } else {
      xStep = niceStep(this.xmax - this.xmin, 10);
      x0 = Math.ceil(this.xmin / xStep) * xStep;
    }
    if (this.logY) {
      const logMin = Math.log10(this.ymin);
      y0 = Math.pow(10, Math.ceil(logMin));
      yStep = 10;
    } else {
      yStep = niceStep(this.ymax - this.ymin, 8);
      y0 = Math.ceil(this.ymin / yStep) * yStep;
    }
    ctx.strokeStyle = st.grid;
    ctx.lineWidth = 1;
    ctx.font = '10px -apple-system, "Segoe UI", sans-serif';
    ctx.fillStyle = st.sub;

    if (this.logX) {
      for (let x = x0; x <= this.xmax; x *= xStep) {
        const px = Math.round(this._toPxX(x)) + 0.5;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillText(formatTick(x, 1), px, h - 4);
      }
    } else {
      for (let x = x0; x <= this.xmax; x += xStep) {
        const px = Math.round(this._toPxX(x)) + 0.5;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillText(formatTick(x, xStep), px, h - 4);
      }
    }

    if (this.logY) {
      for (let y = y0; y <= this.ymax; y *= yStep) {
        const py = Math.round(this._toPxY(y)) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(w, py);
        ctx.stroke();
        ctx.textAlign = 'left';
        ctx.fillText(formatTick(y, 1), 4, py - 3);
      }
    } else {
      for (let y = y0; y <= this.ymax; y += yStep) {
        const py = Math.round(this._toPxY(y)) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(w, py);
        ctx.stroke();
        ctx.textAlign = 'left';
        ctx.fillText(formatTick(y, yStep), 4, py - 3);
      }
    }

    // ── Оси ──
    ctx.strokeStyle = st.sub;
    ctx.lineWidth = 1.2;
    if (!this.logY && this.ymin <= 0 && this.ymax >= 0) {
      const ay = Math.round(this._toPxY(0)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, ay);
      ctx.lineTo(w, ay);
      ctx.stroke();
    }
    if (!this.logX && this.xmin <= 0 && this.xmax >= 0) {
      const ax = Math.round(this._toPxX(0)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(ax, 0);
      ctx.lineTo(ax, h);
      ctx.stroke();
    }

    // ── Кривые ──
    const SAMPLES = Math.max(200, Math.min(1200, Math.round(w * 2)));
    this.functions.forEach(function (fn) {
      if (fn.show === false) {
        return;
      }
      ctx.strokeStyle = fn.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      let prevY = null;
      for (let i = 0; i <= SAMPLES; i++) {
        // Use log-spaced samples for log scale
        let wx;
        if (self.logX) {
          const logMin = Math.log10(self.xmin);
          const logMax = Math.log10(self.xmax);
          wx = Math.pow(10, logMin + (i / SAMPLES) * (logMax - logMin));
        } else {
          wx = self.xmin + (i / SAMPLES) * (self.xmax - self.xmin);
        }
        let vy;
        try {
          vy = fn.f(wx);
        } catch (e) {
          vy = NaN;
        }
        if (typeof vy === 'object' && vy !== null) {
          vy = vy.re;
        }
        if (typeof vy !== 'number' || !Number.isFinite(vy)) {
          // Разрыв domain: новый сегмент, иначе рисуем вертикальную черту.
          started = false;
          prevY = null;
          continue;
        }
        const qx = self._toPxX(wx);
        const qy = self._toPxY(vy);
        // Защита от вертикальных скачков вроде 1/x около нуля.
        if (prevY !== null && Math.abs(qy - prevY) > h * 2) {
          started = false;
        }
        if (!started) {
          ctx.moveTo(qx, qy);
          started = true;
        } else {
          ctx.lineTo(qx, qy);
        }
        prevY = qy;
      }
      ctx.stroke();
    });

    // ── Курсор ──
    if (this.hover) {
      ctx.fillStyle = st.sub;
      ctx.beginPath();
      ctx.arc(this.hover.px, this.hover.py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  GraphView.prototype._updateHover = function (px, py) {
    const wx = this._toWorldX(px);
    const self = this;
    let best = null;
    this.functions.forEach(function (fn) {
      if (fn.show === false) {
        return;
      }
      let vy;
      try {
        vy = fn.f(wx);
      } catch (e) {
        return;
      }
      if (typeof vy === 'object' && vy !== null) {
        vy = vy.re;
      }
      if (typeof vy !== 'number' || !Number.isFinite(vy)) {
        return;
      }
      const dist = Math.abs(self._toPxY(vy) - py);
      if (best === null || dist < best.dist) {
        best = { dist: dist, px: self._toPxX(wx), py: self._toPxY(vy), wx: wx, wy: vy, fn: fn };
      }
    });
    if (best && best.dist < 24) {
      this.hover = best;
    } else {
      this.hover = null;
    }
    this.render();
    if (this.onHover) {
      this.onHover(this.hover);
    }
  };

  GraphView.prototype.hoverText = function () {
    if (!this.hover) {
      return '';
    }
    const F = window.CW.format;
    return t('graph.hover', { x: F.fmt(this.hover.wx, 6), y: F.fmt(this.hover.wy, 6) });
  };

  /** Экспорт в PNG. Ошибки возвращаются вызывающему, а не бросаются в консоль. */
  GraphView.prototype.exportPng = function (filename) {
    try {
      const url = this.canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'graph.png';
      a.click();
      return true;
    } catch (e) {
      return false;
    }
  };

  /** Значение функции в точке x только как конечное число (иначе NaN). */
  GraphView.prototype._sampleFn = function (fn, x) {
    let y;
    try {
      y = fn.f(x);
    } catch (e) {
      return NaN;
    }
    if (typeof y === 'object' && y !== null) {
      y = y.re;
    }
    return typeof y === 'number' && Number.isFinite(y) ? y : NaN;
  };

  /** Вписать область Y по значениям функций на видимом диапазоне X. */
  GraphView.prototype.autofit = function () {
    const N = 400;
    const self = this;
    let lo = Infinity;
    let hi = -Infinity;
    this.functions.forEach(function (fn) {
      if (fn.show === false) {
        return;
      }
      for (let i = 0; i <= N; i++) {
        const x = self.xmin + (i / N) * (self.xmax - self.xmin);
        const y = self._sampleFn(fn, x);
        if (y < lo) {
          lo = y;
        }
        if (y > hi) {
          hi = y;
        }
      }
    });
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
      return false;
    }
    if (hi - lo < 1e-9) {
      lo -= 1;
      hi += 1;
    }
    const pad = (hi - lo) * 0.1;
    this.ymin = lo - pad;
    this.ymax = hi + pad;
    this._clamp();
    this.render();
    this.onChange();
    return true;
  };

  /** Таблица значений: x и все видимые функции. */
  GraphView.prototype.valueTable = function (rows) {
    rows = rows || 40;
    const self = this;
    const fns = this.functions.filter(function (f) {
      return f.show !== false;
    });
    const data = [];
    for (let i = 0; i <= rows; i++) {
      const x = self.xmin + (i / rows) * (self.xmax - self.xmin);
      data.push(
        [x].concat(
          fns.map(function (f) {
            return self._sampleFn(f, x);
          })
        )
      );
    }
    return { fns: fns, rows: data };
  };

  /** Экспорт таблицы значений в CSV. */
  GraphView.prototype.exportCsv = function (filename) {
    try {
      const t = this.valueTable(60);
      const F = window.CW.format;
      const header = ['x']
        .concat(
          t.fns.map(function (f, i) {
            return 'y' + (i + 1);
          })
        )
        .join(',');
      const lines = t.rows.map(function (r) {
        return r
          .map(function (v) {
            return Number.isFinite(v) ? F.fmt(v, 10) : '';
          })
          .join(',');
      });
      const blob = new Blob([header + '\n' + lines.join('\n')], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename || 'graph.csv';
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
      }, 1000);
      return true;
    } catch (e) {
      return false;
    }
  };

  /** Экспорт в SVG. Возвращает строку SVG или null при ошибке. */
  GraphView.prototype.exportSvg = function (filename) {
    try {
      const dim = this._resize();
      const w = dim.w,
        h = dim.h;
      const st = this._style();

      // Build SVG content
      let svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="' +
        w +
        '" height="' +
        h +
        '" viewBox="0 0 ' +
        w +
        ' ' +
        h +
        '">';
      // Background
      svg +=
        '<rect width="100%" height="100%" fill="' +
        st.grid.replace('#', '').replace(/^([0-9a-f]{3})$/, '$1$1') +
        '" />';

      // We need to recreate the rendering in SVG - simplified version
      // Grid
      const xStep = window.CW.graph.niceStep(this.xmax - this.xmin, 10);
      const yStep = window.CW.graph.niceStep(this.ymax - this.ymin, 8);

      svg += '<g stroke="' + st.grid + '" stroke-width="1">';
      const x0 = Math.ceil(this.xmin / xStep) * xStep;
      for (let x = x0; x <= this.xmax; x += xStep) {
        const px = Math.round(this._toPxX(x)) + 0.5;
        svg += '<line x1="' + px + '" y1="0" x2="' + px + '" y2="' + h + '" />';
      }
      const y0 = Math.ceil(this.ymin / yStep) * yStep;
      for (let y = y0; y <= this.ymax; y += yStep) {
        const py = Math.round(this._toPxY(y)) + 0.5;
        svg += '<line x1="0" y1="' + py + '" x2="' + w + '" y2="' + py + '" />';
      }
      svg += '</g>';

      // Axes
      svg += '<g stroke="' + st.sub + '" stroke-width="1.2">';
      if (this.ymin <= 0 && this.ymax >= 0) {
        const ay = Math.round(this._toPxY(0)) + 0.5;
        svg += '<line x1="0" y1="' + ay + '" x2="' + w + '" y2="' + ay + '" />';
      }
      if (this.xmin <= 0 && this.xmax >= 0) {
        const ax = Math.round(this._toPxX(0)) + 0.5;
        svg += '<line x1="' + ax + '" y1="0" x2="' + ax + '" y2="' + h + '" />';
      }
      svg += '</g>';

      // Curves
      const SAMPLES = Math.max(200, Math.min(1200, Math.round(w * 2)));
      for (let idx = 0; idx < this.functions.length; idx++) {
        const fn = this.functions[idx];
        if (fn.show === false) {
          continue;
        }
        let path = '';
        let started = false;
        let prevY = null;
        for (let i = 0; i <= SAMPLES; i++) {
          const wx = this.xmin + (i / SAMPLES) * (this.xmax - this.xmin);
          let vy;
          try {
            vy = fn.f(wx);
          } catch (e) {
            vy = NaN;
          }
          if (typeof vy === 'object' && vy !== null) {
            vy = vy.re;
          }
          if (typeof vy !== 'number' || !Number.isFinite(vy)) {
            started = false;
            prevY = null;
            continue;
          }
          const qx = this._toPxX(wx);
          const qy = this._toPxY(vy);
          if (prevY !== null && Math.abs(qy - prevY) > h * 2) {
            started = false;
          }
          if (!started) {
            path += 'M ' + qx + ' ' + qy + ' ';
            started = true;
          } else {
            path += 'L ' + qx + ' ' + qy + ' ';
          }
          prevY = qy;
        }
        if (path) {
          svg += '<path d="' + path + '" stroke="' + fn.color + '" stroke-width="2" fill="none" />';
        }
      }

      svg += '</svg>';

      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'graph.svg';
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1000);
      return true;
    } catch (e) {
      return false;
    }
  };

  /** Найти точки пересечения между всеми парами видимых функций. */
  GraphView.prototype.findIntersections = function () {
    const intersections = [];
    const visibleFns = this.functions.filter(function (fn) {
      return fn.show !== false;
    });
    const EPS = 1e-6;

    for (let i = 0; i < visibleFns.length; i++) {
      for (let j = i + 1; j < visibleFns.length; j++) {
        const f1 = visibleFns[i];
        const f2 = visibleFns[j];
        // Находим корни f1(x) - f2(x) = 0 на текущем интервале
        const diffFn = function (x) {
          let v1, v2;
          try {
            v1 = f1.f(x);
          } catch (e) {
            return NaN;
          }
          try {
            v2 = f2.f(x);
          } catch (e) {
            return NaN;
          }
          if (typeof v1 === 'object' && v1 !== null) {
            v1 = v1.re;
          }
          if (typeof v2 === 'object' && v2 !== null) {
            v2 = v2.re;
          }
          if (
            typeof v1 !== 'number' ||
            typeof v2 !== 'number' ||
            !Number.isFinite(v1) ||
            !Number.isFinite(v2)
          ) {
            return NaN;
          }
          return v1 - v2;
        };

        // Сканер по сетке
        const steps = 200;
        let prevX = this.xmin;
        let prevY = diffFn(prevX);
        for (let k = 1; k <= steps; k++) {
          const x = this.xmin + (k / steps) * (this.xmax - this.xmin);
          const y = diffFn(x);
          if (
            Number.isFinite(prevY) &&
            Number.isFinite(y) &&
            (prevY === 0 || prevY < 0 !== y < 0)
          ) {
            // Есть смена знака - бисекция
            const root = this._bisect(diffFn, prevX, x, prevY);
            if (root !== null) {
              let ry;
              try {
                ry = f1.f(root);
              } catch (e) {
                ry = NaN;
              }
              if (Number.isFinite(ry)) {
                // Проверка на дубликаты
                let isDup = false;
                for (const existing of intersections) {
                  if (Math.abs(existing.x - root) < EPS && Math.abs(existing.y - ry) < EPS) {
                    isDup = true;
                    break;
                  }
                }
                if (!isDup) {
                  intersections.push({ x: root, y: ry, fn1: f1, fn2: f2 });
                }
              }
            }
          }
          prevX = x;
          prevY = y;
        }
      }
    }
    return intersections;
  };

  GraphView.prototype._bisect = function (f, a, b, fa) {
    const EPS = 1e-10;
    for (let i = 0; i < 50; i++) {
      const mid = (a + b) / 2;
      const fm = f(mid);
      if (!Number.isFinite(fm)) {
        return null;
      }
      if (Math.abs(fm) < EPS || Math.abs(b - a) < EPS) {
        return mid;
      }
      if (fa < 0 !== fm < 0) {
        b = mid;
      } else {
        a = mid;
        fa = fm;
      }
    }
    return (a + b) / 2;
  };

  /** Численная производная в точке x. */
  GraphView.prototype.numericalDerivative = function (fn, x) {
    const h = 1e-6;
    let f1, f2;
    try {
      f1 = fn(x + h);
    } catch (e) {
      return NaN;
    }
    try {
      f2 = fn(x - h);
    } catch (e) {
      return NaN;
    }
    if (typeof f1 === 'object' && f1 !== null) {
      f1 = f1.re;
    }
    if (typeof f2 === 'object' && f2 !== null) {
      f2 = f2.re;
    }
    if (
      typeof f1 !== 'number' ||
      typeof f2 !== 'number' ||
      !Number.isFinite(f1) ||
      !Number.isFinite(f2)
    ) {
      return NaN;
    }
    return (f1 - f2) / (2 * h);
  };

  /** Численный интеграл (метод трапеций). */
  GraphView.prototype.numericalIntegral = function (fn, a, b, steps) {
    steps = steps || 1000;
    if (a > b) {
      const t = a;
      a = b;
      b = t;
    }
    const h = (b - a) / steps;
    let sum = 0;
    let fa;
    try {
      fa = fn(a);
    } catch (e) {
      return NaN;
    }
    if (typeof fa === 'object' && fa !== null) {
      fa = fa.re;
    }
    if (typeof fa !== 'number' || !Number.isFinite(fa)) {
      return NaN;
    }
    for (let i = 1; i <= steps; i++) {
      const x = a + i * h;
      let fb;
      try {
        fb = fn(x);
      } catch (e) {
        return NaN;
      }
      if (typeof fb === 'object' && fb !== null) {
        fb = fb.re;
      }
      if (typeof fb !== 'number' || !Number.isFinite(fb)) {
        return NaN;
      }
      sum += ((fa + fb) * h) / 2;
      fa = fb;
    }
    return sum;
  };

  return { GraphView: GraphView, COLORS: COLORS, niceStep: niceStep };
})();
