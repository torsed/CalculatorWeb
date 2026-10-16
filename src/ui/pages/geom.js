/* Геометрия.
 *
 * Часть pages/: вкладки приложения. Файл самодостаточен для file:// —
 * грузится обычным <script> после core/* и до ui/app.js, регистрируется
 * в window.CW.pages. См. комментарий про window.CW в index.html.
 */
'use strict';
window.CW = window.CW || {};
window.CW.pages = window.CW.pages || {};
/* Общие helpers (F, el) — см. src/ui/pages/helpers.js. */
(function () {
  const F = window.CW.pages._helpers.F();
  const el = window.CW.pages._helpers.el;
  const H = window.CW.pages._helpers;
  const t = window.CW.i18n.t;
  const U = window.CW.i18n.unit;
  // ── Геометрия ────────────────────────────────────────────
  // Все входы в СИ: длины в м, углы в рад. π захардкожен.
  /** @type {FormulaSpec[]} */
  const GEOM_FUNCS = [
    [
      t('geom.f.circleArea'),
      ['S', 'r'],
      function (v) {
        return ['S', Math.PI * v.r * v.r, 'м²'];
      },
    ],
    [
      t('geom.f.circumference'),
      ['C', 'r'],
      function (v) {
        return ['C', 2 * Math.PI * v.r, 'м'];
      },
    ],
    [
      t('geom.f.heron'),
      ['S', 'a', 'b', 'c'],
      function (v) {
        const p = (v.a + v.b + v.c) / 2;
        return ['S', Math.sqrt(p * (p - v.a) * (p - v.b) * (p - v.c)), 'м²'];
      },
    ],
    [
      t('geom.f.triangleArea'),
      ['S', 'b', 'h'],
      function (v) {
        return ['S', 0.5 * v.b * v.h, 'м²'];
      },
    ],
    [
      t('geom.f.rectangleArea'),
      ['S', 'a', 'b'],
      function (v) {
        return ['S', v.a * v.b, 'м²'];
      },
    ],
    [
      t('geom.f.rectanglePerimeter'),
      ['P', 'a', 'b'],
      function (v) {
        return ['P', 2 * (v.a + v.b), 'м'];
      },
    ],
    [
      t('geom.f.trapezoidArea'),
      ['S', 'a', 'b', 'h'],
      function (v) {
        return ['S', 0.5 * (v.a + v.b) * v.h, 'м²'];
      },
    ],
    [
      t('geom.f.circularSector'),
      ['S', 'r', 'a'],
      function (v) {
        // α в радианах.
        return ['S', 0.5 * v.r * v.r * v.a, 'м²'];
      },
    ],
    [
      t('geom.f.sphereVolume'),
      ['V', 'r'],
      function (v) {
        return ['V', (4 / 3) * Math.PI * v.r * v.r * v.r, 'м³'];
      },
    ],
    [
      t('geom.f.sphereArea'),
      ['A', 'r'],
      function (v) {
        return ['A', 4 * Math.PI * v.r * v.r, 'м²'];
      },
    ],
    [
      t('geom.f.cylinderVolume'),
      ['V', 'r', 'h'],
      function (v) {
        return ['V', Math.PI * v.r * v.r * v.h, 'м³'];
      },
    ],
    [
      t('geom.f.coneVolume'),
      ['V', 'r', 'h'],
      function (v) {
        return ['V', (Math.PI * v.r * v.r * v.h) / 3, 'м³'];
      },
    ],
  ];

  function mountGeom(app) {
    const page = app.pageNodes.geom;
    page.innerHTML = '';

    const card = el('div', 'card');
    card.appendChild(el('h2', null, t('geom.formula')));
    const sel = el('select', 'field');
    GEOM_FUNCS.forEach(function (f, i) {
      const o = el('option', null, f[0]);
      o.value = String(i);
      sel.appendChild(o);
    });
    card.appendChild(sel);

    const row = el('div', 'row');
    row.style.marginTop = '8px';
    const inputs = [];
    // Число полей берём по самой «длинной» формуле (4 аргумента — Герон, трапеция).
    let maxKeys = 0;
    GEOM_FUNCS.forEach(function (f) {
      if (f[1].length > maxKeys) {
        maxKeys = f[1].length;
      }
    });
    for (let i = 0; i < maxKeys; i++) {
      const f = el('input', 'field');
      f.type = 'text';
      f.inputMode = 'decimal';
      // aria-label ставим явно: el() уже отработал и не подхватит более
      // поздние изменения placeholder. Скрытые поля тоже должны иметь имя.
      const initKey = GEOM_FUNCS[0][1][i] || t('geom.param', { name: i + 1 });
      f.placeholder = initKey;
      f.setAttribute('aria-label', initKey);
      row.appendChild(f);
      inputs.push(f);
    }
    card.appendChild(row);
    const out = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    card.appendChild(out);

    function refreshInputs() {
      const keys = GEOM_FUNCS[parseInt(sel.value, 10)][1];
      inputs.forEach(function (f, i) {
        if (i < keys.length) {
          f.style.display = '';
          f.placeholder = keys[i];
          f.setAttribute('aria-label', keys[i]);
        } else {
          f.style.display = 'none';
          f.value = '';
          f.placeholder = '';
        }
      });
    }
    sel.onchange = refreshInputs;
    refreshInputs();

    function run() {
      try {
        const spec = GEOM_FUNCS[parseInt(sel.value, 10)];
        const keys = spec[1];
        const vals = {};
        keys.forEach(function (k, i) {
          vals[k] = F.toNumber(inputs[i].value);
        });
        const missing = keys.filter(function (k) {
          return inputs[keys.indexOf(k)].value.trim() === '';
        });
        if (missing.length !== 1) {
          throw { message: t('geom.err.oneEmpty') };
        }
        const emptyKey = missing[0];
        if (emptyKey === keys[0]) {
          const res = spec[2](vals);
          if (typeof res[1] === 'number' && !Number.isFinite(res[1])) {
            throw { message: t('geom.err.undefined') };
          }
          out.textContent = res[0] + ' = ' + F.fmt(res[1]) + ' ' + U(res[2]);
        } else {
          const x = H.solveInverse(spec, vals, emptyKey);
          if (!Number.isFinite(x)) {
            throw {
              message: t('geom.err.solve', { target: keys[0], key: emptyKey }),
            };
          }
          out.textContent = emptyKey + ' = ' + F.fmt(x, 6);
        }
        out.classList.remove('err');
      } catch (e) {
        out.textContent = e.message || String(e);
        out.classList.add('err');
      }
    }
    const btn = el('button', 'btn primary', t('common.solve'));
    btn.onclick = run;
    const brow = el('div', 'row');
    brow.style.marginTop = '8px';
    brow.appendChild(btn);
    card.appendChild(brow);

    const hint = el('div', 'hint', t('geom.hint'));
    card.appendChild(hint);
    page.appendChild(card);
  }

  window.CW.pages.mountGeom = mountGeom;
})();
