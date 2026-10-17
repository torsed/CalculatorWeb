/* Строки вкладки «Матрицы». */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'matrix.placeholderA': 'Матрица A: строки через перевод строки или «;»',
    'matrix.placeholderB': 'Матрица B',
    'matrix.hintB': 'B:',
    'matrix.op.add': 'A + B',
    'matrix.op.sub': 'A − B',
    'matrix.op.mul': 'A × B',
    'matrix.op.transpose': 'Aᵀ',
    'matrix.op.det': 'Определитель A',
    'matrix.op.rank': 'Ранг A',
    'matrix.op.inv': 'Обратная A',
    'matrix.op.solve': 'Решить Ax=b (B — вектор)',
    'matrix.op.eig': 'Собственные значения A',
    'matrix.op.scale': 'Умножить A на 10',
    'matrix.op.trace': 'След A',
    'matrix.op.norm': 'Норма A (Фробениуса)',
    'matrix.op.power': 'Степень Aⁿ (n справа)',
    'matrix.op.rref': 'Приведённый ступенчатый вид A',
    'matrix.op.lu': 'LU-разложение A',
    'matrix.op.qr': 'QR-разложение A',
    'matrix.rankLabel': 'Ранг: {n}',
    'matrix.eig.none': 'Собственных значений не найдено',
    'matrix.hint':
      'Вырожденность определяется относительным порогом, поэтому det([[1e-13]]) = 1e-13, а не 0.',
  });
  i18n.add('en', {
    'matrix.placeholderA': 'Matrix A: rows separated by a newline or “;”',
    'matrix.placeholderB': 'Matrix B',
    'matrix.hintB': 'B:',
    'matrix.op.add': 'A + B',
    'matrix.op.sub': 'A − B',
    'matrix.op.mul': 'A × B',
    'matrix.op.transpose': 'Aᵀ',
    'matrix.op.det': 'Determinant A',
    'matrix.op.rank': 'Rank A',
    'matrix.op.inv': 'Inverse A',
    'matrix.op.solve': 'Solve Ax=b (B is a vector)',
    'matrix.op.eig': 'Eigenvalues of A',
    'matrix.op.scale': 'Multiply A by 10',
    'matrix.op.trace': 'Trace of A',
    'matrix.op.norm': 'Frobenius norm of A',
    'matrix.op.power': 'Power Aⁿ (n on the right)',
    'matrix.op.rref': 'Reduced row echelon form of A',
    'matrix.op.lu': 'LU decomposition of A',
    'matrix.op.qr': 'QR decomposition of A',
    'matrix.rankLabel': 'Rank: {n}',
    'matrix.eig.none': 'No eigenvalues found',
    'matrix.hint':
      'Singularity is determined by a relative threshold, so det([[1e-13]]) = 1e-13, not 0.',
  });
})();
