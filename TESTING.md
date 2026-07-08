# Testing Guide

Current testing setup for the repo.

**Last updated:** 2026-07-06

---

## Test Stack

### Unit and integration

- Jest
- `jest-environment-jsdom`
- `@testing-library/jest-dom`
- mixed DOM testing styles:
  - `react-dom/client` render tests
  - Testing Library-style tests where available

### End-to-end

- Playwright

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
```

---

## Coverage Thresholds

`jest.config.js` (`coverageThreshold.global`) is the single source of truth for the
enforced coverage gates, applied in CI through `npm run test:ci`. They ratchet upward
as coverage improves, so read the config rather than trusting a restated number here.

---

## Where Tests Live

### Jest

- `src/components/**/__tests__`
- `src/hooks/**/__tests__`
- `src/lib/__tests__/` — pure-logic unit tests (fantasy snapshot/ADP/consensus builders, the investments live-quote allowlist in `finnhub.allowlist.test.ts`, and more)
- `src/app/fantasy-football/__tests__/` — route state integration tests, including fantasy football client and fantasy state tests
- `src/app/premier-league/__tests__/` and `src/app/la-liga/__tests__/` — dashboard client and route-state regression tests
- `src/app/news-pulse/__tests__/`, `src/app/spacex-mission-control/__tests__/`, and `src/app/fintech-tools/budget-planner/__tests__/` — standalone tool coverage
- `src/app/api/news-pulse/__tests__/`, `src/app/api/spacex/**/__tests__/`, and `src/app/api/premier-league/**/__tests__/` — API route coverage for data tools
- other repo-level `*.test.*` and `*.spec.*` files outside `e2e/`

### Playwright

- `e2e/*.spec.ts`

Current e2e coverage includes navigation, homepage, portfolio shell, accessibility,
writing, search, investments, fantasy football, March Madness, footer CTA, the résumé
PDF download, product surfaces (football/F1/GitHub/polling/SpaceX/fintech/news-pulse
dashboards), and personal-interest tool persistence (`persisted-tools.spec.ts`).

---

## Playwright Projects

Defined in `playwright.config.ts`:

- Chromium
- Firefox
- WebKit
- Mobile Chrome
- Mobile Safari

By default (CI and local), only Chromium runs so PR feedback stays fast. Set `E2E_FULL_MATRIX=1` — or run `npm run test:e2e:full` — to run the full matrix (Firefox, WebKit, and the mobile projects), used for main-branch / nightly coverage.

Some local environments may only have a subset of browsers installed, so targeted project runs are also common during local work.

---

## Testing Guidance

- Prefer targeted test runs while iterating
- Match the style of nearby tests instead of forcing a single pattern
- For shared shell changes, verify:
  - desktop nav
  - mobile nav
  - footer behavior
  - mobile overflow
- For route-specific UI updates, add focused Playwright coverage instead of broad unrelated regression suites
- For dashboard route-state changes, add or update the colocated state helper tests first, then add focused Playwright coverage only when browser behavior is part of the risk

---

## Current Caveats

- `@testing-library/react` is present, but the repo also uses direct `createRoot` tests; follow local conventions
- E2E tests rely on the local Next dev server started by Playwright config
- If a browser is missing locally, restrict the Playwright run to installed projects rather than assuming the whole matrix is available

---

## Source Files

- `jest.config.js`
- `jest.setup.js`
- `playwright.config.ts`
- `src/components/__tests__/`
- `src/components/investments/__tests__/`
- `e2e/`
