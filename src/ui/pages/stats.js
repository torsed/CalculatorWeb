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
  }

  window.CW.pages.mountStats = mountStats;
})();
