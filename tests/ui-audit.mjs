/* Аудит отображения всех вкладок: скриншоты (desktop + mobile), горизонтальные
 * переполнения внутри каждой страницы и JS-ошибки. Пишет shots/audit/.
 * Запуск: node tests/ui-audit.mjs (сервер уже должен работать на 8787).
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:8787';
const OUT = 'shots/audit';
mkdirSync(OUT, { recursive: true });

const TABS = [
  'calc',
  'graph',
  'conv',
  'stats',
  'matrix',
  'numth',
  'solver',
  'analysis',
  'phys',
  'chem',
  'geom',
  'finance',
  'util',
  'date',
  'prob',
  'prog',
  'gen',
  'elem',
];

const SIZES = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const browser = await chromium.launch();
const problems = [];

for (const s of SIZES) {
  const ctx = await browser.newContext({
    viewport: { width: s.width, height: s.height },
    deviceScaleFactor: 2,
    isMobile: s.name === 'mobile',
    hasTouch: s.name === 'mobile',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForFunction(() => window.CW && window.CW.appInstance);
  await page.waitForTimeout(600);

  for (const id of TABS) {
    const btn = page.locator(`#tab-${id}`);
    if (!(await btn.count())) {
      continue;
    }
    await btn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${s.name}-${id}.png`, fullPage: true });

    // Переполнение внутри активной страницы вкладки (не только документа).
    const report = await page.evaluate(tabId => {
      const pg = document.getElementById('page-' + tabId);
      if (!pg) {
        return { overflowW: 0, scrollW: 0, clientW: 0, bad: [] };
      }
      const scrollW = pg.scrollWidth;
      const clientW = pg.clientWidth;
      const bad = [];
      if (scrollW > clientW + 1) {
        pg.querySelectorAll('*').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > clientW + 1) {
            bad.push(
              `${el.tagName}.${(el.className || '').toString().slice(0, 40)}` +
                ` right=${Math.round(r.right)} w=${Math.round(r.width)}`
            );
          }
        });
      }
      return { overflowW: scrollW > clientW + 1 ? 1 : 0, scrollW, clientW, bad: bad.slice(0, 8) };
    }, id);
    if (report.overflowW) {
      problems.push(
        `${s.name}/${id}: переполнение ${report.scrollW} > ${report.clientW}\n    ` +
          report.bad.join('\n    ')
      );
    }
  }

  if (errors.length) {
    problems.push(`${s.name}: JS-ошибки: ${errors.slice(0, 5).join(' | ')}`);
  }
  await ctx.close();
}

await browser.close();
console.log('\n=== проблемы ===');
console.log(problems.length ? problems.join('\n') : 'нет');
