import { test, expect } from '@playwright/test';

// Регресс-тесты на исправленные баги и новые возможности.
// Каждый тест соответствует конкретному дефекту, найденному при аудите.
test.describe('Regressions and new features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.CW && window.CW.appInstance);
  });

  test('parser: inverse trig returns correct complex values (radians)', async ({ page }) => {
    const v = await page.evaluate(() => window.CW.parser.evaluate('asin(2)', false));
    expect(Math.abs(v.re - Math.PI / 2)).toBeLessThan(1e-9);
    expect(Math.abs(v.im - -1.3169578969248166)).toBeLessThan(1e-9);
  });

  test('numtheory: modpow with negative exponent uses modular inverse', async ({ page }) => {
    const a = await page.evaluate(() => window.CW.numtheory.modpow(2, -1, 7));
    const b = await page.evaluate(() => window.CW.numtheory.modpow(3, -1, 11));
    expect(a).toBe(4);
    expect(b).toBe(4);
  });

  test('solver: symbolic mode finds exact polynomial roots (incl. quartic)', async ({ page }) => {
    await page.click('button.tab:has-text("Решатель")');
    await page.locator('#solver-symbolic').check();
    await page.fill('#page-solver input.field[placeholder*="x^2"]', 'x^4 - 5x^2 + 4');
    await page.click('#page-solver button.btn.primary:has-text("Найти корни")');
    const out = page.locator('#page-solver .out');
    await expect(out).toContainText('= -2');
    await expect(out).toContainText('= -1');
    await expect(out).toContainText('= 1');
    await expect(out).toContainText('= 2');
  });

  test('solver: symbolic falls back to numeric for non-polynomial', async ({ page }) => {
    await page.click('button.tab:has-text("Решатель")');
    await page.locator('#solver-symbolic').check();
    await page.fill('#page-solver input.field[placeholder*="x^2"]', 'sin(x)');
    await page.click('#page-solver button.btn.primary:has-text("Найти корни")');
    await expect(page.locator('#page-solver .out')).toContainText('численные корни');
  });

  test('graph: range inputs actually change the view', async ({ page }) => {
    await page.click('button.tab:has-text("График")');
    await page.fill('#graph-xmin', '-5');
    await page.locator('#graph-xmin').blur();
    await page.fill('#graph-xmax', '5');
    await page.locator('#graph-xmax').blur();
    const r = await page.evaluate(() => ({
      xmin: window.CW.appInstance.graphView.xmin,
      xmax: window.CW.appInstance.graphView.xmax,
    }));
    expect(r.xmin).toBe(-5);
    expect(r.xmax).toBe(5);
  });

  test('util: fuel formula has four inputs', async ({ page }) => {
    await page.click('button.tab:has-text("Быт")');
    await page.locator('#page-util select.field').selectOption({ index: 6 });
    const inputs = page.locator('#page-util input.field');
    await expect(inputs).toHaveCount(4);
    await inputs.nth(0).fill('');
    await inputs.nth(1).fill('8');
    await inputs.nth(2).fill('100');
    await inputs.nth(3).fill('50');
    await page.click('#page-util button.btn.primary:has-text("Решить")');
    await expect(page.locator('#page-util .out')).toContainText('400');
  });

  test('util: inverse solve for BMI mass', async ({ page }) => {
    await page.click('button.tab:has-text("Быт")');
    await page.locator('#page-util select.field').selectOption({ index: 0 });
    const inputs = page.locator('#page-util input.field');
    await inputs.nth(0).fill('22'); // BMI
    await inputs.nth(1).fill(''); // масса — искомая
    await inputs.nth(2).fill('1.75'); // рост
    await page.click('#page-util button.btn.primary:has-text("Решить")');
    await expect(page.locator('#page-util .out')).toContainText('m =');
    await expect(page.locator('#page-util .out')).toContainText('67.375 кг');
  });

  test('util: heading shows the tab name, not the brand', async ({ page }) => {
    await page.click('button.tab:has-text("Быт")');
    await expect(page.locator('#page-util h2')).toHaveText('Быт');
  });

  test('util: bottom hint follows the selected formula', async ({ page }) => {
    await page.click('button.tab:has-text("Быт")');
    const hint = page.locator('#page-util .hint');
    // По умолчанию BMI — подсказка про вес и рост.
    await expect(hint).toContainText('вес в килограммах');
    // Смена операции обновляет подсказку вместе с полями.
    await page.locator('#page-util select.field').selectOption({ index: 4 }); // расход топлива
    await expect(hint).toContainText('топливо в литрах');
    await page.locator('#page-util select.field').selectOption({ index: 1 }); // чаевые
    await expect(hint).toContainText('сумма счёта');
  });

  test('mobile: keypad not covered by history, display fully visible', async ({ page }) => {
    // Регресс: при height:100% у .calc на узких экранах колонки сжимались,
    // контент вылезал из контейнера, и история перекрывала дисплей и клавиатуру.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);
    const left = await page.locator('.calc-left').boundingBox();
    const right = await page.locator('.calc-right').boundingBox();
    // Калькулятор целиком выше панели истории, без наложения.
    expect(left.y + left.height).toBeLessThanOrEqual(right.y + 2);
    // Основной пад видим и имеет ненулевую высоту.
    const pad = page.locator('.calc-left .pad:not(.sci-pad)');
    await expect(pad).toBeVisible();
    const pb = await pad.boundingBox();
    expect(pb.height).toBeGreaterThan(150);
    // Дисплей не должен вылезать за пределы .calc-left.
    const display = await page.locator('.calc-left .display-col').boundingBox();
    expect(display.y).toBeGreaterThanOrEqual(left.y - 2);
    expect(display.y + display.height).toBeLessThanOrEqual(left.y + left.height + 2);
  });

  test('graph: coordinate readout hidden when nothing to show', async ({ page }) => {
    // Регресс: пустая рамка readout постоянно висела в правом верхнем углу.
    await page.click('button.tab:has-text("График")');
    const readout = page.locator('.graph-readout');
    await expect(readout).toBeHidden();
    // Курсор над графиком — readout показывает координаты.
    const box = await page.locator('#graph-canvas').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(readout).toBeVisible();
  });

  test('util: inverse solve for BMI height stays positive', async ({ page }) => {
    await page.click('button.tab:has-text("Быт")');
    await page.locator('#page-util select.field').selectOption({ index: 0 });
    const inputs = page.locator('#page-util input.field');
    await inputs.nth(0).fill('22'); // BMI
    await inputs.nth(1).fill('70'); // масса
    await inputs.nth(2).fill(''); // рост — искомая
    await page.click('#page-util button.btn.primary:has-text("Решить")');
    // h² даёт и отрицательный корень — ожидаем положительный рост.
    await expect(page.locator('#page-util .out')).toContainText('h = 1.78377 м');
  });

  test('util: all fields filled recomputes the result', async ({ page }) => {
    await page.click('button.tab:has-text("Быт")');
    const card = page.locator('#page-util .card');
    await card.locator('select.field').selectOption({
      label: 'Процент от числа  X = A·p / 100',
    });
    const inputs = card.locator('input.field:visible');
    await inputs.nth(0).fill('999'); // X — заведомо неверное значение
    await inputs.nth(1).fill('200'); // A
    await inputs.nth(2).fill('15'); // p
    await card.locator('button.btn.primary').click();
    // Все поля заполнены — пересчитывается первая величина, а не ошибка.
    await expect(card.locator('.out')).toContainText('X = 30');
    await expect(card.locator('.out')).not.toHaveClass(/err/);
  });

  test('phys: Ampère force with angle α', async ({ page }) => {
    await page.click('button.tab:has-text("Физика")');
    await page
      .locator('#page-phys select.field')
      .selectOption({ label: 'Сила Ампера  F = I·B·l·sin(α)' });
    const inputs = page.locator('#page-phys input.field');
    await expect(inputs).toHaveCount(5);
    await inputs.nth(0).fill('');
    await inputs.nth(1).fill('2');
    await inputs.nth(2).fill('3');
    await inputs.nth(3).fill('4');
    await inputs.nth(4).fill('1.5707963267948966');
    await page.click('#page-phys button.btn.primary:has-text("Решить")');
    await expect(page.locator('#page-phys .out')).toContainText('F = 24');
  });

  test('phys: inverse solve pendulum length', async ({ page }) => {
    await page.click('button.tab:has-text("Физика")');
    await page
      .locator('#page-phys select.field')
      .selectOption({ label: 'Период математического маятника  T = 2π·√(L/g)' });
    const inputs = page.locator('#page-phys input.field');
    await inputs.nth(0).fill('2'); // T
    await inputs.nth(1).fill(''); // L — искомая
    await inputs.nth(2).fill('9.8'); // g
    await page.click('#page-phys button.btn.primary:has-text("Решить")');
    await expect(page.locator('#page-phys .out')).toContainText('L = 0.992');
  });

  test('chem: Gibbs energy uses temperature input', async ({ page }) => {
    await page.click('button.tab:has-text("Химия")');
    const card = page.locator('#page-chem .card').filter({ hasText: 'Расчёты' });
    await card.locator('select.field').selectOption({ label: 'Энергия Гиббса  ΔG = ΔH − T·ΔS' });
    const inputs = card.locator('input.field');
    await inputs.nth(0).fill('');
    await inputs.nth(1).fill('1000');
    await inputs.nth(2).fill('200');
    await inputs.nth(3).fill('300');
    await card.locator('button.btn.primary:has-text("Решить")').click();
    await expect(card.locator('.out')).toContainText('-59000');
  });

  test('keyboard scoped: typing on another tab does not touch calculator', async ({ page }) => {
    await page.click('button.tab:has-text("Быт")');
    const before = await page.evaluate(() => window.CW.appInstance.calcView.st.cur);
    await page.keyboard.press('7');
    const after = await page.evaluate(() => window.CW.appInstance.calcView.st.cur);
    expect(after).toBe(before);
  });

  test('parser: Ans and M reflect calculator state', async ({ page }) => {
    await page.click('button.tab:has-text("Калькулятор")');
    for (const k of ['5', '+', '3', '=']) {
      await page.click(`#page-calc .pad button:has-text("${k}")`);
    }
    const v = await page.evaluate(() => window.CW.parser.evaluate('ans + 1'));
    expect(v).toBe(9);
  });

  test('matrix: eigenvalues and solve Ax=b', async ({ page }) => {
    await page.click('button.tab:has-text("Матрицы")');
    const card = page.locator('#page-matrix .card');
    await card.locator('select.field').selectOption('eig');
    await page.fill('#page-matrix textarea.field >> nth=0', '2 1\n1 2');
    await card.locator('button.btn.primary').click();
    await expect(card.locator('.out')).toContainText('λ = 1');
    await expect(card.locator('.out')).toContainText('λ = 3');

    await card.locator('select.field').selectOption('solve');
    await page.fill('#page-matrix textarea.field >> nth=0', '2 1\n1 3');
    await page.fill('#page-matrix textarea.field >> nth=1', '3\n5');
    await card.locator('button.btn.primary').click();
    await expect(card.locator('.out')).toContainText('x1 = 0.8');
    await expect(card.locator('.out')).toContainText('x2 = 1.4');
  });

  test('graph: autofit changes Y range', async ({ page }) => {
    await page.click('button.tab:has-text("График")');
    const before = await page.evaluate(() => [
      window.CW.appInstance.graphView.ymin,
      window.CW.appInstance.graphView.ymax,
    ]);
    const ok = await page.evaluate(() => window.CW.appInstance.graphView.autofit());
    expect(ok).toBe(true);
    const after = await page.evaluate(() => [
      window.CW.appInstance.graphView.ymin,
      window.CW.appInstance.graphView.ymax,
    ]);
    expect(after).not.toEqual(before);
  });

  test('graph: CSV export downloads a file', async ({ page }) => {
    await page.click('button.tab:has-text("График")');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#page-graph button:has-text("CSV")'),
    ]);
    expect(download.suggestedFilename()).toBe('graph.csv');
  });

  test('tabs: active tab persists across reload', async ({ page }) => {
    await page.click('button.tab:has-text("Матрицы")');
    await page.reload();
    await page.waitForFunction(() => window.CW && window.CW.appInstance);
    await expect(page.locator('#tab-matrix')).toHaveAttribute('aria-selected', 'true');
  });

  test('converter: currency shows offline approximation hint when API is unreachable', async ({
    page,
  }) => {
    await page.route('**/open.er-api.com/**', route => route.abort());
    await page.click('button.tab:has-text("Конвертер")');
    await page.locator('#conv-cat').selectOption({ label: 'Валюты' });
    await expect(page.locator('#conv-live-hint')).toContainText('приблизительные');
  });

  test('converter: live rates response switches hint to online mode', async ({ page }) => {
    await page.route('**/open.er-api.com/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: 'success',
          base_code: 'USD',
          rates: { USD: 1, EUR: 0.9, RUB: 90 },
        }),
      })
    );
    await page.click('button.tab:has-text("Конвертер")');
    await page.locator('#conv-cat').selectOption({ label: 'Валюты' });
    await page.locator('#conv-from').selectOption('USD');
    await page.locator('#conv-to').selectOption('EUR');
    await expect(page.locator('#conv-live-hint')).toContainText('из сети');
    // 1 USD = 0.9 EUR по замоканному курсу.
    await expect(page.locator('#page-conv .out')).toContainText('0.9 EUR');
  });

  test('graph: value table renders a text alternative', async ({ page }) => {
    await page.click('button.tab:has-text("График")');
    await page.click('#page-graph button:has-text("Таблица")');
    await expect(page.locator('#page-graph .graph-readout')).toContainText('x');
  });

  test('i18n: switching to English translates the shell and persists', async ({ page }) => {
    await expect(page.locator('button.tab:has-text("График")')).toBeVisible();
    await page.click('.lang-btn');
    await page.waitForFunction(() => window.CW && window.CW.appInstance);
    await expect(page.locator('button.tab:has-text("Graph")')).toBeVisible();
    await expect(page.locator('button.tab:has-text("График")')).toHaveCount(0);
    await page.reload();
    await page.waitForFunction(() => window.CW && window.CW.appInstance);
    await expect(page.locator('button.tab:has-text("Graph")')).toBeVisible();
    await page.click('.lang-btn');
    await page.waitForFunction(() => window.CW && window.CW.appInstance);
    await expect(page.locator('button.tab:has-text("График")')).toBeVisible();
  });

  test('i18n: core errors are localized in English', async ({ page }) => {
    await page.click('.lang-btn');
    await page.waitForFunction(() => window.CW && window.CW.appInstance);
    const msg = await page.evaluate(() => {
      try {
        window.CW.parser.evaluate('unknownfn(2)');
        return null;
      } catch (e) {
        return e.message;
      }
    });
    expect(msg).toBe('Unknown function: unknownfn');
  });

  test('i18n: converter units are translated', async ({ page }) => {
    await page.click('.lang-btn');
    await page.waitForFunction(() => window.CW && window.CW.appInstance);
    await page.click('button.tab:has-text("Converter")');
    await page.selectOption('#conv-cat', { label: 'Length' });
    await expect(page.locator('#conv-from option').first()).toHaveText('Meters');
    await page.selectOption('#conv-cat', { label: 'Temperature' });
    await expect(page.locator('#conv-from option').first()).toHaveText('Celsius');
  });

  test('CSP: no unsafe-inline violations and CSSOM styles still apply', async ({ page }) => {
    const violations = [];
    page.on('console', m => {
      if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) {
        violations.push(m.text());
      }
    });
    await page.goto('/');
    await page.waitForFunction(() => window.CW && window.CW.appInstance);
    const display = await page.evaluate(
      () => getComputedStyle(document.querySelector('.tablist')).display
    );
    expect(display).toBe('contents');
    expect(violations).toEqual([]);
  });
});
