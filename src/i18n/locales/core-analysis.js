/* Сообщения ядра анализа (src/core/analysis.js). */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'core.parseExpression': 'Не удалось разобрать выражение: {msg}',
    'core.notDefined': 'Значение не определено: {what}',
    'core.integrandBoundary': 'Функция не определена на границе отрезка',
    'core.integrandUndefined': 'Функция не определена внутри отрезка',
    'core.sumTooMany': 'Слишком много слагаемых (максимум 100000)',
    'core.sumUndefined': 'Функция не определена при k={k}',
  });
  i18n.add('en', {
    'core.parseExpression': 'Failed to parse the expression: {msg}',
    'core.notDefined': 'Value is undefined: {what}',
    'core.integrandBoundary': 'The function is undefined at the interval boundary',
    'core.integrandUndefined': 'The function is undefined inside the interval',
    'core.sumTooMany': 'Too many terms (maximum 100000)',
    'core.sumUndefined': 'The function is undefined at k={k}',
  });
})();
