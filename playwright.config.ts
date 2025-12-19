import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000, // Increase overall test timeout to 60 seconds
  use: {
    trace: 'on-first-retry',
    baseURL: 'http://localhost:5173',
    headless: true, // Ensure headless mode for consistent testing
    viewport: { width: 1280, height: 720 }, // Consistent viewport
    actionTimeout: 15000, // Timeout for individual actions
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          slowMo: 100, // Add slight delay between actions for stability
        },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    timeout: 120000, // Increase web server startup timeout
    reuseExistingServer: !process.env.CI,
  },
});