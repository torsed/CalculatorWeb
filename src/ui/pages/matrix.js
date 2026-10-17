/* Матрицы.
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
  // ── Матрицы ──────────────────────────────────────────────
  function mountMatrix(app) {
    const page = app.pageNodes.matrix;
    page.innerHTML = '';
    const M = window.CW.matrix;

    const card = el('div', 'card');
    card.appendChild(el('h2', null, t('common.tab.matrix')));
    const a = el('textarea', 'field');
    a.value = '1 2\n3 4';
    a.placeholder = t('matrix.placeholderA');
    const b = el('textarea', 'field');
    b.value = '5 6\n7 8';
    b.placeholder = t('matrix.placeholderB');
    const row = el('div', 'row');
    row.style.marginTop = '8px';
    const sel = el('select', 'field');
    [
      [t('matrix.op.add'), 'add'],
      [t('matrix.op.sub'), 'sub'],
      [t('matrix.op.mul'), 'mul'],
      [t('matrix.op.transpose'), 'transpose'],
      [t('matrix.op.det'), 'det'],
      [t('matrix.op.rank'), 'rank'],
      [t('matrix.op.inv'), 'inv'],
      [t('matrix.op.solve'), 'solve'],
      [t('matrix.op.eig'), 'eig'],
      [t('matrix.op.scale'), 'scale'],
      [t('matrix.op.trace'), 'trace'],
      [t('matrix.op.norm'), 'norm'],
      [t('matrix.op.power'), 'power'],
      [t('matrix.op.rref'), 'rref'],
      [t('matrix.op.lu'), 'lu'],
      [t('matrix.op.qr'), 'qr'],
    ].forEach(function (p) {
      const o = el('option', null, p[0]);
      o.value = p[1];
      sel.appendChild(o);
    });
    const powerInput = el('input', 'field');
    powerInput.type = 'text';
    powerInput.value = '2';
    powerInput.style.display = 'none';
    powerInput.style.flex = '0 1 70px';
    powerInput.setAttribute('aria-label', t('matrix.op.power'));
    powerInput.placeholder = 'n';
    const btn = el('button', 'btn primary', t('common.calculate'));
    const out = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    row.appendChild(sel);
    row.appendChild(powerInput);
    row.appendChild(btn);
    card.appendChild(a);
    card.appendChild(el('div', 'hint', t('matrix.hintB')));
    card.appendChild(b);
    card.appendChild(row);
    card.appendChild(out);

    sel.onchange = function () {
      powerInput.style.display = sel.value === 'power' ? '' : 'none';
    };

    btn.onclick = function () {
      try {
        const ma = M.parse(a.value);
        const s = sel.value;
        let text;
        if (s === 'transpose') {
          text = M.format(M.transpose(ma));
        } else if (s === 'det') {
          text = F.fmt(M.det(ma));
        } else if (s === 'rank') {
          text = String(M.rank(ma));
        } else if (s === 'inv') {
          text = M.format(M.inverse(ma));
        } else if (s === 'eig') {
          const vals = M.eigenvalues(ma);
          if (vals.length === 0) {
            text = t('matrix.eig.none');
          } else {
            text = vals
              .map(function (v) {
                if (typeof v === 'number') {
                  return 'λ = ' + F.fmt(v);
                }
                const im = Math.abs(v.im);
                return 'λ = ' + F.fmt(v.re) + (v.im < 0 ? ' − ' : ' + ') + F.fmt(im) + 'i';
              })
              .join('\n');
          }
        } else if (s === 'solve') {
          const mb = M.parse(b.value);
          const flat = mb.map(function (r) {
            return r.length === 1 ? r[0] : r;
          });
          const vec = flat.length === 1 ? [].concat(flat[0]) : flat;
          const x = M.solve(ma, vec);
          text =
            'x =\n' +
            x
              .map(function (v, i) {
                return 'x' + (i + 1) + ' = ' + F.fmt(v);
              })
              .join('\n');
        } else if (s === 'scale') {
          text = M.format(
            ma.map(function (r) {
              return r.map(function (x) {
                return x * 10;
              });
            })
          );
        } else if (s === 'trace') {
          text = F.fmt(M.trace(ma));
        } else if (s === 'norm') {
          text = F.fmt(M.normFro(ma));
        } else if (s === 'power') {
          text = M.format(M.power(ma, parseInt(powerInput.value, 10)));
        } else if (s === 'rref') {
          const r = M.rref(ma);
          text = 'RREF:\n' + M.format(r.rref) + '\n\n' + t('matrix.rankLabel', { n: r.rank });
        } else if (s === 'lu') {
          const d = M.lu(ma);
          text = 'L:\n' + M.format(d.L) + '\n\nU:\n' + M.format(d.U) + '\n\nP:\n' + M.format(d.P);
        } else if (s === 'qr') {
          const d = M.qr(ma);
          text = 'Q:\n' + M.format(d.Q) + '\n\nR:\n' + M.format(d.R);
        } else {
          const mb = M.parse(b.value);
          text = M.format(
            s === 'add' ? M.add(ma, mb) : s === 'sub' ? M.sub(ma, mb) : M.mul(ma, mb)
          );
        }
        out.textContent = text;
        out.classList.remove('err');
      } catch (e) {
        out.textContent = e.message || String(e);
        out.classList.add('err');
      }
    };
    page.appendChild(card);
    page.appendChild(el('div', 'hint', t('matrix.hint')));
  }

  window.CW.pages.mountMatrix = mountMatrix;
})();
