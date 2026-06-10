> [!IMPORTANT]
> Historical reference only. This file captures an older roadmap and is not a current source of truth by itself. Use `AGENTS.md`, `CLAUDE.md`, `README.md`, `PAGES.md`, `COMPONENTS.md`, `ARCHITECTURE.md`, `API.md`, and `docs/README.md` for current documentation.

# Feature Roadmap

Last updated: 2026-04-05

## Completed

- ~~P1-A: Historical Price Chart~~ — Done (PriceChartPanel.tsx, D3 candlestick + volume)
- ~~P3-A: Fix OptimizedImage~~ — Done (dynamic class, undefined bg, overlay divs, reduced motion)
- ~~P3-B: Search Page Design System~~ — Done (all slate-* → CSS variables)
- ~~Football Dashboards: Premier League refactored to snapshot-backed data~~ — Done (`src/data/premierLeagueSnapshot.ts`, `src/components/football/`)
- ~~Football Dashboards: La Liga dashboard added~~ — Done (`/la-liga`, `src/data/laLigaSnapshot.ts`)

---

## Priority 1 — Portfolio Analytics

### P1-A: Portfolio Performance Chart
**Status:** Not started | **Effort:** Medium (4–6 hrs)
Show how total portfolio value has changed over time. Use existing `price.json` for each
holding to reconstruct historical daily values (shares × historical close). Render as a D3
line chart on the Portfolio tab with 1M / 3M / 6M / 1Y / All range buttons. Annotate
buy/sell events as dots on the line.
- **Data available:** `data/investments-raw/{symbol}/price.json` (daily OHLCV since 1994)
- **Files:** new `src/components/investments/PortfolioChartPanel.tsx`, edit `investments-client.tsx`

### P1-B: Sector & Industry Allocation
**Status:** Not started | **Effort:** Small (2–3 hrs)
Add a second view to the AllocationChart — toggle between "By Stock" (existing pie) and
"By Sector" (new pie). Sector data comes from `info.json` already fetched. Shows how
concentrated the portfolio is in Tech vs Financials vs Consumer, etc.
- **Data available:** `info.json` → `sector` field per symbol
- **Files:** edit `src/components/investments/AllocationChart.tsx`

### P1-C: Portfolio Risk Dashboard
**Status:** Not started | **Effort:** Medium (3–5 hrs)
Add a risk metrics row to PortfolioSummary: portfolio beta (weighted avg of holdings),
largest single-position concentration %, and a simple diversification score. Beta per stock
already in `beta.json`.
- **Data available:** `data/investments-raw/{symbol}/beta.json` → `beta5y`
- **Files:** edit `src/components/investments/PortfolioSummary.tsx`

---

## Priority 2 — Research Enhancements

### P2-A: Quantitative Stock Score
**Status:** Not started | **Effort:** Medium (3–4 hrs)
Synthesize existing panel data into a 0–100 composite score shown on the Overview tab.
Four sub-scores (25 pts each): Valuation (inverse P/E, P/S vs industry), Growth (revenue +
EPS YoY), Profitability (ROE, ROIC, margins), DCF Upside (upside % from dcf.json). Show
score badge + breakdown bar chart.
- **Data available:** `fundamentals.json`, `growth.json`, `profitability.json`, `dcf.json`, `industry.json`
- **Files:** new `src/components/investments/StockScorePanel.tsx`, edit `StockResearch.tsx`

### P2-B: Historical Metric Trends
**Status:** Not started | **Effort:** Medium (3–4 hrs)
Add a "Trends" tab to StockResearch showing how key metrics have changed over time —
P/E ratio, EPS, revenue, and gross margin plotted as D3 line charts. All data is already
in `fundamentals.json` and `margins.json` as quarterly arrays going back years.
- **Data available:** `fundamentals.json` (ttmEps, ttmPe), `margins.json`, `growth.json`
- **Files:** new `src/components/investments/MetricTrendsPanel.tsx`, edit `StockResearch.tsx`

---

## Priority 3 — UX & Utility

### P3-A: Watchlist
**Status:** Not started | **Effort:** Small (2–3 hrs)
A third top-level tab ("Watchlist") alongside My Portfolio and Research. Track symbols
without entering shares/cost — just shows current price, daily change, and a quick-research
button. Persisted in localStorage. Reuses existing quote-fetching and StockSearch infrastructure.
- **Files:** new `src/components/investments/Watchlist.tsx`, edit `investments-client.tsx`

### P3-B: Portfolio Export (CSV)
**Status:** Not started | **Effort:** Tiny (< 1 hr)
Add an "Export CSV" button to PortfolioTracker that downloads holdings as a CSV:
symbol, shares, avg cost, current price, current value, gain/loss $, gain/loss %.
Pure client-side (Blob + URL.createObjectURL), no API needed.
- **Files:** edit `src/components/investments/PortfolioTracker.tsx`
