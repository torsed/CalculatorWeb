/* Строки вкладки «Дата и время». */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'date.title': 'Дата и время',
    'date.op': 'Операция',
    'date.op.diff': 'Разница между датами (дней)',
    'date.op.addDays': 'Прибавить дни к дате',
    'date.op.addMonths': 'Прибавить месяцы к дате',
    'date.op.addYears': 'Прибавить годы к дате',
    'date.op.weekday': 'День недели и номер недели',
    'date.op.business': 'Рабочие дни между датами',
    'date.op.age': 'Возраст на дату',
    'date.date1': 'Дата 1 (ГГГГ-ММ-ДД)',
    'date.date2': 'Дата 2 (ГГГГ-ММ-ДД)',
    'date.n': 'Количество',
    'date.plus': '+',
    'date.result.diff': 'Между {a} и {b}: {n} дней',
    'date.result.business': 'Рабочих дней между {a} и {b}: {n}',
    'date.result.age': 'Возраст: {y} лет {m} мес. {d} дн.',
    'date.weekdayLine': '{name}, неделя {week}',
    'date.isoWeekYear': 'Неделя ISO: {week}-я, год {year}',
    'date.leapLine': 'Год {year} високосный: {v}',
    'date.yes': 'да',
    'date.no': 'нет',
    'date.err.number': 'Проверьте числовое поле «Количество»',
    'date.hint':
      'Форматы даты: ГГГГ-ММ-ДД или ДД.ММ.ГГГГ. Рабочие дни — с понедельника по пятницу, ' +
      'включая обе границы.',
  });
  i18n.add('en', {
    'date.title': 'Date & time',
    'date.op': 'Operation',
    'date.op.diff': 'Difference between dates (days)',
    'date.op.addDays': 'Add days to a date',
    'date.op.addMonths': 'Add months to a date',
    'date.op.addYears': 'Add years to a date',
    'date.op.weekday': 'Weekday and week number',
    'date.op.business': 'Business days between dates',
    'date.op.age': 'Age on a date',
    'date.date1': 'Date 1 (YYYY-MM-DD)',
    'date.date2': 'Date 2 (YYYY-MM-DD)',
    'date.n': 'Amount',
    'date.plus': '+',
    'date.result.diff': 'Between {a} and {b}: {n} days',
    'date.result.business': 'Business days between {a} and {b}: {n}',
    'date.result.age': 'Age: {y} years {m} months {d} days',
    'date.weekdayLine': '{name}, week {week}',
    'date.isoWeekYear': 'ISO week: {week}, year {year}',
    'date.leapLine': 'Year {year} is leap: {v}',
    'date.yes': 'yes',
    'date.no': 'no',
    'date.err.number': 'Check the “Amount” numeric field',
    'date.hint':
      'Date formats: YYYY-MM-DD or DD.MM.YYYY. Business days are Monday–Friday, ' +
      'inclusive of both ends.',
  });
})();
