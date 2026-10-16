/* Генератор: случайные числа, пароли, броски.
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
  const t = window.CW.i18n.t;
  const U = window.CW.i18n.unit;
  // ── Генератор ────────────────────────────────────────────
  // Все формулы «вычислительные» — без требования «ровно одно пустое».

  function randInt(min, max) {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      throw { message: t('gen.err.intMinMax') };
    }
    if (min > max) {
      throw { message: t('gen.err.minLeMax') };
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Набор символов для пароля.
  const PASSWORD_SETS = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    digit: '0123456789',
    sym: '!@#$%^&*()-_=+[]{};:,/?',
  };

  function randPassword(len, kinds) {
    const alphabet = kinds
      .map(function (k) {
        return PASSWORD_SETS[k];
      })
      .join('');
    if (!alphabet) {
      throw { message: t('gen.err.sets') };
    }
    let out = '';
    const a = alphabet;
    for (let i = 0; i < len; i++) {
      out += a.charAt(Math.floor(Math.random() * a.length));
    }
    return out;
  }

  /** @type {FormulaSpec[]} */
  const GEN_FUNCS = [
    [
      t('gen.fn.int'),
      ['N', 'min', 'max'],
      function (v) {
        return ['N', String(randInt(parseInt(v.min, 10), parseInt(v.max, 10))), ''];
      },
    ],
    [
      t('gen.fn.real'),
      ['N', 'min', 'max'],
      function (v) {
        const lo = F.toNumber(v.min);
        const hi = F.toNumber(v.max);
        if (lo >= hi) {
          throw { message: t('gen.err.minLtMax') };
        }
        return ['N', String(lo + Math.random() * (hi - lo)), ''];
      },
    ],
    [
      t('gen.fn.dice'),
      ['R', 'k', 'm'],
      function (v) {
        const k = parseInt(v.k, 10);
        const m = parseInt(v.m, 10);
        if (!Number.isInteger(k) || k < 2) {
          throw { message: t('gen.err.k') };
        }
        if (!Number.isInteger(m) || m < 1) {
          throw { message: t('gen.err.m') };
        }
        const results = [];
        for (let i = 0; i < m; i++) {
          results.push(randInt(1, k));
        }
        const sum = results.reduce(function (a, b) {
          return a + b;
        }, 0);
        return ['Σ', 'Σ=' + sum + ' [' + results.join(', ') + ']', ''];
      },
    ],
    [
      t('gen.fn.password'),
      ['P', 'len', 'sets'],
      function (v) {
        const len = parseInt(v.len, 10);
        if (!Number.isInteger(len) || len < 1) {
          throw { message: t('gen.err.len') };
        }
        if (len > 256) {
          throw { message: 'len ≤ 256' };
        }
        // sets — строка флагов: l=lower, u=upper, d=digit, s=symbol.
        const kinds = [];
        if (/l/i.test(v.sets)) {
          kinds.push('lower');
        }
        if (/u/i.test(v.sets)) {
          kinds.push('upper');
        }
        if (/d/i.test(v.sets)) {
          kinds.push('digit');
        }
        if (/s/i.test(v.sets)) {
          kinds.push('sym');
        }
        return ['P', randPassword(len, kinds), ''];
      },
    ],
  ];

  function mountGen(app) {
    const page = app.pageNodes.gen;
    page.innerHTML = '';

    const card = el('div', 'card');
    card.appendChild(el('h2', null, t('common.tab.gen')));
    const sel = el('select', 'field');
    GEN_FUNCS.forEach(function (f, i) {
      const o = el('option', null, f[0]);
      o.value = String(i);
      sel.appendChild(o);
    });
    card.appendChild(sel);

    const row = el('div', 'row');
    row.style.marginTop = '8px';
    const inputs = [];
    let maxKeys = 0;
    GEN_FUNCS.forEach(function (f) {
      if (f[1].length > maxKeys) {
        maxKeys = f[1].length;
      }
    });
    for (let i = 0; i < maxKeys; i++) {
      const f = el('input', 'field');
      f.type = 'text';
      const initKey = GEN_FUNCS[0][1][i] || t('gen.param', { n: i + 1 });
      f.placeholder = initKey;
      f.setAttribute('aria-label', initKey);
      row.appendChild(f);
      inputs.push(f);
    }
    card.appendChild(row);
    const out = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    card.appendChild(out);

    function refreshInputs() {
      const keys = GEN_FUNCS[parseInt(sel.value, 10)][1];
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
        const spec = GEN_FUNCS[parseInt(sel.value, 10)];
        const keys = spec[1];
        const vals = {};
        keys.forEach(function (k, i) {
          vals[k] = inputs[i].value;
        });
        const res = spec[2](vals);
        out.textContent = res[0] + ' = ' + res[1] + ' ' + U(res[2]);
        out.classList.remove('err');
      } catch (e) {
        out.textContent = e.message || String(e);
        out.classList.add('err');
      }
    }
    const btn = el('button', 'btn primary', t('gen.generate'));
    btn.onclick = run;
    const brow = el('div', 'row');
    brow.style.marginTop = '8px';
    brow.appendChild(btn);
    card.appendChild(brow);

    const hint = el('div', 'hint', t('gen.hint'));
    card.appendChild(hint);
    page.appendChild(card);
  }

  window.CW.pages.mountGen = mountGen;
})();
