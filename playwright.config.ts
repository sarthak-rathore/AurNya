import { defineConfig, devices } from '@playwright/test';

// End-to-end tests drive a real browser against the production build.
//   First time only:  npx playwright install chromium
//   Then:             npm run test:e2e
// If a browser is already installed elsewhere, point PW_CHROMIUM_PATH at its executable.
const PORT = 3100;
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined, args: ['--no-sandbox'] },
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { env: { QUOTE_RATE_LIMIT_PER_MIN: '100000' }, command: `npm run build && npx next start -p ${PORT}`, url: `http://localhost:${PORT}`, timeout: 240_000, reuseExistingServer: true },
});
