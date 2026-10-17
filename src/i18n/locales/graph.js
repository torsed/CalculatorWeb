/* Строки вкладки «График». */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'graph.aria':
      'График функций: интерактивный холст. Стрелки — панорама, плюс и минус — масштаб, 0 — сбросить вид.',
    'graph.readoutAria': 'Текущие значения на графике',
    'graph.add': '+ Функция',
    'graph.reset': 'Сбросить вид',
    'graph.pngFail': 'Не удалось сохранить PNG',
    'graph.svgFail': 'Не удалось сохранить SVG',
    'graph.csvFail': 'Не удалось сохранить CSV',
    'graph.intersections': 'Пересечения',
    'graph.noIntersections': 'Пересечений не найдено',
    'graph.fitY': 'Вписать Y',
    'graph.fitFail': 'Не удалось вписать: нет конечных значений',
    'graph.table': 'Таблица',
    'graph.hint':
      'Колесо — зум к курсору, перетаскивание — панорама, правая кнопка мыши — сброс. ' +
      'С клавиатуры: стрелки — панорама, +/− — масштаб, 0 — сбросить. x — переменная.',
    'graph.view': 'Вид: x от {min} до {max}',
    'graph.intersectLine': '{n}. x = {x}, y = {y}',
    'graph.colorFn': 'Сменить цвет функции {fx}',
    'graph.changeColor': 'Сменить цвет',
    'graph.fnInput': 'Функция для графика',
    'graph.toggleFn': 'Показать или скрыть функцию {fx}',
    'graph.toggle': 'Показать/скрыть',
    'graph.delFn': 'Удалить функцию {fx}',
    'graph.del': 'Удалить функцию',
    'graph.range': 'Диапазон',
    'graph.logX': 'Лог. шкала X',
    'graph.logY': 'Лог. шкала Y',
    'graph.hover': 'x = {x}\ny = {y}',
    'graph.err.range': 'Диапазон содержит некорректные значения',
    'graph.err.xmin': 'xmin должен быть меньше xmax',
    'graph.err.ymin': 'ymin должен быть меньше ymax',
    'graph.mode': 'Тип кривой',
    'graph.mode.y': 'y = f(x)',
    'graph.mode.polar': 'r = f(θ)',
    'graph.mode.param': 'x(t), y(t)',
    'graph.fnInputY': 'Вторая функция y(t)',
    'graph.ph.fx': 'например sin(x)',
    'graph.ph.fxPolar': 'например 1 + cos(θ)',
    'graph.paramsTitle': 'Параметры кривых',
    'graph.paramsHint':
      'Ползунки задают переменные A, B, C, D — используйте их в формулах, например ' +
      'A·sin(B·x). Полярный и параметрический режимы считают θ/t на интервале ниже.',
    'graph.paramAria': 'Параметр {name}',
    'graph.domain': 'Интервал θ/t',
  });
  i18n.add('en', {
    'graph.aria':
      'Function graph: interactive canvas. Arrow keys pan, plus and minus zoom, 0 resets the view.',
    'graph.readoutAria': 'Current values on the graph',
    'graph.add': '+ Function',
    'graph.reset': 'Reset view',
    'graph.pngFail': 'Could not save PNG',
    'graph.svgFail': 'Could not save SVG',
    'graph.csvFail': 'Could not save CSV',
    'graph.intersections': 'Intersections',
    'graph.noIntersections': 'No intersections found',
    'graph.fitY': 'Fit Y',
    'graph.fitFail': 'Could not fit: no finite values',
    'graph.table': 'Table',
    'graph.hint':
      'Wheel — zoom to cursor, drag — pan, right mouse button — reset. ' +
      'From the keyboard: arrows — pan, +/− — zoom, 0 — reset. x is the variable.',
    'graph.view': 'View: x from {min} to {max}',
    'graph.intersectLine': '{n}. x = {x}, y = {y}',
    'graph.colorFn': 'Change color of {fx}',
    'graph.changeColor': 'Change color',
    'graph.fnInput': 'Function to plot',
    'graph.toggleFn': 'Show or hide {fx}',
    'graph.toggle': 'Show/hide',
    'graph.delFn': 'Delete function {fx}',
    'graph.del': 'Delete function',
    'graph.range': 'Range',
    'graph.logX': 'Log scale X',
    'graph.logY': 'Log scale Y',
    'graph.hover': 'x = {x}\ny = {y}',
    'graph.err.range': 'Range contains invalid values',
    'graph.err.xmin': 'xmin must be less than xmax',
    'graph.err.ymin': 'ymin must be less than ymax',
    'graph.mode': 'Curve type',
    'graph.mode.y': 'y = f(x)',
    'graph.mode.polar': 'r = f(θ)',
    'graph.mode.param': 'x(t), y(t)',
    'graph.fnInputY': 'Second function y(t)',
    'graph.ph.fx': 'e.g. sin(x)',
    'graph.ph.fxPolar': 'e.g. 1 + cos(θ)',
    'graph.paramsTitle': 'Curve parameters',
    'graph.paramsHint':
      'The sliders set variables A, B, C, D — use them in formulas, e.g. A·sin(B·x). ' +
      'Polar and parametric modes evaluate θ/t over the interval below.',
    'graph.paramAria': 'Parameter {name}',
    'graph.domain': 'θ/t interval',
  });
})();
