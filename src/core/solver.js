/* Численный решатель уравнений.
 *
 * В Python-версии здесь sympy.solve. В веб-версии символьной математики нет,
 * поэтому решаем численно: смена знака + бисекция + метод Ньютона.
 * Это находит корни, но не раскладывает уравнение на множители.
 */
'use strict';
window.CW = window.CW || {};
window.CW.solver = (function () {
  const P = window.CW.parser;

  /** Перевод сообщения, если ядро i18n доступно; иначе — исходный ru-текст. */
  function translate(message, code, params) {
    const i18n = window.CW && window.CW.i18n;
    if (i18n && code) {
      const key = 'core.' + code;
      const tr = i18n.t(key, params);
      if (tr !== key) {
        return tr;
      }
    }
    return message;
  }

  function Err(message, code, params) {
    const e = new Error(translate(message, code, params));
    e.name = 'ExprError';
    e.isExprError = true;
    if (code) {
      e.code = code;
    }
    return e;
  }

  const DEFAULT_SAMPLES = 1000;

  /** Вычислить f(x), защищаясь от inf/nan в точках разрыва. */
  function makeFn(expr, deg) {
    let fn;
    try {
      fn = P.compileFn(expr, deg);
    } catch (e) {
      throw Err('Не удалось разобрать выражение: ' + (e.message || e), 'parseExpression', {
        msg: e.message || e,
      });
    }
    return function (x) {
      let v;
      try {
        v = fn(x);
      } catch (e) {
        return NaN;
      }
      if (typeof v === 'object' && v !== null) {
        v = v.re;
      }
      return typeof v === 'number' ? v : NaN;
    };
  }

  /**
   * Численные корни на [lo, hi].
   *
   * samples <= 0 приводил к бесконечному циклу в Python-версии (шаг
   * становился нулевым или отрицательным), поэтому валидируется здесь.
   */
  function numericRoots(expr, lo, hi, samples, deg) {
    if (samples === undefined) {
      samples = DEFAULT_SAMPLES;
    }
    if (samples === null) {
      samples = DEFAULT_SAMPLES;
    }
    samples = Number(samples);
    if (!Number.isFinite(samples) || !Number.isInteger(samples)) {
      throw Err('Число выборок должно быть целым числом', 'samplesInt');
    }
    if (samples < 2) {
      throw Err('Число выборок должно быть ≥ 2', 'samplesMin');
    }
    lo = Number(lo);
    hi = Number(hi);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
      throw Err('Границы интервала должны быть числами', 'intervalBounds');
    }
    if (lo === hi) {
      throw Err('Интервал имеет нулевую ширину — корни не ищутся', 'zeroWidth');
    }
    if (lo > hi) {
      const t = lo;
      lo = hi;
      hi = t;
    }

    const f = makeFn(expr, deg);
    const step = (hi - lo) / samples;
    const roots = [];
    const EPS = 1e-12;

    function push(x) {
      if (Math.abs(f(x)) > 1e-7) {
        return;
      }
      for (let i = 0; i < roots.length; i++) {
        if (Math.abs(roots[i] - x) < EPS * Math.max(1, Math.abs(x))) {
          return;
        }
      }
      roots.push(x);
    }

    let prevX = lo;
    let prevY = f(lo);
    for (let i = 1; i <= samples; i++) {
      const x = lo + i * step;
      const y = f(x);
      if (Number.isFinite(prevY) && Number.isFinite(y)) {
        if (prevY === 0) {
          push(prevX);
        } else if (prevY < 0 !== y < 0) {
          push(bisect(f, prevX, x, prevY));
        }
      }
      prevX = x;
      prevY = y;
    }
    if (Number.isFinite(prevY) && Math.abs(prevY) < 1e-12) {
      push(prevX);
    }

    // Ньютон уточняет те же корни — метод знаковой переменной на сетке
    // оставляет погрешность порядка шага.
    for (let k = 0; k < roots.length; k++) {
      roots[k] = newton(f, roots[k]);
    }
    roots.sort(function (a, b) {
      return a - b;
    });
    return roots;
  }

  function bisect(f, a, b, fa) {
    const EPS = 1e-14;
    for (let i = 0; i < 200; i++) {
      const mid = (a + b) / 2;
      const fm = f(mid);
      if (!Number.isFinite(fm)) {
        break;
      }
      if (Math.abs(fm) < EPS || Math.abs(b - a) < EPS) {
        return mid;
      }
      if (fa < 0 !== fm < 0) {
        b = mid;
      } else {
        a = mid;
        fa = fm;
      }
    }
    return (a + b) / 2;
  }

  function newton(f, x0) {
    const EPS = 1e-10;
    for (let i = 0; i < 40; i++) {
      const h = Math.max(1e-7, Math.abs(x0) * 1e-7);
      const y0 = f(x0);
      const y1 = f(x0 + h);
      if (!Number.isFinite(y0) || !Number.isFinite(y1)) {
        return x0;
      }
      const d = (y1 - y0) / h;
      if (d === 0) {
        return x0;
      }
      const x1 = x0 - y0 / d;
      if (!Number.isFinite(x1)) {
        return x0;
      }
      if (Math.abs(x1 - x0) < EPS) {
        return x1;
      }
      x0 = x1;
    }
    return x0;
  }

  /**
   * Публичная точка входа. Возвращает {roots, note}.
   * note предупреждает, что найдено численное приближение, а не символьный
   * ответ — в Python-версии здесь был sympy.solve с точными формами.
   */
  function solve(expr, deg, lo, hi, samples) {
    const roots = numericRoots(
      expr,
      lo === undefined ? -100 : lo,
      hi === undefined ? 100 : hi,
      samples,
      deg
    );
    let note = null;
    if (!roots.length) {
      note = translate(
        'Корней на интервале не найдено. Попробуйте расширить диапазон.',
        'noRootsNote'
      );
    } else {
      note = translate('Численные корни (точных символьных форм нет).', 'numericRootsNote');
    }
    return { roots: roots, note: note };
  }

  /** Подстановка: значение выражения в точке — для проверки найденного корня. */
  function evaluateAt(expr, x, deg) {
    return makeFn(expr, deg)(x);
  }

  return {
    solve: solve,
    numericRoots: numericRoots,
    evaluateAt: evaluateAt,
  };
})();
