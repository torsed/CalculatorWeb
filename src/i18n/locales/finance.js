/* Строки вкладки «Финансы». */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'finance.title': 'Формула',
    'finance.fn.simple': 'Простые проценты  S = P·(1 + r·t)',
    'finance.fn.compound': 'Сложные проценты  S = P·(1 + r/n)^(n·t)',
    'finance.fn.annuity': 'Аннуитетный платёж  PMT = PV·r/(1 − (1+r)^−n)',
    'finance.fn.fv': 'Будущая стоимость аннуитета  FV = PMT·((1+r)ⁿ−1)/r',
    'finance.fn.real': 'Реальная доходность (инфляция)  r_real = (1+r)/(1+i)−1',
    'finance.fn.bep': 'Точка безубыточности  BEP = FC/(P − VC)',
    'finance.fn.roi': 'ROI  ROI = (Доход − Инвестиции)/Инвестиции·100%',
    'finance.fn.cagr': 'CAGR (среднегодовой темп роста)  r = (FV/PV)^(1/n)−1',
    'finance.fn.div': 'Дивидендная доходность  y = D/P·100%',
    'finance.fn.margin': 'Рентабельность  r = NP/Revenue·100%',
    'finance.param': 'Параметр {n}',
    'finance.err.price': 'Цена должна быть выше переменных затрат',
    'finance.err.oneEmpty': 'Оставьте ровно одно поле пустым',
    'finance.err.undefined': 'Проверьте данные: результат не определён (деление на ноль?)',
    'finance.err.solve':
      'Формула вычисляет «{fn}». Не удалось решить относительно «{target}» — проверьте данные.',
    'finance.hint':
      'Ставки в долях (0.05 = 5%), время в годах, деньги в одной валюте. Оставьте пустым поле с искомой величиной.',
  });
  i18n.add('en', {
    'finance.title': 'Formula',
    'finance.fn.simple': 'Simple interest  S = P·(1 + r·t)',
    'finance.fn.compound': 'Compound interest  S = P·(1 + r/n)^(n·t)',
    'finance.fn.annuity': 'Annuity payment  PMT = PV·r/(1 − (1+r)^−n)',
    'finance.fn.fv': 'Future value of an annuity  FV = PMT·((1+r)ⁿ−1)/r',
    'finance.fn.real': 'Real return (inflation)  r_real = (1+r)/(1+i)−1',
    'finance.fn.bep': 'Break-even point  BEP = FC/(P − VC)',
    'finance.fn.roi': 'ROI  ROI = (Gain − Investment)/Investment·100%',
    'finance.fn.cagr': 'CAGR (compound annual growth rate)  r = (FV/PV)^(1/n)−1',
    'finance.fn.div': 'Dividend yield  y = D/P·100%',
    'finance.fn.margin': 'Profitability  r = NP/Revenue·100%',
    'finance.param': 'Parameter {n}',
    'finance.err.price': 'Price must be higher than variable costs',
    'finance.err.oneEmpty': 'Leave exactly one field empty',
    'finance.err.undefined': 'Check the data: the result is undefined (division by zero?)',
    'finance.err.solve':
      'The formula computes «{fn}». Could not solve for «{target}» — check the data.',
    'finance.hint':
      'Rates as fractions (0.05 = 5%), time in years, money in a single currency. Leave the field for the unknown blank.',
  });
})();
