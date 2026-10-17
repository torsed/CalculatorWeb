/* Дата и время.
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
  // ── Дата и время ─────────────────────────────────────────
  const OPS = [
    ['date.op.diff', 'diff', 'date1', 'date2'],
    ['date.op.addDays', 'addDays', 'date1', 'n'],
    ['date.op.addMonths', 'addMonths', 'date1', 'n'],
    ['date.op.addYears', 'addYears', 'date1', 'n'],
    ['date.op.weekday', 'weekday', 'date1', null],
    ['date.op.business', 'business', 'date1', 'date2'],
    ['date.op.age', 'age', 'date1', 'date2'],
  ];

  function fmtDate(d) {
    return window.CW.datetime.iso(d);
  }

  function mountDate(app) {
    const page = app.pageNodes.date;
    page.innerHTML = '';
    const D = window.CW.datetime;
    const locale = window.CW.i18n.getLocale();

    const card = el('div', 'card');
    card.appendChild(el('h2', null, t('date.title')));

    const sel = el('select', 'field');
    OPS.forEach(function (p, i) {
      const o = el('option', null, t(p[0]));
      o.value = String(i);
      sel.appendChild(o);
    });
    sel.setAttribute('aria-label', t('date.op'));
    card.appendChild(sel);

    const todayStr = fmtDate(D.today());

    const row = el('div', 'row');
    row.style.marginTop = '8px';
    const date1 = el('input', 'field');
    date1.type = 'text';
    date1.value = todayStr;
    date1.placeholder = t('date.date1');
    date1.setAttribute('aria-label', t('date.date1'));
    const date2 = el('input', 'field');
    date2.type = 'text';
    date2.value = todayStr;
    date2.placeholder = t('date.date2');
    date2.setAttribute('aria-label', t('date.date2'));
    const num = el('input', 'field');
    num.type = 'text';
    num.value = '30';
    num.placeholder = t('date.n');
    num.setAttribute('aria-label', t('date.n'));
    row.appendChild(date1);
    row.appendChild(date2);
    row.appendChild(num);
    card.appendChild(row);

    const out = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    card.appendChild(out);

    function refresh() {
      const spec = OPS[parseInt(sel.value, 10)];
      date1.style.display = spec[2] ? '' : 'none';
      date2.style.display = spec[3] === 'date2' ? '' : 'none';
      num.style.display = spec[3] === 'n' ? '' : 'none';
    }
    sel.onchange = refresh;
    refresh();

    function run() {
      try {
        const spec = OPS[parseInt(sel.value, 10)];
        const op = spec[1];
        const d1 = D.parse(date1.value);
        if (op === 'diff') {
          const d2 = D.parse(date2.value);
          out.textContent =
            t('date.result.diff', { a: fmtDate(d1), b: fmtDate(d2), n: D.diffDays(d1, d2) }) +
            '\n' +
            t('date.weekdayLine', {
              name: D.weekdayName(d1, locale),
              week: D.isoWeek(D.parse(date1.value)).week,
            });
        } else if (op === 'addDays' || op === 'addMonths' || op === 'addYears') {
          const n = F.toNumber(num.value);
          if (!Number.isFinite(n)) {
            throw { message: t('date.err.number') };
          }
          const r =
            op === 'addDays'
              ? D.addDays(d1, n)
              : op === 'addMonths'
                ? D.addMonths(d1, n)
                : D.addYears(d1, n);
          out.textContent =
            fmtDate(d1) +
            ' ' +
            t('date.plus') +
            ' ' +
            n +
            ' → ' +
            fmtDate(r) +
            '  (' +
            D.weekdayName(r, locale) +
            ')';
        } else if (op === 'weekday') {
          const w = D.isoWeek(d1);
          out.textContent =
            t('date.weekdayLine', { name: D.weekdayName(d1, locale), week: w.week }) +
            '\n' +
            t('date.isoWeekYear', { week: w.week, year: w.year }) +
            '\n' +
            t('date.leapLine', {
              year: d1.y,
              v: D.isLeapYear(d1.y) ? t('date.yes') : t('date.no'),
            });
        } else if (op === 'business') {
          const d2 = D.parse(date2.value);
          out.textContent = t('date.result.business', {
            a: fmtDate(d1),
            b: fmtDate(d2),
            n: D.businessDays(d1, d2),
          });
        } else if (op === 'age') {
          const a = D.age(d1, D.parse(date2.value));
          out.textContent = t('date.result.age', { y: a.years, m: a.months, d: a.days });
        }
        out.classList.remove('err');
      } catch (e) {
        out.textContent = e.message || String(e);
        out.classList.add('err');
      }
    }

    const btn = el('button', 'btn primary', t('common.calculate'));
    btn.onclick = run;
    const brow = el('div', 'row');
    brow.style.marginTop = '8px';
    brow.appendChild(btn);
    card.appendChild(brow);
    card.appendChild(el('div', 'hint', t('date.hint')));
    page.appendChild(card);
  }

  window.CW.pages.mountDate = mountDate;
})();
