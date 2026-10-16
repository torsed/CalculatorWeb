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
  };
})();
