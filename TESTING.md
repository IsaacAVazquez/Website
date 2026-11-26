# Testing Guide

Current testing setup for the repo.

**Last updated:** 2026-11-16

---

## Test Stack

### Unit and integration

- Jest
- `jest-environment-jsdom` as the default environment. A test of server code switches to Node with a `/** @jest-environment node */` docblock at the top of the file, as every API route test and workflow test does
- `@testing-library/jest-dom`
- mixed DOM testing styles:
  - `react-dom/client` render tests
  - Testing Library-style tests where available

### End-to-end

- Playwright

### Python

- `unittest`, for the investments fetch script only

---

## Commands

```bash
npm test
npm run test:watch
npm run test:coverage
npm run test:ci
npm run test:e2e
npm run test:e2e:full
npm run test:e2e:ui
npm run test:e2e:debug
npm run test:all
```

`npm run test:all` runs `npm run test:coverage` and then `npm run test:e2e`.

---

## Coverage Thresholds

`jest.config.js` (`coverageThreshold.global`) is the single source of truth for the
enforced coverage gates, applied in CI through `npm run test:ci`. They ratchet upward
as coverage improves, so this guide gives no numbers and the config is the place to read them.
Its `collectCoverageFrom` measures files under `src/` alone, leaving out `src/app/layout.tsx`
and `src/app/page.tsx`, so code under `scripts/`, `extension/`, or `netlify/` never counts
toward the numbers.

---

## Where Tests Live

### Jest

- `src/components/**/__tests__`
- `src/hooks/**/__tests__`
- `src/lib/__tests__/` holds pure-logic unit tests (fantasy snapshot/ADP/consensus builders, the investments live-quote allowlist in `finnhub.allowlist.test.ts`, and more)
- `src/app/fantasy-football/__tests__/` holds route state integration tests, including the fantasy football client and fantasy state tests
- `src/app/fantasy-football/best-ball/**/__tests__/` covers contest route state, draft persistence, and the live best ball room
- `src/lib/__tests__/bestBall*.test.ts` covers source parsing and snapshot validation, and `src/lib/bestBall/__tests__/` covers contest presets, rankings, roster construction, recommendation signals, and source capabilities
- `src/lib/__tests__/fantasyTeamValue.test.ts` pins Draft Outlook baselines, slot context, room midranks, format-specific signals, and exact return math; `src/components/fantasy/DraftValuePanel.test.tsx` covers the shared disclosure and calculator UI
- `src/app/premier-league/__tests__/` and `src/app/la-liga/__tests__/` hold the dashboard client and route state regression tests
- every live tool route in `DASHBOARD_ROUTES` (`src/constants/catalog97Nav.ts`) had a `__tests__/` folder beside its page on 2026-11-02, as in `src/app/news-pulse/__tests__/`, `src/app/spacex-mission-control/__tests__/`, and `src/app/fintech-tools/budget-planner/__tests__/`
- every API route had a `__tests__/` folder beside its `route.ts` on 2026-11-02, from the data tool routes such as `src/app/api/spacex/**/__tests__/` and `src/app/api/premier-league/**/__tests__/`, to `/api/search`, `/api/rss`, `/api/data-revisions`, newsletter signup, the job board feed in `src/app/api/mba-jobs/__tests__/`, and the private job search sync in `src/app/api/job-search/__tests__/`
- `src/app/__tests__/` holds the site-wide checks, from the root layout, the error shells, and the Catalog 97 stylesheets, to the bundle import guards and the file tables in `COMPONENTS.md` (`component-docs.test.ts`)
- `src/constants/__tests__/` checks the case studies, build notes, and tool categories, and `project-routes-complete.test.ts` there holds `DASHBOARD_ROUTES` equal to the case studies' links
- `src/lib/scorePools/__tests__/`, `src/lib/retirement/__tests__/`, and `src/lib/rentVsBuy/__tests__/` cover the score pools, retirement planner, and rent versus buy engines
- `netlify/functions/__tests__/` covers the two scheduled functions that refresh the Polling and Frontier Models blobs, and `src/__tests__/proxy.test.ts` pins the security headers `src/proxy.ts` sets
- `src/app/mba-internship-notifications/__tests__/` covers the job search tracker client, candidates view, application edit dialog, and form state
- `src/hooks/__tests__/useMBAApplications.test.tsx` covers the application tracking hooks and the private pipeline and candidate sync
- `src/lib/__tests__/mba-job-search.test.ts` and `src/lib/__tests__/mba-job-matching.test.ts` cover candidate filtering, target matching, deduplication, and parsing
- `extension/src/__tests__/` holds the Chrome extension tests, covering draft tab binding, provider pick extraction, the snapshot client and its packaged-board fallback, and the autodraft controller with its dialog matching. Pick reconciliation and the rest of the companion's shared logic are tested in `src/lib/fantasyCompanion/__tests__/`
- `scripts/__tests__/` covers the snapshot builders, the refresh verifier, the curated data audit, the blog date check, the changelog appender, the dev launcher (`dev.test.ts`), and the candidate dump
- `.github/workflows/__tests__/` checks the workflow files and the deployment packaging, including the snapshot refresh lanes, the investments workflow, and the production data publication verifier
- other repo-level `*.test.*` and `*.spec.*` files outside `e2e/`

### Python

- `scripts/tests/test_fetch_investments_data.py` tests the timeouts, symbol rotation, and price checks in `scripts/fetch_investments_data.py` with `unittest`. Jest does not run it. `update-investments.yml` runs it before each refresh with `.venv/bin/python3 -m unittest scripts.tests.test_fetch_investments_data`, and the same command runs it locally from the repo root with the `.venv` described in `DEVELOPMENT.md`

### Playwright

- `e2e/*.spec.ts`

Current e2e coverage includes navigation, homepage, portfolio shell, accessibility
(keyboard focus, image alt text, and button names on the homepage; text contrast is
measured by `scripts/contrastSweep.mjs` and by no e2e spec),
writing, search, investments, Before You Buy, fantasy football, the fantasy trade
calculator, March Madness, footer CTA, the résumé PDF download, the designed About,
Résumé, and Contact pages (`designed-pages.spec.ts`), product surfaces
(football/F1/GitHub/polling/SpaceX/fintech/news-pulse dashboards), project workflows
(`project-workflows.spec.ts`), every page and portfolio project in both themes at phone
width (`all-projects.spec.ts`, which also runs short workflows on tools from the wine cellar
and travel log to score pools and the arcade), one h1 and a clean hydration on every project
route in the Los Angeles and Tokyo time zones (`project-routes.spec.ts`), personal-interest
tool state surviving a reload, which `persisted-tools.spec.ts` checks on the museum log and
`all-projects.spec.ts` on the wine cellar, travel log, recipe finder, and food map, and print
(`print.spec.ts`, plus print checks in `investments.spec.ts`, `resume.spec.ts`, and
`before-you-buy.spec.ts`).

The print tests read computed styles under print media, which is where every print fault
measured on 2026-09-29 starts, and the grid tests do it at a 1600px viewport, since Safari's
engine answers a width query with the window's width and that is the state its print is in.
They do not print anything. `page.pdf()` is Chromium only, so a real print through Firefox's
or Safari's engine is a manual check. The prints of 2026-09-29 were scripted, through
`browsingContext.print` over WebDriver BiDi in Playwright's Firefox build and through a
`WKWebView` print operation for the system WebKit, and neither script lives in the repo. The
tests for filtered and blended elements run in the Firefox project alone, so they run with
the full matrix, and the default Chromium run checks that the portrait keeps its treatment
on paper there.

---

## Playwright Projects

Defined in `playwright.config.ts`:

- `chromium` (Desktop Chrome)
- `firefox` (Desktop Firefox)
- `webkit` (Desktop Safari)
- `Mobile Chrome` (Pixel 5)
- `Mobile Safari` (iPhone 12)

By default (CI and local), only `chromium` runs so PR feedback stays fast. Set `E2E_FULL_MATRIX=1`, or run `npm run test:e2e:full`, to run the full matrix (Firefox, WebKit, and the mobile projects), which CI does on every push to `main`. No workflow runs it on a nightly schedule.

Some local environments may only have a subset of browsers installed, so targeted project runs are also common during local work. Without `E2E_FULL_MATRIX=1` the config defines only `chromium`, so a run of one other project needs both, as in `E2E_FULL_MATRIX=1 npx playwright test --project=firefox`.

---

## Continuous integration

`.github/workflows/test.yml` runs on every push and pull request to `main` or `develop`, except a push whose commit message carries `[skip ci]`, as every snapshot refresh and changelog commit does. The unit test job runs `npm run check:blog-dates` against the pull request's base commit (or, on a push, the commit before it), which fails when a change edits an existing article's body under `content/blog/` without changing its `updatedAt`, and then `npm run test:ci`, whose coverage report it uploads to Codecov in a step that cannot fail the job. The build job runs `npm run typecheck` and `npm run build`, the lint job runs `npm run lint`, which is ESLint over `src/` alone, and the `chromium` end to end run splits the specs across three shards against the build job's `.next` output. On a push to `main` a separate job runs `npm run test:e2e:full` on the same build and opens or updates a GitHub issue labeled `e2e-matrix-failure` when it fails, which the next passing run closes.

---

## Testing Guidance

- Prefer targeted test runs while iterating
- Match the style of nearby tests instead of forcing a single pattern
- For shared shell changes, verify:
  - desktop nav
  - mobile nav
  - footer behavior
  - mobile overflow
- `e2e/layoutChecks.ts`, which `portfolio-shell.spec.ts` and `project-routes.spec.ts` call, fails on sideways scroll and holds the h1, any breadcrumb, and the footer to the header's edges at 390, 1440, and 1920px wide. `node scripts/layoutSweep.mjs <baseUrl>` runs the full sweep from phone to big-monitor sizes against a running server
- For route-specific UI updates, add focused Playwright coverage instead of broad unrelated regression suites
- For dashboard route-state changes, add or update the colocated state helper tests first, then add focused Playwright coverage only when browser behavior is part of the risk

---

## Current Caveats

- `@testing-library/react` is present, but the repo also uses direct `createRoot` tests; follow local conventions
- Playwright config starts the Next dev server locally and `npm run start` in CI. The local server runs with `JOB_SEARCH_PRIVATE_SYNC=0`, so a test never writes the private job search files, and `reuseExistingServer` is on locally, so a server already answering on `E2E_PORT` (then `PORT`, then 3000) gets tested instead, even one started from another checkout, and that server keeps whatever private sync setting it started with. `E2E_BASE_URL` points a run at another address
- Test artifacts go to `website-playwright-test-results` under the system temp folder unless `PLAYWRIGHT_OUTPUT_DIR` is set, and the HTML report goes to `playwright-report/`
- If a browser is missing locally, restrict the Playwright run to installed projects rather than assuming the whole matrix is available

---

## Source Files

- `jest.config.js`
- `jest.setup.js`
- `playwright.config.ts`
- `.github/workflows/test.yml`
- `src/components/__tests__/`
- `src/components/investments/__tests__/`
- `e2e/`
