/* Химия и таблица элементов.
 *
 * Часть pages/: вкладки приложения. Файл самодостаточен для file:// —
 * грузится обычным <script> после core/* и до ui/app.js, регистрируется
 * в window.CW.pages. См. комментарий про window.CW в index.html.
 */
'use strict';
window.CW = window.CW || {};
window.CW.pages = window.CW.pages || {};
/* Общие helpers (F, el) — см. src/ui/pages/helpers.js. */
(function () {
  const F = window.CW.pages._helpers.F();
  const el = window.CW.pages._helpers.el;
  const H = window.CW.pages._helpers;
  const t = window.CW.i18n.t;
  const U = window.CW.i18n.unit;
  // ── Химия ────────────────────────────────────────────────
  const ELEMENTS = [
    [1, 'H', t('chem.el.H'), 1.008],
    [2, 'He', t('chem.el.He'), 4.003],
    [3, 'Li', t('chem.el.Li'), 6.94],
    [4, 'Be', t('chem.el.Be'), 9.012],
    [5, 'B', t('chem.el.B'), 10.81],
    [6, 'C', t('chem.el.C'), 12.011],
    [7, 'N', t('chem.el.N'), 14.007],
    [8, 'O', t('chem.el.O'), 15.999],
    [9, 'F', t('chem.el.F'), 18.998],
    [10, 'Ne', t('chem.el.Ne'), 20.18],
    [11, 'Na', t('chem.el.Na'), 22.99],
    [12, 'Mg', t('chem.el.Mg'), 24.305],
    [13, 'Al', t('chem.el.Al'), 26.982],
    [14, 'Si', t('chem.el.Si'), 28.085],
    [15, 'P', t('chem.el.P'), 30.974],
    [16, 'S', t('chem.el.S'), 32.06],
    [17, 'Cl', t('chem.el.Cl'), 35.45],
    [18, 'Ar', t('chem.el.Ar'), 39.95],
    [19, 'K', t('chem.el.K'), 39.098],
    [20, 'Ca', t('chem.el.Ca'), 40.078],
    [21, 'Sc', t('chem.el.Sc'), 44.956],
    [22, 'Ti', t('chem.el.Ti'), 47.867],
    [23, 'V', t('chem.el.V'), 50.942],
    [24, 'Cr', t('chem.el.Cr'), 51.996],
    [25, 'Mn', t('chem.el.Mn'), 54.938],
    [26, 'Fe', t('chem.el.Fe'), 55.845],
    [27, 'Co', t('chem.el.Co'), 58.933],
    [28, 'Ni', t('chem.el.Ni'), 58.693],
    [29, 'Cu', t('chem.el.Cu'), 63.546],
    [30, 'Zn', t('chem.el.Zn'), 65.38],
    [31, 'Ga', t('chem.el.Ga'), 69.723],
    [32, 'Ge', t('chem.el.Ge'), 72.63],
    [33, 'As', t('chem.el.As'), 74.922],
    [34, 'Se', t('chem.el.Se'), 78.971],
    [35, 'Br', t('chem.el.Br'), 79.904],
    [36, 'Kr', t('chem.el.Kr'), 83.798],
    [37, 'Rb', t('chem.el.Rb'), 85.468],
    [38, 'Sr', t('chem.el.Sr'), 87.62],
    [39, 'Y', t('chem.el.Y'), 88.906],
    [40, 'Zr', t('chem.el.Zr'), 91.224],
    [41, 'Nb', t('chem.el.Nb'), 92.906],
    [42, 'Mo', t('chem.el.Mo'), 95.95],
    [43, 'Tc', t('chem.el.Tc'), 98],
    [44, 'Ru', t('chem.el.Ru'), 101.07],
    [45, 'Rh', t('chem.el.Rh'), 102.91],
    [46, 'Pd', t('chem.el.Pd'), 106.42],
    [47, 'Ag', t('chem.el.Ag'), 107.87],
    [48, 'Cd', t('chem.el.Cd'), 112.41],
    [49, 'In', t('chem.el.In'), 114.82],
    [50, 'Sn', t('chem.el.Sn'), 118.71],
    [51, 'Sb', t('chem.el.Sb'), 121.76],
    [52, 'Te', t('chem.el.Te'), 127.6],
    [53, 'I', t('chem.el.I'), 126.9],
    [54, 'Xe', t('chem.el.Xe'), 131.29],
    [55, 'Cs', t('chem.el.Cs'), 132.91],
    [56, 'Ba', t('chem.el.Ba'), 137.33],
    [57, 'La', t('chem.el.La'), 138.91],
    [58, 'Ce', t('chem.el.Ce'), 140.12],
    [59, 'Pr', t('chem.el.Pr'), 140.91],
    [60, 'Nd', t('chem.el.Nd'), 144.24],
    [61, 'Pm', t('chem.el.Pm'), 145],
    [62, 'Sm', t('chem.el.Sm'), 150.36],
    [63, 'Eu', t('chem.el.Eu'), 151.96],
    [64, 'Gd', t('chem.el.Gd'), 157.25],
    [65, 'Tb', t('chem.el.Tb'), 158.93],
    [66, 'Dy', t('chem.el.Dy'), 162.5],
    [67, 'Ho', t('chem.el.Ho'), 164.93],
    [68, 'Er', t('chem.el.Er'), 167.26],
    [69, 'Tm', t('chem.el.Tm'), 168.93],
    [70, 'Yb', t('chem.el.Yb'), 173.05],
    [71, 'Lu', t('chem.el.Lu'), 174.97],
    [72, 'Hf', t('chem.el.Hf'), 178.49],
    [73, 'Ta', t('chem.el.Ta'), 180.95],
    [74, 'W', t('chem.el.W'), 183.84],
    [75, 'Re', t('chem.el.Re'), 186.21],
    [76, 'Os', t('chem.el.Os'), 190.23],
    [77, 'Ir', t('chem.el.Ir'), 192.22],
    [78, 'Pt', t('chem.el.Pt'), 195.08],
    [79, 'Au', t('chem.el.Au'), 196.97],
    [80, 'Hg', t('chem.el.Hg'), 200.59],
    [81, 'Tl', t('chem.el.Tl'), 204.38],
    [82, 'Pb', t('chem.el.Pb'), 207.2],
    [83, 'Bi', t('chem.el.Bi'), 208.98],
    [84, 'Po', t('chem.el.Po'), 209],
    [85, 'At', t('chem.el.At'), 210],
    [86, 'Rn', t('chem.el.Rn'), 222],
    [87, 'Fr', t('chem.el.Fr'), 223],
    [88, 'Ra', t('chem.el.Ra'), 226],
    [89, 'Ac', t('chem.el.Ac'), 227],
    [90, 'Th', t('chem.el.Th'), 232.04],
    [91, 'Pa', t('chem.el.Pa'), 231.04],
    [92, 'U', t('chem.el.U'), 238.03],
    [93, 'Np', t('chem.el.Np'), 237],
    [94, 'Pu', t('chem.el.Pu'), 244],
    [95, 'Am', t('chem.el.Am'), 243],
    [96, 'Cm', t('chem.el.Cm'), 247],
    [97, 'Bk', t('chem.el.Bk'), 247],
    [98, 'Cf', t('chem.el.Cf'), 251],
    [99, 'Es', t('chem.el.Es'), 252],
    [100, 'Fm', t('chem.el.Fm'), 257],
    [101, 'Md', t('chem.el.Md'), 258],
    [102, 'No', t('chem.el.No'), 259],
    [103, 'Lr', t('chem.el.Lr'), 266],
    [104, 'Rf', t('chem.el.Rf'), 267],
    [105, 'Db', t('chem.el.Db'), 268],
    [106, 'Sg', t('chem.el.Sg'), 269],
    [107, 'Bh', t('chem.el.Bh'), 270],
    [108, 'Hs', t('chem.el.Hs'), 269],
    [109, 'Mt', t('chem.el.Mt'), 278],
    [110, 'Ds', t('chem.el.Ds'), 281],
    [111, 'Rg', t('chem.el.Rg'), 282],
    [112, 'Cn', t('chem.el.Cn'), 285],
    [113, 'Nh', t('chem.el.Nh'), 286],
    [114, 'Fl', t('chem.el.Fl'), 289],
    [115, 'Mc', t('chem.el.Mc'), 290],
    [116, 'Lv', t('chem.el.Lv'), 293],
    [117, 'Ts', t('chem.el.Ts'), 294],
    [118, 'Og', t('chem.el.Og'), 294],
  ];

  const ELEMENT_PROPS = {
    H: {
      name: t('chem.el.H'),
      density: 0.0899,
      melt: 14.01,
      boil: 20.28,
      eneg: 2.2,
      radius: 53,
      config: '1s¹',
    },
    He: {
      name: t('chem.el.He'),
      density: 0.1785,
      melt: 0.95,
      boil: 4.22,
      eneg: null,
      radius: 31,
      config: '1s²',
    },
    Li: {
      name: t('chem.el.Li'),
      density: 0.534,
      melt: 453.69,
      boil: 1603,
      eneg: 0.98,
      radius: 167,
      config: '[He] 2s¹',
    },
    Be: {
      name: t('chem.el.Be'),
      density: 1.85,
      melt: 1560,
      boil: 2742,
      eneg: 1.57,
      radius: 112,
      config: '[He] 2s²',
    },
    B: {
      name: t('chem.el.B'),
      density: 2.34,
      melt: 2349,
      boil: 4200,
      eneg: 2.04,
      radius: 87,
      config: '[He] 2s² 2p¹',
    },
    C: {
      name: t('chem.el.C'),
      density: 2.267,
      melt: 3823,
      boil: 4098,
      eneg: 2.55,
      radius: 67,
      config: '[He] 2s² 2p²',
    },
    N: {
      name: t('chem.el.N'),
      density: 1.251,
      melt: 63.15,
      boil: 77.36,
      eneg: 3.04,
      radius: 56,
      config: '[He] 2s² 2p³',
    },
    O: {
      name: t('chem.el.O'),
      density: 1.429,
      melt: 54.36,
      boil: 90.2,
      eneg: 3.44,
      radius: 48,
      config: '[He] 2s² 2p⁴',
    },
    F: {
      name: t('chem.el.F'),
      density: 1.696,
      melt: 53.48,
      boil: 85.03,
      eneg: 3.98,
      radius: 42,
      config: '[He] 2s² 2p⁵',
    },
    Ne: {
      name: t('chem.el.Ne'),
      density: 0.9002,
      melt: 24.56,
      boil: 27.07,
      eneg: null,
      radius: 38,
      config: '[He] 2s² 2p⁶',
    },
    Na: {
      name: t('chem.el.Na'),
      density: 0.971,
      melt: 370.87,
      boil: 1156,
      eneg: 0.93,
      radius: 190,
      config: '[Ne] 3s¹',
    },
    Mg: {
      name: t('chem.el.Mg'),
      density: 1.738,
      melt: 923,
      boil: 1363,
      eneg: 1.31,
      radius: 145,
      config: '[Ne] 3s²',
    },
    Al: {
      name: t('chem.el.Al'),
      density: 2.7,
      melt: 933.47,
      boil: 2792,
      eneg: 1.61,
      radius: 118,
      config: '[Ne] 3s² 3p¹',
    },
    Si: {
      name: t('chem.el.Si'),
      density: 2.33,
      melt: 1687,
      boil: 3173,
      eneg: 1.9,
      radius: 111,
      config: '[Ne] 3s² 3p²',
    },
    P: {
      name: t('chem.el.P'),
      density: 1.82,
      melt: 317.3,
      boil: 550,
      eneg: 2.19,
      radius: 98,
      config: '[Ne] 3s² 3p³',
    },
    S: {
      name: t('chem.el.S'),
      density: 2.07,
      melt: 388.36,
      boil: 717.87,
      eneg: 2.58,
      radius: 88,
      config: '[Ne] 3s² 3p⁴',
    },
    Cl: {
      name: t('chem.el.Cl'),
      density: 3.214,
      melt: 171.6,
      boil: 239.11,
      eneg: 3.16,
      radius: 79,
      config: '[Ne] 3s² 3p⁵',
    },
    Ar: {
      name: t('chem.el.Ar'),
      density: 1.784,
      melt: 83.81,
      boil: 87.3,
      eneg: null,
      radius: 71,
      config: '[Ne] 3s² 3p⁶',
    },
    K: {
      name: t('chem.el.K'),
      density: 0.856,
      melt: 336.53,
      boil: 1032,
      eneg: 0.82,
      radius: 243,
      config: '[Ar] 4s¹',
    },
    Ca: {
      name: t('chem.el.Ca'),
      density: 1.55,
      melt: 1115,
      boil: 1757,
      eneg: 1.0,
      radius: 197,
      config: '[Ar] 4s²',
    },
    Fe: {
      name: t('chem.el.Fe'),
      density: 7.874,
      melt: 1811,
      boil: 3134,
      eneg: 1.83,
      radius: 156,
      config: '[Ar] 3d⁶ 4s²',
    },
    Cu: {
      name: t('chem.el.Cu'),
      density: 8.96,
      melt: 1357.77,
      boil: 2835,
      eneg: 1.9,
      radius: 128,
      config: '[Ar] 3d¹⁰ 4s¹',
    },
    Zn: {
      name: t('chem.el.Zn'),
      density: 7.14,
      melt: 692.68,
      boil: 1180,
      eneg: 1.65,
      radius: 134,
      config: '[Ar] 3d¹⁰ 4s²',
    },
    Br: {
      name: t('chem.el.Br'),
      density: 3.1028,
      melt: 265.8,
      boil: 332.0,
      eneg: 2.96,
      radius: 94,
      config: '[Ar] 3d¹⁰ 4s² 4p⁵',
    },
    Kr: {
      name: t('chem.el.Kr'),
      density: 3.749,
      melt: 115.78,
      boil: 119.93,
      eneg: 3.0,
      radius: 88,
      config: '[Ar] 3d¹⁰ 4s² 4p⁶',
    },
    Ag: {
      name: t('chem.el.Ag'),
      density: 10.49,
      melt: 1234.93,
      boil: 2435,
      eneg: 1.93,
      radius: 144,
      config: '[Kr] 4d¹⁰ 5s¹',
    },
    I: {
      name: t('chem.el.I'),
      density: 4.933,
      melt: 386.85,
      boil: 457.4,
      eneg: 2.66,
      radius: 133,
      config: '[Kr] 4d¹⁰ 5s² 5p⁵',
    },
    Xe: {
      name: t('chem.el.Xe'),
      density: 5.894,
      melt: 161.4,
      boil: 165.05,
      eneg: 2.6,
      radius: 108,
      config: '[Kr] 4d¹⁰ 5s² 5p⁶',
    },
    Au: {
      name: t('chem.el.Au'),
      density: 19.32,
      melt: 1337.33,
      boil: 3129,
      eneg: 2.54,
      radius: 144,
      config: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹',
    },
    Hg: {
      name: t('chem.el.Hg'),
      density: 13.534,
      melt: 234.32,
      boil: 629.88,
      eneg: 2.0,
      radius: 151,
      config: '[Xe] 4f¹⁴ 5d¹⁰ 6s²',
    },
    Pb: {
      name: t('chem.el.Pb'),
      density: 11.34,
      melt: 600.61,
      boil: 2022,
      eneg: 2.33,
      radius: 154,
      config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²',
    },
    U: {
      name: t('chem.el.U'),
      density: 19.1,
      melt: 1405.3,
      boil: 4404,
      eneg: 1.38,
      radius: 156,
      config: '[Rn] 5f³ 6d¹ 7s²',
    },
  };

  const BY_SYMBOL = {};
  ELEMENTS.forEach(function (e) {
    BY_SYMBOL[e[1]] = e;
  });
  // Merge props into BY_SYMBOL for easy lookup
  Object.keys(ELEMENT_PROPS).forEach(function (sym) {
    if (BY_SYMBOL[sym]) {
      Object.assign(BY_SYMBOL[sym], ELEMENT_PROPS[sym]);
    }
  });

  /** Разбор формулы вида H2O, Ca(OH)2, Fe2(SO4)3. */
  function parseFormula(text) {
    const s = String(text || '').replace(/\s+/g, '');
    if (!s) {
      throw { message: t('chem.err.enterFormula') };
    }
    const counts = {};
    let i = 0;
    let depth = 0;
    while (i < s.length) {
      const ch = s[i];
      if (ch === '(') {
        depth++;
        i++;
        continue;
      }
      if (ch === ')') {
        depth--;
        if (depth < 0) {
          throw { message: t('chem.err.extraClose') };
        }
        i++;
        const mult = readNumber(s, i);
        i = mult.end;
        if (mult.value === 1) {
          mult.value = 0;
        } // множитель вне скобок не применить
        i = mult.end;
        continue;
      }
      if (/[A-Z]/.test(ch)) {
        let sym = ch;
        i++;
        if (i < s.length && /[a-z]/.test(s[i])) {
          sym += s[i];
          i++;
        }
        if (!BY_SYMBOL[sym]) {
          throw { message: t('chem.err.unknownElement', { name: sym }) };
        }
        const n = readNumber(s, i);
        // Множитель «0» — это опечатка, а не «ноль атомов».
        if (n.value === 0) {
          throw { message: t('chem.err.zeroMultiplier', { sym: sym }) };
        }
        counts[sym] = (counts[sym] || 0) + n.value;
        i = n.end;
        continue;
      }
      throw { message: t('chem.err.badChar', { char: ch }) };
    }
    if (depth !== 0) {
      throw { message: t('chem.err.unclosedParen') };
    }
    if (!Object.keys(counts).length) {
      throw { message: t('chem.err.emptyFormula') };
    }
    return counts;
  }

  function readNumber(s, start) {
    const m = /^[0-9]+/.exec(s.slice(start));
    if (!m) {
      return { value: 1, end: start };
    }
    return { value: parseInt(m[0], 10), end: start + m[0].length };
  }

  function molarMass(formula) {
    const counts = typeof formula === 'string' ? parseFormula(formula) : formula;
    let total = 0;
    const parts = [];
    Object.keys(counts).forEach(function (sym) {
      const el = BY_SYMBOL[sym];
      if (!el) {
        throw { message: t('chem.err.unknownElement', { name: sym }) };
      }
      total += el[3] * counts[sym];
      parts.push(sym + (counts[sym] > 1 ? counts[sym] : ''));
    });
    return { mass: total, pretty: parts.join('') };
  }

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

  function lcm(a, b) {
    return (a * b) / gcd(a, b);
  }

  /** Точная дробь — балансировщику нужна целочисленная арифметика, float врёт. */
  function Frac(num, den) {
    if (den === undefined) {
      den = 1;
    }
    if (den < 0) {
      num = -num;
      den = -den;
    }
    const g = gcd(num, den) || 1;
    this.n = num / g;
    this.d = den / g;
  }
  Frac.prototype.add = function (o) {
    return new Frac(this.n * o.d + o.n * this.d, this.d * o.d);
  };
  Frac.prototype.sub = function (o) {
    return new Frac(this.n * o.d - o.n * this.d, this.d * o.d);
  };
  Frac.prototype.mul = function (o) {
    return new Frac(this.n * o.n, this.d * o.d);
  };
  Frac.prototype.div = function (o) {
    return new Frac(this.n * o.d, this.d * o.n);
  };
  Frac.prototype.neg = function () {
    return new Frac(-this.n, this.d);
  };
  Frac.prototype.isZero = function () {
    return this.n === 0;
  };

  /** Баланс химических уравнений: точный Гаусс над дробями, целочисленный ответ. */
  function balanceEquation(text) {
    const sides = String(text || '').split(/->|=>|=/);
    if (sides.length !== 2) {
      throw { message: t('chem.err.equationForm') };
    }
    const left = sides[0]
      .split('+')
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    const right = sides[1]
      .split('+')
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    const all = left.concat(right);
    if (!all.length) {
      throw { message: t('chem.err.emptyEquation') };
    }

    const counts = all.map(function (f) {
      return parseFormula(f);
    });
    const elements = [];
    counts.forEach(function (c) {
      Object.keys(c).forEach(function (sym) {
        if (elements.indexOf(sym) === -1) {
          elements.push(sym);
        }
      });
    });
    if (!elements.length) {
      throw { message: t('chem.err.noElements') };
    }

    // Строки — элементы, столбцы — вещества. Правая часть со знаком минус:
    // тогда решение нуль-пространства сразу даёт баланс масс.
    const m = elements.length,
      n = all.length;
    const A = elements.map(function (sym) {
      return counts.map(function (c, j) {
        const v = c[sym] || 0;
        return new Frac(j < left.length ? v : -v);
      });
    });

    const x = nullspaceVector(A, m, n);
    if (!x) {
      throw { message: t('chem.err.noCoefficients') };
    }

    // Приводим к общему знаменателю, потом к НОД.
    let scale = 1;
    x.forEach(function (f) {
      scale = lcm(scale, f.d);
    });
    let coeff = x.map(function (f) {
      return (f.n * scale) / f.d;
    });
    let g = 0;
    coeff.forEach(function (v) {
      g = gcd(g, v);
    });
    if (g) {
      coeff = coeff.map(function (v) {
        return v / g;
      });
    }
    if (
      !coeff.some(function (v) {
        return v !== 0;
      })
    ) {
      throw { message: t('chem.err.degenerate') };
    }
    // Знак выбираем так, чтобы сумма коэффициентов была положительной.
    const sum = coeff.reduce(function (a, b) {
      return a + b;
    }, 0);
    if (sum < 0) {
      coeff = coeff.map(function (v) {
        return -v;
      });
    }

    const fmt = function (c, i) {
      return (c === 1 ? '' : c) + all[i];
    };
    return (
      left
        .map(function (f, i) {
          return fmt(coeff[i], i);
        })
        .join(' + ') +
      ' → ' +
      right
        .map(function (f, i) {
          return fmt(coeff[left.length + i], left.length + i);
        })
        .join(' + ')
    );
  }

  /** Вектор нуль-пространства матрицы A (m×n) через RREF над дробями. */
  function nullspaceVector(A, m, n) {
    const M = A.map(function (row) {
      return row.slice();
    });
    const pivots = [];
    let r = 0;
    for (let c = 0; c < n && r < m; c++) {
      let p = -1;
      for (let i = r; i < m; i++) {
        if (!M[i][c].isZero()) {
          p = i;
          break;
        }
      }
      if (p === -1) {
        continue;
      }
      const t = M[p];
      M[p] = M[r];
      M[r] = t;
      const piv = M[r][c];
      for (let j = c; j < n; j++) {
        M[r][j] = M[r][j].div(piv);
      }
      for (let i = 0; i < m; i++) {
        if (i === r) {
          continue;
        }
        const f = M[i][c];
        if (f.isZero()) {
          continue;
        }
        for (let j = c; j < n; j++) {
          M[i][j] = M[i][j].sub(f.mul(M[r][j]));
        }
      }
      pivots.push(c);
      r++;
    }
    let free = -1;
    for (let c = 0; c < n; c++) {
      if (pivots.indexOf(c) === -1) {
        free = c;
        break;
      }
    }
    if (free === -1) {
      return null;
    } // нет избыточных веществ — баланс не единственный
    const x = [];
    for (let c = 0; c < n; c++) {
      x.push(c === free ? new Frac(1) : new Frac(0));
    }
    pivots.forEach(function (pc, i) {
      let sum = new Frac(0);
      for (let j = pc + 1; j < n; j++) {
        if (!M[i][j].isZero() && !x[j].isZero()) {
          sum = sum.add(M[i][j].mul(x[j]));
        }
      }
      x[pc] = sum.neg();
    });
    return x;
  }

  // ── Расчёты ─────────────────────────────────────────────
  // Те же «3-4 поля, одно пустое» что и в физике. Все входы в СИ:
  // c — моль/м³, V — м³, P — Па, T — К, I — А, t — с, F = 96485 Кл/моль захардкожен.
  /** @type {FormulaSpec[]} */
  const CHEM_CALCS = [
    [
      'chem.f.molarConcentration',
      ['c', 'n', 'V'],
      function (v) {
        return ['c', v.n / v.V, 'моль/м³'];
      },
    ],
    [
      'chem.f.dilution',
      ['c1', 'V1', 'c2', 'V2'],
      function (v) {
        return ['c₁', (v.c2 * v.V2) / v.V1, 'моль/м³'];
      },
    ],
    [
      'chem.f.faraday',
      ['m', 'M', 'I', 't'],
      function (v) {
        // F = 96 485 Кл/моль — постоянная Фарадея. n (число электронов)
        // здесь фиксировано 2 — типичное Cu/Cu²⁺, Zn/Zn²⁺ и т. п.
        return ['m', (v.M * v.I * v.t) / (2 * 96485), 'г'];
      },
    ],
    [
      'chem.f.gibbs',
      ['G', 'H', 'S', 'T'],
      function (v) {
        // Все в СИ: ΔH и ΔG в Дж, T в К, ΔS в Дж/К.
        return ['ΔG', v.H - v.T * v.S, 'Дж'];
      },
    ],
    [
      'chem.f.boyle',
      ['P1', 'V1', 'P2', 'V2'],
      function (v) {
        return ['P₁', (v.P2 * v.V2) / v.V1, 'Па'];
      },
    ],
    [
      'chem.f.osmotic',
      ['pi', 'c', 'T'],
      function (v) {
        // R = 8.314462618 Дж/(моль·К).
        return ['π', 8.314 * v.c * v.T, 'Па'];
      },
    ],
    [
      'chem.f.arrhenius',
      ['k', 'A', 'T', 'Ea'],
      function (v) {
        // Eₐ в Дж/моль. R = 8.314 Дж/(моль·К).
        return ['k', v.A * Math.exp(-v.Ea / (8.314 * v.T)), ''];
      },
    ],
    [
      'chem.f.dalton',
      ['P', 'p1', 'p2'],
      function (v) {
        return ['P', v.p1 + v.p2, 'Па'];
      },
    ],
    [
      'chem.f.titer',
      ['T', 'm', 'V'],
      function (v) {
        // m в граммах, V в литрах (1 л = 0.001 м³).
        return ['T', v.m / (v.V * 0.001), 'г/л'];
      },
    ],
    [
      'chem.f.molality',
      ['b', 'n', 'm'],
      function (v) {
        // n в моль, m в кг растворителя.
        return ['b', v.n / v.m, 'моль/кг'];
      },
    ],
    [
      'chem.f.massFraction',
      ['w', 'm1', 'm2'],
      function (v) {
        // m₁ — масса вещества, m₂ — масса всего раствора.
        return ['ω', v.m1 / v.m2, ''];
      },
    ],
    [
      'chem.f.waterIonProduct',
      ['H', 'OH'],
      function (v) {
        // Для воды при 25 °C. toNumber('') = NaN, заполненное = число.
        if (isNaN(v.H)) {
          return ['H⁺', 1e-14 / v.OH, 'моль/л'];
        }
        return ['OH⁻', 1e-14 / v.H, 'моль/л'];
      },
    ],
    [
      'chem.f.buffer',
      ['pH', 'pKa', 'ratio'],
      function (v) {
        // ratio = [A⁻]/[HA] — безразмерное отношение концентраций.
        return ['pH', v.pKa + Math.log10(v.ratio), ''];
      },
    ],
    [
      'chem.f.dissociation',
      ['a', 'Ka', 'c'],
      function (v) {
        // Ka — константа диссоциации, c — концентрация, оба в тех же единицах.
        return ['α', Math.sqrt(v.Ka / v.c), ''];
      },
    ],
    [
      'chem.f.nernst',
      ['E', 'E0', 'C'],
      function (v) {
        // n — число электронов, захардкожено как 1. C — молярная концентрация.
        return ['E', v.E0 + (0.059 / 1) * Math.log10(v.C), 'В'];
      },
    ],
    [
      'chem.f.unsaturation',
      ['I', 'c', 'h'],
      function (v) {
        // c — число атомов C, h — число атомов H. Для бензола C₆H₆ → I = 4.
        return ['I', (2 * v.c + 2 - v.h) / 2, ''];
      },
    ],
    [
      'chem.f.equilibriumK',
      ['K', 'G', 'T'],
      function (v) {
        // R = 8.314 Дж/(моль·К).
        return ['K', Math.exp(-v.G / (8.314 * v.T)), ''];
      },
    ],
    [
      'chem.f.yield',
      ['eta', 'm1', 'm2'],
      function (v) {
        // m1 — практически полученная масса, m2 — расчётная (теоретическая).
        return ['η', (v.m1 / v.m2) * 100, '%'];
      },
    ],
    [
      'chem.f.entropyRelation',
      ['S', 'H', 'G', 'T'],
      function (v) {
        // Все энтальпии в Дж, ΔS° в Дж/К.
        return ['ΔS°', (v.H - v.G) / v.T, 'Дж/К'];
      },
    ],
    [
      'chem.f.heatEffect',
      ['Q', 'H', 'mol'],
      function (v) {
        // ΔH в Дж/моль, n в моль — получаем тепло в Дж.
        return ['Q', v.H * v.mol, 'Дж'];
      },
    ],
    [
      'chem.f.stoichiometry',
      ['n1', 'v1', 'v2', 'n2'],
      function (v) {
        // ν — стехиометрические коэффициенты из уравнения.
        return ['n₁', (v.v1 / v.v2) * v.n2, 'моль'];
      },
    ],
    [
      'chem.f.rate',
      ['v', 'c1', 'c2', 't'],
      function (v) {
        // c₁, c₂ — концентрации в начале и конце, t — время.
        return ['v̄', (v.c2 - v.c1) / v.t, 'моль/(м³·с)'];
      },
    ],
    [
      'chem.f.density',
      ['rho', 'm', 'V'],
      function (v) {
        return ['ρ', v.m / v.V, 'кг/м³'];
      },
    ],
  ];

  function mountChem(app) {
    const page = app.pageNodes.chem;
    page.innerHTML = '';

    const card = el('div', 'card');
    card.appendChild(el('h2', null, t('chem.molarMass.title')));
    const input = el('input', 'field');
    input.id = 'chem-formula';
    input.type = 'text';
    input.value = 'H2O';
    input.placeholder = 'H2O, Ca(OH)2, Fe2(SO4)3';
    const inputLabel = el('label', 'label-hint', t('chem.molarMass.label'));
    inputLabel.setAttribute('for', 'chem-formula');
    inputLabel.style.cssText = 'display:block;font-size:12px;color:var(--sub);margin-bottom:4px;';
    const row = el('div', 'row');
    const btn = el('button', 'btn primary', t('chem.btn.compute'));
    const out = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    row.appendChild(btn);
    card.appendChild(inputLabel);
    card.appendChild(input);
    card.appendChild(row);
    card.appendChild(out);

    btn.onclick = function () {
      try {
        const r = molarMass(input.value);
        out.textContent = r.pretty + '\nM = ' + F.fmt(r.mass, 8) + ' ' + U('г/моль');
        out.classList.remove('err');
      } catch (e) {
        out.textContent = e.message || String(e);
        out.classList.add('err');
      }
    };
    input.onkeydown = function (ev) {
      if (ev.key === 'Enter') {
        btn.click();
      }
    };
    page.appendChild(card);

    const chips = el('div', 'chips');
    ['H2O', 'CO2', 'NaCl', 'Ca(OH)2', 'Fe2(SO4)3', 'C6H12O6', 'C2H5OH'].forEach(function (s) {
      const c = el('button', 'chip', s);
      c.onclick = function () {
        input.value = s;
        btn.click();
      };
      chips.appendChild(c);
    });
    page.appendChild(chips);

    // ── Баланс уравнений ────────────────────────────────────
    const balanceCard = el('div', 'card');
    balanceCard.style.marginTop = '10px';
    balanceCard.appendChild(el('h2', null, t('chem.balance.title')));
    const balanceInput = el('input', 'field');
    balanceInput.id = 'chem-balance';
    balanceInput.type = 'text';
    balanceInput.value = 'H2 + O2 -> H2O';
    balanceInput.placeholder = 'H2 + O2 -> H2O, Fe + O2 -> Fe2O3';
    const balanceLabel = el('label', 'label-hint', t('chem.balance.label'));
    balanceLabel.setAttribute('for', 'chem-balance');
    balanceLabel.style.cssText = 'display:block;font-size:12px;color:var(--sub);margin-bottom:4px;';
    const balanceRow = el('div', 'row');
    balanceRow.style.marginTop = '8px';
    const balanceBtn = el('button', 'btn primary', t('chem.btn.balance'));
    const balanceOut = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    balanceRow.appendChild(balanceBtn);
    balanceCard.appendChild(balanceLabel);
    balanceCard.appendChild(balanceInput);
    balanceCard.appendChild(balanceRow);
    balanceCard.appendChild(balanceOut);

    balanceBtn.onclick = function () {
      try {
        const equation = balanceInput.value.trim();
        if (!equation) {
          throw { message: t('chem.err.enterEquation') };
        }
        balanceOut.textContent = balanceEquation(equation);
        balanceOut.classList.remove('err');
      } catch (e) {
        balanceOut.textContent = e.message || String(e);
        balanceOut.classList.add('err');
      }
    };
    balanceInput.onkeydown = function (ev) {
      if (ev.key === 'Enter') {
        balanceBtn.click();
      }
    };
    page.appendChild(balanceCard);

    const balanceChips = el('div', 'chips');
    balanceChips.style.marginTop = '8px';
    [
      'H2 + O2 -> H2O',
      'Fe + O2 -> Fe2O3',
      'C3H8 + O2 -> CO2 + H2O',
      'Fe2O3 + CO -> Fe + CO2',
      'KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2',
    ].forEach(function (s) {
      const c = el('button', 'chip', s);
      c.onclick = function () {
        balanceInput.value = s;
        balanceBtn.click();
      };
      balanceChips.appendChild(c);
    });
    page.appendChild(balanceChips);

    // ── Карточка «Расчёты» ────────────────────────────────
    // Те же правила, что и в физике: одно пустое поле = искомая величина.
    const calcCard = el('div', 'card');
    calcCard.style.marginTop = '10px';
    calcCard.appendChild(el('h2', null, t('chem.calc.title')));
    const calcSel = el('select', 'field');
    CHEM_CALCS.forEach(function (f, i) {
      const o = el('option', null, t(f[0]));
      o.value = String(i);
      calcSel.appendChild(o);
    });
    calcCard.appendChild(calcSel);

    const calcRow = el('div', 'row');
    calcRow.style.marginTop = '8px';
    const calcInputs = [];
    // Число полей берём по самой «длинной» формуле (4 аргумента — Фарадей,
    // Бойль — Мариотт, разбавление).
    let chemMaxKeys = 0;
    CHEM_CALCS.forEach(function (f) {
      if (f[1].length > chemMaxKeys) {
        chemMaxKeys = f[1].length;
      }
    });
    for (let i = 0; i < chemMaxKeys; i++) {
      const f = el('input', 'field');
      f.type = 'text';
      f.inputMode = 'decimal';
      // aria-label ставим явно, иначе скрытые поля падают тест доступности.
      const initKey = CHEM_CALCS[0][1][i] || t('chem.param', { name: i + 1 });
      f.placeholder = initKey;
      f.setAttribute('aria-label', initKey);
      calcRow.appendChild(f);
      calcInputs.push(f);
    }
    calcCard.appendChild(calcRow);
    const calcOut = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    calcCard.appendChild(calcOut);

    function refreshChemInputs() {
      const keys = CHEM_CALCS[parseInt(calcSel.value, 10)][1];
      calcInputs.forEach(function (f, i) {
        if (i < keys.length) {
          f.style.display = '';
          f.placeholder = keys[i];
          f.setAttribute('aria-label', keys[i]);
        } else {
          f.style.display = 'none';
          f.value = '';
          f.placeholder = '';
        }
      });
    }
    calcSel.onchange = refreshChemInputs;
    refreshChemInputs();

    const chemPutKey = function (objs, k, x) {
      objs[k === 'π' ? 'pi' : k] = x;
    };

    function runCalc() {
      try {
        const spec = CHEM_CALCS[parseInt(calcSel.value, 10)];
        const keys = spec[1];
        const vals = {};
        keys.forEach(function (k, i) {
          chemPutKey(vals, k, F.toNumber(calcInputs[i].value));
        });
        const missing = keys.filter(function (k) {
          return calcInputs[keys.indexOf(k)].value.trim() === '';
        });
        if (missing.length !== 1) {
          throw { message: t('chem.err.oneEmpty') };
        }
        const emptyKey = missing[0];
        if (emptyKey === keys[0]) {
          const res = spec[2](vals);
          if (typeof res[1] === 'number' && !Number.isFinite(res[1])) {
            throw { message: t('chem.err.undefined') };
          }
          calcOut.textContent = res[0] + ' = ' + F.fmt(res[1]) + ' ' + U(res[2]);
        } else {
          const x = H.solveInverse(spec, vals, emptyKey, chemPutKey);
          if (!Number.isFinite(x)) {
            throw {
              message: t('chem.err.solve', { target: keys[0], key: emptyKey }),
            };
          }
          calcOut.textContent = emptyKey + ' = ' + F.fmt(x, 6);
        }
        calcOut.classList.remove('err');
      } catch (e) {
        calcOut.textContent = e.message || String(e);
        calcOut.classList.add('err');
      }
    }
    const calcBtn = el('button', 'btn primary', t('common.solve'));
    calcBtn.onclick = runCalc;
    const calcBtnRow = el('div', 'row');
    calcBtnRow.style.marginTop = '8px';
    calcBtnRow.appendChild(calcBtn);
    calcCard.appendChild(calcBtnRow);
    page.appendChild(calcCard);

    // ── Функциональные группы (справочник) ─────────────────
    const groupsCard = el('div', 'card');
    groupsCard.style.marginTop = '10px';
    groupsCard.appendChild(el('h2', null, t('chem.groups.title')));
    const groups = [
      ['−OH', t('chem.group.hydroxyl'), t('chem.groupClass.hydroxyl')],
      ['−COOH', t('chem.group.carboxyl'), t('chem.groupClass.carboxyl')],
      ['−C(=O)−', t('chem.group.carbonyl'), t('chem.groupClass.carbonyl')],
      ['−O−', t('chem.group.ether'), t('chem.groupClass.ether')],
      ['−NH₂', t('chem.group.amino'), t('chem.groupClass.amino')],
      ['−NO₂', t('chem.group.nitro'), t('chem.groupClass.nitro')],
      ['C=C', t('chem.group.doubleBond'), t('chem.groupClass.doubleBond')],
      ['C≡C', t('chem.group.tripleBond'), t('chem.groupClass.tripleBond')],
      ['−C₆H₅', t('chem.group.phenyl'), t('chem.groupClass.phenyl')],
      ['−X', t('chem.group.halogen'), t('chem.groupClass.halogen')],
      ['−SH', t('chem.group.thiol'), t('chem.groupClass.thiol')],
      ['−CN', t('chem.group.cyano'), t('chem.groupClass.cyano')],
      ['−CONH₂', t('chem.group.amide'), t('chem.groupClass.amide')],
      ['−SO₃H', t('chem.group.sulfo'), t('chem.groupClass.sulfo')],
    ];
    const groupsTable = el('table');
    groupsTable.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';
    groupsTable.appendChild(
      (function () {
        const h = el('tr');
        [t('chem.groups.group'), t('chem.groups.name'), t('chem.groups.class')].forEach(
          function (label) {
            const c = el('th', null, label);
            c.style.cssText =
              'text-align:left;padding:4px 6px;border-bottom:1px solid var(--line);color:var(--sub);font-weight:normal;';
            h.appendChild(c);
          }
        );
        return h;
      })()
    );
    groups.forEach(function (row) {
      const tr = el('tr');
      row.forEach(function (cell, i) {
        const td = el('td', null, cell);
        td.style.cssText =
          'padding:4px 6px;border-bottom:1px solid var(--line);' +
          (i === 0 ? 'font-family:ui-monospace,Consolas,monospace;' : '');
        tr.appendChild(td);
      });
      groupsTable.appendChild(tr);
    });
    groupsCard.appendChild(groupsTable);
    page.appendChild(groupsCard);

    // ── Растворимость солей и оснований (справочник) ───────
    // «Р» — растворимо, «М» — мало, «Н» — нерастворимо, «—» — разлагается водой.
    // Строка — катион, столбец — анион. Сокращения для краткости.
    const solCard = el('div', 'card');
    solCard.style.marginTop = '10px';
    solCard.appendChild(el('h2', null, t('chem.sol.title')));
    const solTable = el('table');
    solTable.style.cssText = 'width:100%;border-collapse:collapse;font-size:12px;';
    const anions = ['Cl⁻', 'Br⁻', 'I⁻', 'SO₄²⁻', 'NO₃⁻', 'CO₃²⁻', 'OH⁻'];
    const solSoluble = t('chem.sol.soluble');
    const solSlightly = t('chem.sol.slightly');
    const solInsoluble = t('chem.sol.insoluble');
    /** @type {Array<[string, string[]]>} */
    const cations = [
      ['Na⁺', [solSoluble, solSoluble, solSoluble, solSoluble, solSoluble, solSoluble, solSoluble]],
      ['K⁺', [solSoluble, solSoluble, solSoluble, solSoluble, solSoluble, solSoluble, solSoluble]],
      ['NH₄⁺', [solSoluble, solSoluble, solSoluble, solSoluble, solSoluble, solSoluble, '—']],
      [
        'Ca²⁺',
        [solSoluble, solSoluble, solSoluble, solSlightly, solSoluble, solInsoluble, solSlightly],
      ],
      [
        'Mg²⁺',
        [solSoluble, solSoluble, solSoluble, solSoluble, solSoluble, solInsoluble, solInsoluble],
      ],
      [
        'Ba²⁺',
        [solSoluble, solSoluble, solSoluble, solInsoluble, solSoluble, solInsoluble, solSoluble],
      ],
      ['Cu²⁺', [solSoluble, solSoluble, '—', solSoluble, solSoluble, '—', solInsoluble]],
      [
        'Fe²⁺',
        [solSoluble, solSoluble, solSoluble, solSoluble, solSoluble, solInsoluble, solInsoluble],
      ],
      ['Fe³⁺', [solSoluble, solSoluble, '—', solSoluble, solSoluble, '—', solInsoluble]],
      ['Al³⁺', [solSoluble, solSoluble, '—', solSoluble, solSoluble, '—', solInsoluble]],
      [
        'Zn²⁺',
        [solSoluble, solSoluble, solSoluble, solSoluble, solSoluble, solInsoluble, solInsoluble],
      ],
      [
        'Ag⁺',
        [solInsoluble, solInsoluble, solInsoluble, solSlightly, solSoluble, solInsoluble, '—'],
      ],
      [
        'Pb²⁺',
        [
          solSlightly,
          solSlightly,
          solInsoluble,
          solInsoluble,
          solSoluble,
          solInsoluble,
          solInsoluble,
        ],
      ],
    ];
    const solHead = el('tr');
    el('th', null, '').style.cssText =
      'text-align:left;padding:4px 6px;border-bottom:1px solid var(--line);color:var(--sub);font-weight:normal;';
    const head0 = el('th', null, '');
    head0.style.cssText =
      'padding:4px 6px;border-bottom:1px solid var(--line);color:var(--sub);font-weight:normal;';
    solHead.appendChild(head0);
    anions.forEach(function (a) {
      const c = el('th', null, a);
      c.style.cssText =
        'text-align:center;padding:4px 6px;border-bottom:1px solid var(--line);color:var(--sub);font-weight:normal;';
      solHead.appendChild(c);
    });
    solTable.appendChild(solHead);
    cations.forEach(function (row) {
      const tr = el('tr');
      const c0 = el('td', null, row[0]);
      c0.style.cssText =
        'padding:4px 6px;border-bottom:1px solid var(--line);font-family:ui-monospace,Consolas,monospace;';
      tr.appendChild(c0);
      row[1].forEach(function (v) {
        const td = el('td', null, v);
        td.style.cssText = 'text-align:center;padding:4px 6px;border-bottom:1px solid var(--line);';
        tr.appendChild(td);
      });
      solTable.appendChild(tr);
    });
    solCard.appendChild(solTable);
    solCard.appendChild(el('div', 'hint', t('chem.sol.hint')));
    page.appendChild(solCard);

    // ── Плотности веществ (справочник) ─────────────────────
    const densCard = el('div', 'card');
    densCard.style.marginTop = '10px';
    densCard.appendChild(el('h2', null, t('chem.dens.title')));
    const densities = [
      [t('chem.dens.air'), '1.205', 'кг/м³'],
      [t('chem.dens.water4'), '1000', 'кг/м³'],
      [t('chem.dens.water20'), '998', 'кг/м³'],
      [t('chem.dens.seaWater'), '1025', 'кг/м³'],
      [t('chem.dens.ethanol'), '789', 'кг/м³'],
      [t('chem.dens.petrol'), '730', 'кг/м³'],
      [t('chem.dens.mercury'), '13 546', 'кг/м³'],
      [t('chem.dens.glycerol'), '1260', 'кг/м³'],
      [t('chem.dens.aluminium'), '2700', 'кг/м³'],
      [t('chem.dens.iron'), '7874', 'кг/м³'],
      [t('chem.dens.copper'), '8960', 'кг/м³'],
      [t('chem.dens.lead'), '11 340', 'кг/м³'],
      [t('chem.dens.gold'), '19 320', 'кг/м³'],
      [t('chem.dens.platinum'), '21 450', 'кг/м³'],
      [t('chem.dens.oak'), '700', 'кг/м³'],
      [t('chem.dens.ice'), '917', 'кг/м³'],
    ];
    const densTable = el('table');
    densTable.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';
    const densHead = el('tr');
    [t('chem.dens.substance'), t('chem.dens.density'), t('chem.dens.units')].forEach(
      function (label) {
        const c = el('th', null, label);
        c.style.cssText =
          'text-align:left;padding:4px 6px;border-bottom:1px solid var(--line);color:var(--sub);font-weight:normal;';
        densHead.appendChild(c);
      }
    );
    densTable.appendChild(densHead);
    densities.forEach(function (row) {
      const tr = el('tr');
      row.forEach(function (cell, i) {
        const td = el('td', null, cell);
        td.style.cssText =
          'padding:4px 6px;border-bottom:1px solid var(--line);' +
          (i === 1 ? 'font-family:ui-monospace,Consolas,monospace;' : '');
        tr.appendChild(td);
      });
      densTable.appendChild(tr);
    });
    densCard.appendChild(densTable);
    page.appendChild(densCard);

    // Property lookup for elements (adds to periodic table click)
    page.appendChild(el('div', 'hint', t('chem.hint.properties')));
  }

  // ── Периодическая таблица ────────────────────────────────
  // Раскладка: 18 колонок, 7 периодов + f-блок. Координаты считаются
  // от атомного номера в mountElements (pos), отдельных списков не нужно.

  function elementCategory(z) {
    if (z === 1 || z === 2) {
      return 's';
    }
    if (z >= 57 && z <= 71) {
      return 'f';
    }
    if (z >= 89 && z <= 103) {
      return 'f';
    }
    if ([3, 4, 11, 12, 19, 20, 37, 38, 55, 56, 87, 88].indexOf(z) >= 0) {
      return 's';
    }
    if (
      (z >= 5 && z <= 10) ||
      (z >= 13 && z <= 18) ||
      (z >= 31 && z <= 36) ||
      (z >= 49 && z <= 54) ||
      (z >= 81 && z <= 86) ||
      z >= 113
    ) {
      return 'p';
    }
    return 'd';
  }

  const CAT_COLOR = {
    s: '#e74c3c', // красный — s-блок (щелочные и щёлочноземельные)
    p: '#3498db', // синий — p-блок (неметаллы, металлоиды, неметаллы)
    d: '#f1c40f', // жёлтый/золотой — d-блок (переходные металлы)
    f: '#9b59b6', // фиолетовый — f-блок (лантаноиды, актиноиды)
  };

  function mountElements(app) {
    const page = app.pageNodes.elem;
    page.innerHTML = '';
    const h = el('h2', null, t('chem.ptable.title'));
    page.appendChild(h);
    const wrap = el('div', 'ptable-wrap');
    const table = el('table', 'ptable');
    table.setAttribute('aria-label', t('chem.ptable.aria'));
    const out = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });

    const cells = {};
    for (let r = 0; r < 10; r++) {
      const tr = el('tr');
      for (let c = 0; c < 19; c++) {
        const td = el('td', r >= 6 ? 'pt-blank' : '');
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    function place(symbol, row, col) {
      const td = table.rows[row].cells[col];
      td.className = '';
      const e = BY_SYMBOL[symbol];
      if (!e) {
        return;
      }
      const cat = elementCategory(e[0]);
      td.style.background = CAT_COLOR[cat];
      // WCAG 1.4.3: цвет текста под фон категории (f-блок тёмный — белый текст).
      td.style.color = cat === 'f' ? '#ffffff' : '#000000';
      // Без opacity: полупрозрачность роняла контраст текста ниже WCAG AA.
      td.title = e[2] + ' — ' + F.fmt(e[3], 6) + ' ' + U('г/моль');
      td.textContent = '';
      const num = el('div', null, String(e[0]));
      num.style.fontSize = '12px';
      const sym = el('div', null, e[1]);
      sym.style.fontSize = '18px';
      sym.style.fontWeight = '600';
      const mass = el('div', null, F.fmt(e[3], 3));
      mass.style.fontSize = '10px';
      td.appendChild(num);
      td.appendChild(sym);
      td.appendChild(mass);
      // WCAG 2.1.1: ячейка — кнопка с клавиатуры, с именем для скринридера.
      td.setAttribute('tabindex', '0');
      td.setAttribute('role', 'button');
      td.setAttribute(
        'aria-label',
        t('chem.ptable.elemAria', { name: e[2], symbol: e[1], z: e[0], mass: F.fmt(e[3], 6) })
      );
      td.onclick = function () {
        const sel = table.querySelectorAll('td.sel');
        for (let i = 0; i < sel.length; i++) {
          sel[i].classList.remove('sel');
        }
        td.classList.add('sel');
        out.textContent =
          e[1] + ' — ' + e[2] + '\nZ = ' + e[0] + '\nA = ' + F.fmt(e[3], 6) + ' ' + U('г/моль');
        out.classList.remove('err');
      };
      td.onkeydown = function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          td.onclick();
        }
      };
      cells[symbol] = td;
    }

    // Раскладка по периоду/группе от атомного номера: офф-баям негде взяться.
    // Лантаноиды и актиноиды — в отдельных f-строках 8 и 9.
    function pos(z) {
      if (z === 1) {
        return [0, 0];
      }
      if (z === 2) {
        return [0, 17];
      }
      if (z >= 57 && z <= 71) {
        return [8, 2 + (z - 57)];
      }
      if (z >= 89 && z <= 103) {
        return [9, 2 + (z - 89)];
      }
      let period, group;
      if (z <= 10) {
        period = 2;
        group = z <= 4 ? z - 2 : z + 8;
      } else if (z <= 18) {
        period = 3;
        group = z <= 12 ? z - 10 : z;
      } else if (z <= 36) {
        period = 4;
        group = z - 18;
      } else if (z <= 54) {
        period = 5;
        group = z - 36;
      } else if (z <= 86) {
        period = 6;
        group = z <= 56 ? z - 54 : z - 68;
      } else {
        period = 7;
        group = z <= 88 ? z - 86 : z - 100;
      }
      return [period - 1, group - 1];
    }
    ELEMENTS.forEach(function (e) {
      const p = pos(e[0]);
      place(e[1], p[0], p[1]);
    });

    wrap.appendChild(table);
    page.appendChild(wrap);
    page.appendChild(el('div', 'hint', t('chem.hint.categories')));
    page.appendChild(out);
  }

  window.CW.pages.mountChem = mountChem;
  window.CW.pages.mountElements = mountElements;
  window.CW.pages.parseFormula = parseFormula;
  window.CW.pages.molarMass = molarMass;
  window.CW.pages.ELEMENTS = ELEMENTS;
})();
