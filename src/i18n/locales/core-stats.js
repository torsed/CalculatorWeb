/* Сообщения статистического ядра (src/core/stats.js). */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'core.noData': 'Нет данных для расчёта',
    'core.badDdof': 'ddof должен быть целым ≥ 0',
    'core.insufficientValues': 'Недостаточно значений для такой степени свободы',
    'core.badQuantile': 'Квантиль должен быть от 0 до 1',
    'core.geometricPositive': 'Среднее геометрическое требует положительных чисел',
    'core.harmonicNonZero': 'Среднее гармоническое требует ненулевых чисел',
    'core.harmonicMixed': 'Среднее гармоническое не определено для смешанных знаков',
    'core.notANumber': '«{part}» не является числом',
    'core.emptyInput': 'Введите хотя бы одно число',
  });
  i18n.add('en', {
    'core.noData': 'No data to compute',
    'core.badDdof': 'ddof must be an integer ≥ 0',
    'core.insufficientValues': 'Not enough values for that degree of freedom',
    'core.badQuantile': 'Quantile must be between 0 and 1',
    'core.geometricPositive': 'Geometric mean requires positive numbers',
    'core.harmonicNonZero': 'Harmonic mean requires non-zero numbers',
    'core.harmonicMixed': 'Harmonic mean is undefined for mixed signs',
    'core.notANumber': '“{part}” is not a number',
    'core.emptyInput': 'Enter at least one number',
  });
})();
