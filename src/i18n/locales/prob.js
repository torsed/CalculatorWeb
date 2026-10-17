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
    'prob.distsTitle': 'Распределения и квантили',
    'prob.distOf': 'Распределение',
    'prob.mode': 'Что вычислить',
    'prob.mode.pdf': 'Плотность / вероятность  (f)',
    'prob.mode.cdf': 'Функция распределения  (F)',
    'prob.mode.quantile': 'Квантиль (обратная F)',
    'prob.value': 'Значение x',
    'prob.probability': 'Вероятность p (0…1)',
    'prob.stat.mean': 'Среднее',
    'prob.stat.variance': 'Дисперсия',
    'prob.distsHint':
      'Введите параметры закона, затем x (для f/F) или p (для квантиля). ' +
      'Для нормального — μ и σ; для t — число степеней свободы ν; для χ² — k.',
    'prob.dist.normal': 'Нормальное N(μ, σ)',
    'prob.dist.studentT': 'Стьюдента t(ν)',
    'prob.dist.chi2': 'Хи-квадрат χ²(k)',
    'prob.dist.fisherF': 'Фишера F(d₁, d₂)',
    'prob.dist.exponential': 'Показательное Exp(λ)',
    'prob.dist.uniform': 'Равномерное U(a, b)',
    'prob.dist.binomial': 'Биномиальное B(n, p)',
    'prob.dist.poisson': 'Пуассона P(λ)',
    'prob.dist.geometric': 'Геометрическое Geom(p)',
    'prob.dist.hypergeometric': 'Гипергеометрическое (N, K, n)',
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
    'prob.distsTitle': 'Distributions and quantiles',
    'prob.distOf': 'Distribution',
    'prob.mode': 'What to compute',
    'prob.mode.pdf': 'Density / probability  (f)',
    'prob.mode.cdf': 'Cumulative distribution  (F)',
    'prob.mode.quantile': 'Quantile (inverse F)',
    'prob.value': 'Value x',
    'prob.probability': 'Probability p (0…1)',
    'prob.stat.mean': 'Mean',
    'prob.stat.variance': 'Variance',
    'prob.distsHint':
      'Enter the distribution parameters, then x (for f/F) or p (for a quantile). ' +
      'Normal — μ and σ; t — degrees of freedom ν; χ² — k.',
    'prob.dist.normal': 'Normal N(μ, σ)',
    'prob.dist.studentT': 'Student t(ν)',
    'prob.dist.chi2': 'Chi-square χ²(k)',
    'prob.dist.fisherF': 'Fisher F(d₁, d₂)',
    'prob.dist.exponential': 'Exponential Exp(λ)',
    'prob.dist.uniform': 'Uniform U(a, b)',
    'prob.dist.binomial': 'Binomial B(n, p)',
    'prob.dist.poisson': 'Poisson P(λ)',
    'prob.dist.geometric': 'Geometric Geom(p)',
    'prob.dist.hypergeometric': 'Hypergeometric (N, K, n)',
  });
})();
