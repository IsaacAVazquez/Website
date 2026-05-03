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
// Loaded once from public/data/investments/index.json at module init time
// (server-only) and cached for the life of the process. The allowlist is the
// authoritative gate for the unauthenticated /api/investments/quotes and
// /api/stocks proxies — only symbols Isaac has chosen to research can hit
// the paid Finnhub key.
const INDEX_JSON_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "investments",
  "index.json"
);

let cachedAllowlist: Set<string> | null = null;

function loadAllowlist(): Set<string> {
  if (cachedAllowlist) {
    return cachedAllowlist;
  }
  try {
    const raw = readFileSync(INDEX_JSON_PATH, "utf8");
    const parsed = JSON.parse(raw) as { symbols?: unknown };
    const symbols = Array.isArray(parsed.symbols)
      ? parsed.symbols.filter((s): s is string => typeof s === "string")
      : [];
    cachedAllowlist = new Set(symbols.map((s) => s.toUpperCase()));
  } catch (error) {
    // If the index is missing or unreadable we fail closed — no symbols
    // are allowed through the proxy.
    console.error("finnhub: failed to load investments allowlist:", error);
    cachedAllowlist = new Set<string>();
  }
  return cachedAllowlist;
}

export function isAllowedSymbol(symbol: string): boolean {
  if (!isValidSymbol(symbol)) {
    return false;
  }
  return loadAllowlist().has(symbol.toUpperCase());
}

export function getAllowedSymbols(): ReadonlySet<string> {
  return loadAllowlist();
}

// Test-only: reset the cached allowlist so tests can force a re-read.
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
