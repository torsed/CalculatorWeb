/* Математический анализ: производные, интегралы, пределы, суммы.
 *
 * Численные методы поверх парсера (window.CW.parser). Файл самодостаточен для
 * file:// и грузится обычным <script> после core/parser.js. Ошибки — ExprError
 * с кодом локализации (см. src/i18n/locales/core-analysis.js).
 */
'use strict';
window.CW = window.CW || {};
window.CW.analysis = (function () {
  const P = window.CW.parser;

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

  /** Скомпилировать выражение в f(x) с числовым результатом (иначе NaN). */
  function makeFn(expr, deg) {
    return makeFnVar(expr, 'x', deg);
  }

  /** Скомпилировать выражение с заданным именем переменной. */
  function makeFnVar(expr, varName, deg) {
    let raw;
    try {
      raw = P.compileVars(expr, [varName], deg === undefined ? false : deg);
    } catch (e) {
      throw Err('Не удалось разобрать выражение: ' + (e.message || e), 'parseExpression', {
        msg: e.message || e,
      });
    }
    return function (x) {
      let v;
      try {
        v = raw(x);
      } catch (e) {
        return NaN;
      }
      if (typeof v === 'object' && v !== null) {
        v = v.re;
      }
      return typeof v === 'number' ? v : NaN;
    };
  }

  /** Имя единственной переменной выражения (кроме функций и констант). */
  function detectVar(expr) {
    const funcs = P.FUNCTIONS;
    const consts = P.CONSTANTS;
    const re = /[A-Za-z][A-Za-z0-9]*/g;
    let m;
    while ((m = re.exec(expr)) !== null) {
      const name = m[0];
      if (funcs[name] || name in consts) {
        continue;
      }
      if (/^(and|or|xor|not|shl|shr|i|I|j)$/.test(name)) {
        continue;
      }
      return name;
    }
    return 'k';
  }

  function requireFinite(v, what) {
    if (!Number.isFinite(v)) {
      throw Err('Значение не определено: ' + what, 'notDefined', { what: what });
    }
    return v;
  }

  /** Численная производная n-го порядка в точке x0 (центральные разности). */
  function derivative(f, x0, order, h) {
    order = order || 1;
    const step = h || Math.max(1e-6, Math.abs(x0) * 1e-6);
    if (order === 1) {
      return (f(x0 + step) - f(x0 - step)) / (2 * step);
    }
    if (order === 2) {
      return (f(x0 + step) - 2 * f(x0) + f(x0 - step)) / (step * step);
    }
    // Для высших порядков — рекурсивно через первую производную.
    const inner = function (x) {
      return derivative(f, x, order - 1, step);
    };
    return (inner(x0 + step) - inner(x0 - step)) / (2 * step);
  }

  /** Производная выражения в точке. */
  function derivativeAt(expr, x0, order, deg) {
    const f = makeFn(expr, deg);
    return requireFinite(derivative(f, x0, order), 'производная в точке x=' + x0);
  }

  /** Касательная в точке: y = m·x + b. */
  function tangent(expr, x0, deg) {
    const f = makeFn(expr, deg);
    const y0 = f(x0);
    const m = derivative(f, x0, 1);
    requireFinite(m, 'производная');
    return { m: m, b: y0 - m * x0, y0: y0 };
  }

  /** Определённый интеграл методом Симпсона (n — чётное число отрезков). */
  function integral(f, a, b, n) {
    n = n || 1000;
    if (n % 2 === 1) {
      n += 1;
    }
    const fa = f(a);
    const fb = f(b);
    if (!Number.isFinite(fa) || !Number.isFinite(fb)) {
      throw Err('Функция не определена на границе отрезка', 'integrandBoundary');
    }
    const h = (b - a) / n;
    // Сумма нечётных узлов умножается на 4, чётных — на 2.
    let odd = 0;
    let even = 0;
    for (let i = 1; i < n; i++) {
      const v = f(a + i * h);
      if (!Number.isFinite(v)) {
        throw Err('Функция не определена внутри отрезка', 'integrandUndefined');
      }
      if (i % 2 === 1) {
        odd += v;
      } else {
        even += v;
      }
    }
    return (h / 3) * (fa + fb + 4 * odd + 2 * even);
  }

  function integralOf(expr, a, b, n, deg) {
    return requireFinite(integral(makeFn(expr, deg), a, b, n), 'интеграл');
  }

  /** Предел f(x) при x → x0 (двусторонний; при необходимости — односторонний). */
  function limitOf(expr, x0, dir, deg) {
    const f = makeFn(expr, deg);
    const seq = [1e-1, 1e-2, 1e-3, 1e-4, 1e-5, 1e-6];
    function side(sign) {
      let last = NaN;
      for (let i = 0; i < seq.length; i++) {
        const x = x0 + sign * seq[i];
        const v = f(x);
        if (!Number.isFinite(v)) {
          return { value: NaN, diverge: true };
        }
        last = v;
      }
      return { value: last, diverge: false };
    }
    const left = side(-1);
    const right = side(1);
    if (dir === '-') {
      return left;
    }
    if (dir === '+') {
      return right;
    }
    if (left.diverge || right.diverge) {
      return { value: NaN, diverge: true };
    }
    // Двусторонний предел есть, только если оба односторонних совпали.
    if (Math.abs(left.value - right.value) > 1e-4 * Math.max(1, Math.abs(left.value))) {
      return { value: NaN, diverge: true, left: left.value, right: right.value };
    }
    return { value: (left.value + right.value) / 2, diverge: false };
  }

  /** Регуляризация: f(x) в точке, NaN для разрывов. */
  function evalAt(expr, x, deg) {
    return makeFn(expr, deg)(x);
  }

  /** Сумма / произведение f(k) по k от a до b (целые шаги). */
  function sumProduct(expr, a, b, kind, deg) {
    a = Math.round(a);
    b = Math.round(b);
    if (b < a) {
      const tmp = a;
      a = b;
      b = tmp;
    }
    if (b - a > 100000) {
      throw Err('Слишком много слагаемых (максимум 100000)', 'sumTooMany');
    }
    const f = makeFnVar(expr, detectVar(expr), deg);
    let acc = kind === 'product' ? 1 : 0;
    for (let k = a; k <= b; k++) {
      const v = f(k);
      if (!Number.isFinite(v)) {
        throw Err('Функция не определена при k=' + k, 'sumUndefined', { k: k });
      }
      acc = kind === 'product' ? acc * v : acc + v;
    }
    return acc;
  }

  /** Численное интегрирование уже готовой функции f на [a,b]. */
  function integrateFn(f, a, b, n) {
    return integral(f, a, b, n);
  }

  /** Локальные экстремумы на [a,b] (по смене знака производной). */
  function extrema(expr, a, b, samples, deg) {
    samples = samples || 1000;
    const f = makeFn(expr, deg);
    const step = (b - a) / samples;
    const out = [];
    let prevD = derivative(f, a, 1);
    for (let i = 1; i <= samples; i++) {
      const x = a + i * step;
      const d = derivative(f, x, 1);
      if (Number.isFinite(prevD) && Number.isFinite(d) && prevD < 0 !== d < 0) {
        // Уточняем точку бисекцией по производной.
        let lo = x - step;
        let hi = x;
        for (let it = 0; it < 60; it++) {
          const mid = (lo + hi) / 2;
          const dm = derivative(f, mid, 1);
          if (dm < 0 !== derivative(f, lo, 1) < 0) {
            hi = mid;
          } else {
            lo = mid;
          }
        }
        const xc = (lo + hi) / 2;
        // Производная меняет знак: −→+ минимум, +→− максимум.
        const kind = prevD < 0 ? 'min' : 'max';
        const yc = f(xc);
        if (Number.isFinite(yc)) {
          const dup =
            out.length && Math.abs(out[out.length - 1].x - xc) < 1e-6 * Math.max(1, Math.abs(xc));
          if (!dup) {
            out.push({ x: xc, y: yc, kind: kind });
          }
        }
      }
      prevD = d;
    }
    return out;
  }

  return {
    makeFn: makeFn,
    derivative: derivative,
    derivativeAt: derivativeAt,
    tangent: tangent,
    integral: integrateFn,
    integralOf: integralOf,
    limitOf: limitOf,
    evalAt: evalAt,
    sumProduct: sumProduct,
    extrema: extrema,
  };
})();
