import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

import { BASE_URL, API_BASE_URL } from '@/config/env';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
// const testEnv = process.env.TEST_ENV || 'staging';
/* Define the absolute path where the authenticated browser state will be cached. */
export const STORAGE_STATE = path.join(__dirname, '.auth/user.json');

/* Re-export the resolved API base URL so tests/utilities can import it from `@config`. */
export { API_BASE_URL };

/* Pattern that matches any spec file whose name starts with "ai" */
const AI_SPECS = /.*\/ai[^/]*\.spec\.ts/;

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
  workers: process.env.CI
    ? process.env.WORKERS
      ? parseInt(process.env.WORKERS, 10)
      : undefined
    : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [
        ['blob'], // ← sharded merge source
        ['allure-playwright', { outputFolder: 'allure-results' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ]
    : [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['allure-playwright', { outputFolder: 'allure-results' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['json', { outputFile: 'test-results/results.json' }],
      ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: BASE_URL,

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
      use: {
        baseURL: BASE_URL,
      },
    },

    // 2. AI-only Projects (Chromium — desktop + mobile)
    {
      name: 'chromium-ai-desktop',
      testMatch: /.*\/ai-desktop\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },

    {
      name: 'chromium-ai-mobile',
      testMatch: /.*\/ai-mobile\.spec\.ts/,
      use: { ...devices['Pixel 5'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },

    // 3. Main Execution Projects: Inherit cached authentication states implicitly (exclude AI specs)
    {
      name: 'chromium',
      testIgnore: AI_SPECS,
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      testIgnore: AI_SPECS,
      // Automatically injects cookies/tokens into all workers
      use: { ...devices['Desktop Firefox'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      testIgnore: AI_SPECS,
      use: { ...devices['Desktop Safari'], storageState: STORAGE_STATE },
      // Forces setup project execution prior to launch
      dependencies: ['setup'],
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      testIgnore: AI_SPECS,
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
  webServer: process.env.RUN_SERVER
    ? {
        command: 'npm run start',
        url: `http://localhost:${process.env.PORT || 3000}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      }
    : undefined,
});
