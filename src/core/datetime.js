/* Дата и время: разница дат, прибавление дней/месяцев, рабочие дни, возраст.
 *
 * Чистая арифметика над календарём (алгоритм days_from_civil Говарда Хиннанта),
 * без зависимости от часового пояса и Date-парсинга. Файл самодостаточен для
 * file:// и грузится обычным <script>.
 */
'use strict';
window.CW = window.CW || {};
window.CW.datetime = (function () {
  function Err(message, code, params) {
    const i18n = window.CW && window.CW.i18n;
    let text = message;
    if (i18n && code) {
      const key = 'core.' + code;
      const tr = i18n.t(key, params);
      if (tr !== key) {
        text = tr;
      }
    }
    const e = new Error(text);
    e.name = 'ExprError';
    e.isExprError = true;
    if (code) {
      e.code = code;
    }
    return e;
  }

  function isLeapYear(y) {
    return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  }

  const MONTH_DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function daysInMonth(y, m) {
    if (m === 2) {
      return isLeapYear(y) ? 29 : 28;
    }
    return MONTH_DAYS[m];
  }

  function valid(d) {
    return (
      d &&
      Number.isInteger(d.y) &&
      Number.isInteger(d.m) &&
      Number.isInteger(d.d) &&
      d.m >= 1 &&
      d.m <= 12 &&
      d.d >= 1 &&
      d.d <= daysInMonth(d.y, d.m)
    );
  }

  /** Дата → число дней с 1970-01-01 (может быть отрицательным). */
  function toDays(y, m, d) {
    let yy = y;
    yy -= m <= 2 ? 1 : 0;
    const era = Math.floor((yy >= 0 ? yy : yy - 399) / 400);
    const yoe = yy - era * 400;
    const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
    const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
    return era * 146097 + doe - 719468;
  }

  /** Число дней → дата {y, m, d}. */
  function fromDays(z) {
    z += 719468;
    const era = Math.floor((z >= 0 ? z : z - 146096) / 146097);
    const doe = z - era * 146097;
    const yoe = Math.floor(
      (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365
    );
    const y = yoe + era * 400;
    const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    const mp = Math.floor((5 * doy + 2) / 153);
    const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
    const m = mp + (mp < 10 ? 3 : -9);
    return { y: y + (m <= 2 ? 1 : 0), m: m, d: d };
  }

  /** Разбор даты из строки: ГГГГ-ММ-ДД или ДД.ММ.ГГГГ. */
  function parse(text) {
    const s = String(text || '').trim();
    let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
    if (m) {
      const d = { y: +m[1], m: +m[2], d: +m[3] };
      if (!valid(d)) {
        throw Err('Некорректная дата: ' + s, 'badDate', { value: s });
      }
      return d;
    }
    m = /^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/.exec(s);
    if (m) {
      const d = { y: +m[3], m: +m[2], d: +m[1] };
      if (!valid(d)) {
        throw Err('Некорректная дата: ' + s, 'badDate', { value: s });
      }
      return d;
    }
    throw Err('Некорректная дата: ' + s + ' (ожидается ГГГГ-ММ-ДД)', 'badDate', { value: s });
  }

  function iso(d) {
    const p2 = function (n) {
      return n < 10 ? '0' + n : String(n);
    };
    return d.y + '-' + p2(d.m) + '-' + p2(d.d);
  }

  /** Разница в днях: b − a. */
  function diffDays(a, b) {
    return toDays(b.y, b.m, b.d) - toDays(a.y, a.m, a.d);
  }

  function addDays(d, n) {
    return fromDays(toDays(d.y, d.m, d.d) + Math.round(n));
  }

  function addMonths(d, n) {
    n = Math.round(n);
    const total = d.y * 12 + (d.m - 1) + n;
    const y = Math.floor(total / 12);
    const m = (total % 12) + 1;
    const day = Math.min(d.d, daysInMonth(y, m));
    return { y: y, m: m < 1 ? m + 12 : m, d: day };
  }

  function addYears(d, n) {
    return addMonths(d, Math.round(n) * 12);
  }

  const WEEKDAYS_RU = [
    'понедельник',
    'вторник',
    'среда',
    'четверг',
    'пятница',
    'суббота',
    'воскресенье',
  ];
  const WEEKDAYS_EN = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  /** День недели: 0 — понедельник … 6 — воскресенье. */
  function isoWeekday(d) {
    return ((((toDays(d.y, d.m, d.d) % 7) + 3) % 7) + 7) % 7;
  }

  /** Номер недели ISO 8601. */
  function isoWeek(d) {
    const z = toDays(d.y, d.m, d.d);
    const wd = ((((z % 7) + 3) % 7) + 7) % 7; // 0 — Пн
    const thursday = z - wd + 3; // четверг той же недели
    const t = fromDays(thursday);
    const jan1 = toDays(t.y, 1, 1);
    const week = Math.floor((thursday - jan1) / 7) + 1;
    return { week: week, year: t.y };
  }

  /** Число рабочих дней (пн–пт) включительно между a и b. */
  function businessDays(a, b) {
    let days = diffDays(a, b);
    if (days === 0) {
      return 0;
    }
    let sign = 1;
    if (days < 0) {
      const t = a;
      a = b;
      b = t;
      days = -days;
      sign = -1;
    }
    let count = 0;
    const startZ = toDays(a.y, a.m, a.d);
    const endZ = toDays(b.y, b.m, b.d);
    for (let z = startZ; z <= endZ; z++) {
      const wd = ((((z % 7) + 3) % 7) + 7) % 7;
      if (wd < 5) {
        count++;
      }
    }
    // Если считали в обратную сторону, «рабочие дни» симметричны по модулю.
    return sign > 0 ? count : count * -1;
  }

  /** Возраст от даты рождения до даты отсчёта: годы, месяцы, дни. */
  function age(birth, asOf) {
    if (toDays(asOf.y, asOf.m, asOf.d) < toDays(birth.y, birth.m, birth.d)) {
      throw Err('Дата отсчёта раньше даты рождения', 'ageNegative');
    }
    let years = asOf.y - birth.y;
    let months = asOf.m - birth.m;
    let days = asOf.d - birth.d;
    if (days < 0) {
      months -= 1;
      const prevMonth = addMonths({ y: asOf.y, m: asOf.m, d: 1 }, -1);
      days += daysInMonth(prevMonth.y, prevMonth.m);
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return { years: years, months: months, days: days };
  }

  /** Сегодняшняя дата в локальном времени. */
  function today() {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
  }

  function weekdayName(d, locale) {
    return locale === 'en' ? WEEKDAYS_EN[isoWeekday(d)] : WEEKDAYS_RU[isoWeekday(d)];
  }

  return {
    isLeapYear: isLeapYear,
    daysInMonth: daysInMonth,
    parse: parse,
    iso: iso,
    valid: valid,
    toDays: toDays,
    fromDays: fromDays,
    diffDays: diffDays,
    addDays: addDays,
    addMonths: addMonths,
    addYears: addYears,
    isoWeekday: isoWeekday,
    isoWeek: isoWeek,
    businessDays: businessDays,
    age: age,
    today: today,
    weekdayName: weekdayName,
  };
})();
