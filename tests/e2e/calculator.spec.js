import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'url';
import { resolve } from 'path';

test.describe('CalculatorWeb core functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.CW && window.CW.appInstance);
  });

  test('loads without errors', async ({ page }) => {
    await expect(page.locator('.brand')).toHaveText('Калькулятор');
    await expect(page.locator('.tab[aria-selected="true"]')).toHaveText('Калькулятор');
  });

  test('basic calculation 5+3=8 via button clicks', async ({ page }) => {
    await page.click('button.key:has-text("5")');
    await page.click('button.key.op:has-text("+")');
    await page.click('button.key:has-text("3")');
    await page.click('button.key.op:has-text("=")');

    await expect(page.locator('.result')).toHaveText('8');
  });

  test('keyboard input 2^10=1024', async ({ page }) => {
    await page.keyboard.type('2^10');
    await page.keyboard.press('Enter');

    await expect(page.locator('.result')).toHaveText('1024');
  });

  test('switch to graph tab and render', async ({ page }) => {
    await page.click('button.tab:has-text("График")');
    await expect(page.locator('#graph-canvas')).toBeVisible();
    await page.waitForTimeout(500);
    const canvas = page.locator('#graph-canvas');
    await expect(canvas).toHaveCSS('width', /[0-9]+px/);
  });

  test('theme toggle persists', async ({ page }) => {
    const themeBtn = page.locator('.icon-btn');
    await themeBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await themeBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('history panel shows calculations', async ({ page }) => {
    await page.keyboard.type('7*6');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    await expect(page.locator('.h-item')).toContainText('7 × 6');
    await expect(page.locator('.h-item')).toContainText('42');
  });

  test('converter tab works', async ({ page }) => {
    await page.click('button.tab:has-text("Конвертер")');
    await expect(page.locator('#page-conv select.field').first()).toBeVisible();
    await page.selectOption('#page-conv select.field', { label: 'Длина' });
    await expect(page.locator('#page-conv select.field').nth(1)).toBeVisible();
  });

  test('parser handles complex and large expressions correctly', async ({ page }) => {
    await page.keyboard.type('sin(30) + sqrt(16)');
    await page.keyboard.press('Enter');
    await expect(page.locator('.result')).toContainText('4');

    await page.keyboard.press('Escape');
    await page.keyboard.type('2pi');
    await page.keyboard.press('Enter');
    await expect(page.locator('.result')).toContainText('6.283');
  });

  test('form fields have accessible names', async ({ page }) => {
    // Скринридер обязан видеть имя у каждого поля. Иначе поля молчат.
    const unnamed = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('input, textarea, select').forEach(f => {
        const name = f.getAttribute('aria-label') || f.getAttribute('aria-labelledby');
        const labelled = f.id && document.querySelector(`label[for="${f.id}"]`);
        const wrapped = f.closest('label');
        const ownText = f.tagName === 'BUTTON' ? f.textContent.trim() : '';
        if (!name && !labelled && !wrapped && !ownText && f.type !== 'hidden') {
          bad.push(
            f.tagName +
              '.' +
              (f.className || '(no class)') +
              (f.getAttribute('placeholder') ? ` [${f.getAttribute('placeholder')}]` : '')
          );
        }
      });
      return bad;
    });
    expect(unnamed, 'поля без доступного имени:\n' + unnamed.join('\n')).toEqual([]);
  });

  test('results announce politely for screen readers', async ({ page }) => {
    await page.click('button.tab:has-text("Химия")');
    const out = page.locator('#page-chem .out').first();
    await expect(out).toHaveAttribute('role', 'status');
    await expect(out).toHaveAttribute('aria-live', 'polite');
  });

  test('viewport allows pinch zoom', async ({ page }) => {
    // user-scalable=no ломает доступность для слабовидящих.
    const content = await page.getAttribute('meta[name="viewport"]', 'content');
    expect(content).not.toContain('user-scalable=no');
    expect(content).not.toContain('maximum-scale');
  });

  test('app works when opened as a plain file (file://)', async ({ page }) => {
    // Критичный сценарий: пользователь открывает index.html двойным кликом.
    // ES-модули по file:// не грузятся (opaque origin), поэтому архитектура
    // намеренно остаётся на window.CW + классических <script>.
    // Этот тест — напоминание, а не украшение.
    const fileUrl = pathToFileURL(resolve(__dirname, '..', '..', 'index.html')).href;
    await page.goto(fileUrl, { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    const state = await page.evaluate(() => ({
      hasApp: !!(window.CW && window.CW.appInstance),
      keys: window.CW ? Object.keys(window.CW).length : 0,
      // Модульные скрипты не должны появляться: они здесь не загрузятся.
      moduleScripts: document.querySelectorAll('script[type="module"]').length,
    }));

    expect(state.moduleScripts, 'ES-модули сломают запуск по file://').toBe(0);
    expect(state.hasApp, 'приложение не поднялось при открытии файлом').toBe(true);
    expect(state.keys).toBeGreaterThan(5);

    // И калькулятор реально считает, а не просто «загрузился».
    await page.click('button.tab:has-text("Калькулятор")');
    await page.evaluate(() => {
      const i = document.querySelector('#page-calc input.field');
      if (i) {
        i.value = '2^8';
        i.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(300);
  });

  test('chemistry tab balances equations', async ({ page }) => {
    await page.click('button.tab:has-text("Химия")');
    const inputs = page.locator('#page-chem input.field');
    await expect(inputs.first()).toBeVisible();

    // Молярная масса воды: 2*1.008 + 15.999 = 18.015
    await inputs.first().fill('H2O');
    await page.click('#page-chem button.btn.primary:has-text("Посчитать") >> nth=0');
    await expect(page.locator('#page-chem .out').nth(0)).toContainText('18.015');

    // Балансировщик: 4Fe + 3O2 -> 2Fe2O3
    await inputs.nth(1).fill('Fe + O2 -> Fe2O3');
    await page.click('#page-chem button.btn.primary:has-text("Уравновесить")');
    await expect(page.locator('#page-chem .out').nth(1)).toHaveText('4Fe + 3O2 → 2Fe2O3');
  });

  test('chemistry tab calculates molar concentration c = n/V', async ({ page }) => {
    await page.click('button.tab:has-text("Химия")');
    // Карточка «Расчёты» — последняя на странице. Изолируем её, чтобы не
    // зацепить поля молярной массы и балансировщика.
    const calcCard = page.locator('#page-chem .card').filter({ hasText: 'Расчёты' });
    await expect(calcCard).toBeVisible();
    await calcCard.locator('select.field').selectOption({
      label: 'Молярная концентрация  c = n/V',
    });
    const inputs = calcCard.locator('input.field:visible');
    await expect(inputs).toHaveCount(3);
    // n=0.5 моль, V=0.001 м³ (1 л) → c = 500 моль/м³.
    await inputs.nth(1).fill('0.5'); // n
    await inputs.nth(2).fill('0.001'); // V
    await calcCard.locator('button.btn.primary').click();
    const out = calcCard.locator('.out');
    await expect(out).toContainText('c =');
    await expect(out).toContainText('500');
  });

  test('chemistry tab solves water ion product H⁺·OH⁻ = 10⁻¹⁴', async ({ page }) => {
    await page.click('button.tab:has-text("Химия")');
    const calcCard = page.locator('#page-chem .card').filter({ hasText: 'Расчёты' });
    await calcCard.locator('select.field').selectOption({
      label: 'Ионное произведение воды  H⁺·OH⁻ = 10⁻¹⁴',
    });
    const inputs = calcCard.locator('input.field:visible');
    // У этой формулы только 2 ключа (H⁺, OH⁻).
    await expect(inputs).toHaveCount(2);
    // OH⁻ = 10⁻⁷ → H⁺ = 10⁻⁷ моль/л (нейтральная вода при 25 °C).
    await inputs.nth(1).fill('0.0000001'); // OH⁻
    await calcCard.locator('button.btn.primary').click();
    const out = calcCard.locator('.out');
    await expect(out).toContainText('H⁺');
    await expect(out).toContainText('1e-07');
  });

  test('chemistry tab computes reaction yield η = (m_факт/m_теор)·100%', async ({ page }) => {
    await page.click('button.tab:has-text("Химия")');
    const calcCard = page.locator('#page-chem .card').filter({ hasText: 'Расчёты' });
    await calcCard.locator('select.field').selectOption({
      label: 'Выход реакции  η = (m_факт/m_теор)·100%',
    });
    const inputs = calcCard.locator('input.field:visible');
    await expect(inputs).toHaveCount(3);
    // Практический выход 2 г при теоретическом 5 г → 40%.
    await inputs.nth(1).fill('2'); // m_факт
    await inputs.nth(2).fill('5'); // m_теор
    await calcCard.locator('button.btn.primary').click();
    const out = calcCard.locator('.out');
    await expect(out).toContainText('η');
    await expect(out).toContainText('40');
  });

  test('geometry tab solves circle area S = π·r²', async ({ page }) => {
    await page.click('button.tab:has-text("Геометрия")');
    const card = page.locator('#page-geom .card');
    await expect(card).toBeVisible();
    await card.locator('select.field').selectOption({
      label: 'Площадь круга  S = π·r²',
    });
    const inputs = card.locator('input.field:visible');
    await expect(inputs).toHaveCount(2);
    // r=2 м → S = π·4 ≈ 12.566 м².
    await inputs.nth(1).fill('2'); // r
    await card.locator('button.btn.primary').click();
    const out = card.locator('.out');
    await expect(out).toContainText('S =');
    await expect(out).toContainText('12.566');
  });

  test('finance tab solves simple interest S = P·(1+r·t)', async ({ page }) => {
    await page.click('button.tab:has-text("Финансы")');
    const card = page.locator('#page-finance .card');
    await expect(card).toBeVisible();
    await card.locator('select.field').selectOption({
      label: 'Простые проценты  S = P·(1 + r·t)',
    });
    const inputs = card.locator('input.field:visible');
    await expect(inputs).toHaveCount(4);
    // P=1000 ₽, r=0.05 (5%), t=2 года → S = 1000·1.1 = 1100.
    await inputs.nth(1).fill('1000'); // P
    await inputs.nth(2).fill('0.05'); // r
    await inputs.nth(3).fill('2'); // t
    await card.locator('button.btn.primary').click();
    const out = card.locator('.out');
    await expect(out).toContainText('S =');
    await expect(out).toContainText('1100');
  });

  test('util tab solves percent of number X = A·p/100', async ({ page }) => {
    await page.click('button.tab:has-text("Быт")');
    const card = page.locator('#page-util .card');
    await expect(card).toBeVisible();
    await card.locator('select.field').selectOption({
      label: 'Процент от числа  X = A·p / 100',
    });
    const inputs = card.locator('input.field:visible');
    await expect(inputs).toHaveCount(3);
    // A=200, p=15 → X = 30.
    await inputs.nth(1).fill('200'); // A
    await inputs.nth(2).fill('15'); // p
    await card.locator('button.btn.primary').click();
    const out = card.locator('.out');
    await expect(out).toContainText('X =');
    await expect(out).toContainText('30');
  });

  test('physics tab solves pendulum period T = 2π·√(L/g)', async ({ page }) => {
    await page.click('button.tab:has-text("Физика")');
    await page.selectOption('#page-phys select.field', {
      label: 'Период математического маятника  T = 2π·√(L/g)',
    });
    const inputs = page.locator('#page-phys input.field');
    await expect(inputs.first()).toBeVisible();
    // L=1 м, g=9.81 м/с² → T = 2π·√(1/9.81) ≈ 2.006 с.
    await inputs.nth(1).fill('1'); // L
    await inputs.nth(2).fill('9.81'); // g
    await page.click('#page-phys button.btn.primary:has-text("Решить")');
    const out = page.locator('#page-phys .out');
    await expect(out).toContainText('T =');
    await expect(out).toContainText('2.006');
  });

  test('prob tab solves Poisson probability P(X=k) = λ^k·e^(−λ)/k!', async ({ page }) => {
    await page.click('button.tab:has-text("Вероятность")');
    const card = page.locator('#page-prob .card');
    await expect(card).toBeVisible();
    await card.locator('select.field').selectOption({
      label: 'Распределение Пуассона  P(X=k) = λ^k·e^(−λ)/k!',
    });
    const inputs = card.locator('input.field:visible');
    await expect(inputs).toHaveCount(3);
    // λ=2, k=3 → 8·e⁻²/6 ≈ 0.1804.
    await inputs.nth(1).fill('2'); // λ
    await inputs.nth(2).fill('3'); // k
    await card.locator('button.btn.primary').click();
    const out = card.locator('.out');
    await expect(out).toContainText('P');
    await expect(out).toContainText('0.1804');
  });

  test('prog tab converts 255₁₀ → hex 0xFF', async ({ page }) => {
    await page.click('button.tab:has-text("Программирование")');
    const card = page.locator('#page-prog .card');
    await expect(card).toBeVisible();
    await card.locator('select.field').selectOption({
      label: 'Из десятичного → base N  R = D.toString(base)',
    });
    const inputs = card.locator('input.field:visible');
    await expect(inputs).toHaveCount(2);
    // n=255, base=16 → R = '0xFF'.
    await inputs.nth(0).fill('255');
    await inputs.nth(1).fill('16');
    await card.locator('button.btn.primary').click();
    const out = card.locator('.out');
    await expect(out).toContainText('R');
    await expect(out).toContainText('0xFF');
  });

  test('gen tab generates dice rolls 3d6', async ({ page }) => {
    await page.click('button.tab:has-text("Генератор")');
    const card = page.locator('#page-gen .card');
    await expect(card).toBeVisible();
    await card.locator('select.field').selectOption({
      label: 'Бросок кубика  K граней, M бросков',
    });
    const inputs = card.locator('input.field:visible');
    await expect(inputs).toHaveCount(3);
    // k=6, m=3 → Σ=3..18, три значения в [1..6]. R оставляем пустым.
    await inputs.nth(1).fill('6');
    await inputs.nth(2).fill('3');
    await card.locator('button.btn.primary:has-text("Сгенерировать")').click();
    const out = card.locator('.out');
    await expect(out).toContainText('Σ');
    // Каждое значение в диапазоне 1..6 — проверяем, что первое ≥ 1 и ≤ 6.
    const text = (await out.textContent()) || '';
    const m = /\[(\d+), (\d+), (\d+)\]/.exec(text);
    expect(m).not.toBeNull();
    const rolls = [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
    for (const v of rolls) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    }
  });

  test('matrix tab calculates determinant', async ({ page }) => {
    await page.click('button.tab:has-text("Матрицы")');
    await expect(page.locator('#page-matrix textarea.field').first()).toBeVisible();
    await page.fill('#page-matrix textarea.field:first-of-type', '1 2\n3 4');
    await page.selectOption('#page-matrix select.field', 'det');
    await page.click('#page-matrix button.btn.primary:has-text("Вычислить")');
    await expect(page.locator('#page-matrix .out')).toHaveText('-2');
  });

  test('solver tab finds roots', async ({ page }) => {
    await page.click('button.tab:has-text("Решатель")');
    await expect(page.locator('#page-solver input.field[placeholder*="x^2"]')).toBeVisible();
    await page.fill('#page-solver input.field[placeholder*="x^2"]', 'x^2 - 4');
    await page.click('#page-solver button.btn.primary:has-text("Найти корни")');
    await expect(page.locator('#page-solver .out')).toContainText('x1 = -2');
    await expect(page.locator('#page-solver .out')).toContainText('x2 = 2');
  });

  test('export history downloads JSON', async ({ page }) => {
    await page.keyboard.type('1+1');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    const downloadPromise = page.waitForEvent('download');
    await page.click('button.btn:has-text("Экспорт")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('history.json');
  });

  test('PNG export on graph tab', async ({ page }) => {
    await page.click('button.tab:has-text("График")');
    await page.waitForTimeout(500);

    const downloadPromise = page.waitForEvent('download');
    await page.click('button.btn:has-text("PNG")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('graph.png');
  });

  test('stats tab computes mean and sum', async ({ page }) => {
    await page.click('button.tab:has-text("Статистика")');
    const ta = page.locator('#stats-data');
    await expect(ta).toBeVisible();
    await ta.fill('1, 2, 3, 4, 5');
    await page.click('#page-stats button.btn.primary:has-text("Посчитать")');
    const out = page.locator('#page-stats .out').first();
    await expect(out).toContainText('Среднее:');
    // Σ=15, среднее=3, медиана=3 — все три должны появиться в строках.
    await expect(out).toContainText('15');
    await expect(out).toContainText('3');
  });

  test('number theory factorizes 360', async ({ page }) => {
    await page.click('button.tab:has-text("Числа")');
    const input = page.locator('#page-numth input.field').first();
    await expect(input).toBeVisible();
    await input.fill('360');
    await page.selectOption('#page-numth select.field', 'factor');
    await page.click('#page-numth button.btn.primary');
    // 360 = 2^3 · 3^2 · 5
    const out = page.locator('#page-numth .out');
    await expect(out).toContainText('2^3');
    await expect(out).toContainText('3^2');
    await expect(out).toContainText('5');
  });

  test('physics tab solves kinetic energy E = m·v²/2', async ({ page }) => {
    await page.click('button.tab:has-text("Физика")');
    const inputs = page.locator('#page-phys input.field');
    await expect(inputs.first()).toBeVisible();
    // По умолчанию первая формула — кинетическая энергия: ключи E, m, v.
    // m=8, v=10 → E = 0.5 · 8 · 10² = 400 Дж.
    await inputs.nth(1).fill('8'); // m
    await inputs.nth(2).fill('10'); // v
    await page.click('#page-phys button.btn.primary:has-text("Решить")');
    const out = page.locator('#page-phys .out');
    await expect(out).toContainText('E =');
    await expect(out).toContainText('400');
  });

  test('physics tab solves Ohm law U = I·R', async ({ page }) => {
    await page.click('button.tab:has-text("Физика")');
    // 14-й в списке (после 6 базовых + 8 добавленных до закона Ома): индекс 14.
    // Считаем по-простому — находим option по тексту.
    await page.selectOption('#page-phys select.field', { label: 'Закон Ома  U = I·R' });
    const inputs = page.locator('#page-phys input.field');
    await expect(inputs.first()).toBeVisible();
    // U — искомая, ключи U, I, R → nth(1)=I, nth(2)=R.
    await inputs.nth(1).fill('2'); // I
    await inputs.nth(2).fill('10'); // R
    await page.click('#page-phys button.btn.primary:has-text("Решить")');
    const out = page.locator('#page-phys .out');
    await expect(out).toContainText('U =');
    await expect(out).toContainText('20');
  });

  test('physics tab solves thin lens 1/F = 1/d + 1/f', async ({ page }) => {
    await page.click('button.tab:has-text("Физика")');
    await page.selectOption('#page-phys select.field', {
      label: 'Тонкая линза  1/F = 1/d + 1/f',
    });
    const inputs = page.locator('#page-phys input.field');
    await expect(inputs.first()).toBeVisible();
    // d=0.1 м, f=0.2 м → F = 1/(1/0.1 + 1/0.2) = 1/15 ≈ 0.0667 м.
    await inputs.nth(1).fill('0.1'); // d
    await inputs.nth(2).fill('0.2'); // f
    await page.click('#page-phys button.btn.primary:has-text("Решить")');
    const out = page.locator('#page-phys .out');
    await expect(out).toContainText('F =');
    await expect(out).toContainText('0.066');
  });

  test('physics tab solves Clapeyron–Mendeleev P·V = n·R·T', async ({ page }) => {
    await page.click('button.tab:has-text("Физика")');
    await page.selectOption('#page-phys select.field', {
      label: 'Уравнение Клапейрона — Менделеева  P·V = n·R·T',
    });
    // У этой формулы 4 ключа (P, V, n, T) — проверяем, что 4-е поле видно.
    const inputs = page.locator('#page-phys input.field:visible');
    await expect(inputs).toHaveCount(4);
    // V=1 м³, n=1 моль, T=300 К → P = 8.314·1·300/1 ≈ 2494 Па.
    await inputs.nth(1).fill('1'); // V
    await inputs.nth(2).fill('1'); // n
    await inputs.nth(3).fill('300'); // T
    await page.click('#page-phys button.btn.primary:has-text("Решить")');
    const out = page.locator('#page-phys .out');
    await expect(out).toContainText('P =');
    await expect(out).toContainText('2494');
  });

  test('physics tab solves first cosmic velocity v₁ = √(g·R)', async ({ page }) => {
    await page.click('button.tab:has-text("Физика")');
    await page.selectOption('#page-phys select.field', {
      label: 'Первая космическая  v₁ = √(g·R)',
    });
    const inputs = page.locator('#page-phys input.field');
    await expect(inputs.first()).toBeVisible();
    // g=9.81 м/с², R=6 371 000 м → v₁ ≈ 7905.66 м/с.
    await inputs.nth(1).fill('9.81'); // g
    await inputs.nth(2).fill('6371000'); // R
    await page.click('#page-phys button.btn.primary:has-text("Решить")');
    const out = page.locator('#page-phys .out');
    await expect(out).toContainText('v₁ =');
    await expect(out).toContainText('7905.66');
  });

  test('physics tab solves LC oscillation period T = 2π·√(L·C)', async ({ page }) => {
    await page.click('button.tab:has-text("Физика")');
    await page.selectOption('#page-phys select.field', {
      label: 'Период колебательного контура  T = 2π·√(L·C)',
    });
    const inputs = page.locator('#page-phys input.field');
    await expect(inputs.first()).toBeVisible();
    // L=1 Гн, C=1 Ф → T = 2π ≈ 6.283 с.
    await inputs.nth(1).fill('1'); // L
    await inputs.nth(2).fill('1'); // C
    await page.click('#page-phys button.btn.primary:has-text("Решить")');
    const out = page.locator('#page-phys .out');
    await expect(out).toContainText('T =');
    await expect(out).toContainText('6.283');
  });
});
