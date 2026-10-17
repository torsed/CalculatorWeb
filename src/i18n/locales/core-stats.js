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
    'core.pairLength': 'Выборки x и y должны быть одинаковой длины',
    'core.regressionNoX': 'Все значения x одинаковы — регрессия невозможна',
    'core.regressionDegree': 'Недостаточно точек для такой степени полинома',
    'core.regressionSingular': 'Система нормальных уравнений вырождена',
    'core.noProbdist': 'Модуль распределений не загружен',
    'core.expectedPositive': 'Ожидаемые частоты должны быть положительными',
    'core.pairRow': 'В каждой строке нужны два числа (x и y): «{row}»',
    'core.pairNumber': 'Не число в строке: {row}',
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
    'core.pairLength': 'The x and y samples must have the same length',
    'core.regressionNoX': 'All x values are equal — regression is impossible',
    'core.regressionDegree': 'Not enough points for that polynomial degree',
    'core.regressionSingular': 'The normal equations system is singular',
    'core.noProbdist': 'The distributions module is not loaded',
    'core.expectedPositive': 'Expected frequencies must be positive',
    'core.pairRow': 'Each row needs two numbers (x and y): “{row}”',
    'core.pairNumber': 'Not a number in row: {row}',
  });
})();
