import os from 'node:os'
import path from 'node:path'
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
const IS_CI_FULL_MATRIX = IS_CI && FULL_MATRIX
const E2E_PORT = process.env.E2E_PORT ?? process.env.PORT ?? '3000'
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${E2E_PORT}`
const OUTPUT_DIR =
  process.env.PLAYWRIGHT_OUTPUT_DIR ??
  path.join(os.tmpdir(), 'website-playwright-test-results')

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
  outputDir: OUTPUT_DIR,

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: IS_CI,

  /* Single retry on CI is enough to weed out true flakes without tripling
     runtime when something is genuinely broken. */
  retries: IS_CI ? 1 : 0,

  /* The mixed Firefox/WebKit matrix is substantially heavier than Chromium.
     Run one browser at a time on GitHub's two-core runners so WebKit and the
     Next.js server do not starve each other; Chromium shards retain four. */
  workers: IS_CI_FULL_MATRIX ? 1 : IS_CI ? 4 : 2,

  /* Reporter: list output in CI logs (useful for triage), html locally. */
  reporter: IS_CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['html', { open: 'never' }]],

  /* Test timeout — production server doesn't need the dev cold-start budget. */
  timeout: IS_CI_FULL_MATRIX ? 45_000 : IS_CI ? 30_000 : 60_000,

  expect: {
    timeout: IS_CI_FULL_MATRIX ? 15_000 : IS_CI ? 10_000 : 15_000,
  },

  use: {
    baseURL: BASE_URL,
    navigationTimeout: IS_CI_FULL_MATRIX ? 20_000 : IS_CI ? 15_000 : 30_000,
    actionTimeout: IS_CI_FULL_MATRIX ? 15_000 : IS_CI ? 10_000 : 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: FULL_MATRIX ? allProjects : [allProjects[0]],

  /* Run the production server before tests on CI (compiled, fast). Locally
     fall back to `npm run dev` so iteration stays cheap. */
  webServer: {
    command: IS_CI ? `PORT=${E2E_PORT} npm run start` : `PORT=${E2E_PORT} npm run dev`,
    url: BASE_URL,
    reuseExistingServer: !IS_CI,
    timeout: 120 * 1000,
  },
})
