/* Перечисляет поля без доступного имени с указанием места в разметке —
   чтобы чинить адресно, а не наугад. */
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(process.env.BASE_URL || 'http://localhost:8787', { waitUntil: 'load' });
await page.waitForTimeout(1200);

const rows = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('input, textarea, select').forEach(f => {
    const name = f.getAttribute('aria-label') || f.getAttribute('aria-labelledby');
    if (f.type === 'hidden') {
      return;
    }
    if (name || (f.id && document.querySelector(`label[for="${f.id}"]`)) || f.closest('label')) {
      return;
    }
    const sel =
      f.tagName === 'SELECT' && f.options.length
        ? f.options[f.selectedIndex].textContent.trim()
        : '';
    out.push({
      tag: f.tagName,
      cls: f.className || '(none)',
      id: f.id || '',
      page: f.closest('[id^="page-"]')?.id || '(вне вкладок)',
      placeholder: f.getAttribute('placeholder') || '',
      type: f.type || '',
      selected: sel,
    });
  });
  return out;
});

rows.forEach(r => console.log(JSON.stringify(r)));
console.log('total:', rows.length);
await browser.close();
