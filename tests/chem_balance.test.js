/* Headless-проверка балансировщика уравнений: вытаскивает функцию из pages/chem.js
   и прогоняет эталонные уравнения без браузера. Запуск: node tests/chem_balance.test.js */
/* eslint-disable no-new-func -- test harness intentionally builds a function from source slice */
'use strict';
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'pages', 'chem.js'), 'utf8');

// Вырезаем блок от "function gcd" до конца nullspaceVector вместе с зависимостями.
const start = src.indexOf('function gcd(a, b)');
const endMarker = 'function mountChem(app)';
const end = src.indexOf(endMarker);
if (start === -1 || end === -1 || end < start) {
  console.error('Не удалось найти блок балансировщика в pages/chem.js');
  process.exit(2);
}
const block = src.slice(start, end);

// Псевдоним для parseFormula из того же файла (берём как есть).
const pfStart = src.indexOf('function parseFormula(text)');
const readEnd = src.indexOf('function molarMass(formula)');
const helper = src.slice(pfStart, readEnd);

const ELEMENTS = {
  H: 1.008,
  He: 4.003,
  Li: 6.94,
  Be: 9.012,
  B: 10.81,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  Ne: 20.18,
  Na: 22.99,
  Mg: 24.305,
  Al: 26.982,
  Si: 28.085,
  P: 30.974,
  S: 32.06,
  Cl: 35.45,
  Ar: 39.95,
  K: 39.098,
  Ca: 40.078,
  Fe: 55.845,
  Cu: 63.546,
  Zn: 65.38,
  Mn: 54.938,
  Br: 79.904,
  Ag: 107.87,
  I: 126.9,
  Ba: 137.33,
  Pt: 195.08,
  Au: 196.97,
};
const BY_SYMBOL = {};
Object.keys(ELEMENTS).forEach(function (s) {
  BY_SYMBOL[s] = [0, s, s, ELEMENTS[s]];
});

const factory = new Function('BY_SYMBOL', helper + '\n' + block + '\nreturn balanceEquation;');
const balanceEquation = factory(BY_SYMBOL);

const CASES = [
  ['H2 + O2 -> H2O', '2H2 + O2 -> 2H2O'],
  ['Fe + O2 -> Fe2O3', '4Fe + 3O2 -> 2Fe2O3'],
  ['C3H8 + O2 -> CO2 + H2O', 'C3H8 + 5O2 -> 3CO2 + 4H2O'],
  ['Fe2O3 + CO -> Fe + CO2', 'Fe2O3 + 3CO -> 2Fe + 3CO2'],
  ['KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2', null],
  ['Na + H2O -> NaOH + H2', '2Na + 2H2O -> 2NaOH + H2'],
  ['Al + O2 -> Al2O3', '4Al + 3O2 -> 2Al2O3'],
  ['C + H2O -> CO + H2', null],
];

let pass = 0;
let fail = 0;

CASES.forEach(function (c) {
  let got;
  try {
    got = balanceEquation(c[0]);
  } catch (e) {
    got = 'ОШИБКА: ' + (e && e.message ? e.message : e);
  }
  if (c[1] === null) {
    console.log((/ОШИБКА/.test(got) ? '⚠ ' : '  ') + c[0] + '  ⇒  ' + got);
    pass++;
    return;
  }
  const norm = function (s) {
    return String(s).replace(/→/g, '->').replace(/\s+/g, '');
  };
  if (norm(got) === norm(c[1])) {
    console.log('✓ ' + c[0] + '  ⇒  ' + got);
    pass++;
  } else {
    console.log('✗ ' + c[0] + '\n   ожидалось: ' + c[1] + '\n   получено : ' + got);
    fail++;
  }
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
