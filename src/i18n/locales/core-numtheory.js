/* Строки ядра теории чисел (src/core/numtheory.js). */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'core.intExpected': 'Ожидается целое число',
    'core.nextPrimeLimit': 'Следующее простое не найдено за {limit} шагов',
    'core.factorNegative': 'Факторизация определена для неотрицательных чисел',
    'core.totientPositive': 'φ определена для положительных чисел',
    'core.modZero': 'Модуль не может быть нулём',
    'core.noInverse': 'Обратный элемент не существует',
    'core.baseTooSmall': 'Основание должно быть ≥ 2',
    'core.mobiusPositive': 'μ определена для положительных чисел',
    'core.divisorsPositive': 'Функция делителей определена для положительных чисел',
    'core.crtEmpty': 'Нужен хотя бы один остаток',
    'core.crtModPositive': 'Модуль должен быть положительным',
    'core.crtNoSolution': 'Система сравнений несовместна',
    'core.cfFinite': 'Нужно конечное число',
    'core.rsaPrimes': 'p и q должны быть различными простыми числами',
    'core.rsaECoprime': 'e должно быть взаимно просто с φ(n)',
  });
  i18n.add('en', {
    'core.intExpected': 'An integer is expected',
    'core.nextPrimeLimit': 'Next prime not found within {limit} steps',
    'core.factorNegative': 'Factorization is defined for non-negative numbers',
    'core.totientPositive': 'φ is defined for positive numbers',
    'core.modZero': 'Modulus cannot be zero',
    'core.noInverse': 'Inverse element does not exist',
    'core.baseTooSmall': 'Base must be ≥ 2',
    'core.mobiusPositive': 'μ is defined for positive numbers',
    'core.divisorsPositive': 'The divisor function is defined for positive numbers',
    'core.crtEmpty': 'At least one remainder is required',
    'core.crtModPositive': 'The modulus must be positive',
    'core.crtNoSolution': 'The congruences are inconsistent',
    'core.cfFinite': 'A finite number is required',
    'core.rsaPrimes': 'p and q must be distinct primes',
    'core.rsaECoprime': 'e must be coprime to φ(n)',
  });
})();
