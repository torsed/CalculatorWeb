/* Математический анализ.
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
  // ── Анализ ───────────────────────────────────────────────
  const OPS = [
    ['analysis.op.deriv', 'deriv'],
    ['analysis.op.deriv2', 'deriv2'],
    ['analysis.op.tangent', 'tangent'],
    ['analysis.op.integral', 'integral'],
    ['analysis.op.limit', 'limit'],
    ['analysis.op.sum', 'sum'],
    ['analysis.op.product', 'product'],
    ['analysis.op.extrema', 'extrema'],
  ];

  function mountAnalysis(app) {
    const page = app.pageNodes.analysis;
    page.innerHTML = '';
    const A = window.CW.analysis;

    const card = el('div', 'card');
    card.appendChild(el('h2', null, t('common.tab.analysis')));

    const sel = el('select', 'field');
    OPS.forEach(function (p, i) {
      const o = el('option', null, t(p[0]));
      o.value = String(i);
      sel.appendChild(o);
    });
    sel.setAttribute('aria-label', t('analysis.formula'));
    card.appendChild(sel);

    const expr = el('input', 'field');
    expr.type = 'text';
    expr.value = 'x^2';
    expr.placeholder = t('analysis.expr');
    expr.setAttribute('aria-label', t('analysis.expr'));
    expr.style.marginTop = '8px';
    card.appendChild(expr);

    const row = el('div', 'row');
    row.style.marginTop = '8px';
    const a = el('input', 'field');
    a.type = 'text';
    a.value = '2';
    a.setAttribute('aria-label', t('analysis.x0'));
    const b = el('input', 'field');
    b.type = 'text';
    b.value = '3';
    b.setAttribute('aria-label', t('analysis.to'));
    row.appendChild(a);
    row.appendChild(b);
    card.appendChild(row);

    const degRow = el('label', 'row');
    degRow.style.marginTop = '8px';
    degRow.style.alignItems = 'center';
    const deg = el('input');
    deg.type = 'checkbox';
    degRow.appendChild(deg);
    degRow.appendChild(el('span', null, t('analysis.deg')));
    card.appendChild(degRow);

    const out = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    card.appendChild(out);

    function labels() {
      const op = OPS[parseInt(sel.value, 10)][1];
      if (op === 'deriv' || op === 'deriv2' || op === 'limit') {
        a.placeholder = t('analysis.x0');
        a.setAttribute('aria-label', t('analysis.x0'));
        a.style.display = '';
        b.style.display = 'none';
      } else if (op === 'integral' || op === 'extrema' || op === 'sum' || op === 'product') {
        a.placeholder = t('analysis.from');
        a.setAttribute('aria-label', t('analysis.from'));
        b.placeholder = t('analysis.to');
        b.setAttribute('aria-label', t('analysis.to'));
        a.style.display = '';
        b.style.display = '';
      } else {
        // tangent — только точка.
        a.placeholder = t('analysis.x0');
        a.setAttribute('aria-label', t('analysis.x0'));
        a.style.display = '';
        b.style.display = 'none';
      }
    }
    sel.onchange = labels;
    labels();

    function num(inp, name) {
      const v = F.toNumber(inp.value);
      if (!Number.isFinite(v)) {
        throw new Error(t('analysis.err.number') + (name ? ' (' + name + ')' : ''));
      }
      return v;
    }

    function run() {
      out.classList.remove('err');
      try {
        const op = OPS[parseInt(sel.value, 10)][1];
        const e = expr.value.trim();
        if (!e) {
          throw new Error(t('common.enterExpression') || t('analysis.expr'));
        }
        const degFlag = deg.checked;
        let text;
        if (op === 'deriv' || op === 'deriv2') {
          const x0 = num(a, 'x₀');
          const v = A.derivativeAt(e, x0, op === 'deriv2' ? 2 : 1, degFlag);
          text = t(op === 'deriv2' ? 'analysis.result.deriv2' : 'analysis.result.deriv', {
            x0: F.fmt(x0),
            v: F.fmt(v, 10),
          });
        } else if (op === 'tangent') {
          const x0 = num(a, 'x₀');
          const tg = A.tangent(e, x0, degFlag);
          text = t('analysis.result.tangent', {
            m: F.fmt(tg.m, 10),
            sign: tg.b < 0 ? '−' : '+',
            b: F.fmt(Math.abs(tg.b), 10),
          });
        } else if (op === 'integral') {
          const lo = num(a, t('analysis.from'));
          const hi = num(b, t('analysis.to'));
          const v = A.integralOf(e, lo, hi, 2000, degFlag);
          text = t('analysis.result.integral', { a: F.fmt(lo), b: F.fmt(hi), v: F.fmt(v, 10) });
        } else if (op === 'limit') {
          const x0 = num(a, 'x₀');
          const r = A.limitOf(e, x0, '', degFlag);
          text = r.diverge
            ? t('analysis.noLimit')
            : t('analysis.result.limit', { x0: F.fmt(x0), v: F.fmt(r.value, 10) });
        } else if (op === 'sum' || op === 'product') {
          const lo = num(a, t('analysis.from'));
          const hi = num(b, t('analysis.to'));
          const v = A.sumProduct(e, lo, hi, op === 'product' ? 'product' : 'sum', degFlag);
          text = t(op === 'product' ? 'analysis.result.product' : 'analysis.result.sum', {
            a: Math.round(lo),
            b: Math.round(hi),
            v: F.fmt(v, 10),
          });
        } else if (op === 'extrema') {
          const lo = num(a, t('analysis.from'));
          const hi = num(b, t('analysis.to'));
          const list = A.extrema(e, lo, hi, 600, degFlag);
          const lines = [t('analysis.result.extrema', { a: F.fmt(lo), b: F.fmt(hi) })];
          if (!list.length) {
            lines.push('  ' + t('analysis.none'));
          } else {
            list.forEach(function (p) {
              lines.push(
                '  ' +
                  t('analysis.extreme', {
                    kind: t(p.kind === 'min' ? 'analysis.min' : 'analysis.max'),
                    x: F.fmt(p.x, 6),
                    y: F.fmt(p.y, 6),
                  })
              );
            });
          }
          text = lines.join('\n');
        }
        out.textContent = text;
      } catch (err) {
        out.textContent = err.message || String(err);
        out.classList.add('err');
      }
    }

    const brow = el('div', 'row');
    brow.style.marginTop = '8px';
    const btn = el('button', 'btn primary', t('common.calculate'));
    btn.onclick = run;
    brow.appendChild(btn);
    card.appendChild(brow);
    card.appendChild(el('div', 'hint', t('analysis.hint')));

    page.appendChild(card);
  }

  window.CW.pages.mountAnalysis = mountAnalysis;
})();
