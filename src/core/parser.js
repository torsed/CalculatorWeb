/* Токенайзер + shunting-yard + RPN-вычислитель.
 *
 * Порт логики core/parser.py. Три фазы:
 *   parse(s)        -> массив токенов (с кэшем)
 *   toRpn(tokens)   -> обратная польская запись
 *   evalRpn(rpn)    -> число
 *
 * Все ошибки бросаются как ExprError, чтобы вызывающий код ловил один тип —
 * в Python-версии так же, только вместо слота Qt это обработчик ввода.
 */
'use strict';
window.CW = window.CW || {};
window.CW.parser = (function () {
  function ExprError(message, code, params) {
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

  // ── Константы ──────────────────────────────────────────────
  const CONSTANTS = {
    pi: Math.PI,
    e: Math.E,
    E: Math.E,
    tau: Math.PI * 2,
    phi: (1 + Math.sqrt(5)) / 2,
    c: 299792458,
    g: 9.80665,
    i: { re: 0, im: 1 },
    I: { re: 0, im: 1 },
    j: { re: 0, im: 1 },
    inf: Infinity,
    nan: NaN,
    // Ans — последний результат, M — память. Синхронизируются из calcState.
    ans: 0,
    m: 0,
  };

  const CONST_ALIASES = { π: 'pi', φ: 'phi', ϕ: 'phi', τ: 'tau', '∞': 'inf' };
  const OP_ALIASES = { '×': '*', '÷': '/', '−': '-', '–': '-', '—': '-' };

  // ── Таблица функций ────────────────────────────────────────
  // arity === -1 означает «переменное число аргументов» (проверяется отдельно).
  const FUNCTIONS = {};

  function def(name, arity, fn) {
    FUNCTIONS[name] = { arity: arity, fn: fn };
  }

  function safe(fn) {
    return function () {
      try {
        return fn.apply(null, arguments);
      } catch (e) {
        const msg = String(e.message || e);
        throw ExprError(msg, 'nativeError', { message: msg });
      }
    };
  }

  // Комплексная арифметика: {re, im} либо обычное число.
  // Чистый комплекс (im === 0) всегда сворачивается в обычное число — иначе
  // cAdd(1, mkC(1,0)) вернул бы {re:2, im:0}, и последующий sqrt ушёл бы в
  // комплексную ветку вместо Math.sqrt.
  function isC(z) {
    return typeof z === 'object' && z !== null && z.im !== undefined;
  }
  function mkC(re, im) {
    return im === 0 ? re : { re: re, im: im };
  }
  function toC(z) {
    return isC(z) ? z : { re: z, im: 0 };
  }
  function isRe(z) {
    return typeof z === 'number';
  }

  function cAdd(a, b) {
    if (!isC(a) && !isC(b)) {
      return a + b;
    }
    a = toC(a);
    b = toC(b);
    return mkC(a.re + b.re, a.im + b.im);
  }
  function cSub(a, b) {
    if (!isC(a) && !isC(b)) {
      return a - b;
    }
    a = toC(a);
    b = toC(b);
    return mkC(a.re - b.re, a.im - b.im);
  }
  function cMul(a, b) {
    if (!isC(a) && !isC(b)) {
      return a * b;
    }
    a = toC(a);
    b = toC(b);
    return mkC(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  }
  function cDiv(a, b) {
    if (!isC(a) && !isC(b)) {
      if (b === 0) {
        // IEEE 754: division by zero returns signed Infinity or NaN
        return a > 0 ? Infinity : a < 0 ? -Infinity : NaN;
      }
      return a / b;
    }
    a = toC(a);
    b = toC(b);
    const d = b.re * b.re + b.im * b.im;
    if (d === 0) {
      // IEEE 754: complex division by zero → Infinity / NaN based on numerator
      const reRes = a.re === 0 ? NaN : a.re > 0 ? Infinity : -Infinity;
      const imRes = a.im === 0 ? NaN : a.im > 0 ? Infinity : -Infinity;
      return mkC(reRes, imRes);
    }
    return mkC((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
  }

  // Комплексный логарифм и экспонента — нужны для степени с дробным показателем.
  function cLog(z) {
    if (isRe(z) && z > 0) {
      return Math.log(z);
    }
    if (isRe(z) && z === 0) {
      return -Infinity;
    }
    z = toC(z);
    const r = Math.sqrt(z.re * z.re + z.im * z.im);
    if (r === 0) {
      // IEEE 754: complex log(0) → -Infinity
      return -Infinity;
    }
    return mkC(Math.log(r), Math.atan2(z.im, z.re));
  }
  function cExp(z) {
    if (isRe(z)) {
      return Math.exp(z);
    }
    z = toC(z);
    const m = Math.exp(z.re);
    return mkC(m * Math.cos(z.im), m * Math.sin(z.im));
  }
  function cSqrt(z) {
    if (isRe(z) && z >= 0) {
      return Math.sqrt(z);
    }
    if (isRe(z) && z < 0) {
      return mkC(0, Math.sqrt(-z));
    }
    // sqrt(0) обязан вернуть 0, а не бросить: через log(0) не пройти.
    // Это нужно acosh(1) = ln(1 + sqrt(0)) = 0.
    const c = toC(z);
    if (c.re === 0 && c.im === 0) {
      return 0;
    }
    // sqrt(z) = exp(log(z)/2) — работает и для отрицательных, и для комплексных.
    const h = cMul(cLn(z), mkC(0.5, 0));
    return cExp(h);
  }
  function cPow(a, b) {
    if (isRe(a) && isRe(b)) {
      if (a < 0 && !Number.isInteger(b)) {
        return cExp(cMul(cLn(a), toC(b)));
      }
      return powChecked(a, b);
    }
    if (isRe(b) && Number.isInteger(b)) {
      // Целая степень — возведение в куб быстрее и точнее, чем через log/exp.
      if (isRe(a)) {
        return powChecked(a, b);
      }
      const n = b < 0 ? -b : b;
      let acc = toC(1);
      for (let i = 0; i < n; i++) {
        acc = cMul(acc, a);
      }
      return b < 0 ? cDiv(1, acc) : acc;
    }
    // ВАЖНО: именно натуральный логарифм. С log10 результат 8^(1/3) был бы 1.87
    // вместо 2 — комплексная степень всегда считается через ln.
    return cExp(cMul(cLn(a), toC(b)));
  }

  /** Возведение в степень с проверкой переполнения — как math.pow в Python. */
  function powChecked(a, b) {
    let r;
    try {
      r = Math.pow(a, b);
    } catch (e) {
      const msg = String(e.message || e);
      throw ExprError(msg, 'nativeError', { message: msg });
    }
    // IEEE 754: overflow returns Infinity; underflow returns 0; no exception thrown
    return r;
  }

  // Тригонометрия в комплексной плоскости.
  function cSin(z) {
    if (isRe(z)) {
      return Math.sin(z);
    }
    z = toC(z);
    return mkC(Math.sin(z.re) * Math.cosh(z.im), Math.cos(z.re) * Math.sinh(z.im));
  }
  function cCos(z) {
    if (isRe(z)) {
      return Math.cos(z);
    }
    z = toC(z);
    return mkC(Math.cos(z.re) * Math.cosh(z.im), -Math.sin(z.re) * Math.sinh(z.im));
  }
  function cTan(z) {
    return cDiv(cSin(z), cCos(z));
  }
  function cSinh(z) {
    if (isRe(z)) {
      return Math.sinh(z);
    }
    z = toC(z);
    return mkC(Math.sinh(z.re) * Math.cos(z.im), Math.cosh(z.re) * Math.sin(z.im));
  }
  function cCosh(z) {
    if (isRe(z)) {
      return Math.cosh(z);
    }
    z = toC(z);
    return mkC(Math.cosh(z.re) * Math.cos(z.im), Math.sinh(z.re) * Math.sin(z.im));
  }
  function cAsin(z) {
    if (isRe(z) && z >= -1 && z <= 1) {
      return Math.asin(z);
    }
    // asin(z) = -i·log(i·z + sqrt(1 - z²))
    const one = mkC(1, 0);
    const inner = cSqrt(cSub(one, cMul(z, z)));
    const iz = cMul(mkC(0, 1), z);
    const t = cMul(mkC(0, -1), cLog(cAdd(iz, inner)));
    return toC(t);
  }
  function cAcos(z) {
    if (isRe(z) && z >= -1 && z <= 1) {
      return Math.acos(z);
    }
    // acos(z) = π/2 - asin(z)
    return cSub(mkC(Math.PI / 2, 0), cAsin(z));
  }
  function cAtan(z) {
    if (isRe(z)) {
      return Math.atan(z);
    }
    // atan(z) = (i/2)·log((i+z)/(i-z))
    const i = mkC(0, 1);
    const half_i = mkC(0, 0.5);
    return cMul(half_i, cLog(cDiv(cAdd(i, z), cSub(i, z))));
  }
  function cAtan2(y, x) {
    if (isRe(y) && isRe(x)) {
      return Math.atan2(y, x);
    }
    if (isRe(y) && x === 0) {
      return mkC(y > 0 ? Math.PI / 2 : -Math.PI / 2, 0);
    }
    if (isRe(x) && y === 0) {
      return x > 0 ? mkC(0, 0) : mkC(Math.PI, 0);
    }
    // atan2(y, x) = asin(y / |z|), где |z| = sqrt(x^2 + y^2)
    const len = Math.sqrt(x * x + y * y);
    return cAsin(cDiv(y, len));
  }
  function cAbs(z) {
    if (isRe(z)) {
      return Math.abs(z);
    }
    z = toC(z);
    return Math.sqrt(z.re * z.re + z.im * z.im);
  }
  // Десятичный логарифм. ВАЖНО: имя cLog10, а не cLog — иначе перекрывало бы
  // комплексный натуральный логарифм cLog, который используют cAsin/cAtan.
  function cLog10(z) {
    let real;
    if (isRe(z) && z > 0) {
      real = Math.log10(z);
    } else {
      // Комплексный логарифм считаем напрямую: ln|z| + i·arg(z) для base-10.
      const c = toC(z);
      const r = Math.sqrt(c.re * c.re + c.im * c.im);
      if (r === 0) {
        // IEEE 754: log10(0) → -Infinity
        return -Infinity;
      }
      real = cMul(mkC(Math.log10(r), 0), mkC(1 / Math.LN10, 0));
      real = cAdd(real, mkC(0, Math.atan2(c.im, c.re) / Math.LN10));
    }
    return real;
  }
  function cLn(z) {
    if (isRe(z) && z > 0) {
      return Math.log(z);
    }
    if (isRe(z) && z === 0) {
      return -Infinity;
    }
    const c = toC(z);
    const r = Math.sqrt(c.re * c.re + c.im * c.im);
    if (r === 0) {
      // IEEE 754: ln(0) complex → -Infinity (divide-by-zero exception)
      return -Infinity;
    }
    return mkC(Math.log(r), Math.atan2(c.im, c.re));
  }

  function toIntStrict(v) {
    if (isC(v)) {
      if (v.im !== 0) {
        throw ExprError('Побитовые операции определены только для целых чисел', 'bitwiseInts');
      }
      v = v.re;
    }
    if (typeof v !== 'number' || !Number.isFinite(v) || !Number.isInteger(v)) {
      throw ExprError('Побитовые операции определены только для целых чисел', 'bitwiseInts');
    }
    return v;
  }

  function factInt(n) {
    if (isC(n)) {
      throw ExprError('Факториал определён только для целых чисел', 'factInteger');
    }
    if (!Number.isInteger(n)) {
      throw ExprError('Факториал определён только для целых чисел', 'factInteger');
    }
    if (n < 0) {
      throw ExprError('Факториал определён только для неотрицательных чисел', 'factNegative');
    }
    if (n > 170) {
      throw ExprError('Факториал слишком велик для double', 'factTooLarge');
    }
    let r = 1;
    for (let i = 2; i <= n; i++) {
      r *= i;
    }
    return r;
  }

  // ── Регистрация функций ────────────────────────────────────
  def('sin', 1, cSin);
  def('cos', 1, cCos);
  def('tan', 1, cTan);
  def('asin', 1, cAsin);
  def('acos', 1, cAcos);
  def('atan', 1, cAtan);
  def('sinh', 1, cSinh);
  def('cosh', 1, cCosh);
  def(
    'tanh',
    1,
    safe(function (z) {
      return cDiv(cSinh(z), cCosh(z));
    })
  );
  def('asinh', 1, function (z) {
    return cLn(cAdd(z, cSqrt(cAdd(cMul(z, z), mkC(1, 0)))));
  });
  def('acosh', 1, function (z) {
    return cLn(cAdd(z, cSqrt(cSub(cMul(z, z), mkC(1, 0)))));
  });
  def('atanh', 1, function (z) {
    const one = mkC(1, 0);
    // atanh(z) = ½·ln((1+z)/(1-z))
    return cMul(mkC(0.5, 0), cLn(cDiv(cAdd(one, z), cSub(one, z))));
  });
  def('sqrt', 1, cSqrt);
  def('cbrt', 1, function (z) {
    return isRe(z) ? Math.cbrt(z) : cPow(z, mkC(1 / 3, 0));
  });
  def('ln', 1, cLn);
  def('log', -1, cLn); // ISO 31-11: log без основания = ln (натуральный)
  def('log2', 1, function (z) {
    return cDiv(cLn(z), mkC(Math.LN2, 0));
  });
  def('log10', 1, function (z) {
    return cLog10(z);
  });
  def('exp', 1, cExp);
  def('abs', 1, cAbs);
  def('fabs', 1, cAbs);
  def('floor', 1, function (z) {
    return isRe(z) ? Math.floor(z) : cFloor(z);
  });
  def('ceil', 1, function (z) {
    return isRe(z) ? Math.ceil(z) : cCeil(z);
  });
  def('round', 1, function (z, n) {
    return roundTo(z, n === undefined ? 0 : n);
  });
  def('sign', 1, function (z) {
    if (isC(z)) {
      throw ExprError('sign определён только для вещественных чисел', 'signReal');
    }
    return z > 0 ? 1 : z < 0 ? -1 : 0;
  });
  def('radians', 1, function (z) {
    return cMul(z, mkC(Math.PI / 180, 0));
  });
  def('degrees', 1, function (z) {
    return cMul(z, mkC(180 / Math.PI, 0));
  });
  def('conj', 1, function (z) {
    z = toC(z);
    return mkC(z.re, -z.im);
  });
  def('re', 1, function (z) {
    return toC(z).re;
  });
  def('im', 1, function (z) {
    return toC(z).im;
  });
  def('arg', 1, function (z) {
    z = toC(z);
    return Math.atan2(z.im, z.re);
  });

  def('fact', 1, factInt);
  def('factorial', 1, factInt);
  def('hypot', 2, function (a, b) {
    return cAbs(cSqrt(cAdd(cMul(a, a), cMul(b, b))));
  });
  def('copysign', 2, function (a, b) {
    if (!isRe(a) || !isRe(b)) {
      throw ExprError('copysign требует вещественные числа', 'copysignReal');
    }
    return Math.abs(a) * (b < 0 || Object.is(b, -0) ? -1 : 1);
  });
  def('atan2', 2, cAtan2);
  def('pow', 2, cPow);
  def('gcd', 2, function (a, b) {
    return gcd(toIntStrict(a), toIntStrict(b));
  });
  def('lcm', 2, function (a, b) {
    const x = Math.abs(toIntStrict(a)),
      y = Math.abs(toIntStrict(b));
    if (x === 0 || y === 0) {
      return 0;
    }
    return (x * y) / gcd(x, y);
  });
  def('ncr', 2, function (a, b) {
    return comb(toIntStrict(a), toIntStrict(b));
  });
  def('npr', 2, function (a, b) {
    return perm(toIntStrict(a), toIntStrict(b));
  });
  def('mod', 2, function (a, b) {
    return cMod(a, b);
  });
  def('rem', 2, function (a, b) {
    return cMod(a, b);
  });

  // Побитовые как функции: and(12, 10)
  def('and', 2, function (a, b) {
    return toIntStrict(a) & toIntStrict(b);
  });
  def('or', 2, function (a, b) {
    return toIntStrict(a) | toIntStrict(b);
  });
  def('xor', 2, function (a, b) {
    return toIntStrict(a) ^ toIntStrict(b);
  });
  def('shl', 2, function (a, b) {
    return toIntStrict(a) << toIntStrict(b);
  });
  def('shr', 2, function (a, b) {
    return toIntStrict(a) >>> toIntStrict(b);
  });
  def('not', 1, function (a) {
    return ~toIntStrict(a);
  });

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a;
  }
  function comb(n, k) {
    if (k < 0 || k > n) {
      return 0;
    }
    k = Math.min(k, n - k);
    let r = 1;
    for (let i = 1; i <= k; i++) {
      r = (r * (n - k + i)) / i;
    }
    return Math.round(r);
  }
  function perm(n, k) {
    if (k < 0 || k > n) {
      return 0;
    }
    let r = 1;
    for (let i = 0; i < k; i++) {
      r *= n - i;
    }
    return r;
  }
  function cMod(a, b) {
    if (isC(a) || isC(b)) {
      // Комплексный остаток в JS нет — но пользователю он и не нужен.
      throw ExprError('Оператор % определён только для вещественных чисел', 'modReal');
    }
    if (b === 0) {
      // IEEE 754: modulo by zero → NaN
      return NaN;
    }
    // Python-семантика: знак остатка берётся от делителя.
    return a - Math.floor(a / b) * b;
  }
  function cFloor(z) {
    z = toC(z);
    return mkC(Math.floor(z.re), Math.floor(z.im));
  }
  function cCeil(z) {
    z = toC(z);
    return mkC(Math.ceil(z.re), Math.ceil(z.im));
  }
  function roundTo(z, n) {
    const f = Math.pow(10, n);
    if (isC(z)) {
      z = toC(z);
      return mkC(roundTo(z.re, n), roundTo(z.im, n));
    }
    // Python's round() uses banker's rounding (round half to even).
    // Math.round() uses round half away from zero. Implement banker's rounding.
    const scaled = z * f;
    let r = Math.round(scaled);
    // Banker's rounding: if exactly halfway, round to even.
    // Use a small epsilon to avoid floating-point inaccuracies.
    const eps = 1e-12;
    const frac = scaled - Math.round(scaled);
    if (Math.abs(Math.abs(frac) - 0.5) < eps) {
      if (Math.abs(r) % 2 === 1) {
        r = scaled > 0 ? r - 1 : r + 1;
      }
    }
    return r / f;
  }

  // ── number theory (delegated: core/numtheory.js registers these at load) ──

  /** Register the numtheory wrappers. Called once after that file loads. */
  function registerNumTheory(nt) {
    // Обёртки отдают 1/0, а не true/false: результат функции попадает на
    // дисплей через fmt(), и boolean там отрисовался бы как «true».
    const specs = {
      isprime: { fn: 'isPrime', arity: 1 },
      nextprime: { fn: 'nextPrime', arity: 1 },
      totient: { fn: 'totient', arity: 1 },
      modpow: { fn: 'modpow', arity: 3 },
    };
    Object.keys(specs).forEach(function (name) {
      const spec = specs[name];
      FUNCTIONS[name] = {
        arity: spec.arity,
        fn: function () {
          const args = Array.prototype.slice.call(arguments);
          return Number(nt[spec.fn].apply(nt, args));
        },
      };
    });
    return FUNCTIONS;
  }

  // ── Приоритеты ─────────────────────────────────────────────
  const PRECEDENCE = {
    '^': 4,
    '%': 3,
    '!': 5,
    '*': 2,
    '/': 2,
    '+': 1,
    '-': 1,
    '<<': 0.9,
    '>>': 0.9,
    shl: 0.9,
    shr: 0.9,
    '&': 0.8,
    and: 0.8,
    xor: 0.75,
    '|': 0.7,
    or: 0.7,
    not: 3,
    '~': 3,
  };
  const RIGHT_ASSOC = { '^': 1, '%': 1 };
  const KEYWORD_OPS = { and: 1, or: 1, xor: 1, shl: 1, shr: 1, not: 1 };

  // Функции с переменным числом аргументов.
  const FLEX_ARITY = { log: [1, 2] };

  // ── Токенайзер ────────────────────────────────────────────
  // Порядок групп значим: NUM раньше OP, иначе «1e3» распадётся.
  const TOKEN_RE = new RegExp(
    '(\\d+(?:\\.\\d*)?(?:[eE][+-]?\\d+)?|\\.\\d+(?:[eE][+-]?\\d+)?)' + // NUM
      '|([\\u03c0\\u03c6\\u03d5\\u03c4\\u221e])' + // CONST
      '|(<<|>>)' + // SHIFT
      '|([!+\\-*/^%\\u00d7\\u00f7\\u2212&|~])' + // OP
      '|([a-zA-Z_][a-zA-Z0-9_]*)' + // FUNC
      '|(\\()' + // LPAREN
      '|(\\))' + // RPAREN
      '|(,)' + // COMMA
      '|(\\s+)', // SPACE
    'g'
  );

  const CACHE_MAX = 512;
  let parseCache = Object.create(null);
  let cacheKeys = [];

  function parse(s) {
    const hit = parseCache[s];
    if (hit) {
      return hit.slice();
    }

    const tokens = [];
    let pos = 0;
    let prevNumHadDot = false;
    while (pos < s.length) {
      TOKEN_RE.lastIndex = pos;
      const m = TOKEN_RE.exec(s);
      if (!m || m.index !== pos) {
        throw ExprError('Недопустимый символ: ' + JSON.stringify(s[pos]), 'invalidChar', {
          ch: JSON.stringify(s[pos]),
        });
      }
      pos = TOKEN_RE.lastIndex;
      const num = m[1],
        constCh = m[2],
        shift = m[3],
        op = m[4];
      const func = m[5],
        lp = m[6],
        rp = m[7],
        comma = m[8],
        space = m[9];

      if (space !== undefined) {
        continue;
      }

      if (num !== undefined) {
        const wasFloat = prevNumHadDot;
        prevNumHadDot = num.indexOf('.') >= 0;
        // "1.5.2" — не тихо 1.5 * .2, а всегда опечатка.
        if (wasFloat && num.charAt(0) === '.') {
          throw ExprError('Некорректное число: «1.5.2» — проверьте ввод', 'badNumber');
        }
        tokens.push({ type: 'NUM', value: parseFloat(num) });
        continue;
      }
      prevNumHadDot = false;

      if (constCh !== undefined) {
        tokens.push({ type: 'CONST', value: constCh });
        continue;
      }
      if (shift !== undefined) {
        tokens.push({ type: 'OP', value: shift });
        continue;
      }
      if (op !== undefined) {
        tokens.push({ type: 'OP', value: OP_ALIASES[op] || op });
        continue;
      }
      if (comma !== undefined) {
        tokens.push({ type: 'COMMA', value: comma });
        continue;
      }
      if (lp !== undefined) {
        tokens.push({ type: 'LPAREN', value: lp });
        continue;
      }
      if (rp !== undefined) {
        tokens.push({ type: 'RPAREN', value: rp });
        continue;
      }

      if (func !== undefined) {
        const rest = s.slice(pos).replace(/^\s+/, '');
        // Известная константа без «(» — это константа, а не вызов.
        if (CONSTANTS[func] !== undefined && rest.charAt(0) !== '(') {
          tokens.push({ type: 'CONST', value: func });
          continue;
        }
        // Ключевое побитовое слово в инфиксной форме — оператор, а не вызов.
        if (KEYWORD_OPS[func.toLowerCase()] && rest.charAt(0) !== '(') {
          tokens.push({ type: 'OP', value: func.toLowerCase() });
          continue;
        }
        // Пустой вызов вроде fact() / sin() — ошибка ввода.
        if (/^\(\s*\)/.test(rest)) {
          throw ExprError('Функция ' + func + ' вызвана без аргументов', 'callNoArgs', {
            name: func,
          });
        }
        tokens.push({ type: 'FUNC', value: func });
      }
    }

    if (cacheKeys.length >= CACHE_MAX) {
      delete parseCache[cacheKeys.shift()];
    }
    parseCache[s] = tokens;
    cacheKeys.push(s);
    return tokens.slice();
  }

  function clearCache() {
    parseCache = Object.create(null);
    cacheKeys = [];
  }

  // ── Shunting-yard → RPN ────────────────────────────────────
  function toRpn(tokens) {
    const out = [];
    const ops = [];
    const argStack = [];
    let prev = null;

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const t = tok.type;

      if (t === 'NUM' || t === 'CONST') {
        // Неявное умножение: 2x, 2(x), 3π
        if (prev && (prev.type === 'NUM' || prev.type === 'CONST' || prev.type === 'RPAREN')) {
          ops.push({ type: 'OP', value: '*' });
        }
        out.push(tok);
      } else if (t === 'FUNC') {
        const nxt = tokens[i + 1];
        const isCall = nxt && nxt.type === 'LPAREN';
        if (prev && (prev.type === 'NUM' || prev.type === 'CONST' || prev.type === 'RPAREN')) {
          ops.push({ type: 'OP', value: '*' });
        }
        if (isCall) {
          ops.push(tok);
        } else {
          out.push(tok);
        } // голый идентификатор — переменная
      } else if (t === 'LPAREN') {
        if (prev && (prev.type === 'NUM' || prev.type === 'CONST' || prev.type === 'RPAREN')) {
          ops.push({ type: 'OP', value: '*' });
        }
        ops.push(tok);
        argStack.push(1);
      } else if (t === 'COMMA') {
        while (ops.length && ops[ops.length - 1].type !== 'LPAREN') {
          out.push(ops.pop());
        }
        if (!ops.length || ops[ops.length - 1].type !== 'LPAREN') {
          throw ExprError('Запятая не на своём месте', 'misplacedComma');
        }
        if (argStack.length) {
          argStack[argStack.length - 1] += 1;
        }
      } else if (t === 'RPAREN') {
        while (ops.length && ops[ops.length - 1].type !== 'LPAREN') {
          out.push(ops.pop());
        }
        if (!ops.length || ops[ops.length - 1].type !== 'LPAREN') {
          throw ExprError('Несогласованные скобки', 'unbalancedParens');
        }
        ops.pop();
        const nArgs = argStack.length ? argStack.pop() : 1;
        if (ops.length && ops[ops.length - 1].type === 'FUNC') {
          const fn = ops.pop();
          out.push({ type: 'FUNC', value: fn.value + '|' + nArgs });
        }
      } else if (t === 'OP') {
        // Постфиксный факториал — наивысший приоритет, отдаём сразу.
        if (tok.value === '!') {
          out.push(tok);
          prev = tok;
          continue;
        }

        const isUnary =
          tok.value === '+' || tok.value === '-' || tok.value === '~' || tok.value === 'not';
        const atStart = prev === null || prev.type === 'OP' || prev.type === 'LPAREN';

        if (isUnary && atStart) {
          // Унарный «-» материализует ведущий ноль; унарный «+» намеренно
          // остаётся на стеке — «5 + + 3» это опечатка, а не 8.
          if (tok.value === '-') {
            out.push({ type: 'NUM', value: 0 });
          }
          ops.push(tok);
        } else {
          // «2**3» — опечатка, а не 2 * (*3).
          if (prev && prev.type === 'OP' && !isUnary && !isUnaryTok(prev.value)) {
            throw ExprError(
              'Два оператора подряд: «' + prev.value + tok.value + '»',
              'twoOperators',
              {
                ops: prev.value + tok.value,
              }
            );
          }
          while (ops.length) {
            const top = ops[ops.length - 1];
            if (top.type !== 'OP') {
              break;
            }
            const tp = PRECEDENCE[top.value] || 0;
            const cp = PRECEDENCE[tok.value] || 0;
            if (tp > cp || (tp === cp && !RIGHT_ASSOC[tok.value])) {
              out.push(ops.pop());
            } else {
              break;
            }
          }
          ops.push(tok);
        }
      }
      prev = tok;
    }

    // Висящий оператор — пользователь ещё печатает («2+»). Проверяем поток
    // токенов, а не RPN: у «1+(2-3)» выход законно кончается оператором.
    if (prev && prev.type === 'OP' && prev.value !== '!') {
      throw ExprError('Незавершённое выражение: не хватает операнда', 'incompleteExpression');
    }

    while (ops.length) {
      if (ops[ops.length - 1].type === 'LPAREN' || ops[ops.length - 1].type === 'RPAREN') {
        throw ExprError('Несогласованные скобки', 'unbalancedParens');
      }
      out.push(ops.pop());
    }
    return out;
  }

  function isUnaryTok(v) {
    return v === '+' || v === '-' || v === '~' || v === 'not';
  }

  // ── Вычислитель RPN ────────────────────────────────────────
  function evalRpn(rpn, deg) {
    if (deg === undefined) {
      deg = true;
    }
    const stack = [];
    for (let i = 0; i < rpn.length; i++) {
      const tok = rpn[i];
      const t = tok.type;

      if (t === 'NUM') {
        stack.push(tok.value);
        continue;
      }

      if (t === 'CONST') {
        const name = CONST_ALIASES[String(tok.value)] || String(tok.value);
        if (!(name in CONSTANTS)) {
          throw ExprError('Неизвестная константа: ' + name, 'unknownConstant', { name: name });
        }
        stack.push(CONSTANTS[name]);
        continue;
      }

      if (t === 'FUNC') {
        const raw = String(tok.value);
        const sep = raw.indexOf('|');
        const fname = sep < 0 ? raw : raw.slice(0, sep);
        const spec = FUNCTIONS[fname];
        if (!spec) {
          if (fname in CONSTANTS) {
            stack.push(CONSTANTS[fname]);
            continue;
          }
          throw ExprError('Неизвестная функция: ' + fname, 'unknownFunction', { name: fname });
        }
        const nGiven = sep < 0 ? spec.arity : parseInt(raw.slice(sep + 1), 10);
        if (sep >= 0) {
          const allowed = FLEX_ARITY[fname];
          if (allowed ? allowed.indexOf(nGiven) < 0 : nGiven !== spec.arity) {
            throw ExprError(
              'Функция ' + fname + ' ожидает ' + spec.arity + ' аргумент(ов), а получено ' + nGiven,
              'arityMismatch',
              { name: fname, expected: spec.arity, given: nGiven }
            );
          }
        }
        if (stack.length < nGiven) {
          throw ExprError('Недостаточно аргументов для ' + fname, 'notEnoughArgs', { name: fname });
        }
        const args = stack.splice(stack.length - nGiven, nGiven);

        // Градусы: вход тригонометрии в радианах, выход обратных функций в градусах.
        if (deg && nGiven === 1) {
          if (fname === 'sin' || fname === 'cos' || fname === 'tan') {
            args[0] = isRe(args[0])
              ? (args[0] * Math.PI) / 180
              : cMul(args[0], mkC(Math.PI / 180, 0));
          } else if (fname === 'asin' || fname === 'acos' || fname === 'atan') {
            const r = spec.fn.apply(null, args);
            stack.push(isRe(r) ? (r * 180) / Math.PI : cMul(r, mkC(180 / Math.PI, 0)));
            continue;
          }
        }
        try {
          stack.push(spec.fn.apply(null, args));
        } catch (e) {
          if (e.isExprError) {
            throw e;
          }
          const msg = String(e.message || e);
          throw ExprError(msg, 'nativeError', { message: msg });
        }
        continue;
      }

      if (t === 'OP') {
        const op = tok.value;
        if (op === '!') {
          stack.push(factInt(stack.pop()));
          continue;
        }
        if (op === 'not' || op === '~') {
          stack.push(~toIntStrict(stack.pop()));
          continue;
        }
        const b = stack.pop();
        const a = stack.pop();
        if (stack.length < 0) {
          throw ExprError('Незавершённое выражение', 'incomplete');
        }
        if (a === undefined || b === undefined) {
          throw ExprError(
            'Незавершённое выражение или два оператора подряд',
            'incompleteOrTwoOperators'
          );
        }
        stack.push(binop(op, a, b));
        continue;
      }

      throw ExprError('Неожиданный тип токена: ' + t, 'unexpectedToken', { type: t });
    }

    if (stack.length !== 1) {
      throw ExprError(
        stack.length === 0 ? 'Пустое выражение' : 'Некорректное выражение',
        stack.length === 0 ? 'emptyExpression' : 'invalidExpression'
      );
    }
    return stack[0];
  }

  function binop(op, a, b) {
    switch (op) {
      case '+':
        return cAdd(a, b);
      case '-':
        return cSub(a, b);
      case '*':
        return cMul(a, b);
      case '/':
        return cDiv(a, b);
      case '^':
        return cPow(a, b);
      case '%':
        return cMod(a, b);
      case '<<':
        return toIntStrict(a) << toIntStrict(b);
      case '>>':
        return toIntStrict(a) >>> toIntStrict(b);
      case '&':
        return toIntStrict(a) & toIntStrict(b);
      case 'and':
        return toIntStrict(a) & toIntStrict(b);
      case '|':
        return toIntStrict(a) | toIntStrict(b);
      case 'or':
        return toIntStrict(a) | toIntStrict(b);
      case 'xor':
        return toIntStrict(a) ^ toIntStrict(b);
      case 'shl':
        return toIntStrict(a) << toIntStrict(b);
      case 'shr':
        return toIntStrict(a) >>> toIntStrict(b);
      default:
        throw ExprError('Неизвестный оператор: ' + op, 'unknownOperator', { op: op });
    }
  }

  /** Публичная точка входа: строка → число. */
  function evaluate(expr, deg) {
    if (deg === undefined) {
      deg = true;
    }
    return evalRpn(toRpn(parse(expr)), deg);
  }

  /** Выражение с одной переменной x — для графиков. */
  function compileFn(expr, deg) {
    if (deg === undefined) {
      deg = true;
    }
    const rpn = toRpn(parse(expr));
    return function (x) {
      // Подставляем x как константу на время вычисления.
      const saved = CONSTANTS.x;
      CONSTANTS.x = x;
      try {
        return evalRpn(rpn, deg);
      } finally {
        if (saved === undefined) {
          delete CONSTANTS.x;
        } else {
          CONSTANTS.x = saved;
        }
      }
    };
  }

  return {
    ExprError: ExprError,
    parse: parse,
    toRpn: toRpn,
    evalRpn: evalRpn,
    evaluate: evaluate,
    compileFn: compileFn,
    clearCache: clearCache,
    registerNumTheory: registerNumTheory,
    setAns: function (v) {
      CONSTANTS.ans = v;
    },
    setMemory: function (v) {
      CONSTANTS.m = v;
    },
    CONSTANTS: CONSTANTS,
    FUNCTIONS: FUNCTIONS,
  };
})();
