/**
 * Finnhub quote client
 *
 * Replaces Yahoo Finance for live stock prices.
 * Free tier: 60 req/min.
 *
 * Quote endpoint returns: { c, d, dp, h, l, o, pc, t }
 * (current, change, changePercent, high, low, open, prevClose, timestamp)
 */

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

export function isValidSymbol(symbol: string): boolean {
  return /^[A-Z]{1,5}(-[A-Z])?(\.[A-Z]{1,2})?$/.test(symbol);
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
