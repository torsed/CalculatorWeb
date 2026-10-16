/* Плотные матрицы: сложение, умножение, определитель, обратная, ранг.
 * Порт core/matrix.py. Частичный выбор ведущего элемента, как в numpy.
 */
'use strict';
window.CW = window.CW || {};
window.CW.matrix = (function () {
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

  function checkFinite(x) {
    if (!Number.isFinite(x)) {
      throw Err('Значение должно быть конечным числом', 'matrixNonFinite');
    }
    return x;
  }

  function fmt(x) {
    if (typeof x !== 'number') {
      return String(x);
    }
    if (Number.isNaN(x)) {
      return 'nan';
    }
    if (!Number.isFinite(x)) {
      return x < 0 ? '-inf' : 'inf';
    }
    if (Number.isInteger(x) && Math.abs(x) < 1e15) {
      return String(x);
    }
    return x.toPrecision(6).replace(/0+$/, '').replace(/\.$/, '');
  }

  /** Разбор текста матрицы: строки через «;», элементы через пробел/запятую. */
  function parse(text) {
    const t = String(text || '');
    if (!t.trim()) {
      throw Err('Введите матрицу (строки через «;» или с новой строки)', 'matrixInputRequired');
    }
    const rows = t
      .trim()
      .split(/[;\n]+/)
      .filter(function (r) {
        return r.trim();
      });
    if (!rows.length) {
      throw Err('Введите хотя бы одну строку', 'matrixRowRequired');
    }

    const matrix = [];
    let width = null;
    rows.forEach(function (r) {
      const cells = [];
      r.trim()
        .split(/\s+/)
        .forEach(function (chunk) {
          // Одиночная десятичная запятая «2,5» — это число, «1,2,3» — три числа.
          const pieces = /^[-+]?\d+,\d+$/.test(chunk) ? [chunk] : chunk.split(',');
          pieces.forEach(function (tok) {
            if (tok === '') {
              return;
            }
            const v = Number(tok.replace(',', '.'));
            if (tok === '' || isNaN(v)) {
              throw Err('«' + tok + '» не является числом', 'matrixNotANumber', {
                tok: tok,
              });
            }
            checkFinite(v);
            cells.push(v);
          });
        });
      if (!cells.length) {
        throw Err('Пустая строка матрицы', 'matrixEmptyRow');
      }
      if (width === null) {
        width = cells.length;
      } else if (cells.length !== width) {
        throw Err('Все строки матрицы должны быть одинаковой длины', 'matrixRowLengthMismatch');
      }
      matrix.push(cells);
    });
    return matrix;
  }

  function format(m) {
    if (!m || !m.length) {
      return '(пусто)';
    }
    let width = 0;
    m.forEach(function (row) {
      row.forEach(function (x) {
        width = Math.max(width, fmt(x).length);
      });
    });
    return m
      .map(function (row) {
        return row
          .map(function (x) {
            return fmt(x).padStart(width);
          })
          .join('  ');
      })
      .join('\n');
  }

  /** Размеры с проверкой прямоугольности — IndexError пользователю не нужен. */
  function shape(m) {
    if (!m || !m.length) {
      throw Err('Пустая матрица', 'matrixEmpty');
    }
    const w = m[0].length;
    for (let i = 0; i < m.length; i++) {
      if (!Array.isArray(m[i]) || m[i].length !== w) {
        throw Err('Все строки матрицы должны быть одинаковой длины', 'matrixRowLengthMismatch');
      }
    }
    return { rows: m.length, cols: w };
  }

  function isSquare(m) {
    const s = shape(m);
    return s.rows === s.cols;
  }

  function transpose(m) {
    const s = shape(m);
    const out = [];
    for (let j = 0; j < s.cols; j++) {
      const row = [];
      for (let i = 0; i < s.rows; i++) {
        row.push(m[i][j]);
      }
      out.push(row);
    }
    return out;
  }

  function add(a, b) {
    const sa = shape(a),
      sb = shape(b);
    if (sa.rows !== sb.rows || sa.cols !== sb.cols) {
      throw Err('Размеры матриц не совпадают', 'matrixShapeMismatch');
    }
    return a.map(function (row, i) {
      return row.map(function (x, j) {
        return x + b[i][j];
      });
    });
  }

  function sub(a, b) {
    const sa = shape(a),
      sb = shape(b);
    if (sa.rows !== sb.rows || sa.cols !== sb.cols) {
      throw Err('Размеры матриц не совпадают', 'matrixShapeMismatch');
    }
    return a.map(function (row, i) {
      return row.map(function (x, j) {
        return x - b[i][j];
      });
    });
  }

  function mul(a, b) {
    const sa = shape(a),
      sb = shape(b);
    if (sa.cols !== sb.rows) {
      throw Err('Число столбцов A не равно числу строк B', 'matrixDimensionMismatch');
    }
    const out = [];
    for (let i = 0; i < sa.rows; i++) {
      const row = [];
      for (let j = 0; j < sb.cols; j++) {
        let sum = 0;
        for (let k = 0; k < sa.cols; k++) {
          sum += a[i][k] * b[k][j];
        }
        row.push(sum);
      }
      out.push(row);
    }
    return out;
  }

  function identity(n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < n; j++) {
        row.push(i === j ? 1 : 0);
      }
      out.push(row);
    }
    return out;
  }

  /**
   * Порог вырожденности: относительный к норме матрицы, а не абсолютный 1e-12.
   * Абсолютный порог ломал det([[1e-13]]) — матрица вырожденной не была.
   */
  function singularThreshold(m) {
    let max = 0;
    m.forEach(function (row) {
      row.forEach(function (x) {
        const v = Math.abs(x);
        if (v > max) {
          max = v;
        }
      });
    });
    return max * m.length * 2.220446049250313e-16;
  }

  /** LU-разложение с частичным выбором. Возвращает {lu, perm, sign}. */
  function luDecompose(m) {
    const s = shape(m);
    if (s.rows !== s.cols) {
      throw Err('Нужна квадратная матрица', 'matrixSquareRequired');
    }
    const n = s.rows;
    const lu = m.map(function (r) {
      return r.slice();
    });
    const perm = [];
    let i, j, k;
    for (i = 0; i < n; i++) {
      perm.push(i);
    }
    let sign = 1;

    for (k = 0; k < n; k++) {
      // Ведущий элемент — максимум по модулю в столбце.
      let pivot = k,
        best = Math.abs(lu[k][k]);
      for (i = k + 1; i < n; i++) {
        if (Math.abs(lu[i][k]) > best) {
          best = Math.abs(lu[i][k]);
          pivot = i;
        }
      }
      if (best === 0) {
        return { lu: lu, perm: perm, singular: true, sign: sign };
      }
      if (pivot !== k) {
        const t = lu[pivot];
        lu[pivot] = lu[k];
        lu[k] = t;
        const tp = perm[pivot];
        perm[pivot] = perm[k];
        perm[k] = tp;
        sign = -sign;
      }
      for (i = k + 1; i < n; i++) {
        const f = lu[i][k] / lu[k][k];
        lu[i][k] = f;
        for (j = k + 1; j < n; j++) {
          lu[i][j] -= f * lu[k][j];
        }
      }
    }
    return { lu: lu, perm: perm, singular: false, sign: sign };
  }

  function det(m) {
    const d = luDecompose(m);
    if (d.singular) {
      return 0;
    }
    const n = d.lu.length;
    let p = 1;
    for (let i = 0; i < n; i++) {
      p *= d.lu[i][i];
    }
    return p * d.sign;
  }

  function rank(m) {
    const d = luDecompose(copySquare(m));
    if (d.singular) {
      // Считаем ненулевые ведущие элементы в оставшемся блоке.
      const n = d.lu.length;
      const eps = singularThreshold(m);
      let r = 0;
      for (let i = 0; i < n; i++) {
        if (Math.abs(d.lu[i][i]) > eps) {
          r++;
        }
      }
      return r > 0 ? r : rankOfRemainder(d.lu, eps);
    }
    return d.lu.length;
  }

  function copySquare(m) {
    const s = shape(m);
    if (s.rows !== s.cols) {
      throw Err('Ранг определён для квадратных матриц', 'matrixRankSquareRequired');
    }
    return m.map(function (r) {
      return r.slice();
    });
  }

  function rankOfRemainder(lu, eps) {
    let r = 0;
    for (let i = 0; i < lu.length; i++) {
      const row = lu[i];
      let has = false;
      for (let j = i; j < row.length; j++) {
        if (Math.abs(row[j]) > eps) {
          has = true;
          break;
        }
      }
      if (has) {
        r++;
      }
    }
    return r;
  }

  function inverse(m) {
    const d = luDecompose(copySquare(m));
    if (d.singular) {
      throw Err('Матрица вырождена — обратной не существует', 'matrixSingular');
    }
    const n = d.lu.length;
    const eps = singularThreshold(m);
    for (let i = 0; i < n; i++) {
      if (Math.abs(d.lu[i][i]) <= eps) {
        throw Err('Матрица вырождена — обратной не существует', 'matrixSingular');
      }
    }

    // Решаем A·X = I столбец за столбцом.
    const inv = [];
    for (let col = 0; col < n; col++) {
      const rhs = [];
      for (let i = 0; i < n; i++) {
        rhs.push(i === col ? 1 : 0);
      }
      inv.push(solveLUSystem(d, rhs));
    }
    // Столбцы получены — транспонируем в строки.
    return transpose(inv);
  }

  function solveLUSystem(d, b) {
    const lu = d.lu,
      perm = d.perm,
      n = b.length;
    const y = new Array(n);
    let i, j;
    for (i = 0; i < n; i++) {
      y[i] = b[perm[i]];
    }
    // Прямой ход: L·y = b
    for (i = 1; i < n; i++) {
      for (j = 0; j < i; j++) {
        y[i] -= lu[i][j] * y[j];
      }
    }
    // Обратный ход: U·x = y
    const x = new Array(n);
    for (i = n - 1; i >= 0; i--) {
      let sum = y[i];
      for (j = i + 1; j < n; j++) {
        sum -= lu[i][j] * x[j];
      }
      x[i] = sum / lu[i][i];
    }
    return x;
  }

  /** Решение системы A·x = b (Метод Гаусса через то же LU). */
  function solve(a, b) {
    const d = luDecompose(copySquare(a));
    if (d.singular) {
      throw Err('Система не имеет единственного решения', 'matrixNoUniqueSolution');
    }
    return solveLUSystem(d, b.slice());
  }

  /**
   * Собственные значения квадратной матрицы: характеристический многочлен
   * (метод Фаддеева–Леверье) и его корни через window.CW.poly.
   * Возвращает массив чисел и/или {re, im}.
   */
  function eigenvalues(m) {
    if (!isSquare(m)) {
      throw Err(
        'Собственные значения — только для квадратной матрицы',
        'matrixEigenSquareRequired'
      );
    }
    const n = m.length;
    if (n === 1) {
      return [m[0][0]];
    }
    const poly = window.CW.poly;
    if (!poly) {
      throw Err('Модуль полиномов не загружен', 'matrixPolyModuleMissing');
    }
    // λ^n + c1·λ^(n-1) + … + cn; коэффициенты по убыванию степени.
    const c = [1];
    let Mk = identity(n);
    for (let k = 1; k <= n; k++) {
      Mk = mul(m, Mk);
      let tr = 0;
      for (let i = 0; i < n; i++) {
        tr += Mk[i][i];
      }
      const ck = -tr / k;
      c.push(ck);
      for (let i = 0; i < n; i++) {
        Mk[i][i] += ck;
      }
    }
    return poly.roots(c.slice().reverse());
  }

  return {
    parse: parse,
    format: format,
    shape: shape,
    isSquare: isSquare,
    identity: identity,
    transpose: transpose,
    add: add,
    sub: sub,
    mul: mul,
    det: det,
    inverse: inverse,
    rank: rank,
    solve: solve,
    eigenvalues: eigenvalues,
    fmt: fmt,
    singularThreshold: singularThreshold,
  };
})();
