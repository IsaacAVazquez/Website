/**
 * The single categorical palette for investments visuals. AllocationChart,
 * HoldingsTable, and ResearchAssetHeader all draw from here so one holding
 * keeps one color across the donut, the table sparkline, and the research
 * header (STYLING.md, "Charts and D3").
 *
 * These are data-series colors, not theme tokens: mid-lightness tones chosen
 * to stay legible on both limestone and dark paper. Deliberately excludes the
 * `--home-signal` hex (never bake a token's hex into a constant) and any
 * ink-equivalent tone (vanishes on dark paper).
 */
export const HOLDING_PALETTE = [
  "#4D8AD0", // blue
  "#1F7A6E", // teal
  "#5C8531", // green
  "#B8862D", // ochre
  "#B22B2F", // red
  "#7C5CBF", // violet
  "#C2653A", // terracotta
  "#3F6B8A", // steel
  "#6B5A3E", // bronze
  "#697079", // slate
] as const;

/** Curated tones for common tickers; everything else hashes stably. */
const CURATED_TONES: Record<string, string> = {
  NVDA: "#5C8531",
  AAPL: "#697079",
  MSFT: "#4D8AD0",
  GOOGL: "#3F6B8A",
  AMZN: "#1F7A6E",
  TSLA: "#B22B2F",
  "BRK.B": "#6B5A3E",
  SPY: "#7C5CBF",
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
