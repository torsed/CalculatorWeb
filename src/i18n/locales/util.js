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
    'util.err.tooFew': 'Заполните все поля, кроме искомого — его оставьте пустым',
    'util.err.undefined': 'Проверьте данные: результат не определён (деление на ноль?)',
    'util.err.solve':
      'Формула вычисляет «{calc}». Не удалось решить относительно «{unknown}» — проверьте данные.',
    // Общая подсказка (одинакова для всех операций) + своя строка на каждую
    // операцию: при смене операции hint обновляется вместе с полями.
    'util.hint.common':
      'Оставьте пустым поле с искомой величиной — формула решится относительно него; если заполнены все поля, пересчитывается первая величина. Проценты как 5..100 (а не 0.05..1).',
    'util.hint.bmi': 'm — вес в килограммах, h — рост в метрах.',
    'util.hint.tip': 'S — сумма счёта в ₽, p — процент чаевых.',
    'util.hint.percent': 'A — число, p — процент.',
    'util.hint.change': 'a — старое значение, b — новое; результат — рост в процентах.',
    'util.hint.fuel': 'V — потраченное топливо в литрах, L — путь в километрах.',
    'util.hint.time': 'S — путь в километрах, V — средняя скорость в км/ч.',
    'util.hint.gas': 'Q — расход в л/100 км, S — путь в км, P — цена топлива в ₽/л.',
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
    'util.err.tooFew': 'Fill in every field except the unknown one — leave that one empty',
    'util.err.undefined': 'Check the data: the result is undefined (division by zero?)',
    'util.err.solve':
      'The formula computes «{calc}». Could not solve for «{unknown}» — check the data.',
    // Common hint (same for all formulas) + a per-formula line: switching the
    // operation updates the hint together with the input fields.
    'util.hint.common':
      'Leave the field with the unknown value empty — the formula will be solved for it; if every field is filled, the first value is recomputed. Percentages as 5..100 (not 0.05..1).',
    'util.hint.bmi': 'm — weight in kilograms, h — height in meters.',
    'util.hint.tip': 'S — bill amount in ₽, p — tip percentage.',
    'util.hint.percent': 'A — the number, p — the percentage.',
    'util.hint.change': 'a — the old value, b — the new one; the result is growth in percent.',
    'util.hint.fuel': 'V — fuel used in liters, L — distance in kilometers.',
    'util.hint.time': 'S — distance in kilometers, V — average speed in km/h.',
    'util.hint.gas': 'Q — consumption in l/100 km, S — distance in km, P — fuel price in ₽/l.',
  });
})();
