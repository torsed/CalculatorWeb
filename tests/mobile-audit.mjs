/* Проверка мобильных дефектов без глаза: размеры зон нажатия, читаемость,
   геометрия холста. Зрение может быть недоступно, а дефекты измеримы. */
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:8787';
// WCAG 2.5.8: минимальная цель нажатия 24×24 CSS-пикселя (AA).
const MIN_TAP = 24;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 360, height: 740 },
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'load' });
await page.waitForTimeout(900);

const findings = [];

for (const tab of [
  'Калькулятор',
  'График',
  'Конвертер',
  'Химия',
  'Матрицы',
  'Решатель',
  'Элементы',
]) {
  const btn = page.locator(`button.tab:has-text("${tab}")`);
  if (!(await btn.count())) {
    continue;
  }
  await btn.first().click();
  await page.waitForTimeout(400);

  const r = await page.evaluate(MIN => {
    const out = { smallTaps: [], clipped: [], tinyText: [], canvas: null };
    const vis = el => {
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent !== null;
    };
    document.querySelectorAll('button, .tab, select, input[type=checkbox]').forEach(el => {
      if (!vis(el)) {
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) {
        return;
      }
      if (r.width < MIN || r.height < MIN) {
        out.smallTaps.push(
          `${el.tagName}.${(el.className || '').toString().slice(0, 20)} ` +
            `${Math.round(r.width)}×${Math.round(r.height)} "${(el.textContent || '').trim().slice(0, 12)}"`
        );
      }
    });
    // Обрезанный текст: scrollWidth заметно больше видимой ширины.
    document.querySelectorAll('button, .tab, .hint, h3, .brand').forEach(el => {
      if (!vis(el)) {
        return;
      }
      if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
        out.clipped.push(
          `${el.tagName}.${(el.className || '').toString().slice(0, 20)} ` +
            `"${(el.textContent || '').trim().slice(0, 18)}"`
        );
      }
    });
    // Нечитаемый шрифт (<11px на мобильном).
    document.querySelectorAll('button, .hint, label, span').forEach(el => {
      if (!vis(el)) {
        return;
      }
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs && fs < 11 && (el.textContent || '').trim()) {
        out.tinyText.push(`${fs}px "${(el.textContent || '').trim().slice(0, 18)}"`);
      }
    });
    const c = document.querySelector('#page-graph canvas');
    if (c && vis(c)) {
      const b = c.getBoundingClientRect();
      out.canvas = {
        cssW: Math.round(b.width),
        cssH: Math.round(b.height),
        bitW: c.width,
        bitH: c.height,
      };
    }
    return out;
  }, MIN_TAP);

  const line = [];
  if (r.smallTaps.length) {
    line.push(`мелкие зоны (${r.smallTaps.length}): ${r.smallTaps.slice(0, 4).join('; ')}`);
  }
  if (r.clipped.length) {
    line.push(`обрезан текст: ${r.clipped.slice(0, 4).join('; ')}`);
  }
  if (r.tinyText.length) {
    line.push(`мелкий шрифт: ${[...new Set(r.tinyText)].slice(0, 4).join('; ')}`);
  }
  if (r.canvas) {
    line.push(
      `canvas ${r.canvas.cssW}×${r.canvas.cssH} css (${r.canvas.bitW}×${r.canvas.bitH} px)`
    );
  }
  findings.push(`${tab}: ${line.length ? line.join(' | ') : 'ок'}`);
}

console.log(findings.join('\n'));
await browser.close();
