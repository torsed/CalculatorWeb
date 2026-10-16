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
  });
  i18n.add('en', {
    'core.intExpected': 'An integer is expected',
    'core.nextPrimeLimit': 'Next prime not found within {limit} steps',
    'core.factorNegative': 'Factorization is defined for non-negative numbers',
    'core.totientPositive': 'φ is defined for positive numbers',
    'core.modZero': 'Modulus cannot be zero',
    'core.noInverse': 'Inverse element does not exist',
    'core.baseTooSmall': 'Base must be ≥ 2',
  });
})();
