"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  PortfolioHolding,
  EnhancedHolding,
  PortfolioSummary,
  StockQuote,
} from "@/types/investment";
import type { PortfolioSnapshot } from "@/components/investments/PortfolioPerformanceChart";
import {
  readValidatedBrowserStorage,
  writeBrowserStorageJson,
  type PersistenceStatus,
} from "@/lib/browserStorage";
import { isLocalDateKey } from "@/lib/date-formatters";
import { useLocalStoragePersistenceStatus } from "@/hooks/useLocalStorageString";

const STORAGE_KEY = "portfolio_holdings";
const SNAPSHOTS_KEY = "portfolio_snapshots";
const QUOTES_CACHE_KEY = "portfolio_quotes_cache";
const MAX_SNAPSHOTS = 365;
const MAX_QUOTES_PER_REQUEST = 25;
const MAX_CONCURRENT_QUOTE_BATCHES = 2;
const QUOTE_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CURRENT_QUOTE_AGE_MS = 4 * 24 * 60 * 60 * 1000;
const PARTIAL_FALLBACK_WARNING =
  "Some market quotes are temporarily unavailable. Portfolio totals are using your saved cost basis where needed.";

class QuoteBatchError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message);
    this.name = "QuoteBatchError";
  }
}

function formatFallbackWarning(
  symbols: string[],
  options: { hasLastGood?: boolean; hasCostBasis?: boolean } = {},
): string {
  const uniqueSymbols = Array.from(new Set(symbols.map((symbol) => symbol.toUpperCase()))).sort();
  if (uniqueSymbols.length === 0) return PARTIAL_FALLBACK_WARNING;

  const displayedSymbols = uniqueSymbols.slice(0, 4).join(", ");
  const remainingCount = uniqueSymbols.length - 4;
  const suffix = remainingCount > 0 ? `, and ${remainingCount} more` : "";

  const prefix = `Market quotes are temporarily unavailable for ${displayedSymbols}${suffix}.`;
  if (options.hasLastGood && options.hasCostBasis) {
    return `${prefix} Portfolio totals are showing the last saved quote where available and using your saved cost basis otherwise.`;
  }
  if (options.hasLastGood) {
    return `${prefix} Portfolio totals are showing the last saved quote for those holdings.`;
  }
  return `${prefix} Portfolio totals are using your saved cost basis where needed.`;
}

// ─── localStorage helpers ────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function decodeHolding(value: unknown): PortfolioHolding | undefined {
  if (!isRecord(value)) return undefined;
  if (
    typeof value.symbol !== "string" ||
    value.symbol.trim().length === 0 ||
    !isFiniteNumber(value.shares) ||
    value.shares <= 0 ||
    !isFiniteNumber(value.averageCost) ||
    value.averageCost < 0
  ) {
    return undefined;
  }

  const holding: PortfolioHolding = {
    symbol: value.symbol.trim().toUpperCase(),
    shares: value.shares,
    averageCost: value.averageCost,
  };
  if (isLocalDateKey(value.purchaseDate)) holding.purchaseDate = value.purchaseDate;
  if (typeof value.notes === "string") holding.notes = value.notes;
  return holding;
}

function decodeHoldings(value: unknown): PortfolioHolding[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map(decodeHolding).filter((holding): holding is PortfolioHolding => !!holding);
}

function decodeSnapshot(value: unknown): PortfolioSnapshot | undefined {
  if (!isRecord(value) || !isLocalDateKey(value.date)) return undefined;
  if (
    !isFiniteNumber(value.totalValue) ||
    value.totalValue < 0 ||
    !isFiniteNumber(value.totalCost) ||
    value.totalCost < 0 ||
    !Number.isInteger(value.holdingCount) ||
    (value.holdingCount as number) < 0
  ) {
    return undefined;
  }
  return {
    date: value.date,
    ...(typeof value.valuationAsOf === "string" &&
    Number.isFinite(Date.parse(value.valuationAsOf))
      ? { valuationAsOf: value.valuationAsOf }
      : {}),
    totalValue: value.totalValue,
    totalCost: value.totalCost,
    holdingCount: value.holdingCount as number,
  };
}

function decodeSnapshots(value: unknown): PortfolioSnapshot[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map(decodeSnapshot)
    .filter((snapshot): snapshot is PortfolioSnapshot => !!snapshot)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_SNAPSHOTS);
}

function decodeStockQuote(value: unknown): StockQuote | undefined {
  if (
    !isRecord(value) ||
    typeof value.symbol !== "string" ||
    value.symbol.trim().length === 0 ||
    typeof value.name !== "string"
  ) {
    return undefined;
  }
  const numericFields: Array<keyof StockQuote> = [
    "price",
    "change",
    "changePercent",
    "dayHigh",
    "dayLow",
    "open",
    "previousClose",
    "volume",
    "marketCap",
  ];
  if (!numericFields.every((field) => isFiniteNumber(value[field]))) return undefined;
  if (value.error !== undefined && typeof value.error !== "string") return undefined;

  return {
    symbol: value.symbol.trim().toUpperCase(),
    price: value.price as number,
    change: value.change as number,
    changePercent: value.changePercent as number,
    dayHigh: value.dayHigh as number,
    dayLow: value.dayLow as number,
    open: value.open as number,
    previousClose: value.previousClose as number,
    volume: value.volume as number,
    marketCap: value.marketCap as number,
    name: value.name,
    ...(typeof value.asOf === "string" ? { asOf: value.asOf } : {}),
    ...(value.source === "finnhub" ? { source: value.source } : {}),
    ...(value.isFallback === true ? { isFallback: true } : {}),
    ...(typeof value.error === "string" ? { error: value.error } : {}),
  };
}

function loadHoldings(): PortfolioHolding[] {
  return readValidatedBrowserStorage(STORAGE_KEY, decodeHoldings, () => []).value;
}

function saveHoldings(holdings: PortfolioHolding[]): PersistenceStatus {
  return writeBrowserStorageJson(STORAGE_KEY, holdings);
}

function loadSnapshots(): PortfolioSnapshot[] {
  return readValidatedBrowserStorage(SNAPSHOTS_KEY, decodeSnapshots, () => []).value;
}

export function upsertSnapshots(
  existing: PortfolioSnapshot[],
  snapshot: PortfolioSnapshot
): PortfolioSnapshot[] {
  const existingIndex = existing.findIndex((entry) => entry.date === snapshot.date);
  const updated =
    existingIndex >= 0
      ? existing.map((entry, index) => (index === existingIndex ? snapshot : entry))
      : [...existing, snapshot];

  return updated.length > MAX_SNAPSHOTS ? updated.slice(-MAX_SNAPSHOTS) : updated;
}

function saveSnapshot(snapshot: PortfolioSnapshot): void {
  if (typeof window === "undefined") return;
  const existing = loadSnapshots();
  const updated = upsertSnapshots(existing, snapshot);
  writeBrowserStorageJson(SNAPSHOTS_KEY, updated);
}

interface CachedQuoteEntry {
  fetchedAt: number;
  quote: StockQuote;
}

interface CachedQuotes {
  version: 2;
  entries: CachedQuoteEntry[];
}

function decodeCachedQuotes(value: unknown): CachedQuotes | undefined {
  if (!isRecord(value)) return undefined;

  if (value.version === 2 && Array.isArray(value.entries)) {
    const entries = value.entries.flatMap((entry): CachedQuoteEntry[] => {
      if (!isRecord(entry) || !isFiniteNumber(entry.fetchedAt)) return [];
      const quote = decodeStockQuote(entry.quote);
      return quote ? [{ fetchedAt: entry.fetchedAt, quote }] : [];
    });
    return { version: 2, entries };
  }

  // Migrate the original whole-cache timestamp shape without extending the
  // age of any quote. The next successful response rewrites it as v2.
  if (isFiniteNumber(value.timestamp) && Array.isArray(value.quotes)) {
    return {
      version: 2,
      entries: value.quotes.flatMap((quoteValue): CachedQuoteEntry[] => {
        const quote = decodeStockQuote(quoteValue);
        return quote ? [{ fetchedAt: value.timestamp as number, quote }] : [];
      }),
    };
  }

  return undefined;
}

function readCachedQuoteEntries(): CachedQuoteEntry[] {
  const stored = readValidatedBrowserStorage<CachedQuotes>(
    QUOTES_CACHE_KEY,
    decodeCachedQuotes,
    () => ({ version: 2, entries: [] }),
  );
  return stored.source === "valid" ? stored.value.entries : [];
}

function loadCachedQuotes(): {
  quotes: Map<string, StockQuote>;
  lastUpdated: Date;
} | null {
  try {
    const now = Date.now();
    const entries = readCachedQuoteEntries().filter(
      ({ fetchedAt }) => fetchedAt <= now + 60_000 && now - fetchedAt <= QUOTE_CACHE_TTL_MS,
    );
    const map = new Map<string, StockQuote>();
    for (const { quote } of entries) {
      if (hasCurrentMarketQuote(quote)) {
        // A browser cache is a last-good value, not proof that this render
        // received a current quote. Keep its prior-session move out of Day P/L.
        map.set(quote.symbol, { ...quote, isFallback: true });
      }
    }
    if (map.size === 0) return null;

    const providerTimestamps = [...map.values()]
      .map((quote) => quote.asOf ? Date.parse(quote.asOf) : Number.NaN)
      .filter(Number.isFinite);
    const fallbackTimestamps = entries.map(({ fetchedAt }) => fetchedAt);
    const lastUpdatedMs = providerTimestamps.length > 0
      ? Math.max(...providerTimestamps)
      : Math.max(...fallbackTimestamps);

    return { quotes: map, lastUpdated: new Date(lastUpdatedMs) };
  } catch {
    return null;
  }
}

function saveCachedQuotes(quotes: Map<string, StockQuote>): void {
  const now = Date.now();
  const entriesBySymbol = new Map(
    readCachedQuoteEntries()
      .filter(({ fetchedAt, quote }) =>
        fetchedAt <= now + 60_000 &&
        now - fetchedAt <= QUOTE_CACHE_TTL_MS &&
        hasCurrentMarketQuote(quote)
      )
      .map((entry) => [entry.quote.symbol, entry]),
  );

  for (const quote of quotes.values()) {
    if (!hasCurrentMarketQuote(quote)) continue;
    const { isFallback: _isFallback, ...persistedQuote } = quote;
    entriesBySymbol.set(quote.symbol, {
      fetchedAt: now,
      quote: persistedQuote,
    });
  }

  const payload: CachedQuotes = {
    version: 2,
    entries: [...entriesBySymbol.values()],
  };
  writeBrowserStorageJson(QUOTES_CACHE_KEY, payload);
}

function symbolKey(holdings: PortfolioHolding[]): string {
  return Array.from(new Set(holdings.map((h) => h.symbol))).sort().join(",");
}

// ─── Quote fetching with retry ───────────────────────────────────────────────

async function fetchQuoteBatch(
  symbols: string[]
): Promise<{ quotes: Map<string, StockQuote>; warning: string | null }> {
  const MAX_RETRIES = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
      const res = await fetch(`/api/investments/quotes?symbols=${symbols.join(",")}`);
      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!isRecord(data) || !Array.isArray(data.quotes)) {
        if (!res.ok) {
          // Retry only genuinely unstructured server errors (502/503/504).
          if (res.status >= 502 && res.status <= 504 && attempt < MAX_RETRIES) {
            lastError = new Error(`Quote fetch failed: HTTP ${res.status}`);
            continue;
          }
          throw new QuoteBatchError(
            `Failed to fetch quotes: HTTP ${res.status}`,
            false,
          );
        }
        throw new QuoteBatchError("Quote service returned an invalid response", true);
      }
      // The route answers 503 when every curated symbol failed and 400 when no
      // requested symbol is eligible for market quotes, but both still carry the
      // structured quotes payload (per-symbol error placeholders). Treat those
      // like a successful response — retrying would just re-fire the full
      // server-side fan-out — and let the fallback messaging take over.
      const map = new Map<string, StockQuote>();
      for (const value of data.quotes) {
        const quote = decodeStockQuote(value);
        if (hasCurrentMarketQuote(quote)) map.set(quote.symbol, quote);
      }
      return {
        quotes: map,
        // The caller knows whether a failed symbol has a last-good quote or
        // must use cost basis, so fallback copy is derived after the batches
        // are merged instead of guessing here.
        warning: null,
      };
    } catch (err) {
      lastError = err as Error;
      if (err instanceof QuoteBatchError && !err.retryable) throw err;
      if (attempt >= MAX_RETRIES) throw lastError;
    }
  }
  throw lastError ?? new Error("Failed to fetch quotes");
}

async function fetchQuotesWithStatus(
  symbols: string[],
): Promise<{ quotes: Map<string, StockQuote>; warning: string | null }> {
  const uniqueSymbols = Array.from(new Set(symbols));
  if (uniqueSymbols.length === 0) return { quotes: new Map(), warning: null };

  const batches: string[][] = [];
  for (let index = 0; index < uniqueSymbols.length; index += MAX_QUOTES_PER_REQUEST) {
    batches.push(uniqueSymbols.slice(index, index + MAX_QUOTES_PER_REQUEST));
  }

  const results = new Array<PromiseSettledResult<Awaited<ReturnType<typeof fetchQuoteBatch>>>>(
    batches.length,
  );
  let nextBatchIndex = 0;

  async function batchWorker() {
    while (nextBatchIndex < batches.length) {
      const index = nextBatchIndex;
      nextBatchIndex += 1;
      try {
        results[index] = {
          status: "fulfilled",
          value: await fetchQuoteBatch(batches[index]),
        };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(MAX_CONCURRENT_QUOTE_BATCHES, batches.length) },
      () => batchWorker(),
    ),
  );
  const quotes = new Map<string, StockQuote>();
  let warning: string | null = null;
  let lastError: Error | null = null;

  for (const result of results) {
    if (result.status === "rejected") {
      lastError = result.reason instanceof Error ? result.reason : new Error("Failed to fetch quotes");
      continue;
    }
    warning ??= result.value.warning;
    result.value.quotes.forEach((quote, symbol) => quotes.set(symbol, quote));
  }

  if (results.every((result) => result.status === "rejected")) {
    throw lastError ?? new Error("Failed to fetch quotes");
  }
  return { quotes, warning };
}

// ─── Derived data ─────────────────────────────────────────────────────────────

function hasUsableQuote(quote?: StockQuote): quote is StockQuote {
  return !!quote && !quote.error && Number.isFinite(quote.price) && quote.price > 0;
}

function hasCurrentMarketQuote(quote?: StockQuote): quote is StockQuote {
  if (!hasUsableQuote(quote) || quote.isFallback) return false;
  if (quote.source !== "finnhub") return false;
  if (!quote.asOf) return false;
  const sourceTimestamp = Date.parse(quote.asOf);
  if (!Number.isFinite(sourceTimestamp)) return false;
  const ageMs = Date.now() - sourceTimestamp;
  return ageMs >= -5 * 60 * 1000 && ageMs <= MAX_CURRENT_QUOTE_AGE_MS;
}

function marketSessionDate(asOf: string): string | null {
  const date = new Date(asOf);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  const value = `${byType.get("year")}-${byType.get("month")}-${byType.get("day")}`;
  return isLocalDateKey(value) ? value : null;
}

function portfolioValuationSession(
  holdings: PortfolioHolding[],
  quotes: Map<string, StockQuote>,
): { date: string; valuationAsOf: string } | null {
  const timestamps = holdings.flatMap((holding) => {
    const quote = quotes.get(holding.symbol);
    return hasCurrentMarketQuote(quote) && quote.asOf ? [quote.asOf] : [];
  });
  if (timestamps.length !== holdings.length) return null;
  const sessionDates = new Set(
    timestamps.map(marketSessionDate).filter((value): value is string => !!value),
  );
  if (sessionDates.size !== 1) return null;
  const timestampValues = timestamps.map(Date.parse).filter(Number.isFinite);
  if (timestampValues.length !== timestamps.length) return null;
  return {
    date: [...sessionDates][0],
    valuationAsOf: new Date(Math.max(...timestampValues)).toISOString(),
  };
}

export function canPersistPortfolioSnapshot(
  holdings: PortfolioHolding[],
  quotes: Map<string, StockQuote>
): boolean {
  return holdings.length > 0 && portfolioValuationSession(holdings, quotes) !== null;
}

export function buildEnhanced(
  holdings: PortfolioHolding[],
  quotes: Map<string, StockQuote>,
  isLoading: boolean
): EnhancedHolding[] {
  const totalValue = holdings.reduce((sum, h) => {
    const q = quotes.get(h.symbol);
    const marketPrice = hasUsableQuote(q) ? q.price : h.averageCost;
    return sum + h.shares * marketPrice;
  }, 0);

  return holdings.map((h) => {
    const q = quotes.get(h.symbol);
    const currentPrice = hasUsableQuote(q) ? q.price : h.averageCost;
    const priceSource: EnhancedHolding["priceSource"] = hasUsableQuote(q)
      ? !hasCurrentMarketQuote(q)
        ? "saved"
        : "live"
      : "costBasis";
    const currentValue = h.shares * currentPrice;
    const totalCost = h.shares * h.averageCost;
    const gainLoss = currentValue - totalCost;
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
    // A saved quote can still value the position, but its day move belongs to
    // an earlier response and must not be rolled into today's portfolio P/L.
    const hasCurrentQuote = hasCurrentMarketQuote(q);
    const dayChange = hasCurrentQuote ? h.shares * q.change : 0;
    const dayChangePercent = hasCurrentQuote ? q.changePercent : 0;
    const allocationPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : null;

    return {
      ...h,
      currentPrice,
      currentValue,
      totalCost,
      gainLoss,
      gainLossPercent,
      dayChange,
      dayChangePercent,
      allocationPercent,
      name: hasUsableQuote(q) ? q.name : h.symbol,
      priceSource,
      isLoading: isLoading && !hasUsableQuote(q),
      error: q?.error,
    };
  });
}

export function buildSummary(enhanced: EnhancedHolding[]): PortfolioSummary {
  return enhanced.reduce(
    (acc, h) => ({
      totalValue: acc.totalValue + h.currentValue,
      totalCost: acc.totalCost + h.totalCost,
      totalGainLoss: acc.totalGainLoss + h.gainLoss,
      totalGainLossPercent: 0, // computed below
      dayChange: acc.dayChange + h.dayChange,
      dayChangePercent: 0, // computed below
    }),
    { totalValue: 0, totalCost: 0, totalGainLoss: 0, totalGainLossPercent: 0, dayChange: 0, dayChangePercent: 0 }
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseInvestmentsReturn {
  holdings: PortfolioHolding[];
  enhancedHoldings: EnhancedHolding[];
  summary: PortfolioSummary;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  snapshots: PortfolioSnapshot[];
  persistenceStatus: PersistenceStatus;
  addHolding: (holding: PortfolioHolding) => void;
  updateHolding: (symbol: string, updates: Partial<PortfolioHolding>) => void;
  removeHolding: (symbol: string) => void;
  refetch: () => void;
}

export function useInvestments(): UseInvestmentsReturn {
  const persistenceStatus = useLocalStoragePersistenceStatus(STORAGE_KEY);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [quotes, setQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const isMounted = useRef(true);
  const holdingsRef = useRef<PortfolioHolding[]>([]);
  const quotesRef = useRef<Map<string, StockQuote>>(new Map());
  const fetchedSymbolKeyRef = useRef<string>("");
  const latestQuoteRequestId = useRef(0);
  const lastQuoteRequestAtRef = useRef(0);

  // Hydrate from localStorage on mount — including cached quotes for instant paint
  useEffect(() => {
    isMounted.current = true;
    const initial = loadHoldings();
    holdingsRef.current = initial;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-shot mount-time hydration from localStorage; must be in effect (not lazy init) because localStorage is unsafe during SSR and reads multiple coordinated keys
    setHoldings(initial);
    setSnapshots(loadSnapshots());
    const cached = loadCachedQuotes();
    if (cached && cached.quotes.size > 0) {
      quotesRef.current = cached.quotes;
      setQuotes(cached.quotes);
      setLastUpdated(cached.lastUpdated);
      // Cached quotes paint immediately as saved values. The symbol effect
      // still starts a background refresh so a five-minute browser cache can
      // never suppress the first market request for this tab.
    }
    return () => { isMounted.current = false; };
  }, []);

  const fetchAllQuotes = useCallback(async (currentHoldings: PortfolioHolding[]) => {
    const requestId = latestQuoteRequestId.current + 1;
    latestQuoteRequestId.current = requestId;
    if (currentHoldings.length === 0) {
      quotesRef.current = new Map();
      setQuotes(new Map());
      setError(null);
      setLastUpdated(null);
      setIsLoading(false);
      return;
    }
    lastQuoteRequestAtRef.current = Date.now();
    setIsLoading(true);
    setError(null);
    try {
      const symbols = currentHoldings.map((h) => h.symbol);
      const { quotes: freshQuotes, warning } = await fetchQuotesWithStatus(symbols);
      if (isMounted.current && latestQuoteRequestId.current === requestId) {
        const previousQuotes = quotesRef.current;
        const nextQuotes = new Map<string, StockQuote>();
        for (const holding of currentHoldings) {
          const freshQuote = freshQuotes.get(holding.symbol);
          const previousQuote = previousQuotes.get(holding.symbol);
          if (hasCurrentMarketQuote(freshQuote)) {
            nextQuotes.set(holding.symbol, freshQuote);
          } else if (hasUsableQuote(previousQuote)) {
            nextQuotes.set(holding.symbol, {
              ...previousQuote,
              isFallback: true,
            });
          }
        }

        const hasFreshQuote = currentHoldings.some((holding) =>
          hasCurrentMarketQuote(freshQuotes.get(holding.symbol)),
        );
        // A newly dated portfolio snapshot must come entirely from this
        // response. Cached fallbacks may remain visible, but mixing them into
        // today's history would silently rewrite stale prices as current.
        const canPersistSnapshot = canPersistPortfolioSnapshot(
          currentHoldings,
          freshQuotes
        );
        const fallbackSymbols = currentHoldings
          .filter((holding) => !hasCurrentMarketQuote(freshQuotes.get(holding.symbol)))
          .map((holding) => holding.symbol);
        const lastGoodFallbackSymbols = fallbackSymbols.filter((symbol) =>
          hasUsableQuote(previousQuotes.get(symbol)),
        );
        const costBasisFallbackSymbols = fallbackSymbols.filter(
          (symbol) => !hasUsableQuote(previousQuotes.get(symbol)),
        );
        const hasFallbackPrices = fallbackSymbols.length > 0;
        const fallbackWarning = formatFallbackWarning(fallbackSymbols, {
          hasLastGood: lastGoodFallbackSymbols.length > 0,
          hasCostBasis: costBasisFallbackSymbols.length > 0,
        });

        quotesRef.current = nextQuotes;
        setQuotes(nextQuotes);
        // Any fresh usable quote refreshes the five-minute client cache and
        // the "last updated" stamp — nextQuotes already merges last-good
        // prices for the symbols that failed, and saveCachedQuotes only
        // stores usable quotes. Gating this on a fully-fresh response would
        // let one chronically failing symbol disable the cache forever.
        if (hasFreshQuote) {
          // Persist only quotes returned by this response. Re-saving carried
          // fallbacks under a new cache timestamp would make their age look
          // newer than it is after any other symbol succeeds.
          saveCachedQuotes(freshQuotes);
          const providerTimestamps = [...freshQuotes.values()]
            .map((quote) => quote.asOf ? Date.parse(quote.asOf) : Number.NaN)
            .filter(Number.isFinite);
          setLastUpdated(
            providerTimestamps.length > 0
              ? new Date(Math.max(...providerTimestamps))
              : new Date()
          );
        }
        setError(warning ?? (hasFallbackPrices ? fallbackWarning : null));

        if (canPersistSnapshot) {
          const valuationSession = portfolioValuationSession(currentHoldings, freshQuotes);
          if (!valuationSession) return;
          const enhanced = buildEnhanced(currentHoldings, nextQuotes, false);
          const summary = buildSummary(enhanced);
          const totalCost = enhanced.reduce((s, h) => s + h.totalCost, 0);
          const snap: PortfolioSnapshot = {
            date: valuationSession.date,
            valuationAsOf: valuationSession.valuationAsOf,
            totalValue: summary.totalValue,
            totalCost,
            holdingCount: currentHoldings.length,
          };
          saveSnapshot(snap);
        }
        setSnapshots(loadSnapshots());
      }
    } catch (err) {
      if (isMounted.current && latestQuoteRequestId.current === requestId) {
        const fallbackQuotes = new Map<string, StockQuote>();
        for (const holding of currentHoldings) {
          const previousQuote = quotesRef.current.get(holding.symbol);
          if (hasUsableQuote(previousQuote)) {
            fallbackQuotes.set(holding.symbol, {
              ...previousQuote,
              isFallback: true,
            });
          }
        }
        quotesRef.current = fallbackQuotes;
        setQuotes(fallbackQuotes);
        setError((err as Error).message || "Market quotes are temporarily unavailable.");
      }
    } finally {
      if (isMounted.current && latestQuoteRequestId.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch quotes only when the *set of symbols* changes — edits to shares/cost
  // on existing holdings don't require a refetch, since derived values recompute
  // from the existing quotes map.
  useEffect(() => {
    // The mount hydration effect updates the ref before React commits the
    // hydrated holdings state. Do not let the initial empty render erase a
    // cache-coverage key or start a redundant request.
    if (holdings !== holdingsRef.current) return;
    const key = symbolKey(holdings);
    if (key === fetchedSymbolKeyRef.current) return;
    fetchedSymbolKeyRef.current = key;
    fetchAllQuotes(holdings);
  }, [holdings, fetchAllQuotes]);

  // Revalidate a visible long-lived tab. The timestamp gate prevents focus
  // churn from multiplying requests, while manual refresh and symbol changes
  // continue to bypass this background throttle.
  useEffect(() => {
    const maybeRefresh = () => {
      if (document.visibilityState === "hidden") return;
      const currentHoldings = holdingsRef.current;
      if (currentHoldings.length === 0) return;
      const elapsedMs = Date.now() - lastQuoteRequestAtRef.current;
      if (elapsedMs >= 0 && elapsedMs < QUOTE_CACHE_TTL_MS) return;
      void fetchAllQuotes(currentHoldings);
    };

    const intervalId = window.setInterval(maybeRefresh, QUOTE_CACHE_TTL_MS);
    window.addEventListener("focus", maybeRefresh);
    document.addEventListener("visibilitychange", maybeRefresh);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", maybeRefresh);
      document.removeEventListener("visibilitychange", maybeRefresh);
    };
  }, [fetchAllQuotes]);

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  const commitHoldings = useCallback(
    (updater: (current: PortfolioHolding[]) => PortfolioHolding[]) => {
      const next = updater(holdingsRef.current);
      holdingsRef.current = next;
      saveHoldings(next);
      setHoldings(next);
    },
    [],
  );

  const addHolding = useCallback((holding: PortfolioHolding) => {
    commitHoldings((prev) => {
      const existing = prev.findIndex((h) => h.symbol === holding.symbol);
      let next: PortfolioHolding[];
      if (existing >= 0) {
        // Merge: weighted-average cost, sum shares
        const old = prev[existing];
        const totalShares = old.shares + holding.shares;
        const avgCost =
          (old.shares * old.averageCost + holding.shares * holding.averageCost) / totalShares;
        next = prev.map((h, i) =>
          i === existing ? { ...h, shares: totalShares, averageCost: avgCost } : h
        );
      } else {
        next = [...prev, holding];
      }
      return next;
    });
  }, [commitHoldings]);

  const updateHolding = useCallback((symbol: string, updates: Partial<PortfolioHolding>) => {
    commitHoldings((prev) =>
      prev.map((h) => (h.symbol === symbol ? { ...h, ...updates } : h)),
    );
  }, [commitHoldings]);

  const removeHolding = useCallback((symbol: string) => {
    commitHoldings((prev) => prev.filter((h) => h.symbol !== symbol));
  }, [commitHoldings]);

  const refetch = useCallback(() => {
    fetchAllQuotes(holdings);
  }, [holdings, fetchAllQuotes]);

  // ─── Derived ──────────────────────────────────────────────────────────────

  const enhancedHoldings = buildEnhanced(holdings, quotes, isLoading);

  const rawSummary = buildSummary(enhancedHoldings);
  const summary: PortfolioSummary = {
    ...rawSummary,
    totalGainLossPercent:
      rawSummary.totalCost > 0
        ? (rawSummary.totalGainLoss / rawSummary.totalCost) * 100
        : 0,
    dayChangePercent: (() => {
      const liveValue = enhancedHoldings
        .filter((holding) => holding.priceSource === "live")
        .reduce((sum, holding) => sum + holding.currentValue, 0);
      const previousValue = liveValue - rawSummary.dayChange;
      return previousValue > 0 ? (rawSummary.dayChange / previousValue) * 100 : 0;
    })(),
  };

  return {
    holdings,
    enhancedHoldings,
    summary,
    isLoading,
    error,
    lastUpdated,
    snapshots,
    persistenceStatus,
    addHolding,
    updateHolding,
    removeHolding,
    refetch,
  };
}
