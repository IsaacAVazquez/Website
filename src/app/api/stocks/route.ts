import { NextRequest, NextResponse } from "next/server";
import { isAllowedSymbol, fetchFinnhubQuote } from "@/lib/finnhub";
import { apiRateLimiter, rateLimitResponse } from "@/lib/rateLimit";

/**
 * Stock API Route
 * Fetches live stock data via Finnhub.
 *
 * Hardening:
 *  - Per-IP rate limit (30 req/min) backed by the in-process apiRateLimiter
 *  - Allowlist of curated symbols (public/data/investments/index.json)
 *  - Caps to 25 symbols per request
 *  - Caches successful responses 30s + 60s SWR; errors get no-store
 *
 * Query Parameters:
 * - symbols: comma-separated list of stock symbols (e.g., "AAPL,GOOGL,MSFT")
 */

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

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rate = apiRateLimiter.check(`stocks:${clientIp}`);
  if (!rate.success) {
    return rateLimitResponse(rate);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const symbols = searchParams.get("symbols");

    if (!symbols) {
      return NextResponse.json(
        { error: "Symbols parameter is required" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

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

    const validSymbols = symbolArray.filter(isAllowedSymbol);
    const invalidSymbols = symbolArray.filter((s) => !isAllowedSymbol(s));

    const invalidQuotes = invalidSymbols.map((s) => ({
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
      error: `Invalid symbol: ${s}`,
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
        rateLimited: false,
        allFailed,
        timestamp: new Date().toISOString(),
      },
      { headers: SUCCESS_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Stock API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
