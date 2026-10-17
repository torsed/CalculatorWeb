/* Headless-тесты новых модулей ядра (без браузера).
 *
 * Загружает ядро так же, как index.html, в минимальный vm-контекст и проверяет
 * анализ, даты, распределения, программирование, линейные системы и расширения
 * матриц/теории чисел/статистики.
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
  'src/state/history.js',
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
function near(a, b, eps) {
  return Math.abs(a - b) < (eps === undefined ? 1e-6 : eps);
}

// ── Дата и время ──────────────────────────────────────────
(function () {
  const D = ctx.CW.datetime;
  const jan1 = D.parse('2024-01-01');
  ok(D.isoWeekday(jan1) === 0, '2024-01-01 — понедельник');
  ok(D.diffDays(D.parse('2024-01-01'), D.parse('2024-03-01')) === 60, 'diffDays високосный год');
  const feb = D.addMonths(D.parse('2024-01-31'), 1);
  ok(feb.m === 2 && feb.d === 29, 'addMonths клампит 31 → 29 в феврале');
  ok(D.businessDays(D.parse('2024-01-01'), D.parse('2024-01-07')) === 5, 'рабочие дни 5 из 7');
  const w = D.isoWeek(D.parse('2024-01-01'));
  ok(w.week === 1 && w.year === 2024, 'ISO-неделя 1');
  const age = D.age(D.parse('2000-05-15'), D.parse('2024-05-14'));
  ok(age.years === 23 && age.months === 11 && age.days === 29, 'возраст за день до ДР');
})();

// ── Анализ ────────────────────────────────────────────────
(function () {
  const A = ctx.CW.analysis;
  ok(near(A.derivativeAt('x^2', 3), 6, 1e-4), 'производная x^2 при 3');
  ok(near(A.integralOf('x^2', 0, 3), 9, 1e-6), 'интеграл x^2 на [0,3]');
  ok(near(A.sumProduct('k', 1, 100, 'sum'), 5050), 'сумма 1..100');
  ok(near(A.sumProduct('k', 1, 5, 'product'), 120), 'произведение 1..5');
  ok(near(A.limitOf('sin(x)/x', 0).value, 1, 1e-4), 'предел sin(x)/x');
  const ext = A.extrema('x^2', -5, 5);
  ok(ext.length >= 1 && ext[0].kind === 'min' && near(ext[0].x, 0, 1e-3), 'минимум x^2 в 0');
  const tan = A.tangent('x^2', 2);
  ok(near(tan.m, 4, 1e-4) && near(tan.b, -4, 1e-2), 'касательная к x^2 в 2');
})();

// ── Распределения ─────────────────────────────────────────
(function () {
  const PD = ctx.CW.probdist;
  ok(near(PD.normalCdf(0, 0, 1), 0.5), 'normalCdf(0)=0.5');
  ok(near(PD.normalCdf(1.96, 0, 1), 0.975, 1e-3), 'normalCdf(1.96)≈0.975');
  ok(near(PD.normalInv(0.975, 0, 1), 1.96, 1e-2), 'normalInv(0.975)≈1.96');
  ok(near(PD.tCdf(0, 10), 0.5), 'tCdf(0)=0.5');
  ok(near(PD.tInv(0.975, 10), 2.228, 1e-2), 'tInv(0.975,10)≈2.228');
  ok(near(PD.chi2Cdf(3.841, 1), 0.95, 1e-3), 'chi2Cdf(3.841,1)≈0.95');
  ok(near(PD.fCdf(4.0, 3, 10), 0.9596, 1e-2), 'fCdf(4,3,10)');
  ok(near(PD.gammaP(1, 1), 1 - Math.exp(-1), 1e-9), 'gammaP(1,1)');
  ok(near(PD.incBeta(1, 1, 0.5), 0.5, 1e-9), 'incBeta(1,1,0.5)');
  ok(near(PD.erf(1), 0.8427007929, 1e-6), 'erf(1)');
  ok(near(PD.logGamma(5), Math.log(24), 1e-9), 'logGamma(5)=ln24');
})();

// ── Программирование ──────────────────────────────────────
(function () {
  const PG = ctx.CW.prog;
  ok(PG.crc32('123456789') === 'CBF43926', 'CRC32 контрольное значение');
  const enc = PG.base64Encode('Привет, мир!');
  ok(PG.base64Decode(enc) === 'Привет, мир!', 'Base64 roundtrip (юникод)');
  ok(PG.base64Encode('Man') === 'TWFu', 'Base64 "Man" → TWFu');
  ok(PG.ieee754(1).hex === '0x3FF0000000000000', 'IEEE-754(1)');
  ok(PG.ieee754(-2).sign === 1, 'IEEE-754(-2) знак');
  ok(PG.charCodes('A')[0].code === 65, 'charCodes A');
})();

// ── Линейные системы ──────────────────────────────────────
(function () {
  const LS = ctx.CW.linsystem;
  const r1 = LS.solve('x + y = 3\nx - y = 1');
  ok(near(r1.solution[0], 2) && near(r1.solution[1], 1), 'система x+y=3, x−y=1');
  const r2 = LS.solve('2x + 3y = 8; x - y = -1');
  ok(near(r2.solution[0], 1) && near(r2.solution[1], 2), 'система 2x+3y=8, x−y=−1');
  const r3 = LS.solve('x + y + z = 6\n2x - y + 3z = 9\nx + 2y - z = 2');
  ok(
    near(r3.solution[0], 1, 1e-6) && near(r3.solution[1], 2, 1e-6) && near(r3.solution[2], 3, 1e-6),
    'система 3×3'
  );
})();

// ── Матрицы: расширения ───────────────────────────────────
(function () {
  const M = ctx.CW.matrix;
  ok(M.trace(M.parse('1 2\n3 4')) === 5, 'след');
  ok(near(M.normFro(M.parse('3 4\n0 0')), 5), 'норма Фробениуса');
  const p = M.power(M.parse('1 1\n0 1'), 3);
  ok(near(p[0][1], 3), 'степень матрицы');
  const rr = M.rref(M.parse('1 2\n3 4'));
  ok(rr.rank === 2 && near(rr.rref[0][0], 1) && near(rr.rref[1][1], 1), 'RREF → I');
  const lu = M.lu(M.parse('4 3\n6 3'));
  // P·A = L·U
  const PA = M.mul(lu.P, M.parse('4 3\n6 3'));
  const LU = M.mul(lu.L, lu.U);
  let luOk = true;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      if (!near(PA[i][j], LU[i][j])) {
        luOk = false;
      }
    }
  }
  ok(luOk, 'LU: P·A = L·U');
  const qr = M.qr(M.parse('1 1\n1 0\n0 1'));
  const QtQ = M.mul(M.transpose(qr.Q), qr.Q);
  ok(near(QtQ[0][0], 1) && near(QtQ[1][1], 1) && near(QtQ[0][1], 0), 'QR: QᵀQ = I');
})();

// ── Теория чисел: расширения ──────────────────────────────
(function () {
  const NT = ctx.CW.numtheory;
  ok(NT.mobius(30) === -1, 'μ(30) = −1');
  ok(NT.mobius(4) === 0, 'μ(4) = 0');
  ok(NT.primePi(100) === 25, 'π(100) = 25');
  ok(NT.divisorCount(28) === 6, 'd(28) = 6');
  ok(NT.sumDivisors(28) === 56, 'σ(28) = 56 (совершенное)');
  const crt = NT.crt([
    [2, 3],
    [3, 5],
    [2, 7],
  ]);
  ok(crt.x === 23 && crt.mod === 105, 'CRT: x ≡ 23 (mod 105)');
  const cf = NT.continuedFraction(1.5);
  ok(cf[0] === 1 && cf[1] === 2, 'непрерывная дробь 1.5 = [1;2]');
  const rsa = NT.rsa(61, 53);
  ok(rsa.n === 3233 && rsa.phi === 3120 && rsa.d > 0, 'RSA(61,53)');
  // Проверка: e·d ≡ 1 (mod φ)
  ok((rsa.e * rsa.d) % rsa.phi === 1, 'RSA: e·d ≡ 1 (mod φ)');
})();

// ── Статистика: расширения ────────────────────────────────
(function () {
  const S = ctx.CW.stats;
  const xs = [1, 2, 3, 4, 5];
  const ys = [3, 5, 7, 9, 11]; // y = 2x + 1
  const reg = S.linearRegression(xs, ys);
  ok(near(reg.slope, 2) && near(reg.intercept, 1) && near(reg.r, 1), 'линейная регрессия y=2x+1');
  ok(near(S.pearson(xs, ys), 1), 'Пирсон = 1');
  ok(near(S.spearman(xs, ys), 1), 'Спирмен = 1');
  const poly = S.polyRegression([0, 1, 2, 3], [0, 1, 4, 9], 2);
  ok(near(poly.coeff[2], 1, 1e-6) && near(poly.r2, 1, 1e-6), 'полиномиальная регрессия x²');
  const tt = S.tTestOne([5.1, 4.9, 5.0, 5.2, 4.8], 5);
  ok(tt.df === 4 && tt.p > 0 && tt.p <= 1, 'одновыборочный t-тест');
  const ci = S.confidenceIntervalMean(xs, 0.95);
  ok(ci.low < 3 && ci.high > 3 && near(ci.mean, 3), 'доверительный интервал среднего');
  const cols = S.parseColumns('1 2\n3 4\n5 6');
  ok(cols.xs.length === 3 && cols.ys[2] === 6, 'разбор двух столбцов');
})();

// ── История: избранное ────────────────────────────────────
(function () {
  const H = ctx.CW.history.History;
  const h = new H();
  h.add('1+1', '2');
  h.add('2+2', '4');
  h.toggleFav('1+1', '2');
  // Повторное добавление не должно терять флаг «избранное».
  h.add('1+1', '2');
  const fav = h.all().filter(function (e) {
    return e.fav;
  });
  ok(fav.length === 1 && fav[0].expr === '1+1', 'избранное сохраняется при дедупликации');
  h.toggleFav('1+1', '2');
  ok(
    h.all().filter(function (e) {
      return e.fav;
    }).length === 0,
    'повторное переключение снимает избранное'
  );
})();

if (failures) {
  console.log('\ncore_ext: ' + failures + ' проверок не прошло.');
  process.exit(1);
}
console.log(
  'core_ext: анализ, даты, распределения, prog, linsystem, матрицы, числа, статистика — OK'
);
