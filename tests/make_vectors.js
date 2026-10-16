/* Генерация тестовых векторов через JS-парсер проекта.
 * Запуск:  node tests/make_vectors.js
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
  vm.runInContext(code, sandbox, { filename: f });
}

const CW = sandbox.window.CW;
CW.parser.registerNumTheory(CW.numtheory);

const CASES = [
  '1+1',
  '2*3',
  '7/2',
  '2^10',
  '2^0.5',
  '(-8)^(1/3)',
  '1/3',
  '5+3*2',
  '(5+3)*2',
  '2+3-4',
  '10-2-3',
  '100/5/2',
  '-5',
  '-5+3',
  '3*-2',
  '2*-3',
  '--5',
  '-(-5)',
  '1.5',
  '0.1+0.2',
  '1e3',
  '1e-3',
  '2.5e3',
  '1e308*10',
  '2^1024',
  '5 + + 3',
  '10%3',
  '-10%3',
  '10%-3',
  '5%0',
  '5!',
  '0!',
  '3!+2!',
  '-1!',
  '2.5!',
  '20!',
  '171!',
  '((1+2))',
  '(1+2',
  '1+2)',
  '()',
  'sin()',
  'fact()',
  'sin(0)',
  'sin(30)',
  'sin(90)',
  'sin(180)',
  'cos(60)',
  'cos(90)',
  'tan(45)',
  'tan(0)',
  'asin(1)',
  'asin(0.5)',
  'acos(0)',
  'acos(1)',
  'atan(1)',
  'atan(0)',
  'sin(0)',
  'sin(pi)',
  'sin(pi/2)',
  'cos(pi)',
  'tan(pi/4)',
  'asin(1)',
  'atan(1)',
  'sinh(1)',
  'cosh(1)',
  'tanh(1)',
  'asinh(1)',
  'acosh(1)',
  'atanh(0.5)',
  'ln(e)',
  'log(100)',
  'log(8,2)',
  'log2(8)',
  'log10(1000)',
  'exp(1)',
  'e^1',
  'sqrt(16)',
  'sqrt(2)',
  'cbrt(27)',
  'cbrt(-8)',
  'sqrt(-1)',
  'sqrt(-4)',
  'sign(-5)',
  'sign(0)',
  'sign(5)',
  'abs(-5)',
  'abs(3+4i)',
  'fabs(-2.5)',
  'floor(2.7)',
  'ceil(2.1)',
  'round(2.5)',
  'round(3.5)',
  'round(-2.5)',
  'round(2.345, 2)',
  'floor(-2.5)',
  'pi',
  'e',
  'tau',
  'phi',
  'c',
  'g',
  'i',
  'I',
  '2pi',
  '2*pi',
  'pi/2',
  '2e',
  'e^2',
  '1/pi',
  '12&10',
  '12|10',
  '12 xor 10',
  '1<<3',
  '16>>2',
  '~5',
  'not(5)',
  '5 and 3',
  '5 or 3',
  '5 xor 3',
  '1 shl 3',
  '16 shr 2',
  '5 & 3',
  '5 | 3',
  '2.5 & 1',
  '~2.5',
  'gcd(12,10)',
  'lcm(4,6)',
  'ncr(5,2)',
  'npr(5,2)',
  'fact(5)',
  'isprime(7)',
  'isprime(8)',
  'nextprime(10)',
  'totient(12)',
  'modpow(2,10,1000)',
  '2pi',
  '3(4)',
  '(2)(3)',
  '2(3)(4)',
  '2sin(30)',
  'i*i',
  'i^2',
  '(1+2i)+(3+4i)',
  '(1+2i)*(3+4i)',
  '(3+4i)/(1+2i)',
  '3+4i',
  '2i',
  'i+1',
  'sqrt(-4)',
  '(2+3i)*(2-3i)',
  '1/0',
  '1.5.2',
  'sin()',
  'fact()',
  '2**3',
  'foo(2)',
  'unknownfunc(1)',
  '5 + + 3',
  '(1+2',
  '1+2)',
  '2+',
  '2*',
  '5!',
  '-1!',
  'log(8)',
  'log(8,2,3)',
  '0!',
  '-1',
  '1.5.2.3',
  'sin(cos(tan(30)))',
  'sqrt(abs(-16))',
  'log(gcd(12,18))',
  'round(sqrt(2)*100)/100',
];

function fmt(value, places) {
  if (places === undefined) {
    places = 12;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'boolean') {
    return String(value ? 1 : 0);
  }
  if (typeof value === 'number' && Number.isNaN(value)) {
    return 'nan';
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return value < 0 ? '-inf' : 'inf';
  }
  if (typeof value !== 'number') {
    return String(value);
  }
  if (Number.isInteger(value) && Math.abs(value) < 1e15) {
    return String(value);
  }
  return CW.format.formatG(value, places);
}

function fmtComplex(value, places) {
  if (typeof value === 'number') {
    return fmt(value, places);
  }
  const re = value.re === undefined ? Number(value.real || 0) : value.re;
  const im = value.im === undefined ? Number(value.imag || 0) : value.im;
  if (Math.abs(im) < 1e-14) {
    return fmt(re, places);
  }
  const sign = im >= 0 ? '+' : '−';
  return fmt(re, places) + ' ' + sign + ' ' + fmt(Math.abs(im), places) + 'i';
}

const out = [];
for (const expr of CASES) {
  for (const deg of [true, false]) {
    try {
      const res = fmtComplex(CW.parser.evaluate(expr, deg));
      out.push({ expr: expr, deg: deg, result: res, error: null });
    } catch (e) {
      if (e.isExprError) {
        out.push({ expr: expr, deg: deg, result: null, error: String(e) });
      } else {
        out.push({
          expr: expr,
          deg: deg,
          result: null,
          error: `UNEXPECTED:${e.name || 'Error'}: ${String(e)}`,
        });
      }
    }
  }
}

const dest = path.join(__dirname, 'vectors.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 1), 'utf8');
const ok = out.filter(r => r.error === null).length;
console.log(`wrote ${out.length} vectors to ${dest} (${ok} numeric, ${out.length - ok} errors)`);
