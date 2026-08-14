import { defineConfig, devices } from '@playwright/test';

// E2E — Lingora. Web specs run against Vite preview; Electron specs use _electron.
// Set PLAYWRIGHT_TARGET=electron to switch projects.
const isWeb = process.env.PLAYWRIGHT_TARGET !== 'electron';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: isWeb
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
      ]
    : [{ name: 'electron', use: {} }],
  webServer: isWeb
    ? {
        command: 'npm run build:web && npm run preview',
        port: 4173,
        reuseRunningServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
