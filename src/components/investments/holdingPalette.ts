/**
 * The single categorical palette for investments visuals. The quote tape,
 * AllocationChart, HoldingsTable, and ResearchAssetHeader all draw from here
 * so one holding keeps one color across the tape, the donut, the table
 * sparkline, and the research header.
 *
 * These are the Catalog 97 chart ramp tokens as CSS colour strings, so the
 * terminal's espresso and chocolate sheets resolve the dark ramp (catalog97.css
 * overrides --c97-chart-1..6 there). Only chart-1, 2, 3, and 6 read apart, so
 * those come first.
 */
export const HOLDING_PALETTE = [
  "var(--c97-chart-1)",
  "var(--c97-chart-2)",
  "var(--c97-chart-3)",
  "var(--c97-chart-6)",
  "var(--c97-chart-4)",
  "var(--c97-chart-5)",
] as const;

/**
 * A holding's colour comes from its place in the portfolio, sorted by symbol,
 * so the first four holdings always get four steps that read apart and every
 * component agrees however it sorts or filters its own list. Pass the whole
 * portfolio's symbols. A symbol outside the portfolio hashes to a stable step.
 * ponytail: past six holdings the steps repeat; the legend and row labels carry the name.
 */
export function holdingColor(symbol: string, portfolio: readonly string[] = []): string {
  const order = [...new Set(portfolio)].sort();
  const index = order.indexOf(symbol);
  if (index >= 0) return HOLDING_PALETTE[index % HOLDING_PALETTE.length];
  let h = 0;
  for (let i = 0; i < symbol.length; i++) {
    h = (h << 5) - h + symbol.charCodeAt(i);
    h |= 0;
  }
  return HOLDING_PALETTE[Math.abs(h) % HOLDING_PALETTE.length];
}
