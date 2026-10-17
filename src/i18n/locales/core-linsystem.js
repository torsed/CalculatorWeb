/* Сообщения ядра линейных систем (src/core/linsystem.js). */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'core.sysEmpty': 'Введите хотя бы одно уравнение',
    'core.sysNoVars': 'Не найдено неизвестных в системе',
    'core.sysCount': 'Для {vars} неизвестных нужно ровно столько же уравнений, а их {eqs}',
    'core.sysTooManyEquals': 'В уравнении больше одного «=»',
    'core.sysParse': 'Не удалось разобрать уравнение «{line}»: {msg}',
    'core.sysMatrixMissing': 'Модуль матриц не загружен',
    'core.sysNoUnique': 'Система не имеет единственного решения (возможно, уравнения зависимы)',
    'core.sysNonlinear': 'Система нелинейна или задана некорректно (невязка велика)',
    'core.sysEval': 'Ошибка вычисления: {msg}',
    'core.sysNotFinite': 'Выражение не даёт конечного числа',
  });
  i18n.add('en', {
    'core.sysEmpty': 'Enter at least one equation',
    'core.sysNoVars': 'No unknowns found in the system',
    'core.sysCount': '{vars} unknowns require exactly {vars} equations, but there are {eqs}',
    'core.sysTooManyEquals': 'An equation has more than one “=”',
    'core.sysParse': 'Failed to parse equation “{line}”: {msg}',
    'core.sysMatrixMissing': 'The matrix module is not loaded',
    'core.sysNoUnique': 'The system has no unique solution (equations may be dependent)',
    'core.sysNonlinear': 'The system is nonlinear or ill-formed (large residual)',
    'core.sysEval': 'Evaluation error: {msg}',
    'core.sysNotFinite': 'The expression does not evaluate to a finite number',
  });
})();
