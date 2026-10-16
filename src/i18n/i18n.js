/* Интернационализация (i18n).
 *
 * Самодостаточно для file:// как и остальные core/ui-модули: регистрируется
 * в window.CW.i18n и грузится первым из src/i18n/.
 *
 * Контракт для остального кода:
 *   CW.i18n.t('ключ')                 → строка (фолбэк: ru, затем сам ключ);
 *   CW.i18n.t('ключ', {n: 5})         → подстановка {n} в шаблон;
 *   CW.i18n.tn('ключ', 5)             → множественная форма (ключ.one/.few/.many);
 *   CW.i18n.add('ru', { 'ключ': '…' }) → регистрация строк области;
 *   CW.i18n.unit('Дж')                → перевод единицы измерения (или как есть);
 *   CW.i18n.locale / setLocale / getLocale / onChange.
 *
 * Каталоги складываются из файлов src/i18n/locales/*.js (по одному на область,
 * оба языка внутри — чтобы ru/en не разъезжались).
 */
'use strict';
window.CW = window.CW || {};
window.CW.i18n = (function () {
  const FALLBACK = 'ru';
  const SUPPORTED = ['ru', 'en'];
  const catalogs = {};
  SUPPORTED.forEach(function (loc) {
    catalogs[loc] = {};
  });

  /** Регистрация пачки строк для языка. */
  function add(locale, strings) {
    if (!catalogs[locale]) {
      catalogs[locale] = {};
    }
    Object.keys(strings).forEach(function (k) {
      catalogs[locale][k] = strings[k];
    });
  }

  function normalize(loc) {
    if (!loc) {
      return FALLBACK;
    }
    const two = String(loc).slice(0, 2).toLowerCase();
    return catalogs[two] ? two : FALLBACK;
  }

  function detect() {
    try {
      const saved = localStorage.getItem('cw.lang');
      if (saved && catalogs[normalize(saved)]) {
        return normalize(saved);
      }
    } catch (e) {
      // приватный режим — не критично
    }
    // Язык по умолчанию — русский: приложение ориентировано на ru, а смена
    // языка запоминается в localStorage (cw.lang) и применяется при следующем
    // запуске. Автоопределение по navigator.language выключено намеренно.
    return FALLBACK;
  }

  let current = detect();
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('lang', current);
  }
  const listeners = [];

  function lookup(locale, key) {
    const cat = catalogs[locale];
    return cat && Object.prototype.hasOwnProperty.call(cat, key) ? cat[key] : undefined;
  }

  /** Перевод по ключу с подстановкой {param}. */
  function t(key, params) {
    let text = lookup(current, key);
    if (text === undefined) {
      text = lookup(FALLBACK, key);
    }
    if (text === undefined) {
      return key;
    }
    if (params) {
      text = text.replace(/\{(\w+)\}/g, function (m, name) {
        return Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : m;
      });
    }
    return text;
  }

  /** Русские правила множественного числа: 1 → one, 2–4 → few, 0/5+ → many. */
  function pluralForm(n) {
    const a = Math.abs(n) % 100;
    const b = a % 10;
    if (a > 10 && a < 20) {
      return 'many';
    }
    if (b > 1 && b < 5) {
      return 'few';
    }
    if (b === 1) {
      return 'one';
    }
    return 'many';
  }

  /** Множественная форма: ключ.one / ключ.few / ключ.many (en: one/other). */
  function tn(key, n) {
    const form = current === 'en' ? (Math.abs(n) === 1 ? 'one' : 'many') : pluralForm(n);
    const byForm = lookup(current, key + '.' + form);
    if (byForm !== undefined) {
      return t(key + '.' + form, { n: n });
    }
    return t(key, { n: n });
  }

  function setLocale(loc) {
    const next = normalize(loc);
    if (next === current) {
      return;
    }
    current = next;
    try {
      localStorage.setItem('cw.lang', next);
    } catch (e) {
      // приватный режим — не критично
    }
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('lang', next);
    }
    listeners.forEach(function (fn) {
      try {
        fn(next);
      } catch (e) {
        // слушатель не должен ломать смену языка
      }
    });
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  /** Число в текущей локали (ru → «1 234,5», en → «1,234.5»). */
  function number(value, opts) {
    try {
      return new Intl.NumberFormat(current, opts).format(value);
    } catch (e) {
      return String(value);
    }
  }

  /** Перевод единицы измерения по её исходному (русскому) обозначению.
   * Каталог — src/i18n/locales/units.js (ключи `unit.<обозначение>`). Если
   * перевода нет (например, коды валют), возвращается исходная строка. */
  function unit(u) {
    if (!u) {
      return u;
    }
    const key = 'unit.' + u;
    const tr = t(key);
    return tr === key ? u : tr;
  }

  return {
    t: t,
    tn: tn,
    unit: unit,
    add: add,
    setLocale: setLocale,
    getLocale: function () {
      return current;
    },
    supported: SUPPORTED.slice(),
    onChange: onChange,
    number: number,
  };
})();
