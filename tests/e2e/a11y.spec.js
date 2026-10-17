import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Мировой стандарт в CI: автоматическая проверка доступности каждой вкладки
// по WCAG 2 A/AA. Падает при любом нарушении — чинить в src, не в тесте.
test.describe('Accessibility (axe-core, WCAG 2.2 AA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.CW && window.CW.appInstance);
  });

  test('all tabs: no axe violations (wcag2a/wcag2aa)', async ({ page }) => {
    // Вкладок много, axe-анализ каждой занимает время: даём тесту запас.
    test.setTimeout(60000);
    const tabs = await page.evaluate(() => window.CW.app.TABS.map(t => t.id));
    const failures = [];
    for (const id of tabs) {
      await page.click('#tab-' + id);
      await page.waitForTimeout(150);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      if (results.violations.length) {
        failures.push(
          id +
            ':\n' +
            results.violations
              .map(v => `  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} узлов)`)
              .join('\n')
        );
      }
    }
    expect(failures, 'axe violations:\n' + failures.join('\n')).toEqual([]);
  });
});
