/* Сообщения ядра дат (src/core/datetime.js). */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'core.badDate': 'Некорректная дата: {value}',
    'core.ageNegative': 'Дата отсчёта раньше даты рождения',
  });
  i18n.add('en', {
    'core.badDate': 'Invalid date: {value}',
    'core.ageNegative': 'The reference date is before the birth date',
  });
})();
