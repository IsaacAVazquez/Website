import { NextRequest, NextResponse } from "next/server";
import type { StockQuote } from "@/types/investment";
import { getAllowedSymbols, fetchFinnhubQuote } from "@/lib/finnhub";
import { apiRateLimiter, rateLimitResponse } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

const RATE_LIMITED_ERROR =
  "Live price is temporarily unavailable right now. Try again in a few minutes.";
const INVALID_SYMBOL_ERROR = "This symbol is not eligible for live pricing.";
const MAX_SYMBOLS_PER_REQUEST = 25;
const SUCCESS_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
};
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
}

/**
 * Investments Quotes Route
 * Fetches live portfolio quotes via Finnhub.
 *
 * Hardening:
 *  - Per-IP rate limit (30 req/min) backed by the in-process apiRateLimiter
 *  - Allowlist of curated symbols (public/data/investments/index.json)
 *  - Caps to 25 symbols per request
 *  - Caches successful responses 30s + 60s SWR; errors get no-store
 *
 * GET /api/investments/quotes?symbols=AAPL,MSFT
 */
export async function GET(request: NextRequest) {
  // Rate limit by client IP only (no user-agent), so a single noisy IP can't
  // bypass the limit by varying its user-agent string.
  const clientIp = getClientIp(request);
  const rate = apiRateLimiter.check(`quotes:${clientIp}`);
  if (!rate.success) {
    return rateLimitResponse(rate);
  }

  const symbols = request.nextUrl.searchParams.get("symbols");

  if (!symbols) {
    return NextResponse.json(
      { error: "symbols parameter is required" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const symbolArray = symbols
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (symbolArray.length > MAX_SYMBOLS_PER_REQUEST) {
      return NextResponse.json(
        {
          error: `Too many symbols. Limit is ${MAX_SYMBOLS_PER_REQUEST} per request.`,
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const allowlist = await getAllowedSymbols();
    const validSymbols = symbolArray.filter((s) => allowlist.has(s));
    const invalidQuotes: StockQuote[] = symbolArray
      .filter((s) => !allowlist.has(s))
      .map((s) => ({
        symbol: s,
        price: 0,
        change: 0,
        changePercent: 0,
        dayHigh: 0,
        dayLow: 0,
        open: 0,
        previousClose: 0,
        volume: 0,
        marketCap: 0,
        name: s,
        error: INVALID_SYMBOL_ERROR,
      }));

    if (validSymbols.length === 0) {
      return NextResponse.json(
        {
          quotes: invalidQuotes,
          rateLimited: false,
          allFailed: false,
          timestamp: new Date().toISOString(),
        },
        { headers: SUCCESS_CACHE_HEADERS }
      );
    }

    const validQuotes = await Promise.all(validSymbols.map(fetchFinnhubQuote));
    const allFailed = validQuotes.length > 0 && validQuotes.every((q) => q.error);

    return NextResponse.json(
      {
        quotes: [...validQuotes, ...invalidQuotes],
        rateLimited: validQuotes.some((q) => q.error === RATE_LIMITED_ERROR),
        allFailed,
        timestamp: new Date().toISOString(),
      },
      { headers: SUCCESS_CACHE_HEADERS }
    );
  } catch (error) {
    logger.error("Investments quotes proxy error", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 502, headers: NO_STORE_HEADERS }
    );
  }
}
