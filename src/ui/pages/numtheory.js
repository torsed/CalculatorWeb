/* Теория чисел.
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
  const el = window.CW.pages._helpers.el;
  const t = window.CW.i18n.t;
  // ── Теория чисел ─────────────────────────────────────────
  function mountNumTheory(app) {
    const page = app.pageNodes.numth;
    page.innerHTML = '';
    const NT = window.CW.numtheory;

    const card = el('div', 'card');
    card.appendChild(el('h2', null, t('numtheory.title')));
    const row = el('div', 'row');
    const input = el('input', 'field');
    input.type = 'text';
    input.value = '360';
    input.setAttribute('aria-label', t('numtheory.numberAria'));
    const sel = el('select', 'field');
    [
      [t('numtheory.mode.prime'), 'prime'],
      [t('numtheory.mode.next'), 'next'],
      [t('numtheory.mode.factor'), 'factor'],
      ['φ(n)', 'phi'],
      [t('numtheory.mode.primes'), 'primes'],
      [t('numtheory.mode.bits'), 'bits'],
      [t('numtheory.mode.mobius'), 'mobius'],
      [t('numtheory.mode.pi'), 'pi'],
      [t('numtheory.mode.divcount'), 'divcount'],
      [t('numtheory.mode.divsum'), 'divsum'],
      [t('numtheory.mode.cf'), 'cf'],
      [t('numtheory.mode.crt'), 'crt'],
      [t('numtheory.mode.rsa'), 'rsa'],
    ].forEach(function (p) {
      const o = el('option', null, p[0]);
      o.value = p[1];
      sel.appendChild(o);
    });
    const btn = el('button', 'btn primary', '→');
    const out = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    row.appendChild(input);
    row.appendChild(sel);
    row.appendChild(btn);
    card.appendChild(row);
    card.appendChild(out);

    btn.onclick = function () {
      try {
        const raw = input.value.trim();
        const mode = sel.value;
        if (mode === 'crt') {
          const pairs = raw.split(';').map(function (part) {
            const kv = part.split(',').map(function (s) {
              return parseInt(s.trim(), 10);
            });
            return kv;
          });
          const r = NT.crt(pairs);
          out.textContent = 'x ≡ ' + r.x + '  (mod ' + r.mod + ')';
          out.classList.remove('err');
          return;
        }
        if (mode === 'rsa') {
          const parts = raw.split(',').map(function (s) {
            return parseInt(s.trim(), 10);
          });
          if (parts.length < 2) {
            throw { message: t('numtheory.err.integer') };
          }
          const r = NT.rsa(parts[0], parts[1], parts[2]);
          out.textContent = 'n = ' + r.n + '\nφ(n) = ' + r.phi + '\ne = ' + r.e + '\nd = ' + r.d;
          out.classList.remove('err');
          return;
        }
        const n = Number(raw);
        if (raw === '' || isNaN(n)) {
          throw { message: t('numtheory.err.integer') };
        }
        if (mode === 'prime') {
          out.textContent = NT.isPrime(n) ? t('numtheory.yes') : t('numtheory.no');
        } else if (mode === 'next') {
          out.textContent = String(NT.nextPrime(n));
        } else if (mode === 'factor') {
          out.textContent = NT.factorString(n);
        } else if (mode === 'phi') {
          out.textContent = String(NT.totient(n));
        } else if (mode === 'primes') {
          const ps = NT.primesBelow(n);
          out.textContent = ps.length ? ps.join(', ') : t('numtheory.nonePrimes', { n: n });
        } else if (mode === 'mobius') {
          out.textContent = 'μ(' + n + ') = ' + NT.mobius(n);
        } else if (mode === 'pi') {
          out.textContent = 'π(' + n + ') = ' + NT.primePi(n);
        } else if (mode === 'divcount') {
          out.textContent = 'd(' + n + ') = ' + NT.divisorCount(n);
        } else if (mode === 'divsum') {
          out.textContent = 'σ(' + n + ') = ' + NT.sumDivisors(n);
        } else if (mode === 'cf') {
          const cf = NT.continuedFraction(n, 24);
          const conv = NT.convergents(cf);
          out.textContent =
            '[' +
            cf[0] +
            '; ' +
            cf.slice(1).join(', ') +
            ']\n' +
            t('numtheory.cfConvergents') +
            ': ' +
            conv
              .slice(-4)
              .map(function (p) {
                return p[0] + '/' + p[1];
              })
              .join(', ');
        } else {
          out.textContent = String(NT.digitCount(n, 16));
        }
        out.classList.remove('err');
      } catch (e) {
        out.textContent = e.message || String(e);
        out.classList.add('err');
      }
    };
    input.onkeydown = function (ev) {
      if (ev.key === 'Enter') {
        btn.click();
      }
    };
    page.appendChild(card);

    const fnCard = el('div', 'card');
    fnCard.appendChild(el('h2', null, t('numtheory.inExprTitle')));
    fnCard.appendChild(el('div', 'hint', t('numtheory.inExprHint')));
    page.appendChild(fnCard);

    // ── Константы (справочник) ──────────────────────────────
    const consts = [
      ['π', '3.14159265358979', t('numtheory.const.math')],
      ['e', '2.71828182845904', t('numtheory.const.e')],
      ['γ', '0.57721566490153', t('numtheory.const.eulerMascheroni')],
      ['φ', '1.61803398874989', t('numtheory.const.golden')],
      ['c', '299 792 458 ' + t('numtheory.unit.mps'), t('numtheory.const.c')],
      ['h', '6.62607015e-34 ' + t('numtheory.unit.Js'), t('numtheory.const.h')],
      ['ℏ', '1.054571817e-34 ' + t('numtheory.unit.Js'), t('numtheory.const.hbar')],
      ['G', '6.67430e-11 ' + t('numtheory.unit.Nm2kg2'), t('numtheory.const.G')],
      ['N_A', '6.02214076e23 ' + t('numtheory.unit.molInv'), t('numtheory.const.NA')],
      ['k_B', '1.380649e-23 ' + t('numtheory.unit.JK'), t('numtheory.const.kB')],
      ['R', '8.314462618 ' + t('numtheory.unit.JmolK'), t('numtheory.const.R')],
      ['F', '96 485.33212 ' + t('numtheory.unit.Cmol'), t('numtheory.const.F')],
      ['ε_0', '8.8541878128e-12 ' + t('numtheory.unit.Fm'), t('numtheory.const.eps0')],
      ['m_e', '9.1093837015e-31 ' + t('numtheory.unit.kg'), t('numtheory.const.me')],
      ['m_p', '1.67262192369e-27 ' + t('numtheory.unit.kg'), t('numtheory.const.mp')],
      ['gₙ', '9.80665 ' + t('numtheory.unit.mps2'), t('numtheory.const.gn')],
      ['p_atm', '101 325 ' + t('numtheory.unit.Pa'), t('numtheory.const.patm')],
    ];
    const constsCard = el('div', 'card');
    constsCard.style.marginTop = '10px';
    constsCard.appendChild(el('h2', null, t('numtheory.constsTitle')));
    const constsTable = el('table');
    constsTable.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';
    const head = el('tr');
    [t('numtheory.col.symbol'), t('common.value'), t('numtheory.col.what')].forEach(function (h) {
      const c = el('th', null, h);
      c.style.cssText =
        'text-align:left;padding:4px 6px;border-bottom:1px solid var(--line);color:var(--sub);font-weight:normal;';
      head.appendChild(c);
    });
    constsTable.appendChild(head);
    consts.forEach(function (row) {
      const tr = el('tr');
      row.forEach(function (cell, i) {
        const td = el('td', null, cell);
        td.style.cssText =
          'padding:4px 6px;border-bottom:1px solid var(--line);' +
          (i === 0
            ? 'font-family:ui-monospace,Consolas,monospace;'
            : i === 1
              ? 'font-family:ui-monospace,Consolas,monospace;color:var(--sub);'
              : '');
        tr.appendChild(td);
      });
      constsTable.appendChild(tr);
    });
    constsCard.appendChild(constsTable);
    page.appendChild(constsCard);
  }

  window.CW.pages.mountNumTheory = mountNumTheory;
})();
