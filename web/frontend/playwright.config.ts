import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.PORT || '5042'
const baseURL = `http://127.0.0.1:${PORT}`
const timeout = 10000

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  reporter: 'html',
  use: { baseURL, trace: 'on-first-retry' },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'cd ../.. && npm run dev',
    url: baseURL,
    timeout,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { PORT }
  },
  timeout
})
