/* Строки вкладки «Решатель». */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'solver.title': 'Решение уравнения f(x) = 0',
    'solver.placeholder': 'например x^2 - 4',
    'solver.symbolic': ' Символьный (точные корни полиномов)',
    'solver.findRoots': 'Найти корни',
    'solver.from': 'От',
    'solver.to': 'До',
    'solver.samples': 'Выборок',
    'solver.hint':
      'Численный режим: бисекция + Ньютон на сетке. Символьный: точные корни полиномов ' +
      'любой степени (Durand–Kerner), для остального — численные.',
    'solver.notFound': 'Корней не найдено',
    'solver.err.equals': 'Ожидается не более одного знака «=»',
    'solver.symbolicNone': 'Символьное решение не найдено — численные корни.',
  });
  i18n.add('en', {
    'solver.title': 'Solving the equation f(x) = 0',
    'solver.placeholder': 'e.g. x^2 - 4',
    'solver.symbolic': ' Symbolic (exact roots of polynomials)',
    'solver.findRoots': 'Find roots',
    'solver.from': 'From',
    'solver.to': 'To',
    'solver.samples': 'Samples',
    'solver.hint':
      'Numeric mode: bisection + Newton on a grid. Symbolic: exact roots of polynomials ' +
      'of any degree (Durand–Kerner); numeric for everything else.',
    'solver.notFound': 'No roots found',
    'solver.err.equals': 'At most one "=" sign is expected',
    'solver.symbolicNone': 'No symbolic solution found — numeric roots.',
  });
})();
