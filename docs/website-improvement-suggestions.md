# Website Improvement Suggestions

**Created:** 2026-06-09
**Scope:** Repo-wide review of performance, accessibility, SEO, testing, code health, and tooling.

This is a working reference, not a canonical spec. It captures a snapshot review of the
site and tracks which items have been actioned. Re-check against code before relying on any
single line — when docs and code disagree, code wins.

---

## What is already strong

These areas were reviewed and found in good shape — listed so future reviews don't
re-flag them as gaps:

- **SEO.** ~93% of `page.tsx` routes export metadata; comprehensive JSON-LD via
  `src/lib/seo.ts` (Person, Article, Project, Breadcrumb, Organization), auto-generated
  sitemap/robots, and AI-optimized meta tags. The three routes without metadata are
  auth/redirect pages that don't need it.
- **Code health.** Zero `TODO`/`FIXME`/`HACK` markers in `src/`. No stray `console.log`
  in components — logging is concentrated in `src/lib/logger.ts` and data scripts.
  `removeConsole` is on for production builds (`next.config.mjs`).
- **Dependencies.** Current stack — Next.js 16, React 19, TypeScript 6, Playwright,
  Jest 30, MSW. No obviously stale packages.
- **Fonts.** All web fonts use `display: swap`/`optional` with pinned weights and system
  fallbacks (`src/app/layout.tsx`).
- **Accessibility baseline.** Dedicated `/accessibility` statement, skip link, 147
  `aria-label` usages, 49 `rel="noopener noreferrer"` external links, global
  `prefers-reduced-motion` handling in `globals.css`.

---

## High impact

### 1. Image loading attributes on raw `<img>` tags — _mostly already done_
Most raw `<img>` tags render **external** sports/space assets (team crests, driver
headshots, circuit maps, mission photos) from hosts not in `next.config.mjs`
`remotePatterns`. Forcing `next/image` onto them would break rendering or require
unbounded host config, so the right move is loading hints, not `next/image`.

On review, the Formula 1, Fantasy F1, and SpaceX images **already** set
`loading="lazy"` (and SpaceX adds `decoding="async"`/`fetchPriority`). The one gap was
`src/components/football/CrestAvatar.tsx` — crests render many-per-page in standings and
fixture lists with no lazy loading.

- **Status: addressed.** `CrestAvatar` now sets `loading="lazy"` + `decoding="async"` and
  explicit dimensions; `decoding="async"` added to the F1/Fantasy-F1 avatars for
  consistency.

### 2. Add `loading.tsx` to data-driven dashboard routes
There were **zero** `loading.tsx` files across the app. Dashboard routes pair an
`error.tsx` with no streaming fallback, so client-side navigation shows nothing until the
server component resolves.

- **Status: addressed.** Added a shared `src/components/RouteLoadingState.tsx` editorial
  skeleton and a `loading.tsx` for each snapshot dashboard (NFL, NBA, MLB, Formula 1,
  Fantasy F1, Premier League, La Liga, World Cup, SpaceX, News Pulse, Investments, Golf,
  Polling Aggregator, GitHub Trending Pulse).

### 3. Code-split the largest client components
A few `"use client"` pages ship very large bundles:
`mba-jobs-client.tsx` (~3,200 lines), `museum-log-client.tsx` (~1,775),
`nfl-client.tsx` (~1,314). Heavy, interaction-only UI loads up front.

- **Status: partially addressed.** In the MBA tracker, the two interaction-gated modals
  (`EmailDigestDialog`, `ApplicationEditDialog`) were extracted to their own modules and
  are now lazy-loaded via `next/dynamic`, gated on open state, so their JS only loads when
  a user opens a dialog. Shared form types/helpers moved to `application-form.ts`.
- **Follow-up:** apply the same interaction-gated `next/dynamic` pattern to the heaviest
  panels in `museum-log-client.tsx` and `nfl-client.tsx`. These carry more shared state,
  so they warrant their own focused PR with interactive verification.

---

## Medium impact

### 4. Close the image alt-text gap
Custom controls are well-labeled, but content images are sparse on `alt`. The
`OptimizedImage` wrapper requires `alt` — routing more images through it (or auditing the
raw tags) closes both the a11y and image-SEO gap.

### 5. Component unit tests for primary surfaces
Test infra is excellent (Jest + Playwright + CI coverage), but the most-visited
components have no unit tests: `PortfolioV3.tsx`, `HomePageV3.tsx`, `AboutV3.tsx`,
`ProjectsContent.tsx`. Lib/data logic is well-covered; the gap is interactive component
behavior.

### 6. Add a typecheck gate to CI
CI runs lint, unit, and E2E, but no standalone `tsc --noEmit`, and `next.config.mjs` sets
`typescript.ignoreBuildErrors: true`. With ESLint relaxing `no-explicit-any` and
`exhaustive-deps` to warnings, a dedicated typecheck job would catch type regressions the
build tolerates.

---

## Low effort / cleanup

### 7. Accessibility page date drift
`src/app/accessibility/page.tsx` says "Updated April 2026" in the kicker but "written in
November 2025" in the body. Reconcile the two.

### 8. Decide the fate of `ProjectsContent.tsx`
~710 lines, referenced only by tests now that `PortfolioV3` is canonical for `/portfolio`.
Either delete it (and its tests) or document why it is retained.

### 9. Retirement planner CMA verification
`CMA_VERIFIED = false` in `capitalMarketAssumptions.ts`. Disclaimers are honest and
intact, but pinning the figures to a dated primary source would let the surface drop the
"unverified" framing.

---

## Suggested sequencing

1. **Done in this pass:** #1, #2, and the MBA slice of #3.
2. **Next, low risk:** #7 and #8 (quick cleanups), then #6 (CI typecheck gate).
3. **Then, focused PRs:** the museum-log/NFL slices of #3, #5 (component tests), #4
   (image alt audit), #9 (CMA verification).
