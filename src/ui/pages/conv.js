/* Конвертер единиц.
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
  // ── Конвертер единиц ─────────────────────────────────────
  const UNITS = {
    length: {
      Метры: 1,
      Километры: 1000,
      Сантиметры: 0.01,
      Миллиметры: 0.001,
      Мили: 1609.344,
      Ярды: 0.9144,
      Футы: 0.3048,
      Дюймы: 0.0254,
      'Морские мили': 1852,
    },
    mass: {
      Килограммы: 1,
      Граммы: 0.001,
      Миллиграммы: 1e-6,
      Тонны: 1000,
      Фунты: 0.45359237,
      Унции: 0.028349523125,
    },
    temperature: { Цельсий: 0, Фаренгейт: 0, Ранкин: 0 },
    area: {
      'Кв. метры': 1,
      'Кв. километры': 1e6,
      'Кв. сантиметры': 1e-4,
      Гектары: 10000,
      Акры: 4046.8564224,
      'Кв. мили': 2589988.11,
    },
    volume: {
      Литры: 1,
      Миллилитры: 0.001,
      Кубометры: 1000,
      'Галлоны (US)': 3.785411784,
      'Пинты (US)': 0.473176473,
    },
    speed: {
      'м/с': 1,
      'км/ч': 1 / 3.6,
      'миль/ч': 0.44704,
      узлы: 0.514444,
      'футы/с': 0.3048,
    },
    time: {
      Секунды: 1,
      Миллисекунды: 0.001,
      Минуты: 60,
      Часы: 3600,
      Дни: 86400,
      Недели: 604800,
    },
    data: {
      Байты: 1,
      Килобайты: 1024,
      Мегабайты: 1048576,
      Гигабайты: 1073741824,
      Терабайты: 1099511627776,
    },
    pressure: {
      Паскали: 1,
      Килопаскали: 1000,
      Мегапаскали: 1e6,
      Бары: 100000,
      Миллибары: 100,
      Атмосферы: 101325,
      'мм рт. ст.': 133.322,
      PSI: 6894.76,
    },
    energy: {
      Джоули: 1,
      Килоджоули: 1000,
      Мегаджоули: 1e6,
      Калории: 4.184,
      Килокалории: 4184,
      'Ватт·часы': 3600,
      'Киловатт·часы': 3.6e6,
      Электронвольты: 1.602176634e-19,
      'Брит. тепл. ед. (BTU)': 1055.06,
    },
    angle: {
      Радианы: 1,
      Градусы: Math.PI / 180,
      Грады: Math.PI / 200,
      Обороты: Math.PI * 2,
      Минуты: Math.PI / 10800,
      Секунды: Math.PI / 648000,
    },
    currency: {
      USD: 0,
      EUR: 0,
      RUB: 0,
      CNY: 0,
      GBP: 0,
      JPY: 0,
      CHF: 0,
      BYN: 0,
      KZT: 0,
      UAH: 0,
    },
  };

  const CAT_NAMES = {
    length: t('conv.cat.length'),
    mass: t('conv.cat.mass'),
    temperature: t('conv.cat.temperature'),
    area: t('conv.cat.area'),
    volume: t('conv.cat.volume'),
    speed: t('conv.cat.speed'),
    time: t('conv.cat.time'),
    data: t('conv.cat.data'),
    pressure: t('conv.cat.pressure'),
    energy: t('conv.cat.energy'),
    angle: t('conv.cat.angle'),
    currency: t('conv.cat.currency'),
  };

  function toKelvin(v, unit) {
    if (unit === 'Цельсий') {
      return v + 273.15;
    }
    if (unit === 'Фаренгейт') {
      return ((v - 32) * 5) / 9 + 273.15;
    }
    if (unit === 'Ранкин') {
      return v / 1.8;
    }
    return v;
  }
  function fromKelvin(k, unit) {
    if (unit === 'Цельсий') {
      return k - 273.15;
    }
    if (unit === 'Фаренгейт') {
      return ((k - 273.15) * 9) / 5 + 32;
    }
    if (unit === 'Ранкин') {
      return k * 1.8;
    }
    return k;
  }

  function mountConv(app) {
    const page = app.pageNodes.conv;
    page.innerHTML = '';
    const card = el('div', 'card');
    card.appendChild(el('h2', null, t('common.tab.conv')));

    const cats = Object.keys(UNITS).map(function (k) {
      return CAT_NAMES[k];
    });
    function labeledField(labelText, control) {
      const w = el('div', 'conv-field');
      const lab = document.createElement('label');
      lab.textContent = labelText;
      lab.className = 'label-hint';
      lab.setAttribute('for', control.id);
      w.appendChild(lab);
      w.appendChild(control);
      return w;
    }
    const row1 = el('div', 'row');
    const selCat = el('select', 'field');
    selCat.id = 'conv-cat';
    cats.forEach(function (c) {
      const o = el('option', null, c);
      o.value = c;
      selCat.appendChild(o);
    });
    row1.appendChild(labeledField(t('common.category'), selCat));

    const selFrom = el('select', 'field');
    selFrom.id = 'conv-from';
    const selTo = el('select', 'field');
    selTo.id = 'conv-to';
    row1.appendChild(labeledField(t('common.from'), selFrom));
    row1.appendChild(labeledField(t('common.to'), selTo));
    card.appendChild(row1);

    const row2 = el('div', 'row');
    row2.style.marginTop = '8px';
    const inp = el('input', 'field');
    inp.type = 'text';
    inp.id = 'conv-value';
    inp.inputMode = 'decimal';
    inp.value = '1';
    inp.setAttribute('aria-label', t('conv.valueAria'));
    inp.setAttribute('aria-describedby', 'conv-live-hint');
    const swap = el('button', 'btn', '⇄');
    swap.title = t('conv.swap');
    swap.setAttribute('aria-label', t('conv.swap'));
    const out = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    row2.appendChild(labeledField(t('common.value'), inp));
    row2.appendChild(swap);
    card.appendChild(row2);
    // WCAG 3.2.5: предупреждаем, что результат обновляется при вводе сам.
    const liveHint = el('div', {
      cls: 'hint',
      attrs: { id: 'conv-live-hint' },
      text: t('conv.liveDefault'),
    });
    const defaultHint = liveHint.textContent;
    card.appendChild(liveHint);
    card.appendChild(out);

    function keyOf(cat) {
      for (const k in UNITS) {
        if (CAT_NAMES[k] === cat) {
          return k;
        }
      }
      return null;
    }
    // Отображаемое имя единицы; ключом остаётся исходное (русское) имя, которое
    // используется в расчётах. Для кодов валют (USD, EUR…) перевода нет — берём
    // сам код.
    function unitLabel(n) {
      const key = 'conv.unit.' + n;
      const label = t(key);
      return label === key ? n : label;
    }
    function fillUnits() {
      const key = keyOf(selCat.value);
      if (!key || !UNITS[key]) {
        return;
      }
      const units = UNITS[key];
      const names = Object.keys(units);
      selFrom.innerHTML = '';
      selTo.innerHTML = '';
      names.forEach(function (n) {
        const a = el('option', null, unitLabel(n));
        a.value = n;
        selFrom.appendChild(a);
        const o = el('option', null, unitLabel(n));
        o.value = n;
        selTo.appendChild(o);
      });
      if (names[1]) {
        selTo.value = names[1];
      }
    }
    let currencyRates = {
      base: 'USD',
      rates: {
        USD: 1,
        EUR: 0.92,
        RUB: 92,
        CNY: 7.2,
        GBP: 0.79,
        JPY: 150,
        CHF: 0.9,
        BYN: 3.2,
        KZT: 450,
        UAH: 38,
      },
    };
    let currencyLastFetch = 0;
    // true, когда удалось получить живые курсы; иначе показываем приблизительные.
    let currencyLive = false;

    function showCurrencyHint() {
      if (keyOf(selCat.value) !== 'currency') {
        liveHint.textContent = defaultHint;
        return;
      }
      liveHint.textContent = currencyLive ? t('conv.currencyLive') : t('conv.currencyOffline');
    }

    async function fetchCurrencyRates() {
      const now = Date.now();
      if (now - currencyLastFetch < 3600000 && Object.keys(currencyRates.rates).length > 1) {
        return; // Use cached rates for 1 hour
      }
      try {
        if (typeof fetch !== 'function') {
          return;
        }
        const resp = await fetch('https://api.exchangerate.host/latest?base=USD');
        if (!resp || !resp.ok) {
          return;
        }
        const data = await resp.json();
        if (data.rates) {
          currencyRates = { base: 'USD', rates: data.rates };
          currencyRates.rates.USD = 1;
          currencyLastFetch = now;
          currencyLive = true;
          localStorage.setItem('cw.currency.rates', JSON.stringify(currencyRates));
          localStorage.setItem('cw.currency.lastFetch', String(currencyLastFetch));
          showCurrencyHint();
        }
      } catch (e) {
        // Use cached or default rates
        try {
          const cached = localStorage.getItem('cw.currency.rates');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (
              parsed &&
              typeof parsed === 'object' &&
              parsed.rates &&
              typeof parsed.rates === 'object'
            ) {
              currencyRates = parsed;
              currencyLastFetch = parseInt(
                localStorage.getItem('cw.currency.lastFetch') || '0',
                10
              );
            }
          }
        } catch (parseErr) {
          // Оставляем дефолтные курсы, если кэш повреждён
          currencyRates = {
            base: 'USD',
            rates: {
              USD: 1,
              EUR: 0.92,
              RUB: 92,
              CNY: 7.2,
              GBP: 0.79,
              JPY: 150,
              CHF: 0.9,
              BYN: 3.2,
              KZT: 450,
              UAH: 38,
            },
          };
        }
      }
    }

    let lastResult = '';

    function convert() {
      const key = keyOf(selCat.value);
      const v = F.toNumber(inp.value);
      if (isNaN(v)) {
        out.textContent = t('conv.err.number');
        out.classList.add('err');
        lastResult = '';
        return;
      }
      let res;
      if (key === 'temperature') {
        res = fromKelvin(toKelvin(v, selFrom.value), selTo.value);
      } else if (key === 'currency') {
        // Handle currency conversion asynchronously
        fetchCurrencyRates()
          .then(function () {
            const rates = currencyRates.rates;
            const fromRate = rates[selFrom.value] || 1;
            const toRate = rates[selTo.value] || 1;
            // Convert from -> USD -> to
            const usd = v / fromRate;
            const result = usd * toRate;
            lastResult = F.fmt(result, 6);
            out.textContent = lastResult + ' ' + selTo.value;
            out.classList.remove('err');
          })
          .catch(function () {
            lastResult = '';
            out.textContent = t('conv.err.rates');
            out.classList.add('err');
          });
        return; // Early return for async currency
      } else {
        res = (v * UNITS[key][selFrom.value]) / UNITS[key][selTo.value];
      }
      lastResult = F.fmt(res, 10);
      out.textContent = lastResult + ' ' + unitLabel(selTo.value);
      out.classList.remove('err');
    }
    selCat.onchange = function () {
      fillUnits();
      showCurrencyHint();
      convert();
    };
    selFrom.onchange = convert;
    selTo.onchange = convert;
    inp.oninput = convert;
    swap.onclick = function () {
      const t = selFrom.value;
      selFrom.value = selTo.value;
      selTo.value = t;
      // Берём именно числовой результат, а не текст с единицей измерения.
      if (lastResult !== '') {
        inp.value = lastResult;
      }
      convert();
    };
    fillUnits();
    convert();
    page.appendChild(card);

    const chips = el('div', 'chips');
    chips.style.marginBottom = '10px';
    [
      ['1', '1'],
      ['100', '100'],
      ['1.5', '1,5'],
      ['-40', '-40'],
      ['1e6', '1e6'],
    ].forEach(function (p) {
      const c = el('button', 'chip', p[0]);
      c.onclick = function () {
        inp.value = p[1];
        convert();
      };
      chips.appendChild(c);
    });
    page.appendChild(chips);
  }

  window.CW.pages.mountConv = mountConv;
})();
