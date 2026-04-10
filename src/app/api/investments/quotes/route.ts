import { NextRequest, NextResponse } from "next/server";
import type { StockQuote } from "@/types/investment";
import { isValidSymbol, fetchFinnhubQuote } from "@/lib/finnhub";

const RATE_LIMITED_ERROR =
  "Live price is temporarily unavailable right now. Try again in a few minutes.";
const INVALID_SYMBOL_ERROR = "This symbol is not eligible for live pricing.";

/**
 * Investments Quotes Route
 * Fetches live portfolio quotes via Finnhub.
 *
 * GET /api/investments/quotes?symbols=AAPL,MSFT
 */
export async function GET(request: NextRequest) {
  const symbols = request.nextUrl.searchParams.get("symbols");

  if (!symbols) {
    return NextResponse.json({ error: "symbols parameter is required" }, { status: 400 });
  }

  try {
    const symbolArray = symbols
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    const validSymbols = symbolArray.filter(isValidSymbol);
    const invalidQuotes: StockQuote[] = symbolArray
      .filter((s) => !isValidSymbol(s))
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
      return NextResponse.json({
        quotes: invalidQuotes,
        rateLimited: false,
        allFailed: false,
        timestamp: new Date().toISOString(),
      });
    }

    const validQuotes = await Promise.all(validSymbols.map(fetchFinnhubQuote));
    const allFailed = validQuotes.length > 0 && validQuotes.every((q) => q.error);

    return NextResponse.json({
      quotes: [...validQuotes, ...invalidQuotes],
      rateLimited: validQuotes.some((q) => q.error === RATE_LIMITED_ERROR),
      allFailed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Investments quotes proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 502 });
  }
}
