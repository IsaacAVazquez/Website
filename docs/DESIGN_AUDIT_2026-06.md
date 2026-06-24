# Front-End Design Audit — June 2026

A site-wide design-quality and best-practice audit of all 49 routes, plus the prioritized fix backlog
it produced. The durable best-practice rules now live in [`DESIGN_CHECKLIST.md`](../DESIGN_CHECKLIST.md);
this file is the point-in-time findings + backlog.

**Date:** 2026-06-24 · **Method:** 16 parallel auditors (11 page-group + 4 cross-cutting + 1 docs),
with the personal-tools and accessibility sweeps re-run, and every P0/P1 claim spot-verified against code.

---

## Executive summary

The site is in **strong design health**. The editorial system (`--home-*` tokens, `.home-*` shell
helpers, the snapshot-driven dashboard pattern, a single `ConditionalLayout`-owned `<main>`) is
well-built and consistently applied. Accessibility fundamentals are a genuine strength — one runtime
`<h1>` per route, clean landmark architecture (no nested `<main>`), idiomatic ARIA tablists/radiogroups,
`aria-live` status regions, sr-only data tables behind charts, a global `:focus-visible` ring, and
correct icon-button labeling / form labels / image alt across the board.

The drift is **real but narrow and patterned** — mostly mechanical, and several issues sit in shared
primitives so one fix clears many routes. 114 findings: **3 critical, 17 high, 42 medium, 52 low.**
Four themes dominate: (1) the V3 roots + writing archive each duplicate the palette as hardcoded hex
in CSS Modules; (2) chart/elevated-surface colors mix toward literal `white` and break in dark mode;
(3) `/march-madness-2026` is a separate dark-only language that bypasses tokens; (4) a long tail of
sub-44px targets, arbitrary micro-type, and missing dashboard `error.tsx` files.

### Verification corrections to the raw audit

- **"6 routes with multiple `<h1>`" is a FALSE POSITIVE.** On `/admin`, `/bay-area-transit`,
  `/earthquake-pulse`, `/golf`, `/museum-log` the two `<h1>`s are in **mutually-exclusive conditional
  branches** (loading/unavailable vs loaded state) — only one renders at runtime. Verified in
  `golf-client.tsx` (`if (!tournament) return (…h1…)` early-return, then the main `return (…h1…)`).
  No action required beyond awareness; the audit's "one `<h1>` per route" conclusion stands.

---

## Top themes

| # | Theme | Scope |
|---|-------|-------|
| T1 | Palette duplicated as hardcoded hex in CSS Modules instead of aliasing `--home-*` | 5 surfaces: `page/about/portfolio/contact/writing.module.css` |
| T2 | Dark-mode bug: `color-mix(… , white)` lightens "raised" surfaces in both themes | ~30 hits: nfl/nba/mlb/premier-league/la-liga (20), polling (4), `ModernButton` (4), news-pulse (2), `/now` (2), mba-jobs (2), MissionImageFrame (2) |
| T3 | Charts bypass tokens / hardcode hex → no dark-mode adaptation | investments (radar, allocation, holdings, research header), frontier chart, formula-1 accents, polling tie color |
| T4 | Missing per-route `error.tsx` (and some `loading.tsx`) on snapshot dashboards | 8 routes (see P0-1) |
| T5 | Sub-44px touch targets on interactive controls | ~12 surfaces (chips, pagers, native selects, icon buttons) |
| T6 | Arbitrary `text-[Npx]` micro-type — partly a real token gap (no fixed 12/13px token) | `text-[12px]` ×26, `text-[13px]` ×20; heaviest travel/museum-log/decision-lab/interchange-iq/budget-planner |
| T7 | Legacy `--color-success/-error/-warning` aliases used in new code | golf, budget-planner, interchange-iq, + several fantasy files |
| T8 | `/march-madness-2026` is a self-contained dark-only surface (no light mode, ~50 raw literals) | 1 route, total token bypass |

Plus low-grade: shared primitives using `transition-all`/bare `transition`; a few Framer surfaces
missing `useReducedMotion`; `role="button"` `<tr>` wrapping a real `<button>`.

---

## Prioritized backlog

Each item is checkable. **Status** = `confirmed` (verified against code) or `verify` (reported, not yet
re-confirmed). None of these are applied yet — they await go-ahead.

### P0 — Critical / guardrail-blocking

- [ ] **P0-1 · Add missing `error.tsx` (+ `loading.tsx`) to snapshot dashboards.** `confirmed`
      Missing `error.tsx`: `/polling-aggregator`, `/github-trending-pulse`, `/fantasy-football`,
      `/fantasy-football/draft-tracker`, `/frontier-models`, `/march-madness-2026`, `/golf`,
      `/mba-internship-notifications`. Also missing `loading.tsx`: fantasy-football, draft-tracker,
      frontier-models, march-madness-2026, mba-internship-notifications. Each `error.tsx` is a `'use client'`
      default re-exporting `RouteErrorBoundary` with a bespoke `surfaceName` (copy `earthquake-pulse/error.tsx`).
      *Why:* CLAUDE.md guardrail; siblings comply. Mechanical, ~16 small files.
- [ ] **P0-2 · `/march-madness-2026` ignores the token system entirely.** `confirmed`
      `march-madness-client.tsx` is hardcoded dark-only (`#06090f` gradients, `text-slate-*`,
      `border-white/10`, `text-amber-300`) → never adapts to light mode. Re-skin onto
      `home-page`/`home-card` + `--home-*` with `color-mix` accents (match golf/F1), or — if intentionally
      seasonal — introduce a scoped `--mm-*` token set so it at least has one source of truth + a `.dark` story.
- [ ] **P0-3 · `/frontier-models` curated-dataset disclosure missing.** `confirmed`
      `FrontierModelsSnapshot` lacks `verified`/`asOf`/`disclaimer`, so the unverified state is never
      disclosed on-page (sibling `tech-startup-tracker` does this). Add the fields + a disclosure card.
- [ ] **P0-4 · `MetricTooltip` definitions unreachable by keyboard/touch.** `confirmed`
      The `?` trigger is a non-focusable `<span>` revealed only on `group-hover`. Make it a real
      `<button>`, reveal on `group-focus-within`, wire `aria-describedby`. Same hover-only pattern affects
      `PortfolioStatsGrid` / `ResearchAssetHeader` metric hints (native `title=` only).

### P1 — High

- [ ] **P1-1 · Collapse the 5 duplicated palettes to one source of truth.** `confirmed`
      In `page/about/portfolio/contact/writing.module.css`, redefine the module-local tokens as
      `var(--home-*)` and delete the redundant `:global(.dark)` palette mirrors. Kills future drift.
- [ ] **P1-2 · Fix the `color-mix(… , white)` dark-mode bug.** `confirmed`
      Replace `bg-[color-mix(in_srgb,var(--home-paper)_92%,white)]` with `bg-[var(--home-paper-raised)]`
      (theme-aware via `--home-elev-mix`). Routes: nfl/nba/mlb/premier-league/la-liga (20), polling (4),
      news-pulse (2), `/now` (2), mba-jobs (2). **Check `ModernButton` (×4) and `MissionImageFrame` (×2)**
      — confirm whether those white-mixes are intentional on-accent highlights before changing.
- [ ] **P1-3 · Make investments charts theme-aware + share one palette.** `confirmed`
      `ComparisonRadarChart` hardcodes `COLOR_A_HEX="#2563EB"` (stale vs `--home-haze` `#5672F8`) and its
      legend swatch ≠ text color; `AllocationChart`/`HoldingsTable`/`ResearchAssetHeader` use static
      palettes (incl. `AAPL "#12110F"` → near-invisible on dark). Resolve via `getComputedStyle` like
      `PortfolioPerformanceChart`; extract one shared `src/lib/investments/palette.ts`.
- [ ] **P1-4 · Tokenize gain/loss + tie accents.** `confirmed`
      `/formula-1` hardcodes `#22A06B`/`#D54E4E`; polling hardcodes tie `#D97706` (×3). Use
      `--home-positive`/`--home-negative`/`--home-warning`. Decorative medal/party colors stay raw.
- [ ] **P1-5 · `/investments` section nav vanishes on mobile.** `confirmed`
      `globals.css` hides `.invest-sidebar` below 900px with no replacement. Render a scrollable chip row
      or sticky section-jump `<select>` reusing `navItems`.
- [ ] **P1-6 · Portfolio listing touch targets.** `confirmed`
      Filter chips (~36px), pager (40px), sort `<select>` (~30px) all < 44px. Add `min-height: 44px`
      (and `min-width: 44px` on pager) via padding/line-height, not by shrinking the hit area.
- [ ] **P1-7 · `/changelog` injects markdown into an undefined `.changelog-prose` class.** `confirmed`
      Class referenced once (`page.tsx:143`), never defined → embedded links render default-blue and ignore
      dark mode. Define `.changelog-prose` in `globals.css` styling `a/ul/ol/code/strong` with `--home-*`.
- [ ] **P1-8 · `PageSummary` shared primitive ignores `useReducedMotion`.** `confirmed`
      Its Framer entrance plays for motion-sensitive users on every route that embeds it. Gate the
      transition on `useReducedMotion()`. (Fixing the shared primitive covers many routes.)

### P2 — Medium polish

- [ ] **P2-1 · Migrate legacy `--color-*` aliases in new code** → `--home-positive/-negative/-warning`.
      golf, budget-planner, interchange-iq (+ several fantasy files). Mechanical, no visual change. `confirmed`
- [ ] **P2-2 · Remaining sub-44px controls.** Fantasy rankings icon buttons (`h-7`) + "Clear"; draft-tracker
      undo/toggle/inputs; investments search/nav; world-cup team rows (36px); budget-planner chevrons (32px);
      interchange-iq Reset (32px); search filter pills (36px); writing chips/pager/select. `confirmed`
- [ ] **P2-3 · `TierBreakdown` tiers have no heading.** Each tier is an `aria-label`'d `<section>` with the
      label as a `<p>`. Promote to `<h3>` + `aria-labelledby` so tiers are navigable by heading. `confirmed`
- [ ] **P2-4 · Arbitrary micro-type cleanup** in decision-lab, interchange-iq, budget-planner, formula-1,
      travel (×37), museum-log (×12), recipe-finder. Migrate 9–11px → `text-3xs`/`text-2xs`; decide the
      12/13px policy (fluid `text-xs` vs a new fixed `text-1xs` token — see `STYLING.md`). `confirmed`
- [ ] **P2-5 · Responsive reflow gaps.** About stat strip stays 4-col on mobile; investments 8-col holdings
      table only horizontal-scrolls; world-cup tables lack the scroll-region wrapper; golf packs 4 StatBlocks
      into `grid-cols-4`; home wordmark `nowrap` clip risk at 360px. `verify`
- [ ] **P2-6 · Invalid `role="button"` on `<tr>` wrapping a real `<button>`.** `confirmed (ai-dev-tools)` /
      `verify (others)` `ai-dev-tools-client.tsx:461` wraps a tabbable `<button>` (:466) → duplicate tab stop.
      Same pattern reported in polling-aggregator, github-trending-pulse, frontier-models — make the row OR
      the inner control interactive, not both. Also: ai-dev-tools placeholder GitHub pill links to bare
      `https://github.com/`.
- [ ] **P2-7 · Framer entrances on `/resume` and `/admin` lack `useReducedMotion`.** `confirmed`
- [ ] **P2-8 · `/accessibility` overstates conformance** ("fully conformant WCAG 2.1 AA, no exceptions",
      "all controls 44px") — contradicted by the 36px search pills. Fix the pills (P2-2) and soften to
      defensible language. `confirmed`
- [ ] **P2-9 · More dark-mode color issues:** frontier chart's 7 hardcoded provider hexes (xAI slate
      `#475569` low-contrast on dark); contact/portfolio `#1a1814` hover not remapped in `.dark` (invisible
      hover in dark). `confirmed`

### P3 — Low

- [ ] **P3-1 · Shared-primitive `transition-all` / bare `transition` → scoped properties.** MetricCallout,
      Breadcrumbs, ProfitabilityPanel, FixtureCard, ProjectsContent (×4). `confirmed`
- [ ] **P3-2 · Mouse-only hover color via inline JS** (no focus state) in AuthorBio + resume-client contact
      links → move to CSS `:hover, :focus-visible`. `confirmed`
- [ ] **P3-3 · Migrate `.prose-writing` off legacy aliases** (`--text-*`, `--surface-*`, `--color-primary`)
      to `--home-*`. `verify`
- [ ] **P3-4 · Hardcoded content counts in AboutV3** disagree with each other / live data — derive from the
      same accessors the homepage uses. `verify`
- [ ] **P3-5 · Consolidate the focus-ring strategy.** Global `button/a:focus-visible` uses `outline` +
      `box-shadow` (and legacy `--color-primary`/`--border-accent` aliases); several components add inline
      `focus-visible:ring-2 ring-offset-2` on top → up to three stacked indicators. Pick one approach. `verify`
- [ ] **P3-6 · Token-fidelity nits:** world-cup inlines `--home-ink-soft` once; writing `#1A1814` raw hex;
      nfl `shadow-sm` vs `shadow-[var(--shadow-sm)]`; bay-area `#888888`/white-dot fallbacks; CrestAvatar
      `bg-white` plate; on-accent `#ffffff` literals in charts. `verify`
- [ ] **P3-7 · Minor a11y/motion:** `/recipe-finder` heading skip (h1 → h3 — add an h2 or promote recipe
      titles); march-madness chevron not `aria-hidden`; F1 external links missing `rel="noreferrer"`;
      CSS chevron rotations not `motion-safe:`; retirement-assumptions table missing `overflow-x-auto`;
      wine-cellar/ai-dev-tools/march-madness wide-table mobile UX. `confirmed (recipe-finder)` / `verify (rest)`

---

## What's already strong (preserve)

- **Editorial token system + shell helpers** — broadly consistent; `/portfolio/[slug]`, `/resume`, the
  writing reader, and topic pages prove the system works with zero per-route hex.
- **Accessibility fundamentals** — one runtime `<h1>`/route, clean single-`<main>` architecture, idiomatic
  ARIA tablists/radiogroups, `aria-live` regions, sr-only data tables behind charts, a global
  `:focus-visible` ring, correct icon-button labeling, form labels, and image alt.
- **The global `prefers-reduced-motion` guard** plus targeted blocks for looping animations — most Framer
  surfaces correctly gate on `useReducedMotion()`.
- **The snapshot-driven dashboard pattern** with fail-soft refresh and honest curated-data disclosure.
- **The shared football component set** (`SurfaceCard`, `StatCard`, `FixtureCard`, `TeamResultPill`) —
  genuinely theme-aware and cleanly reused across 6 routes.
- **The personal-interest tools** (travel/food-map/recipe-finder/wine-cellar/museum-log) — strong token
  discipline, form a11y, empty states, and motion handling; their main gap is arbitrary micro-type.
- **Reference implementations to copy:** `PortfolioPerformanceChart`, `github-trending-pulse`,
  `tech-startup-tracker`, `EditorialPillButton`, the `scroll-shadow-x` wide-table pattern.

---

## Documentation changes shipped with this audit

- **`DESIGN_CHECKLIST.md`** (new) — single canonical pre-merge checklist.
- **`STYLING.md`** — corrected the fonts table (added **Bricolage Grotesque** / `--font-display`); added
  *Dark-mode elevation*, *Semantic status colors*, *Charts/D3 theming*, and the *micro-type policy / 12–13px
  token gap*.
- **`CLAUDE.md`** — added `DESIGN_CHECKLIST.md` to the documentation map + new guardrails.
- **`SNAPSHOT_DRIVEN_DASHBOARDS.md`** — made the `error.tsx` + `loading.tsx` + curated-disclosure
  requirement explicit.
- **`DARK_MODE_USAGE_GUIDE.md`** — cross-referenced the chart-theming pattern and the elevation rule.
