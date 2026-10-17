/* Распределения вероятностей и спецфункции.
 *
 * Реализует гамма/бета функции, регуляризованные неполные гамма/бета (для CDF
 * t, χ², F), а также нормальное, биномиальное, Пуассона, гипергеометрическое,
 * экспоненциальное, геометрическое и равномерное распределения с квантилями.
 *
 * Численные схемы — Numerical Recipes (series/continued fraction + Lanczos).
 * Файл самодостаточен для file:// и грузится обычным <script>.
 */
'use strict';
window.CW = window.CW || {};
window.CW.probdist = (function () {
  const LANCZOS = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  /** log Γ(x) — приближение Ланцоша. */
  function logGamma(x) {
    if (x < 0.5) {
      return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
    }
    x -= 1;
    let a = LANCZOS[0];
    const t = x + 7.5;
    for (let i = 1; i < 9; i++) {
      a += LANCZOS[i] / (x + i);
    }
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }

  function gammaFn(x) {
    if (Number.isInteger(x) && x > 0) {
      let r = 1;
      for (let i = 2; i < x; i++) {
        r *= i;
      }
      return r;
    }
    return Math.exp(logGamma(x));
  }

  const ITMAX = 300;
  const EPS = 3e-14;
  const FPMIN = 1e-300;

  /** Регуляризованная нижняя неполная гамма P(a,x) (серия / цепная дробь). */
  function gammaP(a, x) {
    if (x <= 0) {
      return 0;
    }
    if (a <= 0) {
      return NaN;
    }
    if (x >= a + 1) {
      return 1 - gammaQ(a, x);
    }
    // Серия.
    let ap = a;
    let sum = 1 / a;
    let del = sum;
    for (let n = 1; n < ITMAX; n++) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * EPS) {
        break;
      }
    }
    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
  }

  /** Регуляризованная верхняя неполная гамма Q(a,x). */
  function gammaQ(a, x) {
    if (x <= 0) {
      return 1;
    }
    if (x < a + 1) {
      return 1 - gammaP(a, x);
    }
    let b = x + 1 - a;
    let c = 1 / FPMIN;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i < ITMAX; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < FPMIN) {
        d = FPMIN;
      }
      c = b + an / c;
      if (Math.abs(c) < FPMIN) {
        c = FPMIN;
      }
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPS) {
        break;
      }
    }
    return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
  }

  function betacf(a, b, x) {
    const qab = a + b;
    const qap = a + 1;
    const qam = a - 1;
    let c = 1;
    let d = 1 - (qab * x) / qap;
    if (Math.abs(d) < FPMIN) {
      d = FPMIN;
    }
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= ITMAX; m++) {
      const m2 = 2 * m;
      let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < FPMIN) {
        d = FPMIN;
      }
      c = 1 + aa / c;
      if (Math.abs(c) < FPMIN) {
        c = FPMIN;
      }
      d = 1 / d;
      h *= d * c;
      aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < FPMIN) {
        d = FPMIN;
      }
      c = 1 + aa / c;
      if (Math.abs(c) < FPMIN) {
        c = FPMIN;
      }
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPS) {
        break;
      }
    }
    return h;
  }

  /** Регуляризованная неполная бета I_x(a,b). */
  function incBeta(a, b, x) {
    if (x <= 0) {
      return 0;
    }
    if (x >= 1) {
      return 1;
    }
    const bt = Math.exp(
      logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
    );
    if (x < (a + 1) / (a + b + 2)) {
      return (bt * betacf(a, b, x)) / a;
    }
    return 1 - (bt * betacf(b, a, 1 - x)) / b;
  }

  /** Функция ошибок через неполную гамму: erf(x) = sign·P(½, x²). */
  function erf(x) {
    if (x === 0) {
      return 0;
    }
    const s = x < 0 ? -1 : 1;
    return s * gammaP(0.5, x * x);
  }
  function erfc(x) {
    return 1 - erf(x);
  }

  // ── Непрерывные распределения ─────────────────────────────
  function normalPdf(x, mu, sig) {
    const z = (x - mu) / sig;
    return Math.exp(-0.5 * z * z) / (sig * Math.sqrt(2 * Math.PI));
  }
  function normalCdf(x, mu, sig) {
    return 0.5 * (1 + erf((x - mu) / (sig * Math.SQRT2)));
  }

  function tPdf(t, v) {
    return (
      (Math.exp(logGamma((v + 1) / 2) - logGamma(v / 2)) / Math.sqrt(v * Math.PI)) *
      Math.pow(1 + (t * t) / v, -(v + 1) / 2)
    );
  }
  function tCdf(t, v) {
    const p = 0.5 * incBeta(v / 2, 0.5, v / (v + t * t));
    return t > 0 ? 1 - p : p;
  }

  function chi2Pdf(x, k) {
    if (x <= 0) {
      return 0;
    }
    return Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.LN2 - logGamma(k / 2));
  }
  function chi2Cdf(x, k) {
    return gammaP(k / 2, x / 2);
  }

  function fPdf(x, d1, d2) {
    if (x <= 0) {
      return 0;
    }
    const lnum = (d1 / 2) * Math.log(d1) + (d2 / 2) * Math.log(d2) + (d1 / 2 - 1) * Math.log(x);
    const lden = ((d1 + d2) / 2) * Math.log(d1 * x + d2);
    const lbeta = logGamma(d1 / 2) + logGamma(d2 / 2) - logGamma((d1 + d2) / 2);
    return Math.exp(lnum - lden - lbeta);
  }
  function fCdf(x, d1, d2) {
    if (x <= 0) {
      return 0;
    }
    return incBeta(d1 / 2, d2 / 2, (d1 * x) / (d1 * x + d2));
  }

  function expPdf(x, lambda) {
    return x < 0 ? 0 : lambda * Math.exp(-lambda * x);
  }
  function expCdf(x, lambda) {
    return x < 0 ? 0 : 1 - Math.exp(-lambda * x);
  }

  function uniformPdf(x, a, b) {
    return x < a || x > b ? 0 : 1 / (b - a);
  }
  function uniformCdf(x, a, b) {
    if (x < a) {
      return 0;
    }
    if (x > b) {
      return 1;
    }
    return (x - a) / (b - a);
  }

  // ── Дискретные распределения ──────────────────────────────
  function logComb(n, k) {
    return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
  }

  function binomialPmf(k, n, p) {
    if (k < 0 || k > n) {
      return 0;
    }
    return Math.exp(logComb(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
  }
  function binomialCdf(k, n, p) {
    let s = 0;
    for (let i = 0; i <= k; i++) {
      s += binomialPmf(i, n, p);
    }
    return Math.min(1, s);
  }

  function poissonPmf(k, lambda) {
    if (k < 0) {
      return 0;
    }
    return Math.exp(-lambda + k * Math.log(lambda) - logGamma(k + 1));
  }
  function poissonCdf(k, lambda) {
    // CDF Пуассона = Q(k+1, λ) для регуляризованной верхней неполной гаммы.
    if (k < 0) {
      return 0;
    }
    return gammaQ(k + 1, lambda);
  }

  function geometricPmf(k, p) {
    if (k < 1) {
      return 0;
    }
    return Math.pow(1 - p, k - 1) * p;
  }
  function geometricCdf(k, p) {
    if (k < 1) {
      return 0;
    }
    return 1 - Math.pow(1 - p, k);
  }

  function hyperPmf(k, N, K, n) {
    if (k < Math.max(0, n - (N - K)) || k > Math.min(n, K)) {
      return 0;
    }
    return Math.exp(logComb(K, k) + logComb(N - K, n - k) - logComb(N, n));
  }
  function hyperCdf(k, N, K, n) {
    let s = 0;
    for (let i = 0; i <= k; i++) {
      s += hyperPmf(i, N, K, n);
    }
    return Math.min(1, s);
  }

  // ── Квантили (обратные CDF) ───────────────────────────────
  function bisectQuantile(cdf, p, lo, hi, steps) {
    steps = steps || 200;
    let a = lo;
    let b = hi;
    for (let i = 0; i < steps; i++) {
      const mid = (a + b) / 2;
      if (cdf(mid) < p) {
        a = mid;
      } else {
        b = mid;
      }
    }
    return (a + b) / 2;
  }

  function normalInv(p, mu, sig) {
    if (p <= 0 || p >= 1) {
      return p <= 0 ? -Infinity : Infinity;
    }
    return bisectQuantile(
      function (x) {
        return normalCdf(x, mu, sig);
      },
      p,
      mu - 40 * sig,
      mu + 40 * sig,
      200
    );
  }
  function tInv(p, v) {
    return bisectQuantile(
      function (x) {
        return tCdf(x, v);
      },
      p,
      -1e6,
      1e6,
      300
    );
  }
  function chi2Inv(p, k) {
    return bisectQuantile(
      function (x) {
        return chi2Cdf(x, k);
      },
      p,
      0,
      Math.max(1000, k * 20),
      300
    );
  }
  function fInv(p, d1, d2) {
    return bisectQuantile(
      function (x) {
        return fCdf(x, d1, d2);
      },
      p,
      0,
      1e6,
      300
    );
  }
  function discreteInv(cdf, p, hi) {
    if (p <= 0) {
      return 0;
    }
    if (p >= 1) {
      return hi;
    }
    let lo = 0;
    let h = hi;
    while (lo < h) {
      const mid = Math.floor((lo + h) / 2);
      if (cdf(mid) < p) {
        lo = mid + 1;
      } else {
        h = mid;
      }
    }
    return lo;
  }

  /** Средние и дисперсии — для справки на странице. */
  const DISTS = [
    {
      id: 'normal',
      params: ['mu', 'sigma'],
      cont: true,
      pdf: normalPdf,
      cdf: normalCdf,
      inv: normalInv,
      mean: function (mu) {
        return mu;
      },
      variance: function (mu, sig) {
        return sig * sig;
      },
    },
    {
      id: 'studentT',
      params: ['v'],
      cont: true,
      pdf: tPdf,
      cdf: tCdf,
      inv: tInv,
      mean: function (v) {
        return v > 1 ? 0 : NaN;
      },
      variance: function (v) {
        return v > 2 ? v / (v - 2) : NaN;
      },
    },
    {
      id: 'chi2',
      params: ['k'],
      cont: true,
      pdf: chi2Pdf,
      cdf: chi2Cdf,
      inv: chi2Inv,
      mean: function (k) {
        return k;
      },
      variance: function (k) {
        return 2 * k;
      },
    },
    {
      id: 'fisherF',
      params: ['d1', 'd2'],
      cont: true,
      pdf: fPdf,
      cdf: fCdf,
      inv: fInv,
      mean: function (d1, d2) {
        return d2 > 2 ? d2 / (d2 - 2) : NaN;
      },
      variance: function (d1, d2) {
        return d2 > 4 ? (2 * d2 * d2 * (d1 + d2 - 2)) / (d1 * (d2 - 2) * (d2 - 2) * (d2 - 4)) : NaN;
      },
    },
    {
      id: 'exponential',
      params: ['lambda'],
      cont: true,
      pdf: expPdf,
      cdf: expCdf,
      inv: function (p, lambda) {
        return -Math.log(1 - p) / lambda;
      },
      mean: function (lambda) {
        return 1 / lambda;
      },
      variance: function (lambda) {
        return 1 / (lambda * lambda);
      },
    },
    {
      id: 'uniform',
      params: ['a', 'b'],
      cont: true,
      pdf: uniformPdf,
      cdf: uniformCdf,
      inv: function (p, a, b) {
        return a + p * (b - a);
      },
      mean: function (a, b) {
        return (a + b) / 2;
      },
      variance: function (a, b) {
        return ((b - a) * (b - a)) / 12;
      },
    },
    {
      id: 'binomial',
      params: ['n', 'p'],
      cont: false,
      hi: function (n) {
        return n;
      },
      pdf: binomialPmf,
      cdf: binomialCdf,
      inv: function (p, n, pp) {
        return discreteInv(
          function (k) {
            return binomialCdf(k, n, pp);
          },
          p,
          n
        );
      },
      mean: function (n, p) {
        return n * p;
      },
      variance: function (n, p) {
        return n * p * (1 - p);
      },
    },
    {
      id: 'poisson',
      params: ['lambda'],
      cont: false,
      hi: function (lambda) {
        return Math.ceil(lambda + 10 * Math.sqrt(lambda) + 10);
      },
      pdf: poissonPmf,
      cdf: poissonCdf,
      inv: function (p, lambda) {
        const hi = Math.ceil(lambda + 10 * Math.sqrt(lambda) + 10);
        return discreteInv(
          function (k) {
            return poissonCdf(k, lambda);
          },
          p,
          hi
        );
      },
      mean: function (lambda) {
        return lambda;
      },
      variance: function (lambda) {
        return lambda;
      },
    },
    {
      id: 'geometric',
      params: ['p'],
      cont: false,
      hi: function () {
        return 100000;
      },
      pdf: geometricPmf,
      cdf: geometricCdf,
      inv: function (pp, p) {
        return discreteInv(
          function (k) {
            return geometricCdf(k, p);
          },
          pp,
          100000
        );
      },
      mean: function (p) {
        return 1 / p;
      },
      variance: function (p) {
        return (1 - p) / (p * p);
      },
    },
    {
      id: 'hypergeometric',
      params: ['N', 'K', 'n'],
      cont: false,
      hi: function (N, K, n) {
        return Math.min(n, K);
      },
      pdf: hyperPmf,
      cdf: hyperCdf,
      inv: function (p, N, K, n) {
        const hi = Math.min(n, K);
        return discreteInv(
          function (k) {
            return hyperCdf(k, N, K, n);
          },
          p,
          hi
        );
      },
      mean: function (N, K, n) {
        return (n * K) / N;
      },
      variance: function (N, K, n) {
        return (n * K * (N - K) * (N - n)) / (N * N * (N - 1));
      },
    },
  ];

  return {
    logGamma: logGamma,
    gammaFn: gammaFn,
    gammaP: gammaP,
    gammaQ: gammaQ,
    incBeta: incBeta,
    erf: erf,
    erfc: erfc,
    normalPdf: normalPdf,
    normalCdf: normalCdf,
    normalInv: normalInv,
    tPdf: tPdf,
    tCdf: tCdf,
    tInv: tInv,
    chi2Pdf: chi2Pdf,
    chi2Cdf: chi2Cdf,
    chi2Inv: chi2Inv,
    fPdf: fPdf,
    fCdf: fCdf,
    fInv: fInv,
    binomialPmf: binomialPmf,
    binomialCdf: binomialCdf,
    poissonPmf: poissonPmf,
    poissonCdf: poissonCdf,
    DISTS: DISTS,
  };
})();
