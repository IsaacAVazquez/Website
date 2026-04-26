import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * CI defaults to chromium-only against `next start` so PR feedback is fast.
 * Set `E2E_FULL_MATRIX=1` (or run `npm run test:e2e:full`) to run firefox /
 * webkit / mobile projects too — used for main-branch / nightly coverage.
 */
const FULL_MATRIX = process.env.E2E_FULL_MATRIX === '1'
const IS_CI = !!process.env.CI

const allProjects = [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
  {
    name: 'Mobile Chrome',
    use: { ...devices['Pixel 5'] },
  },
  {
    name: 'Mobile Safari',
    use: { ...devices['iPhone 12'] },
  },
]

export default defineConfig({
  testDir: './e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: IS_CI,

  /* Single retry on CI is enough to weed out true flakes without tripling
     runtime when something is genuinely broken. */
  retries: IS_CI ? 1 : 0,

  /* On CI, run against `next start` (no on-demand compile), so workers can
     run in parallel safely. Locally we keep 2 to match developer flow. */
  workers: IS_CI ? 4 : 2,

  /* Reporter: list output in CI logs (useful for triage), html locally. */
  reporter: IS_CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['html', { open: 'never' }]],

  /* Test timeout — production server doesn't need the dev cold-start budget. */
  timeout: IS_CI ? 30_000 : 60_000,

  expect: {
    timeout: IS_CI ? 10_000 : 15_000,
  },

  use: {
    baseURL: 'http://localhost:3000',
    navigationTimeout: IS_CI ? 15_000 : 30_000,
    actionTimeout: IS_CI ? 10_000 : 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: FULL_MATRIX ? allProjects : [allProjects[0]],

  /* Run the production server before tests on CI (compiled, fast). Locally
     fall back to `npm run dev` so iteration stays cheap. */
  webServer: {
    command: IS_CI ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !IS_CI,
    timeout: 120 * 1000,
  },
})
