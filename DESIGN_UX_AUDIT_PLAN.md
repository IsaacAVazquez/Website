# Design & UX Audit Plan

**Audited:** 2026-04-25  
**Branch:** `claude/audit-design-ux-issues-3medx`  
**Scope:** Full application — all routes, shared components, global shell

This document catalogs every design, styling, UI/UX, and accessibility issue found across the site and provides a prioritized remediation plan. Issues are grouped app-wide first, then project by project.

---

## Severity Legend

| Tag | Meaning |
|-----|---------|
| **P0** | Broken or inaccessible — ships nothing until fixed |
| **P1** | Clear design/UX bug — fix before next release |
| **P2** | Polish or consistency — tackle in a dedicated pass |

---

## 1. App-Wide Hierarchy

Issues in this section affect every page. Fix these first — many P1/P2 items elsewhere will auto-resolve.

### 1.1 Critical Shell Bugs (P0)

| # | Issue | File | Line |
|---|-------|------|------|
| AW-1 | **Mobile menu overlay `z-[-1]`** — overlay sits _behind_ the page, not behind the panel; close tap is unreachable | `src/components/StaticHeader.tsx` | 142–147 |
| AW-2 | **Skip link invisible in dark mode** — `bg-[var(--neutral-900)]` doesn't invert; text and background become same color | `src/app/layout.tsx` | 77 |
| AW-3 | **Global `*:focus { outline: none }` with incomplete replacement** — keyboard users lose focus indicator on custom components and some inputs | `src/app/globals.css` | 24–26 |

### 1.2 Design System & Token Issues (P1)

| # | Issue | File | Line |
|---|-------|------|------|
| AW-4 | **Three competing button primitives** — `ui/button.tsx` (shadcn, references tokens that don't exist), `ui/ModernButton.tsx` (editorial palette, correct), and `.home-button*` CSS classes (globals). No single source of truth. | `src/components/ui/button.tsx`, `ModernButton.tsx`, `globals.css` | 738–798 |
| AW-5 | **Legacy semantic tokens (`--surface-*`, `--text-*`, `--color-primary`) still mixed with `--home-*` in new code** — `PortfolioProjectCard.tsx` mixes both systems | `src/components/PortfolioProjectCard.tsx` | 156 |
| AW-6 | **`--text-tertiary` at 45% strength may fail WCAG AA for small text** — `color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))` on beige yields ~5.8:1 for large text but insufficient for 12–13px labels | `src/app/globals.css` | 107 |
| AW-7 | **Header active link has no dark-mode override** — `[aria-current="page"]` background doesn't visually distinguish on `#12110F` dark paper | `src/app/globals.css` | 1193–1208 |
| AW-8 | **Touch targets inconsistent** — logo brand link has `min-h-[44px]` but no `min-w-[44px]`; some icon buttons undeclared | `src/components/StaticHeader.tsx` | 57 |

### 1.3 Layout & Accessibility Shell (P1)

| # | Issue | File | Line |
|---|-------|------|------|
| AW-9 | **`tabIndex={-1}` on `<main>`** breaks skip-link semantics — skip link target should be a naturally focusable block landmark | `src/components/ConditionalLayout.tsx` | 54 |
| AW-10 | **`/accessibility` page not in `selfShellRoutes`** — footer links there but ConditionalLayout renders it with wrong wrapper | `src/components/Footer.tsx`, `ConditionalLayout.tsx` | 114, 16 |
| AW-11 | **Z-index conflict risk** — header `z-50`, modals `z-50`, overlay `z-[-1]` create unpredictable stacking | `StaticHeader.tsx`, `mba-jobs-client.tsx` | multiple |

### 1.4 Polish (P2)

| # | Issue | File | Line |
|---|-------|------|------|
| AW-12 | Theme toggle icon animation not wrapped in `prefers-reduced-motion` check | `src/components/ui/ThemeToggle.tsx` | 30–37 |
| AW-13 | Missing `rel="noopener noreferrer"` on external footer links | `src/components/Footer.tsx` | 119–124 |
| AW-14 | Mobile menu hover/active states differ from desktop (border vs background pattern); inconsistent cross-viewport | `src/app/globals.css` | 1183–1216 |
| AW-15 | Four fonts loaded with `display: swap`; non-critical Instrument Serif/Sans lack `display: optional` fallback; CLS risk | `src/app/layout.tsx` | 14–38 |

---

## Remediation Order for App-Wide Issues

1. **AW-1** — Fix overlay z-index (`z-40`) in StaticHeader
2. **AW-2** — Fix skip link to use `var(--home-paper)`/`var(--home-ink)` instead of neutral-900
3. **AW-3** — Replace `*:focus { outline: none }` with `*:focus-visible { outline: ... }` and audit remaining focus rules
4. **AW-9** — Remove `tabIndex={-1}` from `<main>` in ConditionalLayout
5. **AW-4** — Deprecate `ui/button.tsx` (shadcn); make `ModernButton` the single primitive, migrate callsites
6. **AW-5/6** — Enforce `--home-*` palette in new code; add lint rule or comment banner on legacy aliases
7. **AW-10/11** — Add `/accessibility` to selfShellRoutes; audit z-index layers
8. **AW-7/8/12–15** — Polish pass: dark mode active states, touch targets, reduced motion, rel attributes

---

## 2. Core Portfolio Pages

### 2.1 Home (`/`) — `src/app/page.tsx`, `src/components/home/HomePageContent.tsx`

| # | Issue | Severity | Line |
|---|-------|----------|------|
| HP-1 | Hero image wrapper has no dark-mode background fallback — if image fails, frame looks hollow | P1 | 133–142 |
| HP-2 | Four staggered Framer Motion reveals on every load; `useReducedMotion()` not checked | P2 | 99–132 |

### 2.2 About (`/about`) — `src/components/About.tsx`

| # | Issue | Severity | Line |
|---|-------|----------|------|
| AB-1 | Tab buttons lack explicit `focus-visible` outline; keyboard tab navigation works but has no visible ring | P1 | 79–95 |
| AB-2 | `AnimatePresence mode="wait"` causes brief content gap on tab switch; potential CLS | P2 | 105–134 |

### 2.3 Portfolio (`/portfolio`) — `src/app/portfolio/page.tsx`, `src/components/PortfolioProjectCard.tsx`

| # | Issue | Severity | Line |
|---|-------|----------|------|
| PF-1 | Grid jumps `md:grid-cols-2` → `xl:grid-cols-3`; no intermediate column step for 1024–1280px tablets | P1 | `page.tsx:59` |
| PF-2 | `line-clamp` + `min-h-*` creates uneven card heights when text wraps; use `flex-1` spacer instead | P1 | `PortfolioProjectCard.tsx:55,68,86` |
| PF-3 | `showFeaturedBadge` always true but badge only renders when `study.featured` is set — redundant prop | P2 | `page.tsx:64` |

### 2.4 Case Study (`/portfolio/[slug]`) — `src/app/portfolio/[slug]/page.tsx`

| # | Issue | Severity | Line |
|---|-------|----------|------|
| CS-1 | GitHub/Live Project outline buttons have no `hover:` or `focus-visible:` state; feel unresponsive | P1 | 176–207 |
| CS-2 | Metrics grid jumps `grid-cols-2` → `md:grid-cols-4`; cramped at tablet width; needs `sm:grid-cols-3` mid-step | P1 | 225 |
| CS-3 | "Next case study" card has sticky hover lift on touch (`group-hover:-translate-y-0.5`); add `active:` or `@media (hover: none)` reset | P2 | 502–523 |
| CS-4 | Testimonial blockquote not wrapped in `<figure><blockquote><figcaption>` — no semantic `<cite>` for screen readers | P2 | 444–459 |
| CS-5 | "Back to Portfolio" link uses `--home-ink-muted` with no hover color; low contrast in dark mode | P2 | 116–121 |

### 2.5 Resume (`/resume`) — `src/app/resume/resume-client.tsx`

| # | Issue | Severity | Line |
|---|-------|----------|------|
| RS-1 | Email/LinkedIn links use `onMouseEnter`/`onMouseLeave` JS for color — breaks on touch; replace with CSS `hover:` class | P1 | 124–135 |
| RS-2 | PDF download button has no loading/disabled feedback; fast double-clicks queue multiple downloads | P2 | 106–112 |

### 2.6 Contact (`/contact`) — `src/components/ContactContent.tsx`

| # | Issue | Severity | Line |
|---|-------|----------|------|
| CT-1 | No contact form exists — only email and LinkedIn CTAs. If form was planned, implement with labels, validation, error states, and success state. Document if links-only is intentional. | P1 | — |
| CT-2 | Availability pulsing dot (`animate-pulse`) has no `aria-label`; motion not gated on `prefers-reduced-motion` | P2 | 92–98 |
| CT-3 | `lg:grid-cols-[1.2fr_0.8fr]` has no `sm:` or `md:` breakpoint; side panel may overflow at 640–1024px | P2 | 42 |

### 2.7 Accessibility (`/accessibility`) — `src/app/accessibility/page.tsx`

| # | Issue | Severity | Line |
|---|-------|----------|------|
| AC-1 | Keyboard shortcut keys rendered as plain text inside styled `<dd>`; should use semantic `<kbd>` elements | P2 | 169–195 |
| AC-2 | "Updated November 2025" is stale — current date is April 2026 | P2 | 105 |
| AC-3 | External WAI link opens in new tab with no `aria-label` announcing that behavior | P2 | 299–307 |

### Repeated Patterns Across Portfolio Pages

- **Inline `style={{}}` everywhere** — dense inline style objects scattered across all case study and accessibility pages. Extract repeated styles (section titles, chip styles, body copy) to Tailwind utilities or CSS helpers.
- **Missing `hover:`/`focus-visible:` on interactive elements** — CS-1, RS-1 are examples of a pattern; audit all custom link/button styles for state coverage.
- **Grid breakpoint gaps** — PF-1, CS-2, CT-3 are all missing mid-point breakpoints. Always include `sm:`, `md:`, `lg:`, `xl:` steps for smooth scaling.

---

## 3. Writing Surface (`/writing`, `/writing/[slug]`)

### 3.1 Critical (P0)

| # | Issue | File | Line |
|---|-------|------|------|
| WR-1 | **Wrong prose class** — slug page uses `prose-home` which is undefined; should be `prose-writing` (defined in globals.css). All custom prose styling is currently ignored. | `src/app/writing/[slug]/page.tsx` | 207 |

### 3.2 High Priority (P1)

| # | Issue | File | Line |
|---|-------|------|------|
| WR-2 | `AuthorBio` renders hardcoded "About the author" kicker — explicitly forbidden by `WRITING_VOICE.md` line 38 | `src/components/ui/AuthorBio.tsx` | 187 |
| WR-3 | `.prose-writing` defines light-mode colors only; no `.dark .prose-writing` overrides — code blocks and blockquotes will be unreadable in dark mode | `src/app/globals.css` | 270–416 |
| WR-4 | No `max-w-prose` or equivalent reading-width constraint on slug page — `max-w-none` allows line lengths beyond readable measure | `src/app/writing/[slug]/page.tsx` | 207 |

### 3.3 Polish (P2)

| # | Issue | File | Line |
|---|-------|------|------|
| WR-5 | Code blocks use `overflow-x: auto` with no scroll affordance or `scrollbar-width: thin`; mobile users don't know content is scrollable | `src/app/globals.css` | 345–361 |
| WR-6 | Inline prose links use `text-decoration-color: transparent` by default — no visible underline until hover; fails low-vision users | `src/app/globals.css` | 318–328 |
| WR-7 | Inline MDX images may be plain `<img>` from remark-html (not `next/image`); no `height: auto` fallback; aspect ratio shift on load | `src/app/globals.css` | 390–393 |
| WR-8 | No table responsive wrapper — tables overflow on mobile with no horizontal scroll indicator | `src/app/globals.css` | 405–415 |
| WR-9 | Article-level `transition-transform` on related post cards and arrow icons not gated on `prefers-reduced-motion` | `src/app/writing/page.tsx` | 291 |
| WR-10 | No sequential prev/next article navigation on slug page — users must return to index | `src/app/writing/[slug]/page.tsx` | — |
| WR-11 | `canonicalUrl` hardcodes `isaacavazquez.com`; breaks on staging/preview deployments; use `process.env.SITE_URL` | `src/app/writing/[slug]/page.tsx` | 50 |
| WR-12 | Date format inconsistency — index uses `publishedDateFormatter`, slug page uses manual `toLocaleDateString` | `blog.ts`, `writing/[slug]/page.tsx` | 88, 172 |
| WR-13 | No syntax highlighting plugin in remark/rehype pipeline (no shiki, prism, or highlight.js) — code blocks render unstyled | `src/lib/blog.ts` | — |
| WR-14 | No footnote plugin configured — `[^1]` footnote syntax will render as plain text with no anchor links | `src/lib/blog.ts` | — |

---

## 4. Investments (`/investments`) & March Madness (`/march-madness-2026`)

### 4.1 Investments — Critical (P0)

| # | Issue | File | Line |
|---|-------|------|------|
| IN-1 | **Tab keyboard navigation missing** — `role="tab"` buttons have no `onKeyDown` for ArrowLeft/Right/Home/End; WCAG 2.1 Level A failure | `src/components/investments/StockResearch.tsx` | 170–183 |
| IN-2 | **`AllocationChart` D3 donut has no screen reader fallback** — no hidden `<ul>` or `aria-live` for holdings data | `src/components/investments/AllocationChart.tsx` | 40–41 |

### 4.2 Investments — High Priority (P1)

| # | Issue | File | Line |
|---|-------|------|------|
| IN-3 | Deep-link state resets on hard refresh — `initialState` from server is never updated after client-side navigation; back button loses research context | `src/app/investments/investments-state.ts` | 78–87 |
| IN-4 | Chart tooltip only on `mouseenter`; no `onFocus`, `onKeyDown`, or `touchstart` handler | `src/components/investments/AllocationChart.tsx` | 70–89 |
| IN-5 | Sparkline `<Sparkline>` SVG has no `aria-label` or data table fallback | `src/components/investments/StockCard.tsx` | 75–79 |
| IN-6 | Quote cache age not surfaced to user — 5-min-old prices show with no "last updated X min ago" label | `src/hooks/useInvestments.ts` | 16, 262–270 |

### 4.3 Investments — Polish (P2)

| # | Issue | File | Line |
|---|-------|------|------|
| IN-7 | Comparison table winner highlight uses color only (no icon or label); may fail color-blind users | `src/components/investments/ComparisonMetricTable.tsx` | 64–69 |
| IN-8 | Loading skeleton uses hardcoded `bg-[var(--neutral-200)]`; appears off in dark mode | `src/components/investments/PortfolioSummary.tsx` | 50–51 |
| IN-9 | Edit/delete buttons on `StockCard` hidden behind hover — no touch equivalent; always show on mobile | `src/components/investments/StockCard.tsx` | 80–160 |
| IN-10 | `staggerChildren: 0` in reduced-motion config may still cause perceptible layout shift for vestibular-sensitive users | `src/components/investments/animations.ts` | 30–56 |

### 4.4 March Madness — Critical (P0)

| # | Issue | File | Line |
|---|-------|------|------|
| MM-1 | **Tab keyboard navigation missing (three TabBar instances)** — same WCAG 3.2.1 failure as IN-1 | `src/app/march-madness-2026/march-madness-client.tsx` | 228–259, 1047–1079 |
| MM-2 | **Rankings table `min-w-[920px]` with unclear overflow** — 16-column table may lack `overflow-x-auto` parent; janky scroll on mobile | `src/app/march-madness-2026/march-madness-client.tsx` | 286–364 |
| MM-3 | **Scroll anchors offset by sticky header** — `scroll-mt-24` (96px) may not match actual nav height | `src/app/march-madness-2026/march-madness-client.tsx` | 944, 1046 |

### 4.5 March Madness — High Priority (P1)

| # | Issue | File | Line |
|---|-------|------|------|
| MM-4 | `text-emerald-300`/`text-rose-300` seeding tags on dark background may fall below 4.5:1 WCAG AA; color-only encoding for colorblind users | `src/app/march-madness-2026/march-madness-client.tsx` | 378–401 |
| MM-5 | Picks expansion state is local `useState` — not URL-synced; shared link lands with everything collapsed | `src/app/march-madness-2026/march-madness-client.tsx` | 670–710 |
| MM-6 | Timezone penalty percentages lack "Penalty:" prefix label — color + number only, meaning is ambiguous | `src/app/march-madness-2026/march-madness-client.tsx` | 500–503 |

### 4.6 March Madness — Polish (P2)

| # | Issue | File | Line |
|---|-------|------|------|
| MM-7 | `StatCell` amber vs green highlight logic unclear to reader without code context; add `title` or `aria-label` | `src/app/march-madness-2026/march-madness-client.tsx` | 261–277 |
| MM-8 | Injury cards lack severity badge ("Out", "Questionable", "Probable") — status buried in text note | `src/app/march-madness-2026/march-madness-client.tsx` | 411–432 |

---

## 5. Experimental Dashboards

### 5.1 Cross-Dashboard Issues (Fix Once, Apply Everywhere)

These patterns repeat across Formula 1, Premier League, La Liga, Polling, News Pulse, and SpaceX. Fixing at the source prevents re-work on each dashboard.

| # | Issue | Severity | Affected Routes |
|---|-------|----------|----------------|
| DB-1 | **Duplicate `MetricCard` implementations** — F1 defines inline `MetricCard` (`article.home-card p-5`) while shared `src/components/football/MetricCard.tsx` uses `p-4`; baseline spacing diverges | P0 | F1, PL, La Liga |
| DB-2 | **Sticky sidebar top offsets inconsistent** — PL/La Liga use `md:top-24`, SpaceX uses `xl:top-24`, Polling uses `lg:top-24`; some may collide with site nav | P0 | PL, La Liga, Polling, SpaceX |
| DB-3 | **Table `overflow-x-auto` with no scroll affordance** — no fade gradient or scrollbar hint; users don't discover horizontal scroll on narrow viewports | P1 | F1, PL, La Liga, News Pulse |
| DB-4 | **Heading hierarchy broken** — kicker `<p class="home-kicker">` used where `<h3>` or `<span>` belongs; jumps from h1 → h2 → p | P1 | All dashboards |
| DB-5 | **Tabs missing `aria-controls`** — `role="tab"` + `aria-selected` present, but no `aria-controls` linking tab to its panel; screen readers can't infer relationship | P1 | PL, News Pulse, Polling |
| DB-6 | **Date/time formatters duplicated per dashboard** — consolidate to shared `src/lib/date-formatters.ts`; no timezone context shown | P2 | All dashboards |
| DB-7 | **Crest images lack error boundaries and lazy loading** — `CrestAvatar` flashes blank on broken URL; not using `next/image`; no `loading="lazy"` or `srcset` | P1 | PL, La Liga |
| DB-8 | **Reduced-motion gaps** — F1 has no `useReducedMotion()` check despite panel transitions; News Pulse `fadeIn` variant causes FOUC when JS is delayed | P2 | F1, News Pulse |

### 5.2 Formula 1 (`/formula-1`) — `src/app/formula-1/formula-1-client.tsx`

| # | Issue | Severity | Line |
|---|-------|----------|------|
| F1-1 | Inline `MetricCard` inside `<article class="home-card">` may double-apply border/shadow if `home-card` has defaults | P0 | 168 |
| F1-2 | `MeetingStrip` `overflow-x-auto` with no scroll indicator; buttons (min-w-[220px]) hide off-screen on landscape mobile | P1 | 522 |
| F1-3 | Gradient background in meeting detail panels uses inline styles; doesn't adapt to dark mode or prefers-color-scheme | P1 | 687 |
| F1-4 | `formatDelta()` doesn't localize decimal separators for non-US locales | P2 | 83 |

### 5.3 Premier League (`/premier-league`) — `src/app/premier-league/premier-league-client.tsx`

| # | Issue | Severity | Line |
|---|-------|----------|------|
| PL-1 | Standings table row buttons lack visible focus rings; borders too thin | P0 | 407, 443 |
| PL-2 | Column hiding (PPG hidden at md, Record at sm) has no visual hint that columns exist | P1 | 406 |
| PL-3 | `activeDetailTab` not URL-synced; refresh loses active team/tab selection | P1 | 316–317 |
| PL-4 | Empty/error states inconsistent — some use `StatusPanel`, others raw prose | P1 | 534–548 |
| PL-5 | Zone pill styles (`getZonePillStyle`) duplicated between PL and La Liga; extract to shared utility | P2 | 73–82, 94–102 |

### 5.4 La Liga (`/la-liga`) — `src/app/la-liga/la-liga-client.tsx`

| # | Issue | Severity | Line |
|---|-------|----------|------|
| LL-1 | Table `overflow-x-auto` with no scroll affordance (same as DB-3) | P0 | 353 |
| LL-2 | `handleClubChange()` doesn't validate that club ID exists; invalid IDs silently fail | P1 | 189 |
| LL-3 | `CrestAvatar` call doesn't validate `crestByClubId.get()` — can pass `undefined` | P1 | 396 |
| LL-4 | `getClubStoryline()` and `getClubPressurePoints()` are copy-paste from PL client; extract to shared module | P2 | 841–872 |

### 5.5 Polling Aggregator (`/polling-aggregator`) — `src/app/polling-aggregator/polling-aggregator-client.tsx`

| # | Issue | Severity | Line |
|---|-------|----------|------|
| PA-1 | TrendChart SVG has no tooltip or `aria-label` for data points; Y-axis labels unreadable on narrow screens | P0 | 62–145 |
| PA-2 | `<tr onClick>` with nested `<button stopPropagation>` — nested interactive elements violate HTML semantics | P1 | 182–223 |
| PA-3 | `aria-live="polite"` on RaceSidebar but state changes don't trigger announcements; dynamic updates silent to screen readers | P1 | 234 |
| PA-4 | `ApprovalPollsTable` and `GenericBallotPollsTable` are identical except column labels — merge into single typed component | P1 | 313–364 |

### 5.6 News Pulse (`/news-pulse`) — `src/app/news-pulse/news-pulse-client.tsx`

| # | Issue | Severity | Line |
|---|-------|----------|------|
| NP-1 | `/api/news-pulse` fetch has no timeout — page stays in loading state indefinitely if feed hangs | P0 | 206 |
| NP-2 | `CoverageView` table `min-w-[920px]` with no scroll affordance on iPad | P0 | 574–705 |
| NP-3 | `SourceDropdown` Escape key may not close consistently; no focus trap | P1 | 261–307 |
| NP-4 | HeadlinesView renders up to 60 articles in DOM with no pagination or virtualisation | P1 | 450 |
| NP-5 | Sentiment and readability scores recalculated on every render; no `useMemo` | P2 | 738–756 |

### 5.7 SpaceX Mission Control (`/spacex-mission-control`) — `src/app/spacex-mission-control/spacex-mission-control-client.tsx`

| # | Issue | Severity | Line |
|---|-------|----------|------|
| SX-1 | Detail panel `xl:sticky xl:top-24` hard-coded 96px offset; misaligns if hero section padding differs | P0 | 511, 518–522 |
| SX-2 | `setInterval` live refresh with no exponential backoff; hammers `/api/spacex/*` with multiple open tabs | P1 | 298–323 |
| SX-3 | API payload not schema-validated; missing fields crash downstream renders | P1 | 143–166 |
| SX-4 | `color-mix()` gradient in hero banner has no fallback for older browsers | P2 | 410 |

### 5.8 Shared Football Components (`src/components/football/`)

| # | Issue | File | Severity | Line |
|---|-------|------|----------|------|
| FC-1 | `FixtureCard` date formatter assumes UTC; no timezone context shown | `FixtureCard.tsx` | P1 | 24–26 |
| FC-2 | `CrestAvatar` has no error boundary; broken image URL renders blank with no fallback to initials on load | `CrestAvatar.tsx` | P1 | 30 |
| FC-3 | `MetricCard` has no `variant` prop — F1's inline version allows custom padding that the shared component doesn't support | `MetricCard.tsx` | P2 | — |

---

## 6. Fantasy Football

### 6.1 Critical (P0)

| # | Issue | File | Line |
|---|-------|------|------|
| FF-1 | **Mobile grid overflow** — `sm:grid-cols-[72px_minmax(0,1.55fr)_110px_140px_140px]` leaves player name < 20px on viewports < 350px; truncation with no tooltip | `fantasy-football-client.tsx` | 508 |
| FF-2 | **No dark mode CSS** — all color-mix values use `--home-*` tokens but no `dark:` prefixes; dark mode renders broken | `fantasy-football-client.tsx` | throughout |
| FF-3 | **Undo button not visible until after first pick** — user never discovers undo exists; always show it (disabled state when no picks) | `DraftBoard.tsx`, `DraftControls` | 59 |
| FF-4 | **Broken image fallback in `EnhancedPlayerCard`** — `fallbackSrc` path construction via regex may never match real files; blank space shown on 404 | `EnhancedPlayerCard.tsx` | 105–111 |
| FF-5 | **Draft setup has no submit feedback** — `startDraft()` fires synchronously with no loading state, success toast, or error boundary | `DraftSetup.tsx` | 214–226 |

### 6.2 High Priority (P1)

| # | Issue | File | Line |
|---|-------|------|------|
| FF-6 | Scoring pill buttons use `aria-pressed` but are not in a `<fieldset role="radiogroup">`; mutual exclusion not communicated to assistive tech | `fantasy-football-client.tsx` | 387 |
| FF-7 | Main page has two h1s and no `<main>` landmark — only a `<section aria-label>`; broken document outline | `fantasy-football-client.tsx` | 283–294 |
| FF-8 | Draft tracker has no `<main>` or `<aside role="complementary">` landmarks | `draft-tracker-client.tsx` | — |
| FF-9 | Search input cleared on position filter change but search text stays in input; implies data was deleted | `DraftBoard.tsx` | 155–156 |
| FF-10 | D3 tier charts have no keyboard navigation; `ZoomIn`/`ZoomOut` icons are visual-only with no keyboard shortcut | `TierChartEnhanced.tsx` | 1–100 |
| FF-11 | Tier chart tooltip is hover-only; touch/mobile draft users cannot inspect player details | `RBTiersChart.tsx` | — |
| FF-12 | "No players match filter" shown for both empty-search and fully-drafted position — ambiguous empty state | `DraftBoard.tsx` | 257–269 |
| FF-13 | Loading skeleton height (104px) shorter than actual player card (112px); causes layout shift on load | `fantasy-football-client.tsx` | 467–473 |
| FF-14 | RB Tiers chart fixed `width={900} height={600}` — ignores viewport; distorted or horizontally scrolled on mobile | `rb-tiers-client.tsx` | 94–99 |
| FF-15 | RB Tiers uses hardcoded colors (`#FF6B35`, `cyan-400`) inconsistent with site editorial palette | `rb-tiers-client.tsx` | 29, 48, 62, 76 |

### 6.3 Polish (P2)

| # | Issue | File | Line |
|---|-------|------|------|
| FF-16 | Filter state (selected position) not URL-persisted; page reload resets to "ALL" mid-draft | `DraftBoard.tsx` | 154 |
| FF-17 | CSV/JSON draft export happens silently with no toast or download feedback | `useDraftState.ts` | 284–320 |
| FF-18 | Undo history not persisted to localStorage; lost on page reload | `useDraftState.ts` | 87 |
| FF-19 | `draftPlayer()` maps over all teams on every pick — O(n²) for 200+ picks; use Map or indexed storage | `useDraftState.ts` | 184–200 |
| FF-20 | Team name input in setup accepts empty string or 100+ chars with no min/max validation | `DraftSetup.tsx` | 78–89 |
| FF-21 | `getPositionTone()`/`getPositionColor()` duplicated in three files; extract to shared utility | multiple | — |
| FF-22 | Rank column uses proportional font; expert range column uses serif; both should use `tabular-nums` | `fantasy-football-client.tsx` | 516, 541 |

---

## 7. Fintech Tools & MBA Internship Tracker

### 7.1 Budget Planner (`/fintech-tools/budget-planner`) — Critical (P0)

| # | Issue | File | Line |
|---|-------|------|------|
| BP-1 | No inline validation feedback on blur — no `aria-invalid` or `aria-describedby`; category blank-blur silently sets "Untitled" | `budget-planner-client.tsx` | 154–172, 368–369 |
| BP-2 | Delete-category button disabled when expenses exist, but disabled state opacity (55%) is insufficient contrast; help text appears only after failure | `budget-planner-client.tsx` | 393–401, 452–456 |
| BP-3 | Numeric inputs (`bg-transparent`) may show browser default background in dark mode; no explicit `focus-ring` color | `budget-planner-client.tsx` | 294–322, 550–569 |
| BP-4 | "Add expense" submit button not sticky on mobile — scrolls off screen; user loses CTA while filling form | `budget-planner-client.tsx` | 192–193 |

### 7.2 Budget Planner — High Priority (P1)

| # | Issue | File | Line |
|---|-------|------|------|
| BP-5 | Spend-vs-budget bar lacks `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` | `budget-planner-client.tsx` | 440–451 |
| BP-6 | Currency formatting uses `minimumFractionDigits: 0` — creates jarring switch when user enters cents | `budget-planner-client.tsx` | 34–39 |
| BP-7 | Empty-state copy doesn't follow `WRITING_VOICE.md` — passive, third-person voice | `budget-planner-client.tsx` | 625–627 |

### 7.3 Budget Planner — Polish (P2)

| # | Issue | File | Line |
|---|-------|------|------|
| BP-8 | Expense date displays raw ISO 8601 (`2026-04-15`); should format as relative or human-readable | `budget-planner-client.tsx` | 645 |
| BP-9 | Form labels use uppercase `text-[11px]` mono without `clamp()`; shrinks further on < 375px | `budget-planner-client.tsx` | 295–297 |

### 7.4 Interchange IQ (`/fintech-tools/interchange-iq`) — Critical (P0)

| # | Issue | File | Line |
|---|-------|------|------|
| IQ-1 | Custom range slider has no `aria-valuenow`, `aria-valuemin`, `aria-valuemax`; focus ring may be hidden by custom track styling | `interchange-iq-client.tsx` | 169–180 |
| IQ-2 | Card mix info toggle button has no `aria-expanded`/`aria-pressed`; revealed panel not an ARIA live region | `interchange-iq-client.tsx` | 286–293 |

### 7.5 Interchange IQ — High Priority (P1)

| # | Issue | File | Line |
|---|-------|------|------|
| IQ-3 | `breakevenTicket = fixedDiff / rateDiff` — no guard when both are 0; result renders null with no explanation | `interchange-iq-client.tsx` | 225 |
| IQ-4 | Processor rates dated "representative 2024 values" with no source link or last-updated date in UI | `interchange-iq-client.tsx` | 14–48 |
| IQ-5 | Savings insight banner divs have no `role="alert"` or `aria-live`; dynamic content not announced | `interchange-iq-client.tsx` | 368–423 |

### 7.6 Interchange IQ — Polish (P2)

| # | Issue | File | Line |
|---|-------|------|------|
| IQ-6 | Comparison bars show no hover tooltip; user must track across disconnected label + bar + number columns | `interchange-iq-client.tsx` | 485–502 |
| IQ-7 | "Cheapest" badge uses `color-mix(--home-haze, 14%)` — may fail WCAG AA contrast on light paper | `interchange-iq-client.tsx` | 456–467 |

### 7.7 MBA Internship Tracker — Critical (P0)

| # | Issue | File | Line |
|---|-------|------|------|
| MB-1 | Search clear button (X) doesn't refocus input after clearing — user must click input again to continue | `mba-jobs-client.tsx` | 1452–1462 |
| MB-2 | Email digest modal has no focus trap, no Esc binding, no `aria-labelledby` linking title to `role="dialog"` | `mba-jobs-client.tsx` | 837–906 |
| MB-3 | Dynamic search results not announced — no `aria-live` or `role="status"` wrapper; "No roles found" empty state silent to screen readers | `mba-jobs-client.tsx` | 1766–1783 |

### 7.8 MBA Internship Tracker — High Priority (P1)

| # | Issue | File | Line |
|---|-------|------|------|
| MB-4 | Email dialog submit disabled on missing `@` but shows no error message — user sees disabled button with no explanation | `mba-jobs-client.tsx` | 871–884 |
| MB-5 | Sort dropdown: Radix closes on selection but focus may not return to trigger button | `mba-jobs-client.tsx` | 695–735 |
| MB-6 | Several UI strings use passive/third-person voice against `WRITING_VOICE.md` — "Results shown are partial," "Search the board, narrow by role..." | `mba-jobs-client.tsx` | 1295, 1325, 1410 |
| MB-7 | Location filter free-text accepts "Los Angeles" but normalization uses "LA"; zero results with no hint | `mba-jobs-client.tsx` | 1465–1498 |
| MB-8 | Email digest endpoint has no client-side throttle; rapid button clicks send multiple requests | `mba-jobs-client.tsx` | 339–361 |

### 7.9 MBA Internship Tracker — Polish (P2)

| # | Issue | File | Line |
|---|-------|------|------|
| MB-9 | Skeleton loader grid uses `aria-hidden="true"` but no `role="status"` or loading announcement | `mba-jobs-client.tsx` | 646–685 |
| MB-10 | Relative time ("2 hours ago") loses precision; show exact time on hover (`title="Posted 10:30 AM"`) | `mba-jobs-client.tsx` | 90–101 |
| MB-11 | Notification permission badge uses 8% color-mix; may fail WCAG AA contrast; needs explicit test | `mba-jobs-client.tsx` | 746–781 |

---

## 8. Master Priority Table

### P0 — Fix Before Anything Ships

| ID | Summary | Surface |
|----|---------|---------|
| AW-1 | Mobile menu overlay z-index broken | Shell |
| AW-2 | Skip link invisible in dark mode | Shell |
| AW-3 | Global focus outline removed, incomplete replacement | Shell |
| WR-1 | Wrong prose class (`prose-home` → `prose-writing`) | Writing |
| IN-1 | Tab keyboard nav missing — Investments | Investments |
| IN-2 | D3 AllocationChart no screen reader fallback | Investments |
| MM-1 | Tab keyboard nav missing — March Madness (3 instances) | March Madness |
| MM-2 | Rankings table overflow unclear on mobile | March Madness |
| DB-1 | Duplicate MetricCard implementations | Dashboards |
| DB-2 | Sticky sidebar top offsets inconsistent across dashboards | Dashboards |
| PA-1 | Polling TrendChart SVG no tooltip/aria-label | Polling |
| NP-1 | News Pulse fetch has no timeout | News Pulse |
| NP-2 | News CoverageView table `min-w-[920px]` no scroll affordance | News Pulse |
| SX-1 | SpaceX sticky offset hard-coded | SpaceX |
| PL-1 | PL standings table focus rings missing | Premier League |
| LL-1 | La Liga table no scroll affordance | La Liga |
| FF-1 | Fantasy mobile grid overflow; name < 20px | Fantasy |
| FF-2 | Fantasy main pages have no dark mode CSS | Fantasy |
| FF-3 | Undo button hidden until first pick | Fantasy |
| FF-4 | Player image broken fallback | Fantasy |
| FF-5 | Draft setup no submit feedback | Fantasy |
| BP-1 | Budget Planner — no input validation feedback | Fintech |
| BP-2 | Category delete disabled-state contrast too low | Fintech |
| BP-3 | Numeric inputs no dark mode / focus ring | Fintech |
| BP-4 | Add Expense CTA not sticky on mobile | Fintech |
| IQ-1 | Interchange IQ range slider no ARIA | Fintech |
| IQ-2 | Info toggle no `aria-expanded` | Fintech |
| MB-1 | MBA Tracker search clear doesn't refocus | MBA |
| MB-2 | Email modal no focus trap or Esc | MBA |
| MB-3 | Search results not announced via aria-live | MBA |

### P1 — Fix in Next Release Cycle

All issues tagged P1 in sections 1–7 above. Roughly 55 issues across: design system consolidation, breakpoint gaps, focus management, URL state sync, ARIA control patterns, dark mode parity, copy voice.

### P2 — Dedicated Polish Sprint

All issues tagged P2. Roughly 60 issues covering reduced-motion, inline style extraction, semantic markup improvements, consistency, date formatting, performance smells.

---

## 9. Suggested Work Streams

Rather than fixing issues one by one, group them into parallel tracks:

| Track | Owner Focus | What to Tackle |
|-------|-------------|----------------|
| **Shell & Design System** | AW-1 → AW-15; deprecate `ui/button.tsx`; unify `--home-*` tokens | Foundation — unlocks other fixes |
| **Accessibility Pass** | All WCAG A/AA failures: focus rings, ARIA roles/controls, keyboard nav, live regions, skip link | Run axe or Lighthouse after |
| **Writing Surface** | WR-1 (prose class), WR-3 (dark mode prose), WR-13 (syntax highlight), WR-2 (AuthorBio) | Small surface, high impact |
| **Fantasy Football** | FF-1 to FF-5 (P0s), then dark mode, draft UX, chart keyboard support | Complex but isolated |
| **Dashboards Consistency** | DB-1 → DB-8, then per-dashboard P1s | Extract shared utilities first |
| **Fintech & MBA** | BP + IQ P0s, MB modal/focus fixes, then P1 copy/voice pass | Form-heavy; test on mobile |
| **Investments & March Madness** | IN-1/IN-2/MM-1 (keyboard nav), then state/deep-link fixes | WCAG failures first |




