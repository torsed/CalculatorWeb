/* Бытовые калькуляторы.
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
  // ── Бытовые ─────────────────────────────────────────────
  // Входы в привычных бытовых единицах: вес в кг, рост в см, сумма в ₽,
  // проценты как 5..100 (а не 0.05..1 — для понятности).
  // Формат элемента: [подпись, [ключи полей], функция, единицы полей?].
  // Первый ключ — величина, которую формула считает напрямую; её единица
  // задана в возврате функции. spec[3] — единицы остальных полей, чтобы
  // обратный расчёт тоже показывал единицу измерения.
  /** @type {FormulaSpec[]} */
  const UTIL_FUNCS = [
    [
      t('util.fn.bmi'),
      ['BMI', 'm', 'h'],
      function (v) {
        // m в кг, h в метрах. Категории: <18.5 дефицит, 18.5–25 норма.
        return ['BMI', v.m / (v.h * v.h), 'кг/м²'];
      },
      { m: 'кг', h: 'м' },
    ],
    [
      t('util.fn.tip'),
      ['T', 'S', 'p'],
      function (v) {
        // S — сумма счёта, p — процент чаевых (10 = 10%).
        return ['T', (v.S * v.p) / 100, '₽'];
      },
      { S: '₽', p: '%' },
    ],
    [
      t('util.fn.percent'),
      ['X', 'A', 'p'],
      function (v) {
        // A — число, p — процент (10 = 10%).
        return ['X', (v.A * v.p) / 100, ''];
      },
      { p: '%' },
    ],
    [
      t('util.fn.change'),
      ['p', 'a', 'b'],
      function (v) {
        // a — старое значение, b — новое. Положительное = рост.
        if (v.a === 0) {
          throw { message: t('util.err.baseZero') };
        }
        return ['Δ%', ((v.b - v.a) / v.a) * 100, '%'];
      },
      { p: '%' },
    ],
    [
      t('util.fn.fuel'),
      ['Q', 'V', 'L'],
      function (v) {
        // V — потраченное топливо в л, L — пройденный путь в км. → л/100 км.
        return ['Q', (v.V / v.L) * 100, 'л/100 км'];
      },
      { V: 'л', L: 'км' },
    ],
    [
      t('util.fn.time'),
      ['t', 'S', 'V'],
      function (v) {
        // S — путь в км, V — средняя скорость в км/ч. → часы.
        return ['t', v.S / v.V, 'ч'];
      },
      { S: 'км', V: 'км/ч' },
    ],
    [
      t('util.fn.gas'),
      ['C', 'Q', 'S', 'P'],
      function (v) {
        // Q — л/100 км, S — км, P — ₽/л.
        return ['C', (v.Q / 100) * v.S * v.P, '₽'];
      },
      { Q: 'л/100 км', S: 'км', P: '₽/л' },
    ],
  ];

  function mountUtil(app) {
    const page = app.pageNodes.util;
    page.innerHTML = '';

    const card = el('div', 'card');
    card.appendChild(el('h2', null, t('common.tab.util')));
    const sel = el('select', 'field');
    UTIL_FUNCS.forEach(function (f, i) {
      const o = el('option', null, f[0]);
      o.value = String(i);
      sel.appendChild(o);
    });
    card.appendChild(sel);

    const row = el('div', 'row');
    row.style.marginTop = '8px';
    const inputs = [];
    const maxKeys = UTIL_FUNCS.reduce(function (m, f) {
      return Math.max(m, f[1].length);
    }, 0);
    for (let i = 0; i < maxKeys; i++) {
      const f = el('input', 'field');
      f.type = 'text';
      f.inputMode = 'decimal';
      const initKey = UTIL_FUNCS[0][1][i] || t('util.param', { n: i + 1 });
      f.placeholder = initKey;
      f.setAttribute('aria-label', initKey);
      row.appendChild(f);
      inputs.push(f);
    }
    card.appendChild(row);
    const out = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    card.appendChild(out);
    // Хинт создаётся до первого refreshInputs(): та обновляет и его.
    const hint = el('div', 'hint');

    // Ключи подсказок по индексу операции (UTIL_FUNCS): при смене операции
    // текст внизу примечания меняется вместе с полями ввода.
    const HINT_KEYS = ['bmi', 'tip', 'percent', 'change', 'fuel', 'time', 'gas'];
    function refreshHint() {
      hint.textContent =
        t('util.hint.' + HINT_KEYS[parseInt(sel.value, 10)]) + ' ' + t('util.hint.common');
    }

    function refreshInputs() {
      const keys = UTIL_FUNCS[parseInt(sel.value, 10)][1];
      inputs.forEach(function (f, i) {
        if (i < keys.length) {
          f.style.display = '';
          f.placeholder = keys[i];
          f.setAttribute('aria-label', keys[i]);
        } else {
          f.style.display = 'none';
          f.value = '';
        }
      });
      refreshHint();
    }
    sel.onchange = refreshInputs;
    refreshInputs();

    function run() {
      try {
        const spec = UTIL_FUNCS[parseInt(sel.value, 10)];
        const keys = spec[1];
        const vals = {};
        keys.forEach(function (k, i) {
          vals[k] = F.toNumber(inputs[i].value);
        });
        const missing = keys.filter(function (k) {
          return inputs[keys.indexOf(k)].value.trim() === '';
        });
        if (missing.length > 1) {
          throw { message: t('util.err.tooFew') };
        }
        // Нет пустых полей — считаем прямую формулу (искомое — первое поле).
        // Одно пустое — прямая, если пусто первое поле, иначе обратная.
        const emptyKey = missing.length === 0 ? keys[0] : missing[0];
        if (emptyKey === keys[0]) {
          const res = spec[2](vals);
          if (typeof res[1] === 'number' && !Number.isFinite(res[1])) {
            throw { message: t('util.err.undefined') };
          }
          const unit = U(res[2]);
          out.textContent = res[0] + ' = ' + F.fmt(res[1]) + (unit ? ' ' + unit : '');
        } else {
          const x = H.solveInverse(spec, vals, emptyKey);
          if (!Number.isFinite(x)) {
            throw {
              message: t('util.err.solve', { calc: keys[0], unknown: emptyKey }),
            };
          }
          const units = spec[3] || {};
          const unit = U(units[emptyKey] || '');
          out.textContent = emptyKey + ' = ' + F.fmt(x, 6) + (unit ? ' ' + unit : '');
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

    card.appendChild(hint);
    page.appendChild(card);
  }

  window.CW.pages.mountUtil = mountUtil;
})();
