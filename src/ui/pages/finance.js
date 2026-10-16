/* Финансы.
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
  // ── Финансы ─────────────────────────────────────────────
  // Все входы в согласованных единицах: деньги в одной валюте, время в годах,
  // ставка в долях (0.05 = 5%). Это избавляет от путаницы % vs. коэффициентов.
  /** @type {FormulaSpec[]} */
  const FIN_FUNCS = [
    [
      'finance.fn.simple',
      ['S', 'P', 'r', 't'],
      function (v) {
        // P — начальная сумма, r — ставка (0.05 = 5%), t — годы.
        return ['S', v.P * (1 + v.r * v.t), '₽'];
      },
    ],
    [
      'finance.fn.compound',
      ['S', 'P', 'r', 'n', 't'],
      function (v) {
        // n — капитализаций в год (n=12 для ежемесячной, n=1 для годовой).
        return ['S', v.P * Math.pow(1 + v.r / v.n, v.n * v.t), '₽'];
      },
    ],
    [
      'finance.fn.annuity',
      ['PMT', 'PV', 'r', 'n'],
      function (v) {
        // PV — тело кредита, r — ставка за период, n — число периодов.
        if (v.r === 0) {
          return ['PMT', v.PV / v.n, '₽'];
        }
        return ['PMT', (v.PV * v.r) / (1 - Math.pow(1 + v.r, -v.n)), '₽'];
      },
    ],
    [
      'finance.fn.fv',
      ['FV', 'PMT', 'r', 'n'],
      function (v) {
        // PMT — платёж за период, в конце периода.
        if (v.r === 0) {
          return ['FV', v.PMT * v.n, '₽'];
        }
        return ['FV', (v.PMT * (Math.pow(1 + v.r, v.n) - 1)) / v.r, '₽'];
      },
    ],
    [
      'finance.fn.real',
      ['rr', 'r', 'i'],
      function (v) {
        // r — номинальная ставка, i — инфляция (доля).
        return ['r_real', (1 + v.r) / (1 + v.i) - 1, ''];
      },
    ],
    [
      'finance.fn.bep',
      ['BEP', 'FC', 'P', 'VC'],
      function (v) {
        // FC — постоянные затраты, P — цена, VC — переменные на единицу.
        if (v.P - v.VC <= 0) {
          throw { message: t('finance.err.price') };
        }
        return ['BEP', v.FC / (v.P - v.VC), 'ед.'];
      },
    ],
    [
      'finance.fn.roi',
      ['roi', 'gain', 'cost'],
      function (v) {
        return ['ROI', ((v.gain - v.cost) / v.cost) * 100, '%'];
      },
    ],
    [
      'finance.fn.cagr',
      ['r', 'fv', 'n'],
      function (v) {
        // PV фиксируется 1 (нормировка).
        return ['r', Math.pow(v.fv / 1, 1 / v.n) - 1, ''];
      },
    ],
    [
      'finance.fn.div',
      ['y', 'D', 'P'],
      function (v) {
        return ['y', (v.D / v.P) * 100, '%'];
      },
    ],
    [
      'finance.fn.margin',
      ['r', 'NP', 'rev'],
      function (v) {
        return ['r', (v.NP / v.rev) * 100, '%'];
      },
    ],
  ];

  function mountFinance(app) {
    const page = app.pageNodes.finance;
    page.innerHTML = '';

    const card = el('div', 'card');
    card.appendChild(el('h2', null, t('finance.title')));
    const sel = el('select', 'field');
    FIN_FUNCS.forEach(function (f, i) {
      const o = el('option', null, t(f[0]));
      o.value = String(i);
      sel.appendChild(o);
    });
    card.appendChild(sel);

    const row = el('div', 'row');
    row.style.marginTop = '8px';
    const inputs = [];
    // Самая «длинная» — сложные проценты с 5 ключами.
    let maxKeys = 0;
    FIN_FUNCS.forEach(function (f) {
      if (f[1].length > maxKeys) {
        maxKeys = f[1].length;
      }
    });
    for (let i = 0; i < maxKeys; i++) {
      const f = el('input', 'field');
      f.type = 'text';
      f.inputMode = 'decimal';
      const initKey = FIN_FUNCS[0][1][i] || t('finance.param', { n: i + 1 });
      f.placeholder = initKey;
      f.setAttribute('aria-label', initKey);
      row.appendChild(f);
      inputs.push(f);
    }
    card.appendChild(row);
    const out = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    card.appendChild(out);

    function refreshInputs() {
      const keys = FIN_FUNCS[parseInt(sel.value, 10)][1];
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
        const spec = FIN_FUNCS[parseInt(sel.value, 10)];
        const keys = spec[1];
        const vals = {};
        keys.forEach(function (k, i) {
          vals[k] = F.toNumber(inputs[i].value);
        });
        const missing = keys.filter(function (k) {
          return inputs[keys.indexOf(k)].value.trim() === '';
        });
        if (missing.length !== 1) {
          throw { message: t('finance.err.oneEmpty') };
        }
        const emptyKey = missing[0];
        if (emptyKey === keys[0]) {
          const res = spec[2](vals);
          if (typeof res[1] === 'number' && !Number.isFinite(res[1])) {
            throw { message: t('finance.err.undefined') };
          }
          out.textContent = res[0] + ' = ' + F.fmt(res[1]) + ' ' + U(res[2]);
        } else {
          const x = H.solveInverse(spec, vals, emptyKey);
          if (!Number.isFinite(x)) {
            throw {
              message: t('finance.err.solve', { fn: keys[0], target: emptyKey }),
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

    const hint = el('div', 'hint', t('finance.hint'));
    card.appendChild(hint);
    page.appendChild(card);
  }

  window.CW.pages.mountFinance = mountFinance;
})();
