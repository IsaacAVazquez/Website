> [!IMPORTANT]
> Historical reference only. This file captures an older roadmap and is not a current source of truth by itself. Use `AGENTS.md`, `CLAUDE.md`, `README.md`, `PAGES.md`, `COMPONENTS.md`, `ARCHITECTURE.md`, `API.md`, and `docs/README.md` for current documentation.

# Feature Roadmap

Last updated: 2026-11-02. The roadmap was written on 2026-03-03, and the notes dated 2026-11-02 record what the code held that day.

## Completed

- ~~P1-A: Historical Price Chart~~, done (`src/components/investments/PriceChartPanel.tsx`, a D3 area chart over volume bars)
- ~~P3-A: Fix OptimizedImage~~, done (dynamic class, undefined bg, overlay divs, reduced motion). As of 2026-11-02 the component no longer exists, since `src/components/ui/OptimizedImage.tsx` was removed as dead code on 2026-08-11 (2dc8ff7c7).
- ~~P3-B: Search Page Design System~~, done (all slate-* → CSS variables)
- ~~Football Dashboards: Premier League refactored to snapshot-backed data~~, done (`src/data/premierLeagueSnapshot.json`, `src/components/football/`)
- ~~Football Dashboards: La Liga dashboard added~~, done (`/la-liga`, `src/data/laLigaSnapshot.json`)

---

## Priority 1 — Portfolio Analytics

### P1-A: Portfolio Performance Chart
**Status:** Shipped in another form on 2026-04-26 | **Effort:** Medium (4–6 hrs)
Show how total portfolio value has changed over time. Use existing `price.json` for each
holding to reconstruct historical daily values (shares × historical close). Render as a D3
line chart on the Portfolio tab with 1M / 3M / 6M / 1Y / All range buttons. Annotate
buy/sell events as dots on the line.
- **Data available:** `data/investments-raw/{symbol}/price.json` (daily OHLCV since 1994)
- **Files:** new `src/components/investments/PortfolioChartPanel.tsx`, edit `investments-client.tsx`

As of 2026-11-02, `src/components/investments/PortfolioHeroCard.tsx` (added on 2026-04-26 in 2b8a6ba69) charts total portfolio value with 1W, 1M, 3M, 1Y, and ALL ranges. It reads the daily totals that `src/hooks/useInvestments.ts` saves in localStorage under `portfolio_snapshots`, up to 365 of them, each time the page prices the holdings, so it does not rebuild history from daily closes or mark buys and sells. `PortfolioChartPanel.tsx` was never created. The page cannot read the raw `data/investments-raw/` files, which are gitignored script input, and each deployed `public/data/investments/{SYMBOL}/snapshot.json` keeps only the last 252 daily price rows (`SNAPSHOT_PRICE_LIMIT` in `src/lib/investmentSnapshot.ts`).

### P1-B: Sector & Industry Allocation
**Status:** Not started | **Effort:** Small (2–3 hrs)
Add a second view to the AllocationChart — toggle between "By Stock" (existing pie) and
"By Sector" (new pie). Sector data comes from `info.json` already fetched. Shows how
concentrated the portfolio is in Tech vs Financials vs Consumer, etc.
- **Data available:** `info.json` → `sector` field per symbol
- **Files:** edit `src/components/investments/AllocationChart.tsx`

As of 2026-11-02 this is still not built, and `AllocationChart.tsx` draws one donut by holding. The sector reaches the page as `sections.info.sector` in each symbol's `public/data/investments/{SYMBOL}/snapshot.json`, since the page never reads a separate `info.json`.

### P1-C: Portfolio Risk Dashboard
**Status:** Partly shipped on 2026-04-26 | **Effort:** Medium (3–5 hrs)
Add a risk metrics row to PortfolioSummary: portfolio beta (weighted avg of holdings),
largest single-position concentration %, and a simple diversification score. Beta per stock
already in `beta.json`.
- **Data available:** `data/investments-raw/{symbol}/beta.json` → `beta5y`
- **Files:** edit `src/components/investments/PortfolioSummary.tsx`

As of 2026-11-02, `src/components/investments/PortfolioStatsGrid.tsx`, which `PortfolioSummary.tsx` renders (added on 2026-04-26 in 2b8a6ba69), shows the top holding with its share of the book and a top-three concentration. Portfolio beta and a diversification score are not built. Beta reaches the page as `sections.beta.beta5y` in each symbol's `public/data/investments/{SYMBOL}/snapshot.json`.

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

As of 2026-11-02 this is not built, and two of its premises are gone. The DCF section (`dcf.json`, `DCFPanel.tsx`, and `src/lib/investmentDcf.ts`) was removed on 2026-07-20 (1c5e18a93), and `StockResearch.tsx` was removed on 2026-08-22 (21b0e18ce). Research renders through `src/components/investments/ResearchWorkspace.tsx`, whose tabs are Overview, Financials, Growth, Valuation, Industry, Chart, and Compare. The closest code is the Compare tab (`ComparisonTab.tsx`), which scores two stocks on a 0 to 100 scale for valuation, growth, profitability, and safety in its radar chart.

### P2-B: Historical Metric Trends
**Status:** Not started | **Effort:** Medium (3–4 hrs)
Add a "Trends" tab to StockResearch showing how key metrics have changed over time —
P/E ratio, EPS, revenue, and gross margin plotted as D3 line charts. All data is already
in `fundamentals.json` and `margins.json` as quarterly arrays going back years.
- **Data available:** `fundamentals.json` (ttmEps, ttmPe), `margins.json`, `growth.json`
- **Files:** new `src/components/investments/MetricTrendsPanel.tsx`, edit `StockResearch.tsx`

As of 2026-11-02 this is not built. `StockResearch.tsx` is gone (removed on 2026-08-22 in 21b0e18ce), and `ResearchWorkspace.tsx` has no Trends tab. The page reads the `fundamentals`, `margins`, and `growth` sections from each symbol's `public/data/investments/{SYMBOL}/snapshot.json` instead of separate JSON files, and those sections hold only the latest reading of each series, because `transformSection` in `src/lib/investmentTransforms.ts` keeps the last value when the snapshot is built. The quarterly arrays the plan counted on stay in the gitignored raw files. For most symbols the snapshot's `income_statement` section does carry revenue, gross profit, and EPS by quarter.

---

## Priority 3 — UX & Utility

### P3-A: Watchlist
**Status:** Not started | **Effort:** Small (2–3 hrs)
A third top-level tab ("Watchlist") alongside My Portfolio and Research. Track symbols
without entering shares/cost — just shows current price, daily change, and a quick-research
button. Persisted in localStorage. Reuses existing quote-fetching and StockSearch infrastructure.
- **Files:** new `src/components/investments/Watchlist.tsx`, edit `investments-client.tsx`

As of 2026-11-02 this is not built, and nothing under `src/components/investments/` or `src/app/investments/` mentions a watchlist. The page's top-level tabs are Portfolio, Research, and Retirement (`TASKS` in `src/components/investments/InvestmentsDashboard.tsx`), so a watchlist would now be a fourth.

### P3-B: Portfolio Export (CSV)
**Status:** Shipped on 2026-07-20 | **Effort:** Tiny (< 1 hr)
Add an "Export CSV" button to PortfolioTracker that downloads holdings as a CSV:
symbol, shares, avg cost, current price, current value, gain/loss $, gain/loss %.
Pure client-side (Blob + URL.createObjectURL), no API needed.
- **Files:** edit `src/components/investments/PortfolioTracker.tsx`

As of 2026-11-02 this shipped as the Export CSV button in `src/components/investments/HoldingsTable.tsx` (8b390ed2d, 2026-07-20), since `PortfolioTracker.tsx` had been removed on 2026-05-26 (55c8f44a9). It saves `portfolio-holdings-<date>.csv` with symbol, name, shares, average cost, current price, current value, gain or loss, and gain or loss percent, built in the browser through `downloadFile` in `src/lib/downloadFile.ts`.
