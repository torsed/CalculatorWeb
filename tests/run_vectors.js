/* Сравнение JS-парсера с эталоном из Python-версии.
 *
 * Векторы сняты скриптом tests/make_vectors.py из C:\Calculator\core\parser.py.
 * Каждое расхождение — это регрессия семантики приоритетов, которую надо
 * закрыть, а не «почти такой же результат».
 *
 * Запуск:  node tests/run_vectors.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const sandbox = { window: {}, console: console };
vm.createContext(sandbox);

for (const f of ['src/core/format.js', 'src/core/parser.js', 'src/core/numtheory.js']) {
  const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
  vm.runInContext(code, sandbox, { filename: path.join(ROOT, f) });
}

const CW = sandbox.window.CW;
CW.parser.registerNumTheory(CW.numtheory);
const vectors = JSON.parse(fs.readFileSync(path.join(__dirname, 'vectors.json'), 'utf8'));

// Допустимые расхождения: в веб-версии есть функции, которых нет в
// Python-прототипе, и там, где Python падает с «math domain error».
// Это расширение возможностей, а не регрессия семантики.
const ALLOWED_EXTENSIONS = {
  'sqrt(-1)': 'веб отдаёт комплексный корень, Python бросает domain error',
  'sqrt(-4)': 'веб отдаёт комплексный корень, Python бросает domain error',
  '(-8)^(1/3)': 'веб отдаёт комплексный корень, Python бросает domain error',
};
const ALLOWED_DIFFERENT = {
  '2^1024': 'Python бросает overflow, JS даёт inf — показываем как есть',
};
const isExtension = expr => ALLOWED_EXTENSIONS[expr] || ALLOWED_DIFFERENT[expr];

// Комплексные значения приводим к строке тем же правилом, что и Python.
function render(v) {
  if (typeof v === 'number') {
    return CW.format.fmt(v);
  }
  return CW.format.fmtComplex(v);
}

let pass = 0;
const failures = [];

for (const vec of vectors) {
  let got;
  try {
    got = render(CW.parser.evaluate(vec.expr, vec.deg));
  } catch (e) {
    got = null;
    if (!e.isExprError && !/ExprError/.test(e.name || '')) {
      failures.push({
        expr: vec.expr,
        deg: vec.deg,
        expected: vec.error || vec.result,
        got: `RAW:${e.name}: ${e.message}`,
        kind: 'raw-exception',
      });
      continue;
    }
  }
  const want = vec.error ? null : vec.result;
  const match = vec.error ? got === null : got === want;
  const extension = !match && vec.error && got !== null && isExtension(vec.expr);
  const different = !match && !vec.error && isExtension(vec.expr);
  if (match || extension || different) {
    pass++;
  } else {
    failures.push({
      expr: vec.expr,
      deg: vec.deg ? 'deg' : 'rad',
      expected: vec.error ? `error: ${vec.error}` : want,
      got: got === null ? 'error' : got,
      kind: vec.error ? 'should-fail' : 'should-succeed',
    });
  }
}

const total = vectors.length;
console.log(`\n  vectors: ${pass}/${total} (расхождения недопустимы)\n`);

if (failures.length) {
  const byKind = { 'should-succeed': [], 'should-fail': [], 'raw-exception': [] };
  for (const f of failures) {
    byKind[f.kind].push(f);
  }
  for (const kind of Object.keys(byKind)) {
    if (!byKind[kind].length) {
      continue;
    }
    console.log(`--- ${kind} (${byKind[kind].length}) ---`);
    for (const f of byKind[kind].slice(0, 40)) {
      console.log(`  ${f.deg}  ${JSON.stringify(f.expr)}`);
      console.log(`     python: ${f.expected}`);
      console.log(`     js    : ${f.got}`);
    }
    if (byKind[kind].length > 40) {
      console.log(`  ... ещё ${byKind[kind].length - 40}`);
    }
    console.log('');
  }
  process.exit(1);
}
console.log('  все векторы совпали с Python-эталоном (кроме перечисленных расширений)\n');
