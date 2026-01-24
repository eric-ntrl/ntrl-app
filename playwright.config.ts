import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for NTRL App E2E testing
 * Tests run against Expo Web version of the app
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'e2e-report' }],
    ['list'],
  ],
  outputDir: 'e2e-results',

  use: {
    // Base URL for Expo Web dev server
    baseURL: 'http://localhost:8081',

    // Capture screenshots on failure
    screenshot: 'only-on-failure',

    // Capture trace on failure for debugging
    trace: 'on-first-retry',

    // Video recording
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Directory for screenshots taken by Claude for UI verification
  snapshotDir: './e2e/snapshots',

  // Timeout settings
  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  // Web server configuration - starts Expo web automatically
  // Note: Expo web can be slow to start. If tests fail, manually start with:
  //   npx expo start --web --port 8081
  // Then run tests with:
  //   npm run e2e:claude
  webServer: {
    command: 'npx expo start --web --port 8081 --non-interactive',
    url: 'http://localhost:8081',
    reuseExistingServer: true, // Always reuse if already running
    timeout: 180000, // 3 minutes for Expo to start
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
