/**
 * Finnhub quote client
 *
 * Replaces Yahoo Finance for live stock prices.
 * Free tier: 60 req/min.
 *
 * Quote endpoint returns: { c, d, dp, h, l, o, pc, t }
 * (current, change, changePercent, high, low, open, prevClose, timestamp)
 */

import { readFileSync } from "fs";
import path from "path";
import type { StockQuote } from "@/types/investment";
import { getInvestmentsAssetOrigin } from "@/lib/investmentsAssetOrigin";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY ?? "";
const TIMEOUT_MS = 8_000;

const TEMPORARY_ERROR = "Live price is temporarily unavailable. Showing the latest saved data instead.";
const RATE_LIMITED_ERROR = "Live price is temporarily unavailable right now. Try again in a few minutes.";
const NO_PRICE_ERROR = "Live price is unavailable for this symbol right now.";

// Module-level rate limit tracker
let rateLimitedUntil = 0;

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
// It is sourced from public/data/investments/index.json. In dev and tests that
// file is on disk, but inside the deployed Netlify function it is stripped from
// the bundle (excluded from output file tracing in next.config.mjs and removed
// by the netlify.toml build command), so a plain readFileSync throws ENOENT and
// the allowlist would otherwise fail closed for every symbol. We therefore fall
// back to fetching the committed public asset over HTTP — exactly how the
// curated-data loader (investmentsData.ts) resolves the same file.
const INDEX_RELATIVE_PATH = "/data/investments/index.json";
const INDEX_JSON_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "investments",
  "index.json"
);

let cachedAllowlist: Set<string> | null = null;

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

async function fetchAllowlistFromPublicAsset(): Promise<Set<string>> {
  const origin = getInvestmentsAssetOrigin();
  if (!origin) {
    return new Set<string>();
  }
  try {
    const response = await fetch(new URL(INDEX_RELATIVE_PATH, origin).toString(), {
      cache: "force-cache",
    });
    if (!response.ok) {
      return new Set<string>();
    }
    return toSymbolSet(await response.json());
  } catch {
    return new Set<string>();
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
export async function getAllowedSymbols(): Promise<ReadonlySet<string>> {
  if (cachedAllowlist && cachedAllowlist.size > 0) {
    return cachedAllowlist;
  }

  const fromDisk = readAllowlistFromDisk();
  if (fromDisk.size > 0) {
    cachedAllowlist = fromDisk;
    return cachedAllowlist;
  }

  const fromPublic = await fetchAllowlistFromPublicAsset();
  if (fromPublic.size > 0) {
    cachedAllowlist = fromPublic;
    return cachedAllowlist;
  }

  console.error(
    "finnhub: failed to resolve investments allowlist from disk or public asset"
  );
  return new Set<string>();
}

export async function isAllowedSymbol(symbol: string): Promise<boolean> {
  if (!isValidSymbol(symbol)) {
    return false;
  }
  const allowlist = await getAllowedSymbols();
  return allowlist.has(symbol.toUpperCase());
}

// Test-only: reset the cached allowlist so tests can force a re-resolve.
// Not exported through the module's public consumers.
export function __resetAllowlistCacheForTests(): void {
  cachedAllowlist = null;
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

/**
 * Fetch a live quote from Finnhub.
 * Always returns a StockQuote — sets the `error` field on failure.
 */
export async function fetchFinnhubQuote(symbol: string): Promise<StockQuote> {
  if (!FINNHUB_API_KEY) {
    return errorQuote(symbol, TEMPORARY_ERROR);
  }

  if (Date.now() < rateLimitedUntil) {
    return errorQuote(symbol, RATE_LIMITED_ERROR);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`,
      {
        headers: { Accept: "application/json" },
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

    const data = await res.json();
    const price: number = data.c ?? 0;

    if (!price) {
      return errorQuote(symbol, NO_PRICE_ERROR);
    }

    return {
      symbol,
      price,
      change: data.d ?? 0,
      changePercent: data.dp ?? 0,
      dayHigh: data.h ?? 0,
      dayLow: data.l ?? 0,
      open: data.o ?? 0,
      previousClose: data.pc ?? 0,
      volume: 0,
      marketCap: 0,
      name: symbol,
    };
  } catch {
    return errorQuote(symbol, TEMPORARY_ERROR);
  } finally {
    clearTimeout(timeoutId);
  }
}
