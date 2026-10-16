/* Снимает экраны на нескольких размерах — брейкпоинты проверяются глазами,
   а не только grep'ом по CSS. Пишет в shots/. */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:8787';
const OUT = 'shots';
mkdirSync(OUT, { recursive: true });

const SIZES = [
  { name: 'mobile-360x740', width: 360, height: 740 },
  { name: 'mobile-390x844', width: 390, height: 844 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'desktop-1440x900', width: 1440, height: 900 },
];
const TABS = ['Калькулятор', 'График', 'Конвертер', 'Химия', 'Матрицы'];

const browser = await chromium.launch();
const problems = [];

for (const s of SIZES) {
  const ctx = await browser.newContext({
    viewport: { width: s.width, height: s.height },
    deviceScaleFactor: 2,
    isMobile: s.width < 700,
    hasTouch: s.width < 700,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(900);

  for (const tab of TABS) {
    const btn = page.locator(`button.tab:has-text("${tab}")`);
    if (!(await btn.count())) {
      continue;
    }
    await btn.first().click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${OUT}/${s.name}-${tab}.png`, fullPage: false });
  }

  // Горизонтальное переполнение — главная беда мобильной вёрстки.
  const overflow = await page.evaluate(() => {
    const de = document.documentElement;
    const bad = [];
    if (de.scrollWidth > de.clientWidth + 1) {
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > de.clientWidth + 1) {
          bad.push(
            `${el.tagName}.${(el.className || '').toString().slice(0, 30)} right=${Math.round(r.right)}`
          );
        }
      });
    }
    return { scrollW: de.scrollWidth, clientW: de.clientWidth, bad: bad.slice(0, 6) };
  });
  if (overflow.scrollW > overflow.clientW + 1) {
    problems.push(
      `${s.name}: горизонтальный скролл ${overflow.scrollW} > ${overflow.clientW}\n    ` +
        overflow.bad.join('\n    ')
    );
  }
  if (errors.length) {
    problems.push(`${s.name}: JS-ошибки: ${errors.join(' | ')}`);
  }

  console.log(
    `${s.name}: scrollW=${overflow.scrollW} clientW=${overflow.clientW} errors=${errors.length}`
  );
  await ctx.close();
}

await browser.close();
console.log('\n=== проблемы ===');
console.log(problems.length ? problems.join('\n') : 'нет');
