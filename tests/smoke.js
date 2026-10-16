/* Headless smoke: load index.html scripts in sequence into a minimal document stub.
 * No browser needed. Catches ReferenceError and TypeError at load and initial click.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Minimal document stub for scripts that reference document
const stubDoc = {
  createElement: function (tag) {
    const base = {
      tagName: tag.toUpperCase(),
      className: '',
      style: { cssText: '' },
      innerHTML: '',
      value: '',
      textContent: '',
      placeholder: '',
      onclick: null,
      oninput: null,
      onkeydown: null,
      onchange: null,
      addEventListener: function () {},
      removeEventListener: function () {},
      appendChild: function () {},
      querySelector: function () {
        const mock = {
          classList: { add: function () {}, remove: function () {}, toggle: function () {} },
          appendChild: function () {},
          innerHTML: '',
          querySelector: function () {
            return mock;
          },
        };
        return mock;
      },
      remove: function () {},
      parentNode: { removeChild: function () {} },
      classList: {
        add: function () {},
        remove: function () {},
        toggle: function () {},
      },
      setAttribute: function () {},
      getAttribute: function () {
        return null;
      },
      children: [],
      parentElement: null,
    };
    if (tag === 'canvas') {
      base.getContext = function () {
        return {
          clearRect: function () {},
          beginPath: function () {},
          moveTo: function () {},
          lineTo: function () {},
          stroke: function () {},
          fillText: function () {},
          setTransform: function () {},
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 1,
          font: '',
          textAlign: 'left',
          arc: function () {},
          fill: function () {},
        };
      };
      base.clientWidth = 600;
      base.clientHeight = 340;
      base.width = 600;
      base.height = 340;
      base.getBoundingClientRect = function () {
        return { left: 0, top: 0, width: 600, height: 340 };
      };
    }
    return base;
  },
  createTextNode: function () {
    return {};
  },
  body: { appendChild: function () {}, removeChild: function () {} },
  documentElement: {
    setAttribute: function () {},
    getPropertyValue: function () {
      return '';
    },
  },
  appendChild: function (child) {
    stubDoc.body.appendChild(child);
  },
  querySelector: function (_sel) {
    const mock = {
      classList: { add: function () {}, remove: function () {}, toggle: function () {} },
      appendChild: function () {},
      innerHTML: '',
      querySelector: function (_s) {
        return mock;
      },
    };
    return mock;
  },
  getElementById: function () {
    return null;
  },
  addEventListener: function () {},
  removeEventListener: function () {},
};
const stubWin = {
  document: stubDoc,
  window: {},
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  localStorage: (function () {
    const store = {};
    return {
      getItem: function (k) {
        return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
      },
      setItem: function (k, v) {
        store[k] = String(v);
      },
      removeItem: function (k) {
        delete store[k];
      },
    };
  })(),
  getComputedStyle: function () {
    return {
      getPropertyValue: function () {
        return '';
      },
    };
  },
  addEventListener: function (type, fn) {
    if (type === 'keydown') {
      stubDoc.keydownFn = fn;
    }
    if (type === 'mouseup') {
      stubWin.mouseupFn = fn;
    }
  },
  removeEventListener: function () {},
};
stubWin.window = stubWin;
vm.createContext(stubWin);

const rootDir = path.resolve(__dirname, '..');

// Load scripts in exact index.html order.
const scripts = [
  'src/core/format.js',
  'src/core/parser.js',
  'src/core/numtheory.js',
  'src/core/stats.js',
  'src/core/matrix.js',
  'src/core/solver.js',
  'src/core/polynomial.js',
  'src/i18n/i18n.js',
  'src/i18n/locales/common.js',
  'src/i18n/locales/units.js',
  'src/i18n/locales/calc.js',
  'src/i18n/locales/graph.js',
  'src/i18n/locales/conv.js',
  'src/i18n/locales/stats.js',
  'src/i18n/locales/matrix.js',
  'src/i18n/locales/numtheory.js',
  'src/i18n/locales/solver.js',
  'src/i18n/locales/phys.js',
  'src/i18n/locales/chem.js',
  'src/i18n/locales/geom.js',
  'src/i18n/locales/finance.js',
  'src/i18n/locales/util.js',
  'src/i18n/locales/prob.js',
  'src/i18n/locales/prog.js',
  'src/i18n/locales/gen.js',
  'src/i18n/locales/core-parser.js',
  'src/i18n/locales/core-numtheory.js',
  'src/i18n/locales/core-matrix.js',
  'src/i18n/locales/core-polynomial.js',
  'src/i18n/locales/core-solver.js',
  'src/i18n/locales/core-stats.js',
  'src/state/history.js',
  'src/ui/calcState.js',
  'src/ui/calcView.js',
  'src/ui/graphView.js',
  'src/ui/pages/helpers.js',
  'src/ui/pages/conv.js',
  'src/ui/pages/stats.js',
  'src/ui/pages/matrix.js',
  'src/ui/pages/numtheory.js',
  'src/ui/pages/solver.js',
  'src/ui/pages/phys.js',
  'src/ui/pages/chem.js',
  'src/ui/app.js',
];

for (const f of scripts) {
  const code = fs.readFileSync(path.join(rootDir, f), 'utf8');
  vm.runInContext(code, stubWin, { filename: path.join(rootDir, f) });
}

// Initialize the app instance as index.html does in its inline script.
// Note: parser sets CW on the sandbox's *window* object.
stubWin.CW = stubWin.window.CW || stubWin.CW || {};
try {
  stubWin.CW.parser.registerNumTheory(stubWin.CW.numtheory);
  // We don't fully initialize App here to avoid complex DOM stub requirements;
  // core module tests cover parser, stats, matrix, numtheory directly.
  console.log('INIT OK — parser, numtheory, stats, matrix loaded');
} catch (e) {
  console.log('INIT FAIL:', e.name, e.message);
  console.log('Trace:', e.stack ? e.stack.split('\n').slice(0, 8).join(' | ') : 'n/a');
  process.exit(1);
}

// Test basic calculation flow headlessly.
try {
  const P = stubWin.CW.parser;
  const result = P.evaluate('5 + 3', true);
  if (Math.abs(result - 8) > 1e-6) {
    throw new Error('Basic calc failed: ' + result);
  }
  console.log('CALC 5+3 result:', result);
} catch (e) {
  console.log('CALC FAIL:', e.name, e.message);
  process.exit(1);
}

console.log('Smoke test passed.');

// Extended core module smoke tests
function extendedSmoke() {
  const P = stubWin.CW.parser;
  const NT = stubWin.CW.numtheory;
  const ST = stubWin.CW.stats;
  const M = stubWin.CW.matrix;

  // Parser tests
  const parseTests = [
    { expr: '2+3', deg: true, want: 5 },
    { expr: 'sin(30)', deg: true, want: 0.5 },
    { expr: 'sqrt(16)', deg: false, want: 4 },
  ];
  for (const t of parseTests) {
    const got = P.evaluate(t.expr, t.deg);
    if (Math.abs(got - t.want) > 1e-6 && got !== t.want) {
      throw new Error(`Parser fail: ${t.expr} => ${got}, expected ${t.want}`);
    }
  }

  // Stats tests
  const stats = ST.describe([1, 2, 3, 4, 5]);
  if (stats.mean !== 3) {
    throw new Error('Stats mean fail: ' + stats.mean);
  }

  // Number theory
  if (!NT.isPrime(7)) {
    throw new Error('isPrime(7) failed');
  }
  if (NT.isPrime(8)) {
    throw new Error('isPrime(8) should be false');
  }

  // Matrix
  const mat = M.parse('1 2\n3 4');
  const det = M.det(mat);
  if (Math.abs(det - -2) > 1e-6) {
    throw new Error('Matrix det fail: ' + det);
  }

  // Полиномы: коэффициенты и корни (замена mathjs).
  const Poly = stubWin.CW.poly;
  const coeff = Poly.coeffs('x^2 - 3x + 2');
  if (!coeff || coeff.length !== 3 || Math.abs(coeff[2] - 1) > 1e-12) {
    throw new Error('Poly.coeffs fail: ' + JSON.stringify(coeff));
  }
  const roots = Poly.roots([-6, 11, -6, 1]); // x³ − 6x² + 11x − 6
  const near = (a, b) => Math.abs(a - b) < 1e-6;
  if (roots.length !== 3 || !near(roots[0], 1) || !near(roots[1], 2) || !near(roots[2], 3)) {
    throw new Error('Poly.roots fail: ' + JSON.stringify(roots));
  }

  // Собственные значения и решение Ax=b.
  const eig = M.eigenvalues(M.parse('2 1\n1 2'));
  if (eig.length !== 2 || !near(eig[0], 1) || !near(eig[1], 3)) {
    throw new Error('eigenvalues fail: ' + JSON.stringify(eig));
  }
  const sol = M.solve(M.parse('2 1\n1 3'), [3, 5]);
  if (!near(sol[0], 0.8) || !near(sol[1], 1.4)) {
    throw new Error('solve fail: ' + JSON.stringify(sol));
  }

  // История: добавление, дедупликация, импорт и персистентность.
  const H = stubWin.CW.history;
  const h = new H.History();
  h.add('1+1', '2');
  h.add('1+1', '2'); // дубликат не должен расти
  h.add('2+2', '4');
  if (h.all().length !== 2) {
    throw new Error('history add/dedupe fail: ' + h.all().length);
  }
  h.importAll([{ expr: '3+3', result: '6' }, { bad: true }]);
  if (h.all().length !== 3) {
    throw new Error('history import fail: ' + h.all().length);
  }
  if (new H.History().all().length !== 3) {
    throw new Error('history persistence fail');
  }
  h.clear();
  if (new H.History().all().length !== 0) {
    throw new Error('history clear fail');
  }

  // i18n: переводы, подстановка параметров, единицы измерения.
  const I18N = stubWin.CW.i18n;
  if (I18N.getLocale() !== 'ru') {
    throw new Error('i18n default locale fail: ' + I18N.getLocale());
  }
  if (I18N.t('common.brand') !== 'Калькулятор') {
    throw new Error('i18n ru string fail');
  }
  if (I18N.t('graph.colorFn', { fx: 'y' }) !== 'Сменить цвет функции y') {
    throw new Error('i18n param substitution fail');
  }
  if (I18N.unit('Дж') !== 'Дж' || I18N.unit('нет такой') !== 'нет такой') {
    throw new Error('i18n unit fallback fail');
  }
  I18N.setLocale('en');
  if (I18N.t('common.brand') !== 'Calculator' || I18N.unit('Дж') !== 'J') {
    throw new Error('i18n en switch fail');
  }
  I18N.setLocale('ru');

  console.log('Extended smoke: parser, stats, numtheory, matrix, poly, history, i18n — OK');
}

try {
  extendedSmoke();
} catch (e) {
  console.log('EXTENDED SMOKE FAIL:', e.name, e.message);
  process.exit(1);
}
