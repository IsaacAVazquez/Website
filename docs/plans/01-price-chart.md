> [!IMPORTANT]
> Historical reference only. This file captures an older implementation plan and is not a current source of truth by itself. Use `AGENT.md`, `README.md`, `API.md`, `ARCHITECTURE.md`, and `docs/README.md` for current documentation.

# Historical Price Chart — Implementation Plan

## Context

The investments Research section currently has no time-series price visualization. The stock price history data exists in `public/data/investments/[symbol]/price.json` — approximately 10,000 daily entries per stock going back to 1994 (`report_date`, `open`, `close`, `high`, `low`, `volume`). This plan adds a "Chart" tab (9th tab) to `StockResearch` with a D3 line chart for close price and a volume bar chart below, with time-range filter buttons (1M / 3M / 6M / 1Y).

---

## Design

**Tab position:** 9th tab in StockResearch, label "Chart"
**Layout (top to bottom):**
1. **Time-range buttons** — 1M / 3M / 6M / 1Y (default: 1Y)
2. **Close price line chart** — D3 SVG area/line, responsive via parent width, x-axis = dates, y-axis = price in USD, tooltip on hover showing date + price
3. **Volume bar chart** — small D3 bar chart below, same x-axis range

**Data:**
- Section key: `"price"` (already in `InvestmentSection` union type)
- Type: `PriceData = StockPrice[] | { error: string }` (already in `src/types/investment.ts`)
- `StockPrice`: `{ date: string; open: number; high: number; low: number; close: number; volume: number }`
- NOTE: actual field is `report_date` not `date` in the JSON — the API may transform it; verify at runtime
- Client-side filter: slice last 252 entries for 1Y, 126 for 6M, 63 for 3M, 21 for 1M

**Colors:**
- Line + area fill: `var(--color-primary)` (blue)
- Volume bars: `var(--color-primary)` at 40% opacity
- Grid lines: `var(--border-primary)`
- Axis text: `var(--text-tertiary)` via D3 `.attr("fill", ...)`

---

## Files to Create

### `src/components/investments/PriceChartPanel.tsx`
D3 SVG line + area chart. Props: `{ symbol: string }`.
Uses `useStockData<PriceData>(symbol, "price")`.
Internal state: `range: "1M" | "3M" | "6M" | "1Y"` (default `"1Y"`).
Slices the data array to the last N entries based on range.
Two vertically stacked SVG charts (price + volume) sharing the same time scale.
Hover tooltip via a transparent overlay rect + D3 bisector.
Loading state: two skeleton rectangles.
Empty/error state: "Price data unavailable."

---

## Files to Modify

### `src/components/investments/StockResearch.tsx`
- Import `PriceChartPanel`
- Add `{ key: "chart", label: "Chart" }` to TABS array (after "DCF", before "Compare")
- Add `{activeTab === "chart" && <PriceChartPanel symbol={symbol} />}` to the panel section
- Update `ResearchTab` type union to include `"chart"`

---

## Implementation Steps

1. Read `GrowthPanel.tsx` for D3 patterns to reuse (axis setup, responsive width, cleanup)
2. Create `PriceChartPanel.tsx`:
   a. Fetch with `useStockData<PriceData>(symbol, "price")`
   b. Handle loading skeleton + error state
   c. Add range filter buttons (1M/3M/6M/1Y) with `min-h-[44px]` touch targets
   d. Build price area/line chart using D3 `scaleTime`, `scaleLinear`, `area`, `line`
   e. Build volume bar chart below using same `scaleTime` + separate `scaleLinear`
   f. Add hover tooltip using `bisectDate` + SVG overlay
3. Modify `StockResearch.tsx` to add the 9th tab

---

## Verification

1. `/investments` → Research → select a stock → "Chart" tab appears
2. Line chart renders with correct price scale and date axis
3. Volume bars visible below the price chart
4. 1M/3M/6M/1Y buttons filter correctly
5. Hover shows date + price tooltip
6. Dark mode: all colors come from CSS variables
7. `npm run build` passes
