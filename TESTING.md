# Testing Guide

Current testing setup for the repo.

**Last updated:** 2026-04-05

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
npm run test:e2e:ui
npm run test:e2e:debug
```

---

## Coverage Thresholds

Current Jest thresholds in `jest.config.js` are intentionally modest:

- branches: `20`
- functions: `25`
- lines: `25`
- statements: `25`

Do not document or assume older 70% thresholds.

---

## Where Tests Live

### Jest

- `src/components/**/__tests__`
- `src/hooks/**/__tests__`
- `src/app/fantasy-football/__tests__/` — route state integration tests, including fantasy football client and fantasy state tests
- other repo-level `*.test.*` and `*.spec.*` files outside `e2e/`

### Playwright

- `e2e/*.spec.ts`

Current e2e coverage includes navigation, homepage, investments, March Madness, and footer CTA scenarios.

---

## Playwright Projects

Defined in `playwright.config.ts`:

- Chromium
- Firefox
- WebKit
- Mobile Chrome
- Mobile Safari

Some local environments may only have a subset of browsers installed, so targeted project runs are common during local work.

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
