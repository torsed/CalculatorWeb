# CalculatorWeb

[![CI](https://github.com/torsed/CalculatorWeb/actions/workflows/ci.yml/badge.svg)](https://github.com/torsed/CalculatorWeb/actions/workflows/ci.yml)
[![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-2ea44f)](https://torsed.github.io/CalculatorWeb/)

Научный калькулятор на чистом vanilla JS. Открывается как обычный файл —
сборщик не нужен: `index.html` грузит скрипты обычными `<script>`
(ES-модули по `file://` не работают, поэтому их нет — см. комментарий
в `index.html`).

Демо онлайн: **https://torsed.github.io/CalculatorWeb/** (PWA, работает офлайн).

## Структура

- `src/core/` — чистая математика без DOM: `parser.js`, `format.js`,
  `matrix.js`, `numtheory.js`, `stats.js`, `solver.js`, `polynomial.js`,
  `analysis.js` (производные/интегралы/пределы), `datetime.js` (календарь),
  `probdist.js` (распределения и квантили), `prog.js` (IEEE-754, Base64, CRC32),
  `linsystem.js` (линейные системы)
- `src/state/history.js` — история в localStorage
- `src/i18n/` — интернационализация: `i18n.js` (ядро `t`/`tn`) и
  `locales/*.js` — каталоги строк ru/en (по одному на область). Язык по
  умолчанию — русский, переключается кнопкой в шапке (`localStorage.cw.lang`).
- `src/ui/` — `calcState.js`, `calcView.js`, `graphView.js`, `app.js`,
  `bootstrap.js` (старт приложения), `sw-register.js` (регистрация SW)
- `src/ui/pages/` — вкладки, по файлу на тему:
  `conv`, `stats`, `matrix`, `numtheory`, `solver`, `analysis`, `phys`, `chem`,
  `geom`, `finance`, `util`, `date`, `prob`, `prog`, `gen`
  (+ `helpers.js` — общие `F`/`el`, единый источник вместо копий)
- `src/core/polynomial.js` — свой движок полиномов: извлечение коэффициентов
  из выражения и корни любой степени (Durand–Kerner). Заменяет mathjs,
  который тянул ~650 КБ и умел только степень ≤ 3.
- `src/icons/` — PWA-иконки 192/512 (генерируются, `maskable` для 512).
- `types/globals.d.ts` — общие типы для `tsc --checkJs` (`window.CW`,
  `FormulaSpec`); `tsconfig.json` — конфиг проверки.
- `tests/coverage.js` — единая точка входа для `c8` (один процесс, сводное
  покрытие); `.c8rc.json` — что считать.
- `CHANGELOG.md` — история изменений.

## Команды

```bash
npm test          # smoke + векторы парсера + балансировщик + расширения ядра (без браузера)
npm run test:e2e  # Playwright, 58 тестов в реальном Chromium (функционал + axe)
npm run test:coverage  # покрытие ядра и состояния через c8 (npm run test:coverage)
npm run test:core # только расширения ядра (tests/core_ext.test.js)
npm run typecheck # tsc --checkJs по src/**/*.js (см. tsconfig.json, types/)
npm run lint      # ESLint, должен быть чистым
npm run format:check  # Prettier
```

## Тесты

- `tests/smoke.js` — загрузка всех скриптов + базовые проверки ядра
- `tests/run_vectors.js` + `tests/vectors.json` — сверка парсера с эталоном (348 векторов)
- `tests/chem_balance.test.js` — балансировщик уравнений из `pages/chem.js`
- `tests/core_ext.test.js` — анализ, даты, распределения, программирование,
  линейные системы, расширения матриц/чисел/статистики, избранное в истории
- `tests/e2e/` — Playwright: клики, клавиатура, вкладки, история,
  открытие по `file://`, PNG-экспорт, `a11y.spec.js` — axe-core
  по всем вкладкам (WCAG 2.2 A/AA, ноль нарушений);
  `regression.spec.js` — регресс-тесты на исправленные дефекты и новые
  возможности (обратный расчёт, собственные значения, Ans/M, CSV-экспорт)
- `CHANGELOG.md` — история изменений (Keep a Changelog)
