/* Flat config для ESLint 10 (замена .eslintrc.cjs).
 *
 * src/ — классические скрипты (без модулей: приложение обязано работать
 * по file://). tests/*.js — CommonJS (vm-харнесс), tests/e2e и *.mjs — ESM.
 */
'use strict';
const globals = require('globals');

const rules = {
  'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  'no-undef': 'off',
  'no-var': 'error',
  'prefer-const': 'error',
  'no-console': 'off',
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  curly: ['error', 'all'],
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-duplicate-case': 'error',
  'no-fallthrough': 'error',
  'no-unreachable': 'error',
  'no-constant-condition': 'error',
  'no-self-assign': 'error',
  'no-redeclare': 'error',
  'array-callback-return': 'error',
  'no-empty': ['error', { allowEmptyCatch: true }],
};

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'shots/**',
    ],
  },
  {
    // Ядро и UI: классические скрипты с window-глобалами.
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: { ...globals.browser, CW: 'readonly' },
    },
    rules: { ...rules, strict: ['error', 'global'] },
  },
  {
    // Node-харнесс unit-тестов (vm-контекст, require).
    files: ['tests/**/*.js'],
    ignores: ['tests/e2e/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: { ...rules, strict: ['error', 'global'] },
  },
  {
    // ESM: Playwright-тесты, вспомогательные скрипты, конфиг Playwright.
    files: ['tests/e2e/**/*.js', 'tests/**/*.mjs', 'playwright.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: rules,
  },
];
