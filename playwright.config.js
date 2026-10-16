import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8787',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // npx serve подвисает на запуске под Windows-шеллом, поэтому отдаём статику
  // встроенным сервером Playwright: он сам поднимает и гасит процесс.
  webServer: {
    command: 'node tests/static-server.js',
    url: 'http://localhost:8787',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
