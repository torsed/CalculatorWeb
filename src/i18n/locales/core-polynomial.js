/* Строки ядра: полиномы (src/core/polynomial.js). */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'core.polyBadChar': 'Неизвестный символ: {char}',
    'core.polyDivZero': 'Деление на ноль',
    'core.polyUnexpectedEnd': 'Неожиданный конец выражения',
    'core.polyUnclosedParen': 'Не закрыта скобка',
    'core.polyUnexpectedToken': 'Неожиданный символ: {token}',
  });
  i18n.add('en', {
    'core.polyBadChar': 'Unknown character: {char}',
    'core.polyDivZero': 'Division by zero',
    'core.polyUnexpectedEnd': 'Unexpected end of expression',
    'core.polyUnclosedParen': 'Unclosed parenthesis',
    'core.polyUnexpectedToken': 'Unexpected character: {token}',
  });
})();
