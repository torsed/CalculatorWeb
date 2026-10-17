/* Теория чисел: простые, факторизация, функция Эйлера, степени по модулю.
 *
 * Порт core/numtheory.py. Все функции бросают ExprError на некорректный ввод —
 * тот же контракт, что и в Python-версии.
 */
'use strict';
window.CW = window.CW || {};
window.CW.numtheory = (function () {
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

  function checkInt(n) {
    const v = typeof n === 'object' && n !== null ? n.re : n;
    if (typeof v !== 'number' || !Number.isFinite(v) || !Number.isInteger(v)) {
      throw ExprError('Ожидается целое число', 'intExpected');
    }
    return v;
  }

  /** Решето Эратосфена до n включительно. */
  function sieve(n) {
    const flags = new Uint8Array(n + 1);
    let i, j;
    for (i = 2; i <= n; i++) {
      flags[i] = 1;
    }
    for (i = 2; i * i <= n; i++) {
      if (!flags[i]) {
        continue;
      }
      for (j = i * i; j <= n; j += i) {
        flags[j] = 0;
      }
    }
    flags[0] = 0;
    if (n >= 1) {
      flags[1] = 0;
    }
    return flags;
  }

  /** Простое ли число. Пробное деление до √n — для единичных запросов быстрее решета. */
  function isPrime(n) {
    n = checkInt(n);
    if (n < 2) {
      return false;
    }
    if (n < 4) {
      return true;
    }
    if (n % 2 === 0) {
      return false;
    }
    if (n % 3 === 0) {
      return n === 3;
    }
    let i = 5;
    while (i * i <= n) {
      if (n % i === 0 || n % (i + 2) === 0) {
        return false;
      }
      i += 6;
    }
    return true;
  }

  /** Простое число, строго большее n. Граница поиска — защита от зависания. */
  const NEXT_PRIME_LIMIT = 1000000;
  function nextPrime(n) {
    n = checkInt(n);
    if (n < 2) {
      return 2;
    }
    let candidate = n + 1;
    if (candidate % 2 === 0) {
      candidate++;
    }
    let steps = 0;
    while (!isPrime(candidate)) {
      candidate += 2;
      if (++steps > NEXT_PRIME_LIMIT) {
        throw ExprError(
          'Следующее простое не найдено за ' + NEXT_PRIME_LIMIT + ' шагов',
          'nextPrimeLimit',
          { limit: NEXT_PRIME_LIMIT }
        );
      }
    }
    return candidate;
  }

  /** Разложение на простые множители: [[p, e], ...] по возрастанию. */
  function factorize(n) {
    n = checkInt(n);
    if (n === 0) {
      return [];
    }
    if (n < 0) {
      throw ExprError('Факторизация определена для неотрицательных чисел', 'factorNegative');
    }
    const out = [];
    let d = 2;
    while (d * d <= n) {
      let e = 0;
      while (n % d === 0) {
        n /= d;
        e++;
      }
      if (e) {
        out.push([d, e]);
      }
      d += d === 2 ? 1 : 2;
    }
    if (n > 1) {
      out.push([n, 1]);
    }
    return out;
  }

  /** Функция Эйлера φ(n) — число чисел от 1 до n, взаимно простых с n. */
  function totient(n) {
    n = checkInt(n);
    if (n < 1) {
      throw ExprError('φ определена для положительных чисел', 'totientPositive');
    }
    let result = n;
    let m = n;
    let d = 2;
    while (d * d <= m) {
      if (m % d === 0) {
        while (m % d === 0) {
          m /= d;
        }
        result -= result / d;
      }
      d += d === 2 ? 1 : 2;
    }
    if (m > 1) {
      result -= result / m;
    }
    return result;
  }

  /** pow(base, exp, mod) — модульное возведение в степень. */
  function modpow(base, exp, mod) {
    base = checkInt(base);
    exp = checkInt(exp);
    mod = checkInt(mod);
    if (mod === 0) {
      throw ExprError('Модуль не может быть нулём', 'modZero');
    }
    const m = Math.abs(mod);
    let result = 1 % m;
    let b = ((base % m) + m) % m;
    let e = exp < 0 ? -exp : exp;
    while (e > 0) {
      if (e & 1) {
        result = (result * b) % m;
      }
      b = (b * b) % m;
      e >>= 1;
    }
    // Отрицательный показатель даёт обратный по модулю.
    return exp < 0 ? modInverse(result, m) : result;
  }

  function modInverse(a, m) {
    // Расширенный алгоритм Евклида: ищем x, y такие что a·x + m·y = gcd(a, m).
    let oldR = ((a % m) + m) % m;
    let r = m;
    let oldX = 1;
    let x = 0;
    while (r !== 0) {
      const q = Math.floor(oldR / r);
      const rTmp = oldR - q * r;
      oldR = r;
      r = rTmp;
      const xTmp = oldX - q * x;
      oldX = x;
      x = xTmp;
    }
    if (oldR !== 1) {
      throw ExprError('Обратный элемент не существует', 'noInverse');
    }
    return ((oldX % m) + m) % m;
  }

  /** Разложение на простые: "12" → "2²·3". */
  function factorString(n) {
    const parts = factorize(n).map(function (p) {
      return p[0] + (p[1] > 1 ? '^' + p[1] : '');
    });
    return parts.length ? parts.join('·') : String(n);
  }

  /** Простые до n — для отображения в интерфейсе. */
  function primesBelow(n) {
    n = checkInt(n);
    if (n < 2) {
      return [];
    }
    const flags = sieve(n);
    const out = [];
    for (let i = 2; i <= n; i++) {
      if (flags[i]) {
        out.push(i);
      }
    }
    return out;
  }

  /** Разрядность n-значного числа в системе счисления base. */
  function digitCount(n, base) {
    n = checkInt(n);
    base = checkInt(base);
    if (base < 2) {
      throw ExprError('Основание должно быть ≥ 2', 'baseTooSmall');
    }
    if (n === 0) {
      return 1;
    }
    let count = 0;
    n = Math.abs(n);
    while (n > 0) {
      n = Math.floor(n / base);
      count++;
    }
    return count;
  }

  /** Наибольший общий делитель (неотрицательный). */
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

  /** Функция Мёбиуса μ(n): 0 при квадратном множителе, иначе (−1)^k. */
  function mobius(n) {
    n = checkInt(n);
    if (n <= 0) {
      throw ExprError('μ определена для положительных чисел', 'mobiusPositive');
    }
    if (n === 1) {
      return 1;
    }
    const f = factorize(n);
    for (let i = 0; i < f.length; i++) {
      if (f[i][1] > 1) {
        return 0;
      }
    }
    return f.length % 2 === 0 ? 1 : -1;
  }

  /** Число простых, не больших n (π(n)). */
  function primePi(n) {
    return primesBelow(n).length;
  }

  /** Число делителей d(n) = ∏(e_i + 1). */
  function divisorCount(n) {
    n = checkInt(n);
    if (n <= 0) {
      throw ExprError('Функция делителей определена для положительных чисел', 'divisorsPositive');
    }
    return factorize(n).reduce(function (acc, p) {
      return acc * (p[1] + 1);
    }, 1);
  }

  /** Сумма делителей σ(n) = ∏(p^{e+1} − 1)/(p − 1). */
  function sumDivisors(n) {
    n = checkInt(n);
    if (n <= 0) {
      throw ExprError('Сумма делителей определена для положительных чисел', 'divisorsPositive');
    }
    return factorize(n).reduce(function (acc, p) {
      return acc * ((Math.pow(p[0], p[1] + 1) - 1) / (p[0] - 1));
    }, 1);
  }

  /**
   * Китайская теорема об остатках: x ≡ a_i (mod m_i). Возвращает {x, mod}.
   * Модули не обязаны быть взаимно простыми; при несовместности — ошибка.
   */
  function crt(pairs) {
    if (!Array.isArray(pairs) || !pairs.length) {
      throw ExprError('Нужен хотя бы один остаток', 'crtEmpty');
    }
    let x = 0;
    let M = 1;
    for (let i = 0; i < pairs.length; i++) {
      const a = checkInt(pairs[i][0]);
      const m = checkInt(pairs[i][1]);
      if (m <= 0) {
        throw ExprError('Модуль должен быть положительным', 'crtModPositive');
      }
      const g = gcd(M, m);
      if ((a - x) % g !== 0) {
        throw ExprError('Система сравнений несовместна', 'crtNoSolution');
      }
      const m1 = M / g;
      const m2 = m / g;
      const inv = modInverse(((m1 % m2) + m2) % m2, m2);
      const t = (((((a - x) / g) * inv) % m2) + m2) % m2;
      x = x + M * t;
      M = M * m2;
      x = ((x % M) + M) % M;
    }
    return { x: x, mod: M };
  }

  /** Непрерывная дробь числа: [a0, a1, …]. */
  function continuedFraction(value, maxTerms) {
    maxTerms = maxTerms || 20;
    if (!Number.isFinite(value)) {
      throw ExprError('Нужно конечное число', 'cfFinite');
    }
    const out = [];
    let x = value;
    for (let i = 0; i < maxTerms; i++) {
      const a = Math.floor(x);
      out.push(a);
      const frac = x - a;
      if (Math.abs(frac) < 1e-12) {
        break;
      }
      x = 1 / frac;
    }
    return out;
  }

  /** Подходящие дроби непрерывной дроби: [[p,q], …]. */
  function convergents(cf) {
    const out = [];
    let h1 = 1;
    let h2 = 0;
    let k1 = 0;
    let k2 = 1;
    for (let i = 0; i < cf.length; i++) {
      const a = cf[i];
      const h = a * h1 + h2;
      const k = a * k1 + k2;
      out.push([h, k]);
      h2 = h1;
      h1 = h;
      k2 = k1;
      k1 = k;
    }
    return out;
  }

  /**
   * Параметры RSA по двум простым: n, φ, d (при заданном e, по умолчанию 65537).
   */
  function rsa(p, q, e) {
    p = checkInt(p);
    q = checkInt(q);
    if (!isPrime(p) || !isPrime(q) || p === q) {
      throw ExprError('p и q должны быть различными простыми числами', 'rsaPrimes');
    }
    e = e === undefined || e === null || e === 0 ? 65537 : checkInt(e);
    const n = p * q;
    const phi = (p - 1) * (q - 1);
    if (gcd(e, phi) !== 1) {
      throw ExprError('e должно быть взаимно просто с φ(n)', 'rsaECoprime');
    }
    const d = modInverse(((e % phi) + phi) % phi, phi);
    return { p: p, q: q, n: n, phi: phi, e: e, d: d };
  }

  return {
    isPrime: isPrime,
    nextPrime: nextPrime,
    factorize: factorize,
    factorString: factorString,
    totient: totient,
    modpow: modpow,
    modInverse: modInverse,
    sieve: sieve,
    primesBelow: primesBelow,
    digitCount: digitCount,
    gcd: gcd,
    mobius: mobius,
    primePi: primePi,
    divisorCount: divisorCount,
    sumDivisors: sumDivisors,
    crt: crt,
    continuedFraction: continuedFraction,
    convergents: convergents,
    rsa: rsa,
  };
})();
