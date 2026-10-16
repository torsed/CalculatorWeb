/* Диагностика загрузки: снимает реальную ошибку из консоли страницы.
   Playwright-тесты падают на beforeEach с «window.CW.appInstance не появился»,
   но не показывают, что именно сломалось. Этот скрипт говорит прямо. */
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:8787';

const browser = await chromium.launch();
const page = await browser.newPage();

const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}\n${e.stack || ''}`));
page.on('requestfailed', r =>
  logs.push(`[requestfailed] ${r.url()} :: ${r.failure()?.errorText || '?'}`)
);
page.on('response', r => {
  if (r.status() >= 400) {
    logs.push(`[http ${r.status()}] ${r.url()}`);
  }
});

await page.goto(BASE, { waitUntil: 'load' });
await page.waitForTimeout(2500);

const state = await page.evaluate(() => ({
  hasCW: typeof window.CW !== 'undefined',
  cwKeys: window.CW ? Object.keys(window.CW) : [],
  hasAppInstance: !!(window.CW && window.CW.appInstance),
  bodyLen: document.body ? document.body.innerHTML.length : 0,
}));

console.log('=== page state ===');
console.log(JSON.stringify(state, null, 2));
console.log('=== console output ===');
console.log(logs.length ? logs.join('\n') : '(пусто — ошибок нет)');

await browser.close();
