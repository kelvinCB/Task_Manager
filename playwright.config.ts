import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.production file
dotenv.config({ path: path.resolve(__dirname, '.env.production') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in parallel with 4 workers */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Use four workers for parallel execution */
  workers: 4,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot always */
    screenshot: 'on',
    /* Record video on failure */
    video: 'retain-on-failure',
    /* Global test timeout */
    actionTimeout: 10000,
    /* Navigation timeout */
    navigationTimeout: 30000,
    /* Full screen viewport */
    viewport: { width: 1920, height: 1080 },
  },

  /* Configure only Chromium project */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev -- --mode production',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'production',
      // Pass environment variables to the dev server
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_KEY: process.env.VITE_SUPABASE_KEY,
      VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY,
      VITE_OPENAI_BASE_URL: process.env.VITE_OPENAI_BASE_URL,
      VITE_OPENAI_MODEL: process.env.VITE_OPENAI_MODEL,
      E2E_TEST_USER_EMAIL: process.env.E2E_TEST_USER_EMAIL,
      E2E_TEST_USER_PASSWORD: process.env.E2E_TEST_USER_PASSWORD,
    }
  },

  /* Global setup and teardown */
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  /* Output directories */
  outputDir: 'test-results/',
  
  /* Test timeout */
  timeout: 30 * 1000,
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 5000,
  },
});
