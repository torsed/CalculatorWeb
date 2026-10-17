/* Глубокие unit-тесты ядра: solver, analysis, prog, linsystem.
 *
 * Дополнение к core_ext.test.js: покрывает ветки, которые раньше оставались
 * без проверки — валидация аргументов solver, односторонние пределы и ошибки
 * интегрирования, UTF-8 суррогатные пары, поля IEEE-754, коды ошибок
 * линейных систем. Тот же vm-контекст, что и в core_ext.test.js.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');

function makeContext() {
  const stubDoc = {
    createElement: function () {
      return {
        tagName: 'DIV',
        style: {},
        classList: { add() {}, remove() {}, toggle() {} },
        setAttribute() {},
        getAttribute() {
          return null;
        },
        appendChild() {},
      };
    },
    documentElement: { setAttribute() {} },
  };
  const ctx = {
    console: console,
    document: stubDoc,
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {},
      removeItem() {},
    },
    Math: Math,
    Date: Date,
    Number: Number,
    Array: Array,
    Object: Object,
    JSON: JSON,
    String: String,
    isNaN: isNaN,
    parseInt: parseInt,
    parseFloat: parseFloat,
    ArrayBuffer: ArrayBuffer,
    DataView: DataView,
    Error: Error,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  return ctx;
}

const scripts = [
  'src/core/format.js',
  'src/core/parser.js',
  'src/core/numtheory.js',
  'src/core/stats.js',
  'src/core/matrix.js',
  'src/core/polynomial.js',
  'src/core/analysis.js',
  'src/core/datetime.js',
  'src/core/probdist.js',
  'src/core/prog.js',
  'src/core/linsystem.js',
  'src/core/solver.js',
];

const ctx = makeContext();
for (const f of scripts) {
  const code = fs.readFileSync(path.join(rootDir, f), 'utf8');
  vm.runInContext(code, ctx, { filename: path.join(rootDir, f) });
}

let failures = 0;
function ok(cond, msg) {
  if (!cond) {
    failures++;
    console.log('  ✗ ' + msg);
  }
}
function codeOf(fn) {
  try {
    fn();
    return null;
  } catch (e) {
    return e.code || null;
  }
}
function near(a, b, eps) {
  return Math.abs(a - b) < (eps === undefined ? 1e-6 : eps);
}

// ── Решатель: корни ───────────────────────────────────────
(function () {
  const S = ctx.CW.solver;
  const r1 = S.solve('x^2 - 4');
  ok(r1.roots.length === 2 && near(r1.roots[0], -2) && near(r1.roots[1], 2), 'корни x²−4 = ±2');
  ok(typeof r1.note === 'string' && r1.note.length > 0, 'solve возвращает note');
  const r2 = S.solve('x^3 - x', false, -10, 10);
  ok(r2.roots.length === 3 && near(r2.roots[1], 0, 1e-6), 'x³−x: три корня на [−10,10]');
  const r3 = S.solve('x^2 + 1', false, -5, 5);
  ok(r3.roots.length === 0 && r3.note && r3.note.length > 0, 'x²+1: корней нет, note-подсказка');
  // lo > hi — интервал разворачивается.
  const r4 = S.numericRoots('x^2 - 4', 10, -10);
  ok(r4.length === 2 && near(r4[0], -2), 'lo > hi: интервал меняется местами');
  ok(near(S.evaluateAt('x^2', 3), 9), 'evaluateAt: 3² = 9');
  ok(S.numericRoots('x^2 - 4', 0, 5, 20).length === 1, 'корень за пределами сетки не ищется');
})();

// ── Решатель: валидация аргументов ────────────────────────
(function () {
  const S = ctx.CW.solver;
  ok(codeOf(() => S.numericRoots('x', 0, 1, 1)) === 'samplesMin', 'samples < 2 → samplesMin');
  ok(codeOf(() => S.numericRoots('x', 0, 1, 2.5)) === 'samplesInt', 'дробное samples → samplesInt');
  ok(
    codeOf(() => S.numericRoots('x', NaN, 1)) === 'intervalBounds',
    'NaN-граница → intervalBounds'
  );
  ok(codeOf(() => S.numericRoots('x', 1, 1)) === 'zeroWidth', 'нулевая ширина → zeroWidth');
  ok(
    codeOf(() => S.numericRoots('x ** ', 0, 1)) === 'parseExpression',
    'нечитаемое выражение → parseExpression'
  );
  // Разрыв внутри отрезка не должен ломать поиск: 1/x имеет корней нет, но и цикл не падает.
  ok(S.numericRoots('1/x', -1, 1).length === 0, 'разрыв 1/x: корней нет, ошибки нет');
})();

// ── Анализ: производные, касательные, значения ────────────
(function () {
  const A = ctx.CW.analysis;
  ok(near(A.derivativeAt('x^3', 2, 2), 12, 1e-3), 'вторая производная x³ при 2 = 12');
  ok(near(A.derivativeAt('sin(x)', 0), 1, 1e-5), 'производная sin(x) при 0 = 1');
  ok(near(A.derivativeAt('e^x', 0), 1, 1e-4), 'производная e^x при 0 = 1');
  const tan = A.tangent('sin(x)', 0);
  ok(
    near(tan.m, 1, 1e-5) && near(tan.b, 0, 1e-5) && near(tan.y0, 0, 1e-9),
    'касательная к sin в 0'
  );
  ok(near(A.evalAt('x^2', 5), 25), 'evalAt: 5² = 25');
  // makeFn возвращает нечисловое значение (NaN/Infinity) вместо исключения.
  ok(
    !Number.isFinite(A.evalAt('1/(x-x)', 1)),
    'деление на ноль в точке → не число, без исключения'
  );
  ok(
    near(
      A.integral(
        function (x) {
          return x * x;
        },
        0,
        3
      ),
      9,
      1e-6
    ),
    'integrateFn по f(x)=x²'
  );
})();

// ── Анализ: пределы и интегралы, ошибки ───────────────────
(function () {
  const A = ctx.CW.analysis;
  const lim = A.limitOf('(x^2 - 1)/(x - 1)', 1);
  ok(!lim.diverge && near(lim.value, 2, 1e-3), 'предел (x²−1)/(x−1) при x→1 = 2');
  const d = A.limitOf('abs(x)/x', 0);
  ok(d.diverge && near(d.left, -1, 1e-9) && near(d.right, 1, 1e-9), 'abs(x)/x: пределы разные');
  ok(A.limitOf('abs(x)/x', 0, '-').value === -1, 'односторонний предел слева');
  ok(A.limitOf('abs(x)/x', 0, '+').value === 1, 'односторонний предел справа');
  ok(
    codeOf(() => A.integralOf('1/(x + 1)', -1, 1)) === 'integrandBoundary',
    'не определена на границе → integrandBoundary'
  );
  ok(
    codeOf(() => A.integralOf('1/x', -1, 1)) === 'integrandUndefined',
    'разрыв внутри отрезка → integrandUndefined'
  );
  ok(
    codeOf(() => A.sumProduct('k / (k - 2)', 1, 3, 'sum')) === 'sumUndefined',
    'не определена при k=2 → sumUndefined'
  );
  ok(
    codeOf(() => A.sumProduct('k', 0, 200000, 'sum')) === 'sumTooMany',
    'слишком много слагаемых → sumTooMany'
  );
  ok(
    codeOf(() => A.derivativeAt('x **', 1)) === 'parseExpression',
    'нечитаемое выражение → parseExpression'
  );
  // b < a — интервал разворачивается.
  ok(near(A.sumProduct('k', 5, 1, 'sum'), 15), 'сумма при b < a: интервал меняется местами');
})();

// ── Анализ: экстремумы ────────────────────────────────────
(function () {
  const A = ctx.CW.analysis;
  const mx = A.extrema('-x^2', -5, 5);
  ok(mx.length >= 1 && mx[0].kind === 'max' && near(mx[0].x, 0, 1e-3), 'максимум −x² в 0');
  const mn = A.extrema('x^3 - 3x', -3, 3);
  ok(mn.length === 2, 'x³−3x: и максимум, и минимум');
  ok(mn[0].kind === 'max' && near(mn[0].x, -1, 1e-2), 'максимум x³−3x при x=−1');
  ok(mn[1].kind === 'min' && near(mn[1].x, 1, 1e-2), 'минимум x³−3x при x=1');
})();

// ── Программирование: UTF-8 и Base64 ──────────────────────
(function () {
  const PG = ctx.CW.prog;
  ok(JSON.stringify(PG.utf8Bytes('A')) === '[65]', 'utf8Bytes ASCII');
  ok(
    JSON.stringify(PG.utf8Bytes('😀')) === '[240,159,152,128]',
    'utf8Bytes: суррогатная пара → 4 байта'
  );
  ok(
    PG.utf8FromBytes([240, 159, 152, 128]) === '😀',
    'utf8FromBytes: 4-байтовая последовательность'
  );
  const round = '✓ hello, мир! 😀 ñ';
  ok(PG.utf8FromBytes(PG.utf8Bytes(round)) === round, 'UTF-8 roundtrip со всем набором длин');
  ok(PG.base64Encode('Ma') === 'TWE=', 'Base64: 2 байта → одно «=»');
  ok(PG.base64Encode('M') === 'TQ==', 'Base64: 1 байт → два «=»');
  ok(PG.base64Decode('TWE=') === 'Ma', 'Base64 decode с паддингом');
})();

// ── Программирование: CRC32 и IEEE-754 ────────────────────
(function () {
  const PG = ctx.CW.prog;
  ok(PG.crc32('') === '00000000', 'CRC32 пустой строки');
  ok(PG.crc32('abc') === '352441C2', 'CRC32 "abc"');
  const f = PG.ieee754(0.5);
  ok(f.hex === '0x3FE0000000000000', 'IEEE-754(0.5) hex');
  ok(
    f.sign === 0 && f.exponent === 1022 && f.bias === 1023 && f.unbiased === -1,
    'IEEE-754(0.5) поля'
  );
  const z = PG.ieee754(0);
  ok(z.exponent === 0 && z.bias === 1 && z.unbiased === -1022, 'IEEE-754(0): денормаль → bias 1');
  ok(
    PG.ieee754(-2).bits.length === 64 && PG.ieee754(-2).bits[0] === '1',
    'IEEE-754: 64 бита, знаковый бит'
  );
  const cc = PG.charCodes('😀');
  ok(
    cc.length === 1 && cc[0].code === 0x1f600 && cc[0].hex === 'U+1F600',
    'charCodes: суррогатная пара'
  );
})();

// ── Линейные системы: detectVars ──────────────────────────
(function () {
  const LS = ctx.CW.linsystem;
  const v = LS.detectVars('sin(x) + pi*y + 2t');
  ok(
    v.length === 3 && v[0] === 'x' && v[1] === 'y' && v[2] === 't',
    'функции и константы — не неизвестные'
  );
  ok(
    LS.detectVars('a and b shl 2 i j').length === 2,
    'побитовые слова и мнимые единицы отфильтрованы'
  );
})();

// ── Линейные системы: решение и подсказка переменных ──────
(function () {
  const LS = ctx.CW.linsystem;
  const r = LS.solve('x + y = 3\nx - y = 1', true, ['x', 'y']);
  ok(near(r.solution[0], 2) && near(r.solution[1], 1), 'solve с varsHint');
  // Правая часть и знак уравнения «f = 0» без «=».
  const r2 = LS.solve('x - 5\ny - 7');
  ok(near(r2.solution[0], 5) && near(r2.solution[1], 7), 'уравнения без «=» понимаются как f = 0');
  // Дробные коэффициенты и константы в уравнениях.
  const r3 = LS.solve('0.5x + y = 2\nx - pi/2*y = 0');
  ok(
    near(r3.solution[0], 1.7596, 1e-3) && near(r3.solution[1], 1.1202, 1e-3),
    'дроби и pi в системе'
  );
})();

// ── Линейные системы: коды ошибок ─────────────────────────
(function () {
  const LS = ctx.CW.linsystem;
  ok(codeOf(() => LS.solve('')) === 'sysEmpty', 'пустой ввод → sysEmpty');
  ok(codeOf(() => LS.solve('   \n; ')) === 'sysEmpty', 'одни разделители → sysEmpty');
  ok(
    codeOf(() => LS.solve('x + y = 3')) === 'sysCount',
    'уравнений меньше, чем неизвестных → sysCount'
  );
  ok(
    codeOf(() => LS.solve('x + y + z = 6\nx - y = 1')) === 'sysCount',
    'число уравнений ≠ числу неизвестных'
  );
  ok(
    codeOf(() => LS.solve('x = 1 = 2\ny = 3')) === 'sysTooManyEquals',
    'два «=» → sysTooManyEquals'
  );
  ok(
    codeOf(() => LS.solve('x + y = 3\n2x + 2y = 6')) === 'sysNoUnique',
    'зависимые уравнения → sysNoUnique'
  );
  ok(
    codeOf(() => LS.solve('x^2 = 4\ny = 1')) === 'sysNonlinear',
    'нелинейное уравнение → sysNonlinear'
  );
  ok(
    codeOf(() => LS.solve('x + = 1\ny = 2')) === 'sysEval',
    'битое уравнение падает при вычислении → sysEval'
  );
  ok(codeOf(() => LS.solve('x)))) = 1\ny = 2')) === 'sysParse', 'нечитаемое уравнение → sysParse');
  ok(
    codeOf(() => LS.solve('x + 1/0 = 2\ny = 1')) === 'sysNotFinite',
    'бесконечность в уравнении → sysNotFinite'
  );
})();

if (failures) {
  console.log('\ncore_deep: ' + failures + ' проверок не прошло.');
  process.exit(1);
}
console.log(
  'core_deep: solver, анализ (пределы/интегралы/экстремумы), prog, linsystem (ошибки) — OK'
);
