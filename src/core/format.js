/* Форматирование и разбор чисел.
 *
 * Порядок вызовов важен: сначала строки, потом sympy-подобные объекты
 * (в порте их нет), потом bool, потом complex, и лишь затем float.
 */
'use strict';
window.CW = window.CW || {};
window.CW.format = (function () {
  /** Формат числа для дисплея. */
  function fmt(value, places) {
    if (places === undefined) {
      places = 12;
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'boolean') {
      return String(value ? 1 : 0);
    }
    if (typeof value === 'number' && Number.isNaN(value)) {
      return 'nan';
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      return value < 0 ? '-inf' : 'inf';
    }
    if (typeof value !== 'number') {
      return String(value);
    }

    // Целые значения печатаем без точки, пока помещаются в int.
    if (Number.isInteger(value) && Math.abs(value) < 1e15) {
      return String(value);
    }
    // %g уже убирает нули из мантиссы. НЕ делаем rstrip('0'):
    // для "1e+30" это съело бы нули показателя и напечатало "1e+3".
    return formatG(value, places);
  }

  /** Аналог Python-овского '%g': значащие цифры + экспонента при нужде. */
  function formatG(value, sig) {
    if (value === 0) {
      return '0';
    }
    const exp = Math.floor(Math.log10(Math.abs(value)));
    if (exp < -4 || exp >= sig) {
      const mant = value / Math.pow(10, exp);
      // Убираем хвостовые нули мантиссы.
      const m = trimZeros(mant.toPrecision(sig));
      return m + 'e' + (exp < 0 ? '-' : '+') + pad(Math.abs(exp));
    }
    return trimZeros(value.toPrecision(sig));
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function trimZeros(s) {
    if (s.indexOf('.') < 0) {
      return s;
    }
    return s.replace(/0+$/, '').replace(/\.$/, '');
  }

  /** Комплексное число → строка в виде кнопок калькулятора. */
  function fmtComplex(value, places) {
    if (typeof value === 'number') {
      return fmt(value, places);
    }
    // Комплексные значения внутри движка хранятся как {re, im}.
    const re = value.re === undefined ? Number(value.real || 0) : value.re;
    const im = value.im === undefined ? Number(value.imag || 0) : value.im;
    if (Math.abs(im) < 1e-14) {
      return fmt(re, places);
    }
    const sign = im >= 0 ? '+' : '−';
    return fmt(re, places) + ' ' + sign + ' ' + fmt(Math.abs(im), places) + 'i';
  }

  /** Разбор строки в float с поддержкой запятой как десятичного разделителя. */
  function toNumber(text) {
    const s = String(text == null ? '' : text)
      .trim()
      .replace(',', '.');
    if (s === '') {
      return NaN;
    }
    const v = Number(s);
    return v;
  }

  return { fmt: fmt, fmtComplex: fmtComplex, toNumber: toNumber, formatG: formatG };
})();
