/* Общие helpers для pages/: F() и el().
 *
 * Часть pages/: вкладки приложения. Файл самодостаточен для file:// —
 * грузится обычным <script> до остальных pages/* и регистрируется
 * в window.CW.pages. См. комментарий про window.CW в index.html.
 *
 * Раньше этот блок копировался в каждый файл pages/*.js (13 копий);
 * теперь единый источник правды здесь.
 */
'use strict';
window.CW = window.CW || {};
window.CW.pages = window.CW.pages || {};
window.CW.pages._helpers =
  window.CW.pages._helpers ||
  (function () {
    function F() {
      return window.CW && window.CW.format
        ? window.CW.format
        : { fmt: String, fmtComplex: String, toNumber: Number };
    }
    // el берётся лениво: модули грузятся раньше app.js в HTML.
    function el(tag, cls, text) {
      if (window.CW && window.CW.app) {
        return window.CW.app.el(tag, cls, text);
      }
      const n = document.createElement(tag);
      if (cls) {
        if (typeof cls === 'string') {
          n.className = cls;
        } else {
          if (cls.cls) {
            n.className = cls.cls;
          }
          if (cls.attrs) {
            Object.keys(cls.attrs).forEach(function (k) {
              n.setAttribute(k, cls.attrs[k]);
            });
          }
        }
      }
      if (text !== undefined && text !== null) {
        n.textContent = text;
      }
      return n;
    }
    // Численно решает формулу относительно произвольного неизвестного поля.
    // spec        — [label, keys, fn]; keys[0] — величина, которую формула
    //               считает напрямую (её значение берётся как «цель»).
    // vals        — уже собранные значения (неизвестный ключ = NaN).
    // unknownKey  — ключ пустого поля.
    // put(objs,k,x) — записать значение с учётом переименования ключей
    //               (λ→lambda и т. п.); по умолчанию просто objs[k]=x.
    function solveInverse(spec, vals, unknownKey, put) {
      put =
        put ||
        function (objs, k, x) {
          objs[k] = x;
        };
      const probe = {};
      put(probe, spec[1][0], 0);
      const target = vals[Object.keys(probe)[0]];
      if (typeof target !== 'number' || !Number.isFinite(target)) {
        return NaN;
      }
      function g(x) {
        const v = Object.assign({}, vals);
        put(v, unknownKey, x);
        try {
          const y = spec[2](v)[1];
          return typeof y === 'number' && Number.isFinite(y) ? y - target : NaN;
        } catch (e) {
          return NaN;
        }
      }
      function bisect(a, b, fa) {
        for (let i = 0; i < 120; i++) {
          const mid = (a + b) / 2;
          const fm = g(mid);
          if (!Number.isFinite(fm) || Math.abs(b - a) < 1e-12) {
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
      }
      const ranges = [
        [-1e6, -1e3],
        [-1e3, -1],
        [-1, 1],
        [1, 1e3],
        [1e3, 1e6],
      ];
      for (let r = 0; r < ranges.length; r++) {
        const a = ranges[r][0];
        const b = ranges[r][1];
        const N = 200;
        let pa = a;
        let fa = g(a);
        for (let i = 1; i <= N; i++) {
          const x = a + ((b - a) * i) / N;
          const fx = g(x);
          if (Number.isFinite(fa) && Number.isFinite(fx)) {
            if (fx === 0) {
              return x;
            }
            if (fa < 0 !== fx < 0) {
              return bisect(pa, x, fa);
            }
          }
          pa = x;
          fa = fx;
        }
      }
      return NaN;
    }
    return { F: F, el: el, solveInverse: solveInverse };
  })();
