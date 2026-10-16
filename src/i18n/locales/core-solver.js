/* Строки ядра: численный решатель уравнений. */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'core.parseExpression': 'Не удалось разобрать выражение: {msg}',
    'core.samplesInt': 'Число выборок должно быть целым числом',
    'core.samplesMin': 'Число выборок должно быть ≥ 2',
    'core.intervalBounds': 'Границы интервала должны быть числами',
    'core.zeroWidth': 'Интервал имеет нулевую ширину — корни не ищутся',
    'core.noRootsNote': 'Корней на интервале не найдено. Попробуйте расширить диапазон.',
    'core.numericRootsNote': 'Численные корни (точных символьных форм нет).',
  });
  i18n.add('en', {
    'core.parseExpression': 'Failed to parse expression: {msg}',
    'core.samplesInt': 'Number of samples must be an integer',
    'core.samplesMin': 'Number of samples must be ≥ 2',
    'core.intervalBounds': 'Interval bounds must be numbers',
    'core.zeroWidth': 'Interval has zero width — roots are not searched',
    'core.noRootsNote': 'No roots found on the interval. Try widening the range.',
    'core.numericRootsNote': 'Numeric roots (no exact symbolic forms).',
  });
})();
