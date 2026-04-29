# Design & UX Audit — Status & Remaining Work

**Status:** Closed — see "Round 6" log below for the final round of fixes.
**Originally audited:** 2026-04-25
**Last updated:** 2026-04-29
**Scope:** Full application — all routes, shared components, global shell

This document tracked every design, styling, UI/UX, and accessibility issue found across the site. After six remediation rounds the audit is closed; the only items still open are documented deferrals that need a new dependency or a meaningful refactor before they're worth doing.

The original IDs and shipped log are kept here so future audits can cross-reference.

---

## Status Summary

| Bucket | Total | Shipped | No-op / superseded | Outstanding |
|---|---|---|---|---|
| **P0** | 30 | 30 | 0 | 0 |
| **P1** | 39 | 32 | 7 | 0 |
| **P2** | ~60 | 39 | 11 | ~10 |

**Shipped via:**
- **PR #88** — P0 pass (shell, writing, dashboard cross-cuts, fantasy/fintech/MBA P0s)
- **PR #89** — P1 pass (shell, writing, portfolio, investments, MM, dashboards, fantasy/fintech/MBA P1s)
- **PR #90** — Deferred items (DB-5 aria-controls, PA-4 polls dedup, SX-2/3 backoff + validation, NP-4 pagination, MM-5/PL-3 URL state, AW-4 button cleanup, AW-6 contrast bump)
- **PR #91** — P1 cleanup (PL-4 empty/error states, PA-3 polling aria-live, NP-3 dropdown verification + polish, AW-5 legacy token policy banner)
- **PR #92** — P2 polish (shell + pages + writing + investments + MM + dashboards + fantasy + fintech + MBA — see commit log for the per-section breakdown)
- **PR #93** — CT-1: documented links-only as the intentional `/contact` treatment
- **Round 6 (2026-04-29)** — post-audit cleanup on home/resume + the new dashboards added since the audit (mlb, nba, nfl, golf, museum-log, wine-cellar, recipe-finder, polling-aggregator). See "Round 6" log below.

---

## Round 6 — 2026-04-29

Items found during a frontend-design pass on pages added after the original audit, plus two regressions on home and resume.

| # | Issue | Fix | File |
|---|-------|-----|------|
| R6-1 | Home spotlight section: italic `*product*` overflowed the green column at lg+ viewports, cutting into the white "Point of view" board | Restructured the manifesto into 5 stacked spans so `*product*` lands alone on its own line; added `min-width: 0` and `overflow-wrap: anywhere` defensively | `src/components/home/HomePageContent.tsx`, `src/app/globals.css` (`.home-manifesto`) |
| R6-2 | Home spotlight board had a blue-violet radial-gradient orb (`color-mix(... haze 32%, transparent)`) that read as an unintended artifact | Softened to a corner-feathered ellipse at 14% mix with 60% fade | `src/app/globals.css` (`.home-spotlight-board`) |
| R6-3 | Resume `home-wordmark` overflowed the `resume-panel` cream card on mobile (clipped final letter) and at very wide desktop (>1500px) | Scoped a smaller font-size clamp for the wordmark inside the panel: `clamp(2.2rem, 12vw, 11rem)` | `src/app/globals.css` (`.resume-panel .home-wordmark`) |
| R6-4 | Resume Skills section had 7 categories in a 2-column grid — empty bottom-right cell and short categories stretched to taller siblings' row heights | Switched to CSS columns (`column-count: 2; break-inside: avoid`) so categories flow naturally | `src/app/resume/resume-client.tsx`, `src/app/globals.css` (`.resume-skills-flow`) |
| R6-5 | Footer CTA buttons (`View projects`, `Get in touch`) wrapped to two lines on the resume page when the flex container squeezed them | Added `white-space: nowrap` to the base `.home-button` style | `src/app/globals.css` (`.home-button`) |
| R6-6 | 18 newer pages baked `| Isaac Vazquez` into their literal title; root layout's `title.template = "%s | Isaac Vazquez"` doubled it (e.g. `MLB Pulse | Isaac Vazquez | Isaac Vazquez`) | Stripped the redundant suffix from each page so the template does the work | `src/app/{fantasy-football,decision-lab,food-map,investments,nba,mlb,la-liga,golf,nfl,polling-aggregator,mba-internship-notifications,premier-league,recipe-finder,news-pulse,spacex-mission-control,wine-cellar,fintech-tools/budget-planner,fantasy-football/draft-tracker}/page.tsx` |
| R6-7 | MLB Pulse showed `Snapshot Dec 31, 1969` (Unix epoch) when the seed snapshot hadn't been refreshed | Hide the snapshot date pill when `updatedAt` is the epoch fallback | `src/app/mlb/mlb-client.tsx` |
| R6-8 | MLB and NBA both leaked dev-only strings ("Run `npm run update:mlb`", `npm run update:nba`) to public users | Replaced with user-facing copy describing the snapshot refresh cadence; removed the `<code>` references | `src/app/mlb/mlb-client.tsx`, `src/app/nba/nba-client.tsx` |
| R6-9 | Portfolio page was missing 8 live tools that exist as routes (mlb, nba, formula-1, golf, polling-aggregator, museum-log, wine-cellar, recipe-finder) | Added entries to `caseStudiesData` and slotted them into `PORTFOLIO_PROJECT_ORDER` | `src/constants/caseStudies.ts` |

---

## Severity Legend

| Tag | Meaning |
|-----|---------|
| **P0** | Broken or inaccessible — ships nothing until fixed |
| **P1** | Clear design/UX bug — fix before next release |
| **P2** | Polish or consistency — tackle in a dedicated pass |

---

## 1. Outstanding P1 Items

None — CT-1 closed via PR #93 (links-only is the intentional treatment; rationale documented in the `ContactContent` component header).

---

## 2. Outstanding P2 Items

These either need a meaningful refactor or a tooling/data shape change before they're worth doing — left as deliberate follow-ups rather than backlog rot.

| # | Issue | Surface | Why deferred |
|---|-------|---------|--------------|
| WR-13 | No syntax-highlighting plugin in remark/rehype pipeline | Writing | Adds a dep (shiki/prism); needs theme integration with editorial palette |
| WR-14 | No footnote plugin configured — `[^1]` renders as plain text | Writing | Same as WR-13 — its own remark plugin PR |
| MM-8 | Injury cards lack severity badge | March Madness | Needs a `status` field on `InjuryEntry`; current `note` is unstructured prose |
| PL-5 | Zone pill style (`getZonePillStyle`) duplicated between PL and La Liga | PL/LL | Each league has different zone cutoffs (PL 4/5/6/7 vs LL 4/5/6); a real shared util needs a config-driven API |
| LL-4 | `getClubStoryline` / `getClubPressurePoints` copy-pasted from PL | PL/LL | Same as PL-5 — leagues hold different storyline copy and ranking inputs |
| FF-16 | Filter state (selected position) not URL-persisted in DraftBoard | Fantasy | Requires lifting state to the page + URL params (moderate refactor) |
| FF-19 | `draftPlayer()` maps over all teams on every pick — O(n²) for 200+ picks | Fantasy | Theoretical perf concern at scale; measure first before refactoring storage |

Everything else flagged P2 in the original audit is either shipped (PR #92) or already resolved by code that landed in another PR — see "No-ops" below.

---

## 3. No-ops / Superseded by Other Fixes

These were tagged in the original audit but either don't apply to current code or were resolved by another fix. Kept for traceability so future audits don't redo the analysis.

| # | Original concern | Why it's not actionable |
|---|------------------|-------------------------|
| F1-1 | Inline `MetricCard` may double-apply border/shadow. | DB-1 fix removed the inline `MetricCard` — F1 now imports the shared one. |
| F1-3 | Gradient inline styles don't adapt to dark mode. | Gradient already uses `--home-paper`/`--home-paper-alt`/`--home-haze`, all of which flip via the `.dark` class. |
| FC-3 | Shared `MetricCard` has no `variant` prop. | Resolved by DB-1: the shared component now accepts optional `icon`/`detail` props that cover the F1 variant. |
| DB-4 | `<p class="home-kicker">` used where `<h3>`/`<span>` belongs. | Kicker is intentional — typographic label, not a document-outline heading. Promoting to `<h3>` would fragment the outline. |
| FF-2 | "No dark mode CSS — page renders broken in dark mode." | All `--home-*` variables flip via `.dark`, so `color-mix()` values adapt automatically. Smoke test confirms. |
| FF-4 | `EnhancedPlayerCard` broken image fallback. | Component no longer exists post-fantasy overhaul (PR #86). |
| FF-7 | "Two h1s, no `<main>` landmark." | `ConditionalLayout` provides `<main>`; only one h1 in the current code. |
| FF-8 | Draft tracker no `<main>` or `<aside>` landmarks. | Same — `ConditionalLayout` wraps it. |
| FF-9 | Search cleared on position change but text stays. | Current code preserves search across position changes. |
| FF-10/11/14/15 | RB tiers chart concerns. | `/fantasy-football/rb-tiers` is a redirect; chart files don't exist post-overhaul. |
| FF-18 | Undo history not persisted to localStorage. | `draftState.undoHistory` is part of the saved state object — already persists. |
| FF-21 | `getPositionTone()` duplicated in three files. | Already a single export in `src/lib/fantasyUtils.ts` post-overhaul. |
| MB-5 | Sort dropdown focus return. | Radix `DropdownMenu` already returns focus to the trigger on close. |
| MB-8 | Email digest endpoint no client-side throttle. | Trigger button + dialog submit both disable on `emailSending`. |
| IN-6 | Quote cache age not surfaced. | Already surfaced via `DataFreshnessIndicator` in `PortfolioTracker`. |
| IN-9 | Edit/delete buttons hidden behind hover. | Buttons are already always visible (audit out of date). |
| NP-5 | Sentiment / readability recalculated on every render. | Already wrapped in `useMemo`. |
| AW-12/HP-2/WR-9 | Reduced-motion gaps on theme toggle / home reveal / writing transitions. | `globals.css`'s `prefers-reduced-motion` `*` rule reduces animation-duration + transition-duration to 0.01ms. |
| AW-13 | Footer external links missing `rel=noopener noreferrer`. | Social links already have it. |
| AW-14 | Mobile menu hover/active states differ from desktop. | Intentional design choice — popover quiet vs. acid bar. |
| DB-8 | F1 reduced-motion gap; News Pulse `fadeIn` FOUC. | F1 has no Framer Motion; News Pulse `fadeIn` is gated on `useReducedMotion()`. |
| SX-4 | `color-mix()` gradient has no fallback for older browsers. | Browsers without `color-mix` support degrade to no-gradient solid background — graceful. |

---

## 4. Suggested Next Steps

1. **Run an axe / Lighthouse pass** on every surface to verify the contrast and WCAG margins ended up where we wanted (especially IQ-7 "Cheapest" badge, MB-11 notification badge, AW-6 `--text-tertiary`).
2. **WR-13 syntax highlighting + WR-14 footnotes** — bundled remark-plugin PR. Pick one lib (shiki for highlighting, remark-gfm covers most footnote needs).
3. **Optional refactor PR** for PL-5/LL-4/FF-16 — config-driven shared zone helper + URL state for the draft board filter.
