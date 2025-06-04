import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  reporter: 'html',
  timeout: 10000,
  use: {
    baseURL: 'http://127.0.0.1:5042',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'cd ../.. && npm run dev',
    url: 'http://127.0.0.1:5042',
  },
})
