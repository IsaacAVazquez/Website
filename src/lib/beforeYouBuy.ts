import type { StockPrice } from "@/types/investment";
import { isValidSymbol } from "@/lib/investmentSymbol";

/**
 * Before You Buy: what one purchase would do to a portfolio. Every reading
 * comes from the same window of daily closes, so two readouts can never
 * disagree only because they were measured over different periods. The
 * weights stay fixed at today's values through that window, which answers
 * "what would this mix have done" and not "what did my account do".
 */

/** A holding by its dollar value at the last close. */
export interface Position {
  symbol: string;
  value: number;
}

export interface SymbolHistory {
  /** Daily rows, oldest first. */
  prices: readonly Pick<StockPrice, "date" | "close">[];
  /** Funds carry none, since the data doesn't break them down by sector. */
  sector?: string;
}

export interface Mix {
  total: number;
  /** Largest first. */
  holdings: { symbol: string; value: number; weight: number }[];
  /** Largest first. */
  sectors: { sector: string; weight: number }[];
  /** Against the benchmark over the window; null when nothing is held or the window is too short. */
  beta: number | null;
}

interface WorstDay {
  date: string;
  benchmark: number;
  before: number | null;
  after: number;
}

export interface BeforeYouBuyResult {
  before: Mix;
  after: Mix;
  buy: Position;
  buySector: string;
  /** Correlation of the buy's daily returns with the current mix's. */
  correlation: number | null;
  /** The benchmark's worst days in the window, worst first. */
  worstDays: WorstDay[];
  /** `from` is the base close, so `days` counts returns. */
  window: { from: string; to: string; days: number } | null;
}

export const FUND_SECTOR = "Fund holdings";
const WORST_DAY_COUNT = 5;
export const MIN_COMPARISON_DAYS = 30;
export const BUY_PORTFOLIO_KEY = "before-you-buy-portfolio-v1";

/** Reject the entire draft on malformed, duplicated, or non-finite positions. */
export function decodeBuyPositions(value: unknown): Position[] | undefined {
  if (!Array.isArray(value) || value.length > 100) return undefined;
  const seen = new Set<string>();
  const positions: Position[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object" || !isValidSymbol(row.symbol) || seen.has(row.symbol) ||
        typeof row.value !== "number" || !Number.isFinite(row.value) || row.value <= 0) return undefined;
    seen.add(row.symbol);
    positions.push({ symbol: row.symbol, value: row.value });
  }
  return Number.isFinite(positions.reduce((sum, row) => sum + row.value, 0)) ? positions : undefined;
}

// The benchmark is the only fund in the curated research universe, and the
// provider sends no quote type, so a fund added later reads as Unclassified.
function sectorOf(symbol: string, history: SymbolHistory | undefined, benchmark: string): string {
  return symbol === benchmark ? FUND_SECTOR : history?.sector || "Unclassified";
}

function mixOf(
  positions: readonly Position[],
  history: Readonly<Record<string, SymbolHistory>>,
  benchmark: string
): Omit<Mix, "beta"> {
  const values = new Map<string, number>();
  for (const { symbol, value } of positions) {
    if (value > 0) values.set(symbol, (values.get(symbol) ?? 0) + value);
  }
  const total = [...values.values()].reduce((sum, value) => sum + value, 0);
  const holdings = [...values]
    .map(([symbol, value]) => ({ symbol, value, weight: total > 0 ? value / total : 0 }))
    .sort((a, b) => b.value - a.value);
  const sectorWeights = new Map<string, number>();
  for (const { symbol, weight } of holdings) {
    const sector = sectorOf(symbol, history[symbol], benchmark);
    sectorWeights.set(sector, (sectorWeights.get(sector) ?? 0) + weight);
  }
  const sectors = [...sectorWeights]
    .map(([sector, weight]) => ({ sector, weight }))
    .sort((a, b) => b.weight - a.weight);
  return { total, holdings, sectors };
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function covariance(a: readonly number[], b: readonly number[]): number {
  const meanA = mean(a);
  const meanB = mean(b);
  return a.reduce((sum, value, i) => sum + (value - meanA) * (b[i] - meanB), 0) / a.length;
}

export function analyzeBuy(
  positions: readonly Position[],
  buy: Position,
  history: Readonly<Record<string, SymbolHistory>>,
  benchmark: string,
  sharedSymbols: readonly string[] = []
): BeforeYouBuyResult {
  const before = mixOf(positions, history, benchmark);
  const after = mixOf([...positions, buy], history, benchmark);
  const symbols = [...new Set([benchmark, buy.symbol, ...after.holdings.map((h) => h.symbol), ...sharedSymbols])];

  // Only days every symbol traded, taken in the benchmark's order.
  const closes = new Map(
    symbols.map((symbol) => [
      symbol,
      new Map((history[symbol]?.prices ?? []).map((row) => [row.date, row.close])),
    ])
  );
  const benchmarkDates = [...new Set((history[benchmark]?.prices ?? []).map((row) => row.date))].sort();
  const validDay = (date: string) => symbols.every((symbol) => {
    const close = closes.get(symbol)?.get(date);
    return typeof close === "number" && Number.isFinite(close) && close > 0;
  });
  // A missing close removes both adjacent intervals. Never call a multi-day
  // return a daily return by joining across a gap in one symbol's history.
  const intervals = benchmarkDates.slice(1).flatMap((date, i) =>
    validDay(date) && validDay(benchmarkDates[i]) ? [{ from: benchmarkDates[i], to: date }] : []
  );
  const returnsOf = (symbol: string) => {
    const series = closes.get(symbol)!;
    return intervals.map(({ from, to }) => series.get(to)! / series.get(from)! - 1);
  };
  const returns = new Map(symbols.map((symbol) => [symbol, returnsOf(symbol)]));
  const days = intervals.length;
  const mixReturns = (mix: Omit<Mix, "beta">) =>
    Array.from({ length: days }, (_, t) =>
      mix.holdings.reduce((sum, h) => sum + h.weight * returns.get(h.symbol)![t], 0)
    );

  const benchmarkReturns = returns.get(benchmark)!;
  const benchmarkVariance = days >= 2 ? covariance(benchmarkReturns, benchmarkReturns) : 0;
  const betaOf = (series: number[] | null) =>
    series && benchmarkVariance > 0 ? covariance(series, benchmarkReturns) / benchmarkVariance : null;

  const beforeReturns = before.total > 0 ? mixReturns(before) : null;
  const afterReturns = mixReturns(after);
  const buyReturns = returns.get(buy.symbol)!;

  let correlation: number | null = null;
  if (beforeReturns && days >= 2) {
    const spread = Math.sqrt(covariance(buyReturns, buyReturns) * covariance(beforeReturns, beforeReturns));
    correlation = spread > 0 ? covariance(buyReturns, beforeReturns) / spread : null;
  }

  const worstDays = benchmarkReturns
    .map((value, t) => ({ value, t }))
    .sort((a, b) => a.value - b.value)
    .slice(0, WORST_DAY_COUNT)
    .map(({ value, t }) => ({
      date: intervals[t].to,
      benchmark: value,
      before: beforeReturns ? beforeReturns[t] : null,
      after: afterReturns[t],
    }));

  return {
    before: { ...before, beta: betaOf(beforeReturns) },
    after: { ...after, beta: betaOf(afterReturns) },
    buy,
    buySector: sectorOf(buy.symbol, history[buy.symbol], benchmark),
    correlation,
    worstDays,
    window: days > 0 ? { from: intervals[0].from, to: intervals[days - 1].to, days } : null,
  };
}

/** All alternatives use one common set of daily observations. */
export function compareBuys(
  positions: readonly Position[],
  buys: readonly Position[],
  history: Readonly<Record<string, SymbolHistory>>,
  benchmark: string
): BeforeYouBuyResult[] {
  // A choice with no history can't share a window, so it must not empty the other one's.
  const shared = buys.map((option) => option.symbol).filter((symbol) => (history[symbol]?.prices.length ?? 0) > 1);
  return buys.map((buy) => {
    const result = analyzeBuy(positions, buy, history, benchmark, shared);
    return (result.window?.days ?? 0) >= MIN_COMPARISON_DAYS ? result : {
      ...result, before: { ...result.before, beta: null }, after: { ...result.after, beta: null },
      correlation: null, worstDays: [],
    };
  });
}

// ─── Wording ─────────────────────────────────────────────────────────────────

export const formatMoney = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const formatWeight = (weight: number) => `${Math.round(weight * 100)}%`;

export const formatReturn = (value: number) =>
  `${value < 0 ? "-" : "+"}${Math.abs(value * 100).toFixed(1)}%`;

export const formatRatio = (value: number) => value.toFixed(2);

// Date-only keys are UTC midnight, so they format in UTC to keep their day.
const DAY_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
export const formatDay = (date: string) => DAY_FORMAT.format(new Date(`${date}T00:00:00Z`));

/** How a correlation reads in a sentence; near zero is no relationship, not an opposite one. */
export function correlationPhrase(value: number): string {
  if (value >= 0.7) return "moved closely with";
  if (value >= 0.3) return "moved somewhat with";
  if (value > -0.3) return "moved mostly independently of";
  return "tended to move against";
}

export function weightIn(sectors: Mix["sectors"], sector: string): number {
  return sectors.find((entry) => entry.sector === sector)?.weight ?? 0;
}

/** The plain summary at the top of the page, built only from the numbers above it. */
export function describeBuy(result: BeforeYouBuyResult, buyName: string): string {
  const { before, after, buy, buySector, correlation, worstDays } = result;
  const sectorName = buySector === FUND_SECTOR ? "fund holdings" : buySector;
  const sectorBefore = weightIn(before.sectors, buySector);
  const sectorAfter = weightIn(after.sectors, buySector);
  const buyWeight = after.holdings.find((h) => h.symbol === buy.symbol)?.weight ?? 0;
  const sentences: string[] = [];

  if (before.total <= 0) {
    return `Adding ${formatMoney(buy.value)} of ${buyName} to an empty portfolio makes it the whole portfolio.`;
  }

  const sectorChange =
    sectorBefore > 0
      ? `takes ${sectorName} from ${formatWeight(sectorBefore)} to ${formatWeight(sectorAfter)} of the portfolio`
      : `puts ${formatWeight(sectorAfter)} of the portfolio in ${sectorName}, where it held nothing before`;
  const largest = after.holdings[0]?.symbol === buy.symbol && before.holdings[0]?.symbol !== buy.symbol;
  const holdingChange = largest
    ? `${buy.symbol} becomes the largest holding at ${formatWeight(buyWeight)} of the total`
    : `${buy.symbol} comes to ${formatWeight(buyWeight)} of the total`;
  sentences.push(
    `Adding ${formatMoney(buy.value)} of ${buyName} to this ${formatMoney(before.total)} portfolio ${sectorChange}, and ${holdingChange}.`
  );

  if (correlation !== null && before.beta !== null && after.beta !== null) {
    const betaChange =
      formatRatio(before.beta) === formatRatio(after.beta)
        ? `the portfolio's beta stays at ${formatRatio(after.beta)}`
        : `the portfolio's beta goes from ${formatRatio(before.beta)} to ${formatRatio(after.beta)}`;
    sentences.push(
      `Over the shared history it ${correlationPhrase(correlation)} what you already hold (a correlation of ${formatRatio(correlation)}), and ${betaChange}.`
    );
  }

  const comparable = worstDays.filter((day): day is WorstDay & { before: number } => day.before !== null);
  if (comparable.length > 0) {
    const averageBefore = mean(comparable.map((day) => day.before));
    const averageAfter = mean(comparable.map((day) => day.after));
    const count = comparable.length === WORST_DAY_COUNT ? "five" : String(comparable.length);
    sentences.push(
      `On the S&P 500's ${count} worst days in this window, your current mix averaged ${formatReturn(averageBefore)} and the new one would have averaged ${formatReturn(averageAfter)}.`
    );
  }

  return sentences.join(" ");
}
