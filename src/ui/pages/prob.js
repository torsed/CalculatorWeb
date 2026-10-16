/* Теория вероятностей.
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
  // ── Теория вероятностей ─────────────────────────────────
  // Все входы в СИ / стандартных единицах вероятности (доли от 0 до 1).

  /** Факториал через гамма-функцию для целых n. */
  function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) {
      throw { message: t('prob.err.integer') };
    }
    let r = 1;
    for (let i = 2; i <= n; i++) {
      r *= i;
    }
    return r;
  }

  /** C(n,k) = n! / (k!·(n−k)!). */
  function comb(n, k) {
    if (k < 0 || k > n) {
      return 0;
    }
    if (k > n - k) {
      k = n - k;
    }
    let r = 1;
    for (let i = 0; i < k; i++) {
      r = (r * (n - i)) / (i + 1);
    }
    return r;
  }

  /** erf(x) через ряд Тейлора — точность ~1e-6 для |x| ≤ 3. */
  function erf(x) {
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1 / (1 + p * x);
    const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  }

  /** @type {FormulaSpec[]} */
  const PROB_FUNCS = [
    [
      t('prob.f.binomial'),
      ['P', 'n', 'k', 'p'],
      function (v) {
        const P = comb(v.n, v.k) * Math.pow(v.p, v.k) * Math.pow(1 - v.p, v.n - v.k);
        return ['P', P, ''];
      },
    ],
    [
      t('prob.f.poisson'),
      ['P', 'l', 'k'],
      function (v) {
        const P = (Math.pow(v.l, v.k) * Math.exp(-v.l)) / factorial(v.k);
        return ['P', P, ''];
      },
    ],
    [
      t('prob.f.normalPdf'),
      ['f', 'x', 'mu', 'sig'],
      function (v) {
        const z = (v.x - v.mu) / v.sig;
        return ['f', Math.exp(-(z * z) / 2) / (v.sig * Math.sqrt(2 * Math.PI)), ''];
      },
    ],
    [
      t('prob.f.normalCdf'),
      ['F', 'z'],
      function (v) {
        return ['F', (1 + erf(v.z / Math.SQRT2)) / 2, ''];
      },
    ],
    [
      t('prob.f.binomialExpectation'),
      ['E', 'n', 'p'],
      function (v) {
        return ['E', v.n * v.p, ''];
      },
    ],
    [
      t('prob.f.binomialVariance'),
      ['D', 'n', 'p'],
      function (v) {
        return ['D', v.n * v.p * (1 - v.p), ''];
      },
    ],
  ];

  function mountProb(app) {
    const page = app.pageNodes.prob;
    page.innerHTML = '';

    const card = el('div', 'card');
    card.appendChild(el('h2', null, t('prob.distribution')));
    const sel = el('select', 'field');
    PROB_FUNCS.forEach(function (f, i) {
      const o = el('option', null, f[0]);
      o.value = String(i);
      sel.appendChild(o);
    });
    card.appendChild(sel);

    const row = el('div', 'row');
    row.style.marginTop = '8px';
    const inputs = [];
    // Самая «длинная» — нормальное распределение с 4 ключами (x, μ, σ, f).
    let maxKeys = 0;
    PROB_FUNCS.forEach(function (f) {
      if (f[1].length > maxKeys) {
        maxKeys = f[1].length;
      }
    });
    for (let i = 0; i < maxKeys; i++) {
      const f = el('input', 'field');
      f.type = 'text';
      f.inputMode = 'decimal';
      const initKey = PROB_FUNCS[0][1][i] || t('prob.param', { name: i + 1 });
      f.placeholder = initKey;
      f.setAttribute('aria-label', initKey);
      row.appendChild(f);
      inputs.push(f);
    }
    card.appendChild(row);
    const out = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    card.appendChild(out);

    function refreshInputs() {
      const keys = PROB_FUNCS[parseInt(sel.value, 10)][1];
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

    const putKey = function (objs, k, x) {
      objs[k === 'λ' ? 'l' : k] = x;
    };

    function run() {
      try {
        const spec = PROB_FUNCS[parseInt(sel.value, 10)];
        const keys = spec[1];
        const vals = {};
        keys.forEach(function (k, i) {
          putKey(vals, k, F.toNumber(inputs[i].value));
        });
        const missing = keys.filter(function (k) {
          return inputs[keys.indexOf(k)].value.trim() === '';
        });
        if (missing.length !== 1) {
          throw { message: t('prob.err.oneEmpty') };
        }
        const emptyKey = missing[0];
        if (emptyKey === keys[0]) {
          const res = spec[2](vals);
          if (typeof res[1] === 'number' && !Number.isFinite(res[1])) {
            throw { message: t('prob.err.undefined') };
          }
          out.textContent = res[0] + ' = ' + F.fmt(res[1]) + ' ' + U(res[2]);
        } else {
          const x = H.solveInverse(spec, vals, emptyKey, putKey);
          if (!Number.isFinite(x)) {
            throw {
              message: t('prob.err.solve', { target: keys[0], key: emptyKey }),
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

    const hint = el('div', 'hint', t('prob.hint'));
    card.appendChild(hint);
    page.appendChild(card);
  }

  window.CW.pages.mountProb = mountProb;
})();
