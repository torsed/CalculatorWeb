/* Полиномы: извлечение коэффициентов из выражения и поиск корней.
 *
 * Заменяет mathjs (rationalize + polynomialRoot), который тянул ~650 КБ ради
 * одной задачи и умел только степень ≤ 3. Здесь:
 *   - coeffs(expr) — коэффициенты многочлена из строки (или null, если не полином);
 *   - roots(coeff) — корни многочлена любой степени (Durand–Kerner + точные
 *     формулы для 1–2 степени).
 * Коэффициенты — по возрастанию степени: [c0, c1, c2, ...] для c0 + c1·x + ... .
 * Файл самодостаточен для file://, как и остальные core/*.
 */
'use strict';
window.CW = window.CW || {};
window.CW.poly = (function () {
  // Ошибка полиномов: переводим сообщение, если ядро i18n доступно.
  // В node-тестах i18n нет — остаётся исходный русский текст.
  // isExprError НЕ ставим: сохраняем прежний тип ошибки.
  function PolyError(message, code, params) {
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
    if (code) {
      e.code = code;
    }
    return e;
  }

  // ── Разбор выражения в коэффициенты ──────────────────────
  function tokenize(src) {
    const out = [];
    let i = 0;
    const s = String(src);
    while (i < s.length) {
      const ch = s[i];
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        i++;
        continue;
      }
      const num = /^\d+(\.\d+)?([eE][+-]?\d+)?/.exec(s.slice(i));
      if (num) {
        out.push({ t: 'num', v: parseFloat(num[0]) });
        i += num[0].length;
        continue;
      }
      if (/[a-zA-Z]/.test(ch)) {
        const id = /^[a-zA-Z][a-zA-Z0-9]*/.exec(s.slice(i))[0];
        out.push({ t: 'id', v: id });
        i += id.length;
        continue;
      }
      if ('+-*/^()'.indexOf(ch) >= 0) {
        out.push({ t: 'op', v: ch });
        i++;
        continue;
      }
      throw PolyError('Неизвестный символ: ' + ch, 'polyBadChar', { char: ch });
    }
    return out;
  }

  function padd(a, b) {
    const n = Math.max(a.length, b.length);
    const r = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      r[i] = (a[i] || 0) + (b[i] || 0);
    }
    return r;
  }
  function pmul(a, b) {
    const r = new Array(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        r[i + j] += a[i] * b[j];
      }
    }
    return r;
  }
  function pscale(a, k) {
    return a.map(function (v) {
      return v * k;
    });
  }
  function ppow(a, n) {
    let r = [1];
    for (let i = 0; i < n; i++) {
      r = pmul(r, a);
    }
    return r;
  }
  function trim(a) {
    let n = a.length;
    while (n > 1 && Math.abs(a[n - 1]) < 1e-15) {
      n--;
    }
    return a.slice(0, n);
  }

  const NOT_POLY = null;

  function parse(src) {
    const toks = tokenize(src);
    let pos = 0;
    function peek() {
      return toks[pos];
    }
    function next() {
      return toks[pos++];
    }
    function isOp(ch) {
      const t = peek();
      return t && t.t === 'op' && t.v === ch;
    }

    // expr := term (('+' | '-') term)*
    function expr() {
      let left = term();
      while (left !== NOT_POLY && (isOp('+') || isOp('-'))) {
        const op = next().v;
        const right = term();
        if (right === NOT_POLY) {
          return NOT_POLY;
        }
        left = op === '+' ? padd(left, right) : padd(left, pscale(right, -1));
      }
      return left;
    }

    function startsFactor() {
      const t = peek();
      if (!t) {
        return false;
      }
      return t.t === 'num' || t.t === 'id' || (t.t === 'op' && t.v === '(');
    }

    // term := factor (('*' | '/') factor | factor)*   (factor после factor — неявное *)
    function term() {
      let left = power();
      for (;;) {
        if (left === NOT_POLY) {
          return NOT_POLY;
        }
        if (isOp('*') || isOp('/')) {
          const op = next().v;
          const right = power();
          if (right === NOT_POLY) {
            return NOT_POLY;
          }
          if (op === '*') {
            left = pmul(left, right);
          } else {
            // Делить можно только на константу.
            if (right.length !== 1) {
              return NOT_POLY;
            }
            if (right[0] === 0) {
              throw PolyError('Деление на ноль', 'polyDivZero');
            }
            left = pscale(left, 1 / right[0]);
          }
        } else if (startsFactor()) {
          const right = power();
          if (right === NOT_POLY) {
            return NOT_POLY;
          }
          left = pmul(left, right);
        } else {
          return left;
        }
      }
    }

    // power := unary ('^' exponent)?  exponent — целое ≥ 0
    function power() {
      const base = unary();
      if (base === NOT_POLY) {
        return NOT_POLY;
      }
      if (isOp('^')) {
        next();
        const expo = exponent();
        if (expo === NOT_POLY) {
          return NOT_POLY;
        }
        if (base.length === 1) {
          return [Math.pow(base[0], expo)];
        }
        return ppow(base, expo);
      }
      return base;
    }

    function exponent() {
      let sign = 1;
      if (isOp('-')) {
        next();
        sign = -1;
      } else if (isOp('+')) {
        next();
      }
      const t = peek();
      if (!t || t.t !== 'num' || !Number.isInteger(t.v)) {
        return NOT_POLY;
      }
      next();
      const e = sign * t.v;
      return e < 0 ? NOT_POLY : e;
    }

    function unary() {
      if (isOp('-')) {
        next();
        const f = unary();
        return f === NOT_POLY ? NOT_POLY : pscale(f, -1);
      }
      if (isOp('+')) {
        next();
        return unary();
      }
      return primary();
    }

    function primary() {
      const t = peek();
      if (!t) {
        throw PolyError('Неожиданный конец выражения', 'polyUnexpectedEnd');
      }
      if (t.t === 'num') {
        next();
        return [t.v];
      }
      if (t.t === 'id') {
        next();
        if (t.v === 'x') {
          return [0, 1];
        }
        // e, pi и прочие — только как константы.
        if (t.v === 'e') {
          return [Math.E];
        }
        if (t.v === 'pi') {
          return [Math.PI];
        }
        return NOT_POLY;
      }
      if (t.t === 'op' && t.v === '(') {
        next();
        const inner = expr();
        if (!isOp(')')) {
          throw PolyError('Не закрыта скобка', 'polyUnclosedParen');
        }
        next();
        return inner;
      }
      throw PolyError('Неожиданный символ: ' + t.v, 'polyUnexpectedToken', { token: t.v });
    }

    const result = expr();
    if (pos !== toks.length) {
      return NOT_POLY; // остались непонятые токены (например, функции)
    }
    if (result === NOT_POLY) {
      return NOT_POLY;
    }
    return trim(result);
  }

  /** Коэффициенты полинома или null. Принимает "lhs - rhs" либо одиночный полином. */
  function coeffs(expr) {
    try {
      return parse(expr);
    } catch (e) {
      return null;
    }
  }

  // ── Корни ────────────────────────────────────────────────
  function cleanTiny(c) {
    if (c.im !== 0 && Math.abs(c.im) < 1e-9 * Math.max(1, Math.abs(c.re))) {
      return { re: c.re, im: 0 };
    }
    return c;
  }
  function cadd(a, b) {
    return { re: a.re + b.re, im: a.im + b.im };
  }
  function csub(a, b) {
    return { re: a.re - b.re, im: a.im - b.im };
  }
  function cmul(a, b) {
    return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
  }
  function cdiv(a, b) {
    const d = b.re * b.re + b.im * b.im;
    if (d === 0) {
      return { re: NaN, im: NaN };
    }
    return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
  }
  function cabs(a) {
    return Math.hypot(a.re, a.im);
  }

  /** Горнер для комплексных коэффициентов (по возрастанию). */
  function horner(coeff, z) {
    let acc = { re: 0, im: 0 };
    for (let i = coeff.length - 1; i >= 0; i--) {
      acc = cadd(cmul(acc, z), coeff[i]);
    }
    return acc;
  }

  /** Durand–Kerner: все корни многочлена (в т.ч. комплексные). */
  function durandKerner(coeff) {
    const n = coeff.length - 1;
    const lead = coeff[n];
    const a = coeff.map(function (c) {
      return { re: c / lead, im: 0 };
    });
    // Начальные приближения на окружности (классический выбор Aberth/DK).
    const roots = [];
    for (let i = 0; i < n; i++) {
      const ang = (2 * Math.PI * i) / n + 0.4;
      const r = Math.pow(0.4, i / n);
      roots.push({ re: r * Math.cos(ang), im: r * Math.sin(ang) });
    }
    const EPS = 1e-14;
    for (let iter = 0; iter < 1000; iter++) {
      let maxDelta = 0;
      for (let i = 0; i < n; i++) {
        let denom = { re: 1, im: 0 };
        for (let j = 0; j < n; j++) {
          if (i !== j) {
            denom = cmul(denom, csub(roots[i], roots[j]));
          }
        }
        const delta = cdiv(horner(a, roots[i]), denom);
        roots[i] = csub(roots[i], delta);
        const m = cabs(delta);
        if (m > maxDelta) {
          maxDelta = m;
        }
      }
      if (maxDelta < EPS) {
        break;
      }
    }
    return roots.map(cleanTiny);
  }

  function dedupe(list) {
    const out = [];
    for (const r of list) {
      const isDup = out.some(function (q) {
        const dr = q.re - r.re;
        const di = (q.im || 0) - (r.im || 0);
        return Math.hypot(dr, di) < 1e-7 * Math.max(1, Math.abs(r.re));
      });
      if (!isDup) {
        out.push(r);
      }
    }
    return out;
  }

  /**
   * Корни по коэффициентам (по возрастанию). Возвращает массив чисел
   * (вещественные) и/или {re, im} (комплексные), отсортированный.
   */
  function roots(coeff) {
    const c = coeff.slice();
    while (c.length > 1 && Math.abs(c[c.length - 1]) < 1e-15) {
      c.pop();
    }
    const n = c.length - 1;
    if (n < 1) {
      return [];
    }
    if (n === 1) {
      return [-c[0] / c[1]];
    }
    if (n === 2) {
      const a = c[2];
      const b = c[1];
      const cc = c[0];
      const disc = b * b - 4 * a * cc;
      if (disc >= 0) {
        const sq = Math.sqrt(disc);
        return [(-b - sq) / (2 * a), (-b + sq) / (2 * a)];
      }
      const sq = Math.sqrt(-disc);
      return [
        { re: -b / (2 * a), im: -sq / (2 * a) },
        { re: -b / (2 * a), im: sq / (2 * a) },
      ];
    }
    const complex = durandKerner(c);
    const result = complex.map(function (r) {
      return r.im === 0 ? r.re : r;
    });
    result.sort(function (a, b) {
      const ar = typeof a === 'number' ? a : a.re;
      const br = typeof b === 'number' ? b : b.re;
      if (Math.abs(ar - br) > 1e-9) {
        return ar - br;
      }
      const ai = typeof a === 'number' ? 0 : a.im;
      const bi = typeof b === 'number' ? 0 : b.im;
      return ai - bi;
    });
    return dedupe(result);
  }

  return { coeffs: coeffs, roots: roots };
})();
