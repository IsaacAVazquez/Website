# Feature Roadmap

Last updated: 2026-03-03

## Priority 1 — Investments Platform

### P1-A: Historical Price Chart
**Status:** Not started | **Effort:** Medium (3–5 hrs)
Add a "Chart" tab (9th tab) to StockResearch showing a D3 line chart of close price + volume bars for the selected stock. Filter controls: 1M / 3M / 6M / 1Y. Data from pre-fetched `price.json` (client-side slice of last 252 entries). No API changes.
→ See `docs/plans/01-price-chart.md`

## Priority 2 — Navigation & UX

### P2-A: Re-enable Resume + Writing in Nav
**Status:** Not started | **Effort:** Tiny (< 30 min)
Resume link is commented out in `navlinks.tsx`. Uncomment it and optionally add Writing link.
→ See `docs/plans/02-nav-fixes.md`

## Priority 3 — Technical Quality

### P3-A: Fix OptimizedImage
**Status:** Not started | **Effort:** Small (1–2 hrs)
Three bugs: (1) `object-${objectFit}` is a dynamic Tailwind class that won't purge correctly — replace with a lookup map; (2) `bg-terminal-border` is an undefined class — replace with `bg-[var(--neutral-200)]`; (3) cyberpunk overlay divs don't match the design system — remove them; (4) Framer Motion fade missing `useReducedMotion` check.
→ See `docs/plans/03-image-fixes.md`

### P3-B: Search Page Design System
**Status:** Not started | **Effort:** Tiny (30 min)
`src/app/search/page.tsx` uses ~8 hardcoded `slate-*` Tailwind classes instead of CSS variables. Replace with `var(--text-*)`, `var(--border-primary)`, `var(--surface-*)`.
→ See `docs/plans/04-search-cleanup.md`
