/* Статистика.
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
  // ── Статистика ───────────────────────────────────────────
  const STAT_LABELS = {
    count: t('stats.count'),
    sum: t('stats.sum'),
    mean: t('stats.mean'),
    median: t('stats.median'),
    modes: t('stats.modes'),
    min: t('stats.min'),
    max: t('stats.max'),
    range: t('stats.range'),
    variance_sample: t('stats.varianceSample'),
    stdev_sample: t('stats.stdevSample'),
    variance_population: t('stats.variancePopulation'),
    stdev_population: t('stats.stdevPopulation'),
    q1: 'Q1',
    q2: t('stats.q2'),
    q3: 'Q3',
    iqr: 'IQR',
    geometric_mean: t('stats.geometricMean'),
    harmonic_mean: t('stats.harmonicMean'),
  };

  function mountStats(app) {
    const page = app.pageNodes.stats;
    page.innerHTML = '';
    const S = window.CW.stats;

    const card = el('div', 'card');
    card.appendChild(el('h2', null, t('stats.title')));
    const ta = el('textarea', 'field');
    ta.id = 'stats-data';
    ta.placeholder = t('stats.placeholder');
    const taLabel = el('label', 'label-hint', t('stats.label'));
    taLabel.setAttribute('for', 'stats-data');
    taLabel.style.cssText = 'display:block;font-size:12px;color:var(--sub);margin-bottom:4px;';
    const row = el('div', 'row');
    row.style.marginTop = '8px';
    const btn = el('button', 'btn primary', t('stats.calc'));
    const out = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    row.appendChild(btn);
    card.appendChild(taLabel);
    card.appendChild(ta);
    card.appendChild(row);
    card.appendChild(out);
    card.appendChild(el('div', 'hint', t('stats.undefinedHint')));

    function run() {
      try {
        const values = S.parseNumbers(ta.value);
        const d = S.describe(values);
        const lines = Object.keys(STAT_LABELS).map(function (k) {
          const v = d[k];
          const text =
            v === null || v === undefined
              ? '—'
              : Array.isArray(v)
                ? v.length
                  ? v.join(', ')
                  : '—'
                : F.fmt(v, 10);
          return (STAT_LABELS[k] + ':').padEnd(20) + text;
        });
        out.textContent = lines.join('\n');
        out.classList.remove('err');
      } catch (e) {
        out.textContent = e.message || String(e);
        out.classList.add('err');
      }
    }
    btn.onclick = run;
    ta.onkeydown = function (ev) {
      if (ev.key === 'Enter') {
        run();
      }
    };
    page.appendChild(card);

    const samples = el('div', 'card');
    samples.appendChild(el('h2', null, t('stats.samples')));
    const chips = el('div', 'chips');
    [
      '1, 2, 3, 4, 5',
      '2, 4, 4, 4, 5, 5, 7, 9',
      '1.5, 2.7, 3.1, 4.8, 5.9, 6.2, 7.1',
      '10, -20, 30, -40, 50',
      '0.1, 0.2, 0.3',
    ].forEach(function (s) {
      const c = el('button', 'chip', s);
      c.onclick = function () {
        ta.value = s;
        run();
      };
      chips.appendChild(c);
    });
    samples.appendChild(chips);
    page.appendChild(samples);

    // ── Регрессия и корреляция ──────────────────────────────
    const regCard = el('div', 'card');
    regCard.appendChild(el('h2', null, t('stats.regressTitle')));
    regCard.appendChild(el('div', 'label-hint', t('stats.pairsLabel')));
    const pairs = el('textarea', 'field');
    pairs.value = '1 2\n2 5\n3 7\n4 11';
    pairs.placeholder = t('stats.pairsPlaceholder');
    pairs.setAttribute('aria-label', t('stats.pairsLabel'));
    regCard.appendChild(pairs);
    const degRow = el('div', 'row');
    degRow.style.marginTop = '8px';
    const degSel = el('select', 'field');
    [
      ['stats.deg1', '1'],
      ['stats.deg2', '2'],
      ['stats.deg3', '3'],
    ].forEach(function (p) {
      const o = el('option', null, t(p[0]));
      o.value = p[1];
      degSel.appendChild(o);
    });
    degSel.setAttribute('aria-label', t('stats.degree'));
    degRow.appendChild(degSel);
    const regBtn = el('button', 'btn primary', t('common.calculate'));
    degRow.appendChild(regBtn);
    regCard.appendChild(degRow);
    const regOut = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    regCard.appendChild(regOut);
    regCard.appendChild(el('div', 'hint', t('stats.regressHint')));

    regBtn.onclick = function () {
      regOut.classList.remove('err');
      try {
        const cols = S.parseColumns(pairs.value);
        const lines = [];
        const p = S.pearson(cols.xs, cols.ys);
        const sp = S.spearman(cols.xs, cols.ys);
        lines.push(t('stats.corrPearson') + ': ' + (p === null ? '—' : F.fmt(p, 6)));
        lines.push(t('stats.corrSpearman') + ': ' + (sp === null ? '—' : F.fmt(sp, 6)));
        const reg = S.linearRegression(cols.xs, cols.ys);
        lines.push(t('stats.slope') + ': ' + F.fmt(reg.slope, 6));
        lines.push(t('stats.intercept') + ': ' + F.fmt(reg.intercept, 6));
        lines.push(t('stats.r2') + ': ' + F.fmt(reg.r2, 6));
        const d = parseInt(degSel.value, 10);
        if (d > 1) {
          const poly = S.polyRegression(cols.xs, cols.ys, d);
          lines.push(
            t('stats.polyCoeffs') +
              ': ' +
              poly.coeff
                .map(function (c) {
                  return F.fmt(c, 6);
                })
                .join(', ')
          );
          lines.push(t('stats.r2') + ': ' + F.fmt(poly.r2, 6));
        }
        regOut.textContent = lines.join('\n');
      } catch (e) {
        regOut.textContent = e.message || String(e);
        regOut.classList.add('err');
      }
    };
    page.appendChild(regCard);

    // ── Проверки гипотез ────────────────────────────────────
    const testCard = el('div', 'card');
    testCard.appendChild(el('h2', null, t('stats.testsTitle')));
    const testSel = el('select', 'field');
    [
      ['stats.test.t1', 't1'],
      ['stats.test.t2', 't2'],
      ['stats.test.ci', 'ci'],
      ['stats.test.chi2', 'chi2'],
    ].forEach(function (p) {
      const o = el('option', null, t(p[0]));
      o.value = p[1];
      testSel.appendChild(o);
    });
    testSel.setAttribute('aria-label', t('stats.test'));
    testCard.appendChild(testSel);

    const data1 = el('textarea', 'field');
    data1.value = '5.1, 4.9, 5.0, 5.2, 4.8';
    data1.setAttribute('aria-label', t('stats.data1'));
    data1.style.marginTop = '8px';
    const data2 = el('textarea', 'field');
    data2.value = '4.1, 4.0, 4.3, 3.9';
    data2.setAttribute('aria-label', t('stats.data2'));
    data2.style.marginTop = '8px';
    const param = el('input', 'field');
    param.type = 'text';
    param.value = '5';
    param.style.marginTop = '8px';
    testCard.appendChild(el('div', 'label-hint', t('stats.data1')));
    testCard.appendChild(data1);
    const data2Label = el('div', 'label-hint', t('stats.data2'));
    testCard.appendChild(data2Label);
    testCard.appendChild(data2);
    testCard.appendChild(param);
    const testOut = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    testCard.appendChild(testOut);
    const testRow = el('div', 'row');
    testRow.style.marginTop = '8px';
    const testBtn = el('button', 'btn primary', t('common.calculate'));
    testRow.appendChild(testBtn);
    testCard.appendChild(testRow);
    testCard.appendChild(el('div', 'hint', t('stats.testsHint')));

    function syncTest() {
      const kind = testSel.value;
      const showSecond = kind === 't2' || kind === 'chi2';
      data2.style.display = showSecond ? '' : 'none';
      data2Label.style.display = showSecond ? '' : 'none';
      param.style.display = kind === 't1' || kind === 'ci' ? '' : 'none';
      if (kind === 't1') {
        param.setAttribute('aria-label', t('stats.mu0'));
        param.placeholder = t('stats.mu0');
        data1.value = data1.value || '5.1, 4.9, 5.0, 5.2, 4.8';
      } else if (kind === 'ci') {
        param.setAttribute('aria-label', t('stats.level'));
        param.placeholder = t('stats.level');
        if (param.value === '5') {
          param.value = '0.95';
        }
      }
    }
    testSel.onchange = syncTest;
    syncTest();

    testBtn.onclick = function () {
      testOut.classList.remove('err');
      try {
        const kind = testSel.value;
        const lines = [];
        if (kind === 't1') {
          const values = S.parseNumbers(data1.value);
          const r = S.tTestOne(values, F.toNumber(param.value));
          lines.push(t('stats.stat.t') + ': ' + F.fmt(r.t, 6));
          lines.push(t('stats.stat.df') + ': ' + r.df);
          lines.push(t('stats.stat.p') + ': ' + F.fmt(r.p, 6));
        } else if (kind === 't2') {
          const a = S.parseNumbers(data1.value);
          const b = S.parseNumbers(data2.value);
          const r = S.tTestTwo(a, b);
          lines.push(t('stats.stat.t') + ': ' + F.fmt(r.t, 6));
          lines.push(t('stats.stat.df') + ': ' + F.fmt(r.df, 4));
          lines.push(t('stats.stat.p') + ': ' + F.fmt(r.p, 6));
        } else if (kind === 'ci') {
          const values = S.parseNumbers(data1.value);
          const r = S.confidenceIntervalMean(values, F.toNumber(param.value));
          lines.push(t('stats.stat.mean') + ': ' + F.fmt(r.mean, 6));
          lines.push(t('stats.stat.se') + ': ' + F.fmt(r.se, 6));
          lines.push(t('stats.stat.ci') + ': [' + F.fmt(r.low, 6) + '; ' + F.fmt(r.high, 6) + ']');
        } else if (kind === 'chi2') {
          const obs = S.parseNumbers(data1.value);
          const exp = S.parseNumbers(data2.value);
          const r = S.chiSquareGoodness(obs, exp);
          lines.push(t('stats.stat.chi2') + ': ' + F.fmt(r.chi2, 6));
          lines.push(t('stats.stat.df') + ': ' + r.df);
          lines.push(t('stats.stat.p') + ': ' + (r.p === null ? '—' : F.fmt(r.p, 6)));
        }
        testOut.textContent = lines.join('\n');
      } catch (e) {
        testOut.textContent = e.message || String(e);
        testOut.classList.add('err');
      }
    };
    page.appendChild(testCard);
  }

  window.CW.pages.mountStats = mountStats;
})();
