/**
 * Finnhub quote client
 *
 * Runtime market quote source. Provider entitlements and public-display terms
 * must be verified separately from this client implementation.
 *
 * Quote endpoint returns: { c, d, dp, h, l, o, pc, t }
 * (current, change, changePercent, high, low, open, prevClose, timestamp)
 */

import { readFileSync } from "fs";
import path from "path";
import type { StockQuote } from "@/types/investment";
import {
  getInvestmentsAssetOrigin,
  type AssetOriginOptions,
} from "@/lib/investmentsAssetOrigin";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY ?? "";
const TIMEOUT_MS = 5_000;
const ALLOWLIST_TIMEOUT_MS = 2_000;
const QUOTE_CACHE_TTL_MS = 30_000;
// Four days covers normal weekends and most exchange holidays without letting
// an old weekly close masquerade as a current market quote.
const MAX_QUOTE_AGE_MS = 4 * 24 * 60 * 60 * 1000;

const TEMPORARY_ERROR = "Live price is temporarily unavailable. Showing the latest saved data instead.";
const RATE_LIMITED_ERROR = "Live price is temporarily unavailable right now. Try again in a few minutes.";
const NO_PRICE_ERROR = "Live price is unavailable for this symbol right now.";

// Module-level rate limit tracker
let rateLimitedUntil = 0;
const quoteCache = new Map<string, { quote: StockQuote; expiresAt: number }>();
const quoteInflight = new Map<string, Promise<StockQuote>>();

export function isRateLimited(): boolean {
  return Date.now() < rateLimitedUntil;
}

/**
 * Strict symbol shape. Forbids leading dots/dashes and consecutive
 * separators; requires at least one alphanumeric and capped at 10 chars.
 * Examples accepted: AAPL, BRK-B, BRK.B, BF.B
 * Examples rejected: .AAPL, -AAPL, AA..PL, AAPL., "AAPL "
 */
export function isValidSymbol(symbol: string): boolean {
  if (typeof symbol !== "string" || symbol.length === 0 || symbol.length > 10) {
    return false;
  }
  return /^[A-Z][A-Z0-9]*([.-][A-Z0-9]+)*$/.test(symbol);
}

// ---------------------------------------------------------------------------
// Allowlist of curated symbols
// ---------------------------------------------------------------------------
// The allowlist is the authoritative gate for the unauthenticated
// /api/investments/quotes and /api/stocks proxies — only symbols Isaac has
// chosen to research can hit the paid Finnhub key.
//
// It is sourced from public/data/investments/index.json. Netlify packages that
// directory with the server handler through `functions.included_files`, which
// keeps the filesystem path reliable in production. The HTTP read remains as a
// fallback for runtimes that omit public assets from their function bundle.
const INDEX_RELATIVE_PATH = "/data/investments/index.json";
const INDEX_JSON_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "investments",
  "index.json"
);

let cachedAllowlist: Set<string> | null = null;
let allowlistInflight: Promise<Set<string>> | null = null;

export class FinnhubAllowlistUnavailableError extends Error {
  readonly status = 503;

  constructor() {
    super("Curated symbol list is temporarily unavailable.");
    this.name = "FinnhubAllowlistUnavailableError";
  }
}

function toSymbolSet(parsed: { symbols?: unknown }): Set<string> {
  const symbols = Array.isArray(parsed.symbols)
    ? parsed.symbols.filter((s): s is string => typeof s === "string")
    : [];
  return new Set(symbols.map((s) => s.toUpperCase()));
}

function readAllowlistFromDisk(): Set<string> {
  try {
    return toSymbolSet(JSON.parse(readFileSync(INDEX_JSON_PATH, "utf8")));
  } catch {
    // Not on the function filesystem — the HTTP fallback handles it.
    return new Set<string>();
  }
}

async function fetchAllowlistFromPublicAsset(
  options?: AssetOriginOptions
): Promise<Set<string>> {
  const origin = getInvestmentsAssetOrigin(options);
  if (!origin) {
    return new Set<string>();
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ALLOWLIST_TIMEOUT_MS);
  try {
    const response = await fetch(new URL(INDEX_RELATIVE_PATH, origin).toString(), {
      cache: "force-cache",
      signal: controller.signal,
    });
    if (!response.ok) {
      return new Set<string>();
    }
    return toSymbolSet(await response.json());
  } catch {
    return new Set<string>();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Resolve the curated-symbol allowlist. Tries the bundled file first (present
 * in dev and tests), then falls back to the committed public asset over HTTP
 * (the only source available inside the deployed function).
 *
 * A non-empty result is cached for the life of the process. A total miss is
 * deliberately NOT cached, so a transient failure can recover on the next
 * request instead of wedging the allowlist closed for the whole process.
 */
export async function getAllowedSymbols(
  options?: AssetOriginOptions
): Promise<ReadonlySet<string>> {
  if (cachedAllowlist && cachedAllowlist.size > 0) {
    return cachedAllowlist;
  }

  const fromDisk = readAllowlistFromDisk();
  if (fromDisk.size > 0) {
    cachedAllowlist = fromDisk;
    return cachedAllowlist;
  }

  const inflight =
    allowlistInflight ?? fetchAllowlistFromPublicAsset(options);
  allowlistInflight = inflight;
  let fromPublic: Set<string>;
  try {
    fromPublic = await inflight;
  } finally {
    if (allowlistInflight === inflight) allowlistInflight = null;
  }
  if (fromPublic.size > 0) {
    cachedAllowlist = fromPublic;
    return cachedAllowlist;
  }

  console.error(
    "finnhub: failed to resolve investments allowlist from disk or public asset"
  );
  throw new FinnhubAllowlistUnavailableError();
}

export async function isAllowedSymbol(
  symbol: string,
  options?: AssetOriginOptions
): Promise<boolean> {
  if (!isValidSymbol(symbol)) {
    return false;
  }
  const allowlist = await getAllowedSymbols(options);
  return allowlist.has(symbol.toUpperCase());
}

// Test-only: reset the cached allowlist so tests can force a re-resolve.
// Not exported through the module's public consumers.
export function __resetAllowlistCacheForTests(): void {
  cachedAllowlist = null;
  allowlistInflight = null;
}

export function __resetQuoteStateForTests(): void {
  rateLimitedUntil = 0;
  quoteCache.clear();
  quoteInflight.clear();
}

function errorQuote(symbol: string, message: string): StockQuote {
  return {
    symbol,
    price: 0,
    change: 0,
    changePercent: 0,
    dayHigh: 0,
    dayLow: 0,
    open: 0,
    previousClose: 0,
    volume: 0,
    marketCap: 0,
    name: symbol,
    error: message,
  };
}

function toFinnhubProviderSymbol(symbol: string): string {
  // The curated research universe keeps Yahoo-style BRK-B for historical
  // snapshot compatibility; Finnhub expects the US class-share form BRK.B.
  return symbol === "BRK-B" ? "BRK.B" : symbol;
}

/**
 * Fetch a live quote from Finnhub.
 * Always returns a StockQuote — sets the `error` field on failure.
 */
async function fetchFinnhubQuoteFromProvider(
  symbol: string,
  timeoutMs = TIMEOUT_MS,
): Promise<StockQuote> {
  if (!FINNHUB_API_KEY) {
    return errorQuote(symbol, TEMPORARY_ERROR);
  }

  if (Date.now() < rateLimitedUntil) {
    return errorQuote(symbol, RATE_LIMITED_ERROR);
  }

  const controller = new AbortController();
  const boundedTimeoutMs =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? Math.max(1, Math.min(TIMEOUT_MS, Math.floor(timeoutMs)))
      : TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), boundedTimeoutMs);

  try {
    const providerSymbol = toFinnhubProviderSymbol(symbol);
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(providerSymbol)}`,
      {
        headers: {
          Accept: "application/json",
          "X-Finnhub-Token": FINNHUB_API_KEY,
        },
        cache: "no-store",
        signal: controller.signal,
      }
    );

    if (res.status === 429) {
      rateLimitedUntil = Date.now() + 60_000;
      return errorQuote(symbol, RATE_LIMITED_ERROR);
    }

    if (!res.ok) {
      return errorQuote(symbol, TEMPORARY_ERROR);
    }

    const data = await res.json() as Record<string, unknown>;
    const finiteNumber = (value: unknown): number | undefined =>
      typeof value === "number" && Number.isFinite(value) ? value : undefined;
    const price = finiteNumber(data.c);
    const providerTimestampSeconds = Number(data.t);
    const providerTimestampMs = providerTimestampSeconds * 1000;
    const now = Date.now();

    if (price === undefined || price <= 0) {
      return errorQuote(symbol, NO_PRICE_ERROR);
    }
    if (
      !Number.isFinite(providerTimestampMs) ||
      providerTimestampMs <= 0 ||
      providerTimestampMs > now + 5 * 60 * 1000 ||
      now - providerTimestampMs > MAX_QUOTE_AGE_MS
    ) {
      return errorQuote(symbol, NO_PRICE_ERROR);
    }

    const change = finiteNumber(data.d);
    const changePercent = finiteNumber(data.dp);
    const dayHigh = finiteNumber(data.h);
    const dayLow = finiteNumber(data.l);
    const open = finiteNumber(data.o);
    const previousClose = finiteNumber(data.pc);
    if (
      change === undefined ||
      changePercent === undefined ||
      dayHigh === undefined ||
      dayLow === undefined ||
      open === undefined ||
      previousClose === undefined ||
      dayHigh <= 0 ||
      dayLow <= 0 ||
      open <= 0 ||
      previousClose <= 0 ||
      dayLow > open ||
      dayHigh < open ||
      dayHigh < dayLow
    ) {
      return errorQuote(symbol, NO_PRICE_ERROR);
    }

    const expectedChange = price - previousClose;
    const expectedPercent = (expectedChange / previousClose) * 100;
    if (
      Math.abs(change - expectedChange) > Math.max(0.05, previousClose * 0.001) ||
      Math.abs(changePercent - expectedPercent) > 0.15
    ) {
      return errorQuote(symbol, NO_PRICE_ERROR);
    }

    return {
      symbol,
      price,
      change,
      changePercent,
      dayHigh,
      dayLow,
      open,
      previousClose,
      volume: 0,
      marketCap: 0,
      name: symbol,
      asOf: new Date(providerTimestampMs).toISOString(),
      source: "finnhub",
    };
  } catch {
    return errorQuote(symbol, TEMPORARY_ERROR);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch a quote with per-symbol process-local caching and in-flight
 * coalescing. This does not replace a distributed provider quota, but it
 * prevents duplicate requests for the same symbol within one server instance.
 */
export async function fetchFinnhubQuote(
  symbol: string,
  options: { timeoutMs?: number } = {},
): Promise<StockQuote> {
  const upperSymbol = symbol.toUpperCase();
  const cached = quoteCache.get(upperSymbol);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.quote;
  }

  const inflight = quoteInflight.get(upperSymbol);
  if (inflight) return inflight;

  const promise = fetchFinnhubQuoteFromProvider(
    upperSymbol,
    options.timeoutMs,
  )
    .then((quote) => {
      if (!quote.error) {
        quoteCache.set(upperSymbol, {
          quote,
          expiresAt: Date.now() + QUOTE_CACHE_TTL_MS,
        });
      }
      return quote;
    })
    .finally(() => quoteInflight.delete(upperSymbol));

  quoteInflight.set(upperSymbol, promise);
  return promise;
}
