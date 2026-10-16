/* Строки ядра матриц (src/core/matrix.js). */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'core.matrixNonFinite': 'Значение должно быть конечным числом',
    'core.matrixInputRequired': 'Введите матрицу (строки через «;» или с новой строки)',
    'core.matrixRowRequired': 'Введите хотя бы одну строку',
    'core.matrixNotANumber': '«{tok}» не является числом',
    'core.matrixEmptyRow': 'Пустая строка матрицы',
    'core.matrixRowLengthMismatch': 'Все строки матрицы должны быть одинаковой длины',
    'core.matrixEmpty': 'Пустая матрица',
    'core.matrixShapeMismatch': 'Размеры матриц не совпадают',
    'core.matrixDimensionMismatch': 'Число столбцов A не равно числу строк B',
    'core.matrixSquareRequired': 'Нужна квадратная матрица',
    'core.matrixRankSquareRequired': 'Ранг определён для квадратных матриц',
    'core.matrixSingular': 'Матрица вырождена — обратной не существует',
    'core.matrixNoUniqueSolution': 'Система не имеет единственного решения',
    'core.matrixEigenSquareRequired': 'Собственные значения — только для квадратной матрицы',
    'core.matrixPolyModuleMissing': 'Модуль полиномов не загружен',
  });
  i18n.add('en', {
    'core.matrixNonFinite': 'Value must be a finite number',
    'core.matrixInputRequired': 'Enter a matrix (rows separated by “;” or a newline)',
    'core.matrixRowRequired': 'Enter at least one row',
    'core.matrixNotANumber': '“{tok}” is not a number',
    'core.matrixEmptyRow': 'Empty matrix row',
    'core.matrixRowLengthMismatch': 'All matrix rows must have the same length',
    'core.matrixEmpty': 'Empty matrix',
    'core.matrixShapeMismatch': 'Matrix dimensions do not match',
    'core.matrixDimensionMismatch': 'Number of columns of A does not equal number of rows of B',
    'core.matrixSquareRequired': 'A square matrix is required',
    'core.matrixRankSquareRequired': 'Rank is defined for square matrices',
    'core.matrixSingular': 'Matrix is singular — no inverse exists',
    'core.matrixNoUniqueSolution': 'System has no unique solution',
    'core.matrixEigenSquareRequired': 'Eigenvalues are only defined for a square matrix',
    'core.matrixPolyModuleMissing': 'Polynomial module is not loaded',
  });
})();
