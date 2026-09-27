/**
 * The single categorical palette for investments visuals. AllocationChart,
 * HoldingsTable, and ResearchAssetHeader all draw from here so one holding
 * keeps one color across the donut, the table sparkline, and the research
 * header.
 *
 * These are the Catalog 97 chart ramp tokens, as CSS colour strings, so the
 * terminal's espresso and chocolate sheets resolve the dark ramp automatically
 * (catalog97.css overrides --c97-chart-1..6 on those two surfaces) instead of
 * a hex literal baked into this constant. Only chart-1, 2, 3, and 6 read apart
 * from each other on espresso, so the curated tickers below cycle through
 * those four first; the hash fallback for everything else cycles through all
 * six steps.
 */
export const HOLDING_PALETTE = [
  "var(--c97-chart-1)",
  "var(--c97-chart-2)",
  "var(--c97-chart-3)",
  "var(--c97-chart-4)",
  "var(--c97-chart-5)",
  "var(--c97-chart-6)",
] as const;

const CURATED_STEPS = ["var(--c97-chart-1)", "var(--c97-chart-2)", "var(--c97-chart-3)", "var(--c97-chart-6)"] as const;

/** Curated tones for common tickers, cycling through the four steps that read
 * apart on espresso; everything else hashes stably across all six. */
const CURATED_TONES: Record<string, string> = {
  NVDA: CURATED_STEPS[0],
  AAPL: CURATED_STEPS[1],
  MSFT: CURATED_STEPS[2],
  GOOGL: CURATED_STEPS[3],
  AMZN: CURATED_STEPS[0],
  TSLA: CURATED_STEPS[1],
  "BRK.B": CURATED_STEPS[2],
  SPY: CURATED_STEPS[3],
};

export function holdingColor(symbol: string): string {
  const direct = CURATED_TONES[symbol];
  if (direct) return direct;
  let h = 0;
  for (let i = 0; i < symbol.length; i++) {
    h = (h << 5) - h + symbol.charCodeAt(i);
    h |= 0;
  }
  return HOLDING_PALETTE[Math.abs(h) % HOLDING_PALETTE.length];
}
