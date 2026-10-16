/* Строки вкладки «Геометрия»: названия формул, подписи полей, сообщения. */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'geom.formula': 'Формула',
    'geom.param': 'Параметр {name}',
    'geom.f.circleArea': 'Площадь круга  S = π·r²',
    'geom.f.circumference': 'Длина окружности  C = 2π·r',
    'geom.f.heron': 'Площадь треугольника (Герон)  S = √(p·(p−a)·(p−b)·(p−c))',
    'geom.f.triangleArea': 'Площадь треугольника  S = ½·b·h',
    'geom.f.rectangleArea': 'Площадь прямоугольника  S = a·b',
    'geom.f.rectanglePerimeter': 'Периметр прямоугольника  P = 2·(a + b)',
    'geom.f.trapezoidArea': 'Площадь трапеции  S = ½·(a + b)·h',
    'geom.f.circularSector': 'Площадь кругового сектора  S = ½·r²·α',
    'geom.f.sphereVolume': 'Объём сферы  V = (4/3)·π·r³',
    'geom.f.sphereArea': 'Площадь сферы  A = 4·π·r²',
    'geom.f.cylinderVolume': 'Объём цилиндра  V = π·r²·h',
    'geom.f.coneVolume': 'Объём конуса  V = (1/3)·π·r²·h',
    'geom.err.oneEmpty': 'Оставьте ровно одно поле пустым',
    'geom.err.undefined': 'Проверьте данные: результат не определён (деление на ноль?)',
    'geom.err.solve':
      'Формула вычисляет «{target}». Не удалось решить относительно «{key}» — проверьте данные.',
    'geom.hint': 'Все длины в метрах, углы в радианах. Оставьте пустым поле с искомой величиной.',
  });
  i18n.add('en', {
    'geom.formula': 'Formula',
    'geom.param': 'Parameter {name}',
    'geom.f.circleArea': 'Area of a circle  S = π·r²',
    'geom.f.circumference': 'Circumference  C = 2π·r',
    'geom.f.heron': "Area of a triangle (Heron's formula)  S = √(p·(p−a)·(p−b)·(p−c))",
    'geom.f.triangleArea': 'Area of a triangle  S = ½·b·h',
    'geom.f.rectangleArea': 'Area of a rectangle  S = a·b',
    'geom.f.rectanglePerimeter': 'Perimeter of a rectangle  P = 2·(a + b)',
    'geom.f.trapezoidArea': 'Area of a trapezoid  S = ½·(a + b)·h',
    'geom.f.circularSector': 'Area of a circular sector  S = ½·r²·α',
    'geom.f.sphereVolume': 'Volume of a sphere  V = (4/3)·π·r³',
    'geom.f.sphereArea': 'Surface area of a sphere  A = 4·π·r²',
    'geom.f.cylinderVolume': 'Volume of a cylinder  V = π·r²·h',
    'geom.f.coneVolume': 'Volume of a cone  V = (1/3)·π·r²·h',
    'geom.err.oneEmpty': 'Leave exactly one field empty',
    'geom.err.undefined': 'Check the data: the result is undefined (division by zero?)',
    'geom.err.solve':
      'The formula computes «{target}». Could not solve for «{key}» — check the data.',
    'geom.hint':
      'All lengths are in meters, angles in radians. Leave the field for the desired value empty.',
  });
})();
