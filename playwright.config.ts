import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration for FeedbackFlow
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: "./e2e",

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  // Shared settings for all the projects below
  use: {
    // Base URL for navigation - uses port 3001 to avoid conflicts
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001",

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video recording on failure only
    video: "on-first-retry",

    // Timeout for each action
    actionTimeout: 15000,

    // Navigation timeout
    navigationTimeout: 30000,
  },

  // Global timeout for each test
  timeout: 60000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Run local dev server before starting the tests
  // Uses port 3001 to avoid conflicts with other projects
  // Set SKIP_WEBSERVER=true to use an existing server
  webServer: process.env.SKIP_WEBSERVER
    ? undefined
    : {
        command: "npm run dev -- -p 3001",
        url: "http://localhost:3001",
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
