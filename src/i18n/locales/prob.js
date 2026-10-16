/* Строки вкладки «Вероятность»: распределения, подписи полей, сообщения. */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'prob.distribution': 'Распределение',
    'prob.param': 'Параметр {name}',
    'prob.f.binomial': 'Биномиальное распределение  P(X=k) = C(n,k)·p^k·(1−p)^(n−k)',
    'prob.f.poisson': 'Распределение Пуассона  P(X=k) = λ^k·e^(−λ)/k!',
    'prob.f.normalPdf': 'Плотность нормального распределения  f(x) = (1/√(2π))·e^(−(x−μ)²/2σ²)/σ',
    'prob.f.normalCdf': 'CDF нормального распределения  F(z) = (1 + erf(z/√2))/2',
    'prob.f.binomialExpectation': 'Математическое ожидание биномиального  E[X] = n·p',
    'prob.f.binomialVariance': 'Дисперсия биномиального  D[X] = n·p·(1−p)',
    'prob.err.integer': 'n должно быть целым ≥ 0',
    'prob.err.oneEmpty': 'Оставьте ровно одно поле пустым',
    'prob.err.undefined': 'Проверьте данные: результат не определён (деление на ноль?)',
    'prob.err.solve':
      'Формула вычисляет «{target}». Не удалось решить относительно «{key}» — проверьте данные.',
    'prob.hint':
      'Вероятности p — в долях (0 ≤ p ≤ 1), k — целое число, λ — параметр Пуассона. Оставьте пустым поле с искомой величиной.',
  });
  i18n.add('en', {
    'prob.distribution': 'Distribution',
    'prob.param': 'Parameter {name}',
    'prob.f.binomial': 'Binomial distribution  P(X=k) = C(n,k)·p^k·(1−p)^(n−k)',
    'prob.f.poisson': 'Poisson distribution  P(X=k) = λ^k·e^(−λ)/k!',
    'prob.f.normalPdf': 'Normal distribution density  f(x) = (1/√(2π))·e^(−(x−μ)²/2σ²)/σ',
    'prob.f.normalCdf': 'Normal distribution CDF  F(z) = (1 + erf(z/√2))/2',
    'prob.f.binomialExpectation': 'Binomial expectation  E[X] = n·p',
    'prob.f.binomialVariance': 'Binomial variance  D[X] = n·p·(1−p)',
    'prob.err.integer': 'n must be an integer ≥ 0',
    'prob.err.oneEmpty': 'Leave exactly one field empty',
    'prob.err.undefined': 'Check the data: the result is undefined (division by zero?)',
    'prob.err.solve':
      'The formula computes «{target}». Could not solve for «{key}» — check the data.',
    'prob.hint':
      'Probabilities p are fractions (0 ≤ p ≤ 1), k is an integer, λ is the Poisson parameter. Leave the field for the unknown value empty.',
  });
})();
