/* Статистические функции. Порт core/stats.py.
 * Неопределённая для данных статистика возвращает null, а не бросает —
 * страница отрисует её как «—».
 */
'use strict';
window.CW = window.CW || {};
window.CW.stats = (function () {
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

  function require_(values) {
    if (!values || !values.length) {
      throw Err('Нет данных для расчёта', 'noData');
    }
    return values;
  }

  function sum(a) {
    return a.reduce(function (x, y) {
      return x + y;
    }, 0);
  }

  function mean(v) {
    return sum(require_(v)) / v.length;
  }

  function median(v) {
    require_(v);
    const s = v.slice().sort(function (a, b) {
      return a - b;
    });
    const n = s.length,
      mid = n >> 1;
    return n % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  function modes(v) {
    require_(v);
    const counts = new Map();
    v.forEach(function (x) {
      counts.set(x, (counts.get(x) || 0) + 1);
    });
    let top = 0;
    counts.forEach(function (c) {
      if (c > top) {
        top = c;
      }
    });
    if (top === 1) {
      return [];
    }
    const out = [];
    counts.forEach(function (c, k) {
      if (c === top) {
        out.push(k);
      }
    });
    return out.sort(function (a, b) {
      return a - b;
    });
  }

  function variance(v, ddof) {
    require_(v);
    if (ddof === undefined) {
      ddof = 1;
    }
    // ddof — степени свободы; отрицательное значение делит на n+1,
    // чего в стандартной статистике не бывает.
    if (!Number.isInteger(ddof) || ddof < 0) {
      throw Err('ddof должен быть целым ≥ 0', 'badDdof');
    }
    const n = v.length;
    if (n - ddof <= 0) {
      throw Err('Недостаточно значений для такой степени свободы', 'insufficientValues');
    }
    const m = mean(v);
    let s = 0;
    v.forEach(function (x) {
      s += (x - m) * (x - m);
    });
    return s / (n - ddof);
  }

  function stdev(v, ddof) {
    return Math.sqrt(variance(v, ddof));
  }

  /** Квантиль линейной интерполяцией — как numpy по умолчанию. */
  function quantile(v, q) {
    require_(v);
    if (q < 0 || q > 1) {
      throw Err('Квантиль должен быть от 0 до 1', 'badQuantile');
    }
    const s = v.slice().sort(function (a, b) {
      return a - b;
    });
    const n = s.length;
    const pos = q * (n - 1);
    const lo = Math.floor(pos);
    if (lo >= n - 1) {
      return s[n - 1];
    }
    return s[lo] + (s[lo + 1] - s[lo]) * (pos - lo);
  }

  function geometric_mean(v) {
    require_(v);
    if (
      v.some(function (x) {
        return x <= 0;
      })
    ) {
      throw Err('Среднее геометрическое требует положительных чисел', 'geometricPositive');
    }
    return Math.exp(
      sum(
        v.map(function (x) {
          return Math.log(x);
        })
      ) / v.length
    );
  }

  function harmonic_mean(v) {
    require_(v);
    if (
      v.some(function (x) {
        return x === 0;
      })
    ) {
      throw Err('Среднее гармоническое требует ненулевых чисел', 'harmonicNonZero');
    }
    const denom = sum(
      v.map(function (x) {
        return 1 / x;
      })
    );
    // При смешанных знаках сумма 1/x обнуляется — среднее не определено.
    if (denom === 0) {
      throw Err('Среднее гармоническое не определено для смешанных знаков', 'harmonicMixed');
    }
    return v.length / denom;
  }

  /**
   * Оборачивает функцию так, чтобы «своя» ошибка (ExprError) давала null,
   * а не падала наружу.
   * @param {Function} fn
   * @returns {(...args: any[]) => any}
   */
  function safe(fn) {
    return function () {
      try {
        return fn.apply(null, arguments);
      } catch (e) {
        if (e.isExprError) {
          return null;
        }
        throw e;
      }
    };
  }

  /** Все описательные статистики разом; undefined-поля = null. */
  function describe(values) {
    require_(values);
    const n = values.length;
    const q1 = quantile(values, 0.25);
    const q3 = quantile(values, 0.75);
    return {
      count: n,
      sum: sum(values),
      mean: mean(values),
      median: median(values),
      modes: modes(values),
      min: Math.min.apply(null, values),
      max: Math.max.apply(null, values),
      range: Math.max.apply(null, values) - Math.min.apply(null, values),
      variance_sample: n >= 2 ? variance(values, 1) : null,
      stdev_sample: n >= 2 ? stdev(values, 1) : null,
      variance_population: variance(values, 0),
      stdev_population: stdev(values, 0),
      q1: q1,
      q2: quantile(values, 0.5),
      q3: q3,
      iqr: q3 - q1,
      geometric_mean: safe(geometric_mean)(values),
      harmonic_mean: safe(harmonic_mean)(values),
    };
  }

  /** Разбор строки в массив чисел. */
  function parseNumbers(text) {
    const parts = String(text || '')
      .split(/[\s,;]+/)
      .filter(function (s) {
        return s !== '';
      });
    const out = [];
    for (let i = 0; i < parts.length; i++) {
      const t = parts[i].replace(',', '.');
      const v = Number(t);
      if (t === '' || isNaN(v)) {
        throw Err('«' + parts[i] + '» не является числом', 'notANumber', { part: parts[i] });
      }
      out.push(v);
    }
    if (!out.length) {
      throw Err('Введите хотя бы одно число', 'emptyInput');
    }
    return out;
  }

  function requirePair(xs, ys) {
    require_(xs);
    require_(ys);
    if (xs.length !== ys.length) {
      throw Err('Выборки x и y должны быть одинаковой длины', 'pairLength');
    }
    return { n: xs.length };
  }

  function covariance(xs, ys, ddof) {
    const { n } = requirePair(xs, ys);
    if (ddof === undefined) {
      ddof = 1;
    }
    if (n - ddof <= 0) {
      throw Err('Недостаточно пар значений', 'insufficientValues');
    }
    const mx = mean(xs);
    const my = mean(ys);
    let s = 0;
    for (let i = 0; i < n; i++) {
      s += (xs[i] - mx) * (ys[i] - my);
    }
    return s / (n - ddof);
  }

  /** Коэффициент корреляции Пирсона. */
  function pearson(xs, ys) {
    const { n } = requirePair(xs, ys);
    if (n < 2) {
      throw Err('Нужно минимум две пары значений', 'insufficientValues');
    }
    const mx = mean(xs);
    const my = mean(ys);
    let sxy = 0;
    let sxx = 0;
    let syy = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - mx;
      const dy = ys[i] - my;
      sxy += dx * dy;
      sxx += dx * dx;
      syy += dy * dy;
    }
    if (sxx === 0 || syy === 0) {
      return null;
    }
    return sxy / Math.sqrt(sxx * syy);
  }

  function rank(v) {
    const idx = v
      .map(function (x, i) {
        return { x: x, i: i };
      })
      .sort(function (a, b) {
        return a.x - b.x;
      });
    const out = new Array(v.length);
    let i = 0;
    while (i < idx.length) {
      let j = i;
      while (j + 1 < idx.length && idx[j + 1].x === idx[i].x) {
        j++;
      }
      const avg = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) {
        out[idx[k].i] = avg;
      }
      i = j + 1;
    }
    return out;
  }

  /** Коэффициент ранговой корреляции Спирмена. */
  function spearman(xs, ys) {
    requirePair(xs, ys);
    return pearson(rank(xs), rank(ys));
  }

  /** Линейная регрессия y = a·x + b. */
  function linearRegression(xs, ys) {
    const { n } = requirePair(xs, ys);
    if (n < 2) {
      throw Err('Нужно минимум две точки', 'insufficientValues');
    }
    const mx = mean(xs);
    const my = mean(ys);
    let sxy = 0;
    let sxx = 0;
    let syy = 0;
    for (let i = 0; i < n; i++) {
      sxy += (xs[i] - mx) * (ys[i] - my);
      sxx += (xs[i] - mx) * (xs[i] - mx);
      syy += (ys[i] - my) * (ys[i] - my);
    }
    if (sxx === 0) {
      throw Err('Все значения x одинаковы — регрессия невозможна', 'regressionNoX');
    }
    const slope = sxy / sxx;
    const intercept = my - slope * mx;
    const r = syy === 0 ? 1 : sxy / Math.sqrt(sxx * syy);
    return { slope: slope, intercept: intercept, r: r, r2: r * r, n: n };
  }

  /** Полиномиальная регрессия степени d через нормальные уравнения. */
  function polyRegression(xs, ys, degree) {
    const { n } = requirePair(xs, ys);
    degree = degree || 1;
    if (degree < 0 || n < degree + 1) {
      throw Err('Недостаточно точек для такой степени полинома', 'regressionDegree');
    }
    const m = degree + 1;
    // Матрица Грама для базиса 1, x, …, x^d.
    const A = [];
    const rhs = [];
    for (let i = 0; i < m; i++) {
      A.push(new Array(m).fill(0));
      let s = 0;
      for (let k = 0; k < n; k++) {
        s += Math.pow(xs[k], i) * ys[k];
      }
      rhs.push(s);
      for (let j = 0; j < m; j++) {
        let p = 0;
        for (let k = 0; k < n; k++) {
          p += Math.pow(xs[k], i + j);
        }
        A[i][j] = p;
      }
    }
    const coeff = solveGauss(A, rhs); // [c0, c1, …, cd] по возрастанию степени
    let ssTot = 0;
    let ssRes = 0;
    const my = mean(ys);
    for (let k = 0; k < n; k++) {
      let f = 0;
      for (let i = 0; i < m; i++) {
        f += coeff[i] * Math.pow(xs[k], i);
      }
      ssRes += (ys[k] - f) * (ys[k] - f);
      ssTot += (ys[k] - my) * (ys[k] - my);
    }
    return { coeff: coeff, r2: ssTot === 0 ? 1 : 1 - ssRes / ssTot, degree: degree };
  }

  /** Гаусс с частичным выбором — для нормальных уравнений регрессии. */
  function solveGauss(A, b) {
    const n = b.length;
    const M = A.map(function (row, i) {
      return row.concat([b[i]]);
    });
    for (let col = 0; col < n; col++) {
      let piv = col;
      for (let r = col + 1; r < n; r++) {
        if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) {
          piv = r;
        }
      }
      if (Math.abs(M[piv][col]) < 1e-12) {
        throw Err('Система нормальных уравнений вырождена', 'regressionSingular');
      }
      const tmp = M[piv];
      M[piv] = M[col];
      M[col] = tmp;
      for (let r = 0; r < n; r++) {
        if (r === col) {
          continue;
        }
        const f = M[r][col] / M[col][col];
        for (let c = col; c <= n; c++) {
          M[r][c] -= f * M[col][c];
        }
      }
    }
    return M.map(function (row, i) {
      return row[n] / row[i];
    });
  }

  function probdist() {
    if (!window.CW || !window.CW.probdist) {
      throw Err('Модуль распределений не загружен', 'noProbdist');
    }
    return window.CW.probdist;
  }

  /** Одновыборочный t-тест: проверка среднего против mu0. */
  function tTestOne(xs, mu0) {
    require_(xs);
    const n = xs.length;
    if (n < 2) {
      throw Err('Нужно минимум два значения', 'insufficientValues');
    }
    const s = stdev(xs, 1);
    const t = (mean(xs) - mu0) / (s / Math.sqrt(n));
    const df = n - 1;
    const p = 2 * (1 - probdist().tCdf(Math.abs(t), df));
    return { t: t, df: df, p: p };
  }

  /** Двухвыборочный t-тест Уэлча (неравные дисперсии). */
  function tTestTwo(xs, ys) {
    requirePair(xs, ys);
    const na = xs.length;
    const nb = ys.length;
    if (na < 2 || nb < 2) {
      throw Err('В каждой выборке нужно минимум два значения', 'insufficientValues');
    }
    const va = variance(xs, 1) / na;
    const vb = variance(ys, 1) / nb;
    const t = (mean(xs) - mean(ys)) / Math.sqrt(va + vb);
    const df = Math.pow(va + vb, 2) / ((va * va) / (na - 1) + (vb * vb) / (nb - 1));
    const p = 2 * (1 - probdist().tCdf(Math.abs(t), df));
    return { t: t, df: df, p: p };
  }

  /** Доверительный интервал для среднего (по Стьюденту). */
  function confidenceIntervalMean(xs, level) {
    require_(xs);
    const n = xs.length;
    if (n < 2) {
      throw Err('Нужно минимум два значения', 'insufficientValues');
    }
    level = level || 0.95;
    const s = stdev(xs, 1);
    const se = s / Math.sqrt(n);
    const tcrit = probdist().tInv(1 - (1 - level) / 2, n - 1);
    const m = mean(xs);
    return { mean: m, low: m - tcrit * se, high: m + tcrit * se, se: se, level: level };
  }

  /** Критерий согласия χ² (по наблюдаемым и ожидаемым частотам). */
  function chiSquareGoodness(observed, expected) {
    requirePair(observed, expected);
    let chi2 = 0;
    for (let i = 0; i < observed.length; i++) {
      if (expected[i] <= 0) {
        throw Err('Ожидаемые частоты должны быть положительными', 'expectedPositive');
      }
      const d = observed[i] - expected[i];
      chi2 += (d * d) / expected[i];
    }
    const df = observed.length - 1;
    const p = df > 0 ? 1 - probdist().chi2Cdf(chi2, df) : null;
    return { chi2: chi2, df: df, p: p };
  }

  /** Разбор двух столбцов «x y» (по строкам) в пары выборок. */
  function parseColumns(text) {
    const rows = String(text || '')
      .split(/[\n;]+/)
      .map(function (s) {
        return s.trim();
      })
      .filter(function (s) {
        return s !== '';
      });
    const xs = [];
    const ys = [];
    for (let i = 0; i < rows.length; i++) {
      const parts = rows[i].split(/[\s,]+/).filter(function (s) {
        return s !== '';
      });
      if (parts.length < 2) {
        throw Err('В каждой строке нужны два числа (x и y)', 'pairRow', { row: rows[i] });
      }
      const x = Number(parts[0].replace(',', '.'));
      const y = Number(parts[1].replace(',', '.'));
      if (isNaN(x) || isNaN(y)) {
        throw Err('Не число в строке: ' + rows[i], 'pairNumber', { row: rows[i] });
      }
      xs.push(x);
      ys.push(y);
    }
    if (!xs.length) {
      throw Err('Введите хотя бы одну пару чисел', 'emptyInput');
    }
    return { xs: xs, ys: ys };
  }

  return {
    mean: mean,
    median: median,
    modes: modes,
    variance: variance,
    stdev: stdev,
    quantile: quantile,
    geometric_mean: geometric_mean,
    harmonic_mean: harmonic_mean,
    describe: describe,
    parseNumbers: parseNumbers,
    covariance: covariance,
    pearson: pearson,
    spearman: spearman,
    linearRegression: linearRegression,
    polyRegression: polyRegression,
    tTestOne: tTestOne,
    tTestTwo: tTestTwo,
    confidenceIntervalMean: confidenceIntervalMean,
    chiSquareGoodness: chiSquareGoodness,
    parseColumns: parseColumns,
  };
})();
