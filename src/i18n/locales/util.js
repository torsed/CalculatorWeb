/* Строки вкладки «Быт». */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'util.fn.bmi': 'Индекс массы тела  BMI = m / h²',
    'util.fn.tip': 'Чаевые  T = S·p / 100',
    'util.fn.percent': 'Процент от числа  X = A·p / 100',
    'util.fn.change': 'Процентное изменение  Δ% = (b − a) / a·100',
    'util.fn.fuel': 'Расход топлива  Q = V/L·100',
    'util.fn.time': 'Время в пути  t = S/V',
    'util.fn.gas': 'Стоимость бензина на поездку  C = (Q/100)·S·P',
    'util.param': 'Параметр {n}',
    'util.err.baseZero': 'Базовое значение не может быть нулём',
    'util.err.oneEmpty': 'Оставьте пустым ровно одно поле — искомую величину',
    'util.err.undefined': 'Проверьте данные: результат не определён (деление на ноль?)',
    'util.err.solve':
      'Формула вычисляет «{calc}». Не удалось решить относительно «{unknown}» — проверьте данные.',
    'util.hint':
      'Проценты как 5..100 (а не 0.05..1), вес в кг, рост в м. Оставьте пустым поле с искомой величиной — формула решится относительно него.',
  });
  i18n.add('en', {
    'util.fn.bmi': 'Body mass index  BMI = m / h²',
    'util.fn.tip': 'Tip  T = S·p / 100',
    'util.fn.percent': 'Percentage of a number  X = A·p / 100',
    'util.fn.change': 'Percentage change  Δ% = (b − a) / a·100',
    'util.fn.fuel': 'Fuel consumption  Q = V/L·100',
    'util.fn.time': 'Travel time  t = S/V',
    'util.fn.gas': 'Fuel cost per trip  C = (Q/100)·S·P',
    'util.param': 'Parameter {n}',
    'util.err.baseZero': 'The base value cannot be zero',
    'util.err.oneEmpty': 'Leave exactly one field empty — the value you are solving for',
    'util.err.undefined': 'Check the data: the result is undefined (division by zero?)',
    'util.err.solve':
      'The formula computes «{calc}». Could not solve for «{unknown}» — check the data.',
    'util.hint':
      'Percentages as 5..100 (not 0.05..1), weight in kg, height in m. Leave the field with the unknown value empty — the formula will be solved for it.',
  });
})();
