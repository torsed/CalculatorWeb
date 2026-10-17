/* Системы линейных уравнений.
 *
 * Коэффициенты при неизвестных извлекаются численно через парсер: линейная
 * функция полностью определяется значениями в нуле и в единичных точках, поэтому
 * f(v) = f(0) + Σ (f(e_i) − f(0))·v_i. Это надёжнее повторного разбора
 * выражения и переиспользует уже проверенный парсер.
 *
 * Файл самодостаточен для file:// и грузится после core/parser.js и core/matrix.js.
 */
'use strict';
window.CW = window.CW || {};
window.CW.linsystem = (function () {
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

  /** Имена неизвестных: идентификаторы, не являющиеся функциями/константами. */
  function detectVars(expr) {
    const funcs = P.FUNCTIONS;
    const consts = P.CONSTANTS;
    const seen = {};
    const out = [];
    const re = /[A-Za-z][A-Za-z0-9]*/g;
    let m;
    while ((m = re.exec(expr)) !== null) {
      const name = m[0];
      if (funcs[name] || name in consts) {
        continue;
      }
      // Ключевые побитовые слова и мнимые единицы не являются неизвестными.
      if (/^(and|or|xor|not|shl|shr|i|I|j)$/.test(name)) {
        continue;
      }
      if (!seen[name]) {
        seen[name] = true;
        out.push(name);
      }
    }
    return out;
  }

  /** Разбор многострочного текста в список уравнений «f = 0». */
  function parseSystem(text) {
    const lines = String(text || '')
      .split(/[\n;]+/)
      .map(function (s) {
        return s.trim();
      })
      .filter(function (s) {
        return s !== '';
      });
    if (!lines.length) {
      throw Err('Введите хотя бы одно уравнение', 'sysEmpty');
    }
    return lines;
  }

  /**
   * Решить систему. text — уравнения через перевод строки или «;».
   * deg — режим углов для парсера.
   */
  function solve(text, deg, varsHint) {
    const lines = parseSystem(text);
    let vars = varsHint && varsHint.length ? varsHint : null;
    if (!vars) {
      const set = {};
      lines.forEach(function (line) {
        const parts = line.split('=');
        const expr = parts.length === 2 ? '(' + parts[0] + ') - (' + parts[1] + ')' : line;
        detectVars(expr).forEach(function (v) {
          set[v] = true;
        });
      });
      vars = Object.keys(set);
    }
    if (!vars.length) {
      throw Err('Не найдено неизвестных в системе', 'sysNoVars');
    }
    if (lines.length !== vars.length) {
      throw Err(
        'Для ' +
          vars.length +
          ' неизвестных(ых) нужно ровно столько же уравнений, а их ' +
          lines.length,
        'sysCount',
        { vars: vars.length, eqs: lines.length }
      );
    }

    const A = [];
    const b = [];
    for (let li = 0; li < lines.length; li++) {
      const parts = lines[li].split('=');
      if (parts.length > 2) {
        throw Err('В уравнении больше одного «=»', 'sysTooManyEquals');
      }
      const expr = parts.length === 2 ? '(' + parts[0] + ') - (' + parts[1] + ')' : lines[li];
      let f;
      try {
        f = P.compileVars(expr, vars, deg === undefined ? true : deg);
      } catch (e) {
        throw Err('Не удалось разобрать уравнение: ' + (e.message || e), 'sysParse', {
          msg: e.message || e,
          line: lines[li],
        });
      }
      const zeros = vars.map(function () {
        return 0;
      });
      const f0 = numeric(f, zeros);
      const row = [];
      for (let vi = 0; vi < vars.length; vi++) {
        const probe = vars.map(function (_, i) {
          return i === vi ? 1 : 0;
        });
        const fv = numeric(f, probe);
        row.push(fv - f0);
      }
      A.push(row);
      b.push(-f0);
    }

    if (!window.CW.matrix) {
      throw Err('Модуль матриц не загружен', 'sysMatrixMissing');
    }
    let solution;
    try {
      solution = window.CW.matrix.solve(A, b);
    } catch (e) {
      throw Err(
        'Система не имеет единственного решения (возможно, уравнения зависимы)',
        'sysNoUnique'
      );
    }

    // Проверка: подставляем решение обратно. Большой невязке соответствует
    // нелинейная или вырожденная система.
    for (let li = 0; li < lines.length; li++) {
      const parts = lines[li].split('=');
      const expr = parts.length === 2 ? '(' + parts[0] + ') - (' + parts[1] + ')' : lines[li];
      const f = P.compileVars(expr, vars, deg === undefined ? true : deg);
      const res = numeric(f, solution);
      if (!Number.isFinite(res) || Math.abs(res) > 1e-6 * (1 + norm(solution))) {
        throw Err('Система нелинейна или задана некорректно (невязка велика)', 'sysNonlinear');
      }
    }

    return { vars: vars, solution: solution };
  }

  function numeric(f, args) {
    let v;
    try {
      v = f.apply(null, args);
    } catch (e) {
      throw Err('Ошибка вычисления: ' + (e.message || e), 'sysEval', { msg: e.message || e });
    }
    if (typeof v === 'object' && v !== null) {
      v = v.re;
    }
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      throw Err('Выражение не даёт конечного числа', 'sysNotFinite');
    }
    return v;
  }

  function norm(arr) {
    let s = 0;
    for (let i = 0; i < arr.length; i++) {
      s += arr[i] * arr[i];
    }
    return Math.sqrt(s);
  }

  return { detectVars: detectVars, solve: solve };
})();
