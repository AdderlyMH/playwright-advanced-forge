import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
// const testEnv = process.env.TEST_ENV || 'staging';
/* Define the absolute path where the authenticated browser state will be cached. */
export const STORAGE_STATE = path.join(__dirname, '.auth/user.json');

export default defineConfig({
  outputDir: 'test-results',
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Global timeout for all tests */
  timeout: 30000,
  /* AssertionError timeout */
  expect: { timeout: 5000 },
  /* Retry on CI only */
  retries: process.env.CI ? 3 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? parseInt(process.env.WORKERS || '100%') : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
      ['html', { outputFolder: 'playwright-report', open: 'never' }],
      ['allure-playwright', { outputFolder: 'allure-results' }],
      /* For CI integrations */
      ['junit', { outputFile: 'test-results/junit.xml' }],
      /* For analytics */
      ['json', { outputFile: 'test-results/results.json' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: process.env.BASE_URL || 'https://api.github.com',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },

  /* Snapshots for visual regression testing */
  snapshotDir: 'tests/snapshots',
  snapshotPathTemplate: '{dir}/{testFileDir}/{testFileName}-{platform}{ext}',
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true' ? 'all' : 'missing',

  /* Configure projects for major browsers */
  projects: [
    // 1. Setup Project: Dedicated block to handle authentication seeding sequentially
    {
      name: 'setup',
      testMatch: /.*\.setup.ts/,
    },
    // 2. Main Execution Projects: Inherit cached authentication states implicitly
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      // Automatically injects cookies/tokens into all workers
      use: { ...devices['Desktop Firefox'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: STORAGE_STATE },
      // Forces setup project execution prior to launch
      dependencies: ['setup'],
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.RUN_SERVER ? {
    command: 'npm run start',
    url: `http://localhost:${process.env.PORT || 3000}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  } : undefined,

});
