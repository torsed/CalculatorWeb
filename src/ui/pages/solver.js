/* Решатель уравнений.
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
  // ── Решатель ─────────────────────────────────────────────
  function mountSolver(app) {
    const page = app.pageNodes.solver;
    page.innerHTML = '';
    const SV = window.CW.solver;
    const Poly = window.CW.poly;

    const card = el('div', 'card');
    card.appendChild(el('h2', null, t('solver.title')));
    const input = el('input', 'field');
    input.type = 'text';
    input.value = 'x^2 - 4';
    input.placeholder = t('solver.placeholder');

    // Mode toggle: numeric / symbolic
    const modeRow = el('div', 'row');
    modeRow.style.marginTop = '8px';
    modeRow.style.marginBottom = '8px';
    const symbolicLabel = el('label', 'check-row');
    const symbolicCheckbox = el('input');
    symbolicCheckbox.type = 'checkbox';
    symbolicCheckbox.id = 'solver-symbolic';
    symbolicLabel.appendChild(symbolicCheckbox);
    symbolicLabel.appendChild(document.createTextNode(t('solver.symbolic')));
    modeRow.appendChild(symbolicLabel);
    card.appendChild(modeRow);

    const row = el('div', 'row');
    const btn = el('button', 'btn primary', t('solver.findRoots'));
    row.appendChild(btn);
    card.appendChild(input);
    card.appendChild(row);

    const row2 = el('div', 'row');
    row2.style.marginTop = '8px';
    const inputs = [];
    [t('solver.from'), t('solver.to'), t('solver.samples')].forEach(function (lbl, i) {
      const l = el('span', null, lbl);
      l.style.color = 'var(--sub)';
      l.style.fontSize = '12px';
      const f = el('input', 'field');
      f.type = 'text';
      f.style.flex = '0 1 90px';
      f.value = ['-100', '100', '1000'][i];
      f.setAttribute('aria-label', lbl);
      row2.appendChild(l);
      row2.appendChild(f);
      if (i === 0) {
        inputs[0] = f;
      }
      if (i === 1) {
        inputs[1] = f;
      }
      if (i === 2) {
        inputs[2] = f;
      }
    }, this);
    card.appendChild(row2);

    const out = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    card.appendChild(out);
    card.appendChild(el('div', 'hint', t('solver.hint')));

    function numericResult() {
      const res = SV.solve(
        input.value,
        window.CW.appInstance && window.CW.appInstance.calcView && window.CW.appInstance.calcView.st
          ? window.CW.appInstance.calcView.st.deg
          : true,
        parseFloat(inputs[0].value),
        parseFloat(inputs[1].value),
        parseInt(inputs[2].value, 10)
      );
      const text = res.roots.length
        ? res.roots
            .map(function (r, i) {
              return 'x' + (i + 1) + ' = ' + F.fmt(r, 10);
            })
            .join('\n')
        : res.note || t('solver.notFound');
      return text + '\n\n' + (res.note || '');
    }

    // Возвращает текст с корнями полинома или null, если выражение не полином
    // (тогда решаем численно). Работает для любой степени.
    function symbolicResult() {
      let expr = input.value.trim();
      if (!expr) {
        return null;
      }
      const eq = expr.split('=');
      if (eq.length === 2) {
        // f(x) = g(x)  →  f(x) − g(x) = 0
        expr = '(' + eq[0] + ') - (' + eq[1] + ')';
      } else if (eq.length > 2) {
        throw new Error(t('solver.err.equals'));
      }
      const coeffs = Poly.coeffs(expr);
      if (!coeffs || coeffs.length < 2) {
        return null; // не полином (sin, log, ...) — решим численно
      }
      const roots = Poly.roots(coeffs);
      if (!roots.length) {
        return null;
      }
      return roots
        .map(function (r, i) {
          return 'x' + (i + 1) + ' = ' + F.fmtComplex(r, 10);
        })
        .join('\n');
    }

    function run() {
      const useSymbolic = symbolicCheckbox.checked;
      try {
        if (useSymbolic) {
          const exact = symbolicResult();
          if (exact !== null) {
            out.textContent = exact;
          } else {
            out.textContent = numericResult() + '\n' + t('solver.symbolicNone');
          }
          out.classList.remove('err');
        } else {
          out.textContent = numericResult();
          out.classList.remove('err');
        }
      } catch (e) {
        out.textContent = e.message || String(e);
        out.classList.add('err');
      }
    }
    btn.onclick = run;
    input.onkeydown = function (ev) {
      if (ev.key === 'Enter') {
        run();
      }
    };
    page.appendChild(card);

    const chips = el('div', 'chips');
    [
      'x^2 - 4',
      'x^3 - 6x^2 + 11x - 6',
      'sin(x)*5',
      'x^2 + 1',
      'log(x) - 1',
      'x^4 - 5x^2 + 4',
    ].forEach(function (s) {
      const c = el('button', 'chip', s);
      c.onclick = function () {
        input.value = s;
        run();
      };
      chips.appendChild(c);
    });
    page.appendChild(chips);
  }

  window.CW.pages.mountSolver = mountSolver;
})();
