/* Строки вкладки «Генератор». */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'gen.fn.int': 'Случайное целое  N ∈ [min, max]',
    'gen.fn.real': 'Случайных вещественных  N ∈ [min, max)',
    'gen.fn.dice': 'Бросок кубика  K граней, M бросков',
    'gen.fn.password': 'Пароль (len, наборы символов)',
    'gen.param': 'Параметр {n}',
    'gen.generate': 'Сгенерировать',
    'gen.hint':
      'Пароль: наборы символов — комбинация «luds» (lower, upper, digit, sym). Бросок кубика: k — грани (2..∞), m — число бросков.',
    'gen.err.intMinMax': 'min/max должны быть целыми',
    'gen.err.minLeMax': 'min должно быть ≤ max',
    'gen.err.sets': 'Включите хотя бы один набор символов',
    'gen.err.minLtMax': 'min должно быть < max',
    'gen.err.k': 'k должно быть целым ≥ 2',
    'gen.err.m': 'm должно быть целым ≥ 1',
    'gen.err.len': 'len должно быть целым ≥ 1',
  });
  i18n.add('en', {
    'gen.fn.int': 'Random integer  N ∈ [min, max]',
    'gen.fn.real': 'Random reals  N ∈ [min, max)',
    'gen.fn.dice': 'Dice roll  K faces, M rolls',
    'gen.fn.password': 'Password (len, character sets)',
    'gen.param': 'Parameter {n}',
    'gen.generate': 'Generate',
    'gen.hint':
      'Password: character sets — a combination of “luds” (lower, upper, digit, sym). Dice roll: k — faces (2..∞), m — number of rolls.',
    'gen.err.intMinMax': 'min/max must be integers',
    'gen.err.minLeMax': 'min must be ≤ max',
    'gen.err.sets': 'Enable at least one character set',
    'gen.err.minLtMax': 'min must be < max',
    'gen.err.k': 'k must be an integer ≥ 2',
    'gen.err.m': 'm must be an integer ≥ 1',
    'gen.err.len': 'len must be an integer ≥ 1',
  });
})();
