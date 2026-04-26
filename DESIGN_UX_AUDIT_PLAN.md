# Design & UX Audit — Status & Remaining Work

**Originally audited:** 2026-04-25
**Last updated:** 2026-04-26
**Scope:** Full application — all routes, shared components, global shell

This document tracked every design, styling, UI/UX, and accessibility issue found across the site. Most items have shipped; this revision keeps the original IDs but trims the doc to **what's still outstanding** plus a short shipped log so future audits can cross-reference.

---

## Status Summary

| Bucket | Total | Shipped | No-op / superseded | Outstanding |
|---|---|---|---|---|
| **P0** | 30 | 30 | 0 | 0 |
| **P1** | 39 | 28 | 7 | 4 |
| **P2** | ~60 | 0 | 0 | ~60 |

**Shipped via:**
- **PR #88** — P0 pass (shell, writing, dashboard cross-cuts, fantasy/fintech/MBA P0s)
- **PR #89** — P1 pass (shell, writing, portfolio, investments, MM, dashboards, fantasy/fintech/MBA P1s)
- **PR #90** — Deferred items (DB-5 aria-controls, PA-4 polls dedup, SX-2/3 backoff + validation, NP-4 pagination, MM-5/PL-3 URL state, AW-4 button cleanup, AW-6 contrast bump)

---

## Severity Legend

| Tag | Meaning |
|-----|---------|
| **P0** | Broken or inaccessible — ships nothing until fixed |
| **P1** | Clear design/UX bug — fix before next release |
| **P2** | Polish or consistency — tackle in a dedicated pass |

---

## 1. Outstanding P1 Items

These are real bugs that should be fixed in the next release cycle.

| # | Issue | Surface | File | Notes |
|---|-------|---------|------|-------|
| AW-5 | Legacy semantic tokens (`--surface-*`, `--text-*`, `--color-primary`) still aliased to `--home-*` in `globals.css`. New code should prefer `--home-*` directly. | Shell | `src/app/globals.css` | The aliases are intentional cascade safety net. Treat as a soft policy: lint or comment-banner discourages new usage. Full migration is its own PR. |
| CT-1 | No contact form exists — only email and LinkedIn CTAs. Either implement with labels/validation/error/success states or document the links-only choice. | Contact | `src/components/ContactContent.tsx` | Product decision required before implementation. |
| PL-4 | Empty/error states inconsistent — some use `StatusPanel`, others raw prose. | Premier League | `premier-league-client.tsx:534–548` | Audit usages; unify on `StatusPanel`. |
| PA-3 | `aria-live="polite"` on RaceSidebar but state changes don't actually trigger announcements; dynamic updates are silent to screen readers. | Polling | `polling-aggregator-client.tsx:234` | Verify the live region wraps the changing content (not just the container) and that the announced text actually changes between selections. |
| NP-3 | `SourceDropdown` Escape handling and focus trap rely on Radix defaults — needs explicit verification that Esc closes consistently and focus returns to the trigger. | News Pulse | `news-pulse-client.tsx:261–307` | If Radix handles it cleanly, close as no-op with a brief test note. |

---

## 2. Outstanding P2 Items

Polish-pass work. None of these block users; they tighten consistency, accessibility margins, and copy.

### 2.1 Shell

| # | Issue | File |
|---|-------|------|
| AW-12 | Theme toggle icon animation not wrapped in `prefers-reduced-motion` check. | `ui/ThemeToggle.tsx:30–37` |
| AW-13 | Missing `rel="noopener noreferrer"` on external footer links. | `Footer.tsx:119–124` |
| AW-14 | Mobile menu hover/active states differ from desktop (border vs background pattern). | `globals.css:1183–1216` |
| AW-15 | Four fonts loaded with `display: swap`; non-critical Instrument Serif/Sans lack `display: optional` fallback (CLS risk). | `layout.tsx:14–38` |

### 2.2 Core Portfolio Pages

| # | Issue | File |
|---|-------|------|
| HP-2 | Four staggered Framer Motion reveals on every load; `useReducedMotion()` not checked. | `home/HomePageContent.tsx:99–132` |
| AB-2 | `AnimatePresence mode="wait"` causes brief content gap on tab switch (potential CLS). | `About.tsx:105–134` |
| PF-3 | `showFeaturedBadge` always true but badge only renders when `study.featured` is set — redundant prop. | `portfolio/page.tsx:64` |
| CS-3 | "Next case study" card has sticky hover lift on touch (`group-hover:-translate-y-0.5`); add `active:` or `@media (hover: none)` reset. | `portfolio/[slug]/page.tsx:502–523` |
| CS-4 | Testimonial blockquote not wrapped in `<figure><blockquote><figcaption>` — no semantic `<cite>`. | `portfolio/[slug]/page.tsx:444–459` |
| CS-5 | "Back to Portfolio" link uses `--home-ink-muted` with no hover color; low contrast in dark mode. | `portfolio/[slug]/page.tsx:116–121` |
| RS-2 | PDF download button has no loading/disabled feedback; fast double-clicks queue multiple downloads. | `resume-client.tsx:106–112` |
| CT-2 | Availability pulsing dot has no `aria-label`; motion not gated on `prefers-reduced-motion`. | `ContactContent.tsx:92–98` |
| CT-3 | `lg:grid-cols-[1.2fr_0.8fr]` has no `sm:`/`md:` breakpoint. | `ContactContent.tsx:42` |
| AC-1 | Keyboard shortcut keys rendered as plain text inside styled `<dd>`; should use `<kbd>`. | `accessibility/page.tsx:169–195` |
| AC-2 | "Updated November 2025" is stale — current date is April 2026. | `accessibility/page.tsx:105` |
| AC-3 | External WAI link opens in new tab with no `aria-label` announcing that behavior. | `accessibility/page.tsx:299–307` |

### 2.3 Writing Surface

| # | Issue | File |
|---|-------|------|
| WR-5 | Code blocks use `overflow-x: auto` with no scroll affordance or `scrollbar-width: thin`. | `globals.css:345–361` |
| WR-6 | Inline prose links use `text-decoration-color: transparent` by default — no visible underline until hover. | `globals.css:318–328` |
| WR-7 | Inline MDX images may be plain `<img>` from `remark-html` (not `next/image`); aspect-ratio shift on load. | `globals.css:390–393` |
| WR-8 | No table responsive wrapper — tables overflow on mobile with no horizontal scroll indicator. | `globals.css:405–415` |
| WR-9 | `transition-transform` on related post cards and arrow icons not gated on `prefers-reduced-motion`. | `writing/page.tsx:291` |
| WR-10 | No sequential prev/next article navigation on slug page. | `writing/[slug]/page.tsx` |
| WR-11 | `canonicalUrl` hardcodes `isaacavazquez.com`; breaks on staging/preview deployments. | `writing/[slug]/page.tsx:50` |
| WR-12 | Date format inconsistency — index uses `publishedDateFormatter`, slug page uses manual `toLocaleDateString`. | `blog.ts:88`, `writing/[slug]/page.tsx:172` |
| WR-13 | No syntax highlighting plugin in remark/rehype pipeline (no shiki/prism/highlight.js). | `lib/blog.ts` |
| WR-14 | No footnote plugin configured — `[^1]` syntax renders as plain text. | `lib/blog.ts` |

### 2.4 Investments

| # | Issue | File |
|---|-------|------|
| IN-7 | Comparison table winner highlight uses color only (no icon or label). | `investments/ComparisonMetricTable.tsx:64–69` |
| IN-8 | Loading skeleton uses hardcoded `bg-[var(--neutral-200)]`; appears off in dark mode. | `investments/PortfolioSummary.tsx:50–51` |
| IN-9 | Edit/delete buttons on `StockCard` hidden behind hover — no touch equivalent. | `investments/StockCard.tsx:80–160` |
| IN-10 | `staggerChildren: 0` in reduced-motion config may still cause perceptible layout shift. | `investments/animations.ts:30–56` |

### 2.5 March Madness

| # | Issue | File |
|---|-------|------|
| MM-7 | `StatCell` amber vs green highlight logic unclear without code context; add `title`/`aria-label`. | `march-madness-client.tsx:261–277` |
| MM-8 | Injury cards lack severity badge ("Out", "Questionable", "Probable"). | `march-madness-client.tsx:411–432` |

### 2.6 Dashboards (Cross-Cutting)

| # | Issue | Affected |
|---|-------|----------|
| DB-6 | Date/time formatters duplicated per dashboard — consolidate to shared `src/lib/date-formatters.ts`. | All dashboards |
| DB-8 | Reduced-motion gaps — F1 has no `useReducedMotion()` despite panel transitions; News Pulse `fadeIn` causes FOUC when JS is delayed. | F1, News Pulse |

### 2.7 Per-Dashboard

| # | Issue | File |
|---|-------|------|
| F1-4 | `formatDelta()` doesn't localize decimal separators for non-US locales. | `formula-1-client.tsx:83` |
| PL-5 | Zone pill styles (`getZonePillStyle`) duplicated between PL and La Liga — extract to shared utility. | `premier-league-client.tsx:73–82`, `la-liga-client.tsx` |
| LL-4 | `getClubStoryline()` and `getClubPressurePoints()` are copy-paste from PL client — extract to shared module. | `la-liga-client.tsx:841–872` |
| NP-5 | Sentiment and readability scores recalculated on every render; no `useMemo`. | `news-pulse-client.tsx:738–756` |
| SX-4 | `color-mix()` gradient in hero banner has no fallback for older browsers. | `spacex-mission-control-client.tsx:410` |

### 2.8 Fantasy Football

| # | Issue | File |
|---|-------|------|
| FF-16 | Filter state (selected position) not URL-persisted; reload resets to "ALL" mid-draft. | `DraftBoard.tsx:154` |
| FF-17 | CSV/JSON draft export happens silently with no toast or download feedback. | `useDraftState.ts:284–320` |
| FF-18 | Undo history not persisted to localStorage; lost on page reload. | `useDraftState.ts:87` |
| FF-19 | `draftPlayer()` maps over all teams on every pick — O(n²) for 200+ picks; use Map or indexed storage. | `useDraftState.ts:184–200` |
| FF-20 | Team name input in setup accepts empty string or 100+ chars with no min/max validation. | `DraftSetup.tsx:78–89` |
| FF-21 | `getPositionTone()`/`getPositionColor()` duplicated in three files — extract to shared utility. | multiple |
| FF-22 | Rank column uses proportional font; expert range column uses serif; both should use `tabular-nums`. | `fantasy-football-client.tsx:516,541` |

### 2.9 Fintech & MBA

| # | Issue | File |
|---|-------|------|
| BP-8 | Expense date displays raw ISO 8601 (`2026-04-15`); should format as relative or human-readable. | `budget-planner-client.tsx:645` |
| BP-9 | Form labels use uppercase `text-[11px]` mono without `clamp()`; shrinks further on < 375px. | `budget-planner-client.tsx:295–297` |
| IQ-6 | Comparison bars show no hover tooltip; user must track across disconnected label + bar + number columns. | `interchange-iq-client.tsx:485–502` |
| IQ-7 | "Cheapest" badge uses `color-mix(--home-haze, 14%)` — may fail WCAG AA contrast on light paper. | `interchange-iq-client.tsx:456–467` |
| MB-9 | Skeleton loader grid uses `aria-hidden="true"` but no `role="status"` or loading announcement. | `mba-jobs-client.tsx:646–685` |
| MB-10 | Relative time ("2 hours ago") loses precision; show exact time on hover. | `mba-jobs-client.tsx:90–101` |
| MB-11 | Notification permission badge uses 8% color-mix; needs explicit WCAG AA contrast test. | `mba-jobs-client.tsx:746–781` |

---

## 3. No-ops / Superseded by Other Fixes

These were tagged in the original audit but turned out not to apply once the surrounding code was reviewed or other fixes landed. Kept for traceability so future audits don't redo the analysis.

| # | Original concern | Why it's not actionable |
|---|------------------|-------------------------|
| F1-1 | Inline `MetricCard` may double-apply border/shadow. | DB-1 fix removed the inline `MetricCard` — F1 now imports the shared one. |
| F1-3 | Gradient inline styles don't adapt to dark mode. | Gradient already uses `--home-paper`/`--home-paper-alt`/`--home-haze`, all of which flip via the `.dark` class. |
| FC-3 | Shared `MetricCard` has no `variant` prop. | Resolved by DB-1: the shared component now accepts optional `icon`/`detail` props that cover the F1 variant. |
| DB-4 | `<p class="home-kicker">` used where `<h3>`/`<span>` belongs. | The kicker pattern is intentional — it's a typographic label, not a document-outline heading. Promoting to `<h3>` would create extra heading levels. |
| FF-2 | "No dark mode CSS — page renders broken in dark mode." | All `--home-*` variables flip via the `.dark` class on `:root`, so `color-mix()` values adapt automatically. Manual smoke test confirms dark mode renders fine. |
| FF-4 | `EnhancedPlayerCard` broken image fallback. | Component no longer exists post-fantasy overhaul (PR #86). |
| FF-7 | "Two h1s, no `<main>` landmark." | `ConditionalLayout` already provides `<main>`, and there's only one h1 in the current code. |
| FF-8 | Draft tracker no `<main>` or `<aside>` landmarks. | Same — `ConditionalLayout` wraps it. |
| FF-9 | Search cleared on position change but text stays. | Current code preserves search across position changes; doesn't match the audit's described behavior. |
| FF-10/11/14/15 | RB tiers chart concerns. | `/fantasy-football/rb-tiers` is now a redirect; the chart files don't exist post-overhaul. |
| MB-5 | Sort dropdown focus return. | Radix `DropdownMenu` already returns focus to the trigger on close. |
| MB-8 | Email digest endpoint no client-side throttle. | The trigger button already disables on `emailSending` and the dialog's submit also disables — double-click cannot re-fire while in flight. |
| IN-6 | Quote cache age not surfaced. | Already surfaced via `DataFreshnessIndicator` in `PortfolioTracker` — shows "Updated X min ago" with refresh button. |

---

## 4. Suggested Next Steps

1. **P1 cleanup PR** — knock out PL-4, PA-3, NP-3 (small, focused). Decide on CT-1 (form vs. links-only) before touching it. Treat AW-5 as a slow-burn policy, not a blocking task.
2. **P2 polish sprint** — group by surface so each PR stays reviewable: writing surface (WR-5–14, especially WR-13 syntax highlighting and WR-2/AC-2 stale-date sweep), dashboards reduced-motion + date helper consolidation (DB-6, DB-8, F1-4, NP-5), fantasy P2 batch (FF-16–22 are mostly internal cleanup).
3. **WCAG AA verification pass** — once the P1 cleanup lands, run axe / Lighthouse on every surface and capture remaining contrast or keyboard-trap issues as a fresh checklist; the original audit's contrast estimates (IQ-7, MB-11, etc.) should be confirmed with real tooling rather than eyeball.
