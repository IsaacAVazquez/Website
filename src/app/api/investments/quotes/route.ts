import { NextRequest, NextResponse } from "next/server";
import type { StockQuote } from "@/types/investment";
import {
  FinnhubAllowlistUnavailableError,
  getAllowedSymbols,
  isValidSymbol,
} from "@/lib/finnhub";
import { fetchQuotesWithConcurrency } from "@/lib/investmentsQuoteBatch";
import {
  getClientIp,
  investmentsQuoteRateLimiter,
  rateLimitResponse,
} from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { buildQueryCacheHeaders, NO_STORE_HEADERS } from "@/lib/apiCacheHeaders";

const RATE_LIMITED_ERROR =
  "Live price is temporarily unavailable right now. Try again in a few minutes.";
const INVALID_SYMBOL_ERROR = "This symbol is not eligible for live pricing.";
const MAX_SYMBOLS_PER_REQUEST = 25;
const SUCCESS_CACHE_HEADERS = buildQueryCacheHeaders(
  "public, max-age=30, stale-while-revalidate=60"
);

/**
 * Investments Quotes Route
 * Fetches live portfolio quotes via Finnhub.
 *
 * Hardening:
 *  - Dedicated per-IP limit (7 req/min) for market-data fan-out
 *  - Allowlist of curated symbols (public/data/investments/index.json)
 *  - Caps to 25 symbols per request
 *  - Stops provider fan-out after a six-second route budget
 *  - Caches successful responses 30s + 60s SWR; errors get no-store
 *
 * GET /api/investments/quotes?symbols=AAPL,MSFT
 */
export async function GET(request: NextRequest) {
  // Rate limit by client IP only (no user-agent), so a single noisy IP can't
  // bypass the limit by varying its user-agent string.
  const clientIp = getClientIp(request);
  const rate = investmentsQuoteRateLimiter.check(`quotes:${clientIp}`);
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
    const rawSymbols = symbols.split(",").map((s) => s.trim().toUpperCase());

    if (rawSymbols.some((symbol) => !isValidSymbol(symbol))) {
      return NextResponse.json(
        { error: "One or more symbols are invalid." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const symbolArray = Array.from(new Set(rawSymbols));

    if (symbolArray.length > MAX_SYMBOLS_PER_REQUEST) {
      return NextResponse.json(
        {
          error: `Too many symbols. Limit is ${MAX_SYMBOLS_PER_REQUEST} per request.`,
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const allowlist = await getAllowedSymbols({
      assetOrigin: request.nextUrl.origin,
    });
    const validSymbols = symbolArray.filter((symbol) => allowlist.has(symbol));
    const invalidQuotes: StockQuote[] = symbolArray
      .filter((symbol) => !allowlist.has(symbol))
      .map((symbol) => ({
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
        error: INVALID_SYMBOL_ERROR,
      }));

    if (validSymbols.length === 0) {
      return NextResponse.json(
        {
          error: INVALID_SYMBOL_ERROR,
          quotes: invalidQuotes,
          rateLimited: false,
          allFailed: false,
          timestamp: new Date().toISOString(),
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const validQuotes = await fetchQuotesWithConcurrency(validSymbols);
    const failedQuotes = validQuotes.filter((quote) => quote.error);
    const allFailed = failedQuotes.length === validQuotes.length;
    const rateLimited = failedQuotes.some(
      (quote) => quote.error === RATE_LIMITED_ERROR
    );
    const quotes = [...validQuotes, ...invalidQuotes];

    return NextResponse.json(
      {
        quotes,
        rateLimited,
        allFailed,
        timestamp: new Date().toISOString(),
      },
      {
        status: allFailed ? 503 : 200,
        headers:
          failedQuotes.length > 0 || invalidQuotes.length > 0
            ? NO_STORE_HEADERS
            : SUCCESS_CACHE_HEADERS,
      }
    );
  } catch (error) {
    if (error instanceof FinnhubAllowlistUnavailableError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: NO_STORE_HEADERS }
      );
    }

    logger.error("Investments quotes proxy error", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 502, headers: NO_STORE_HEADERS }
    );
  }
}
