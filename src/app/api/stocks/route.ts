import { NextRequest, NextResponse } from "next/server";
import { isValidSymbol, fetchFinnhubQuote } from "@/lib/finnhub";

/**
 * Stock API Route
 * Fetches live stock data via Finnhub.
 *
 * Query Parameters:
 * - symbols: comma-separated list of stock symbols (e.g., "AAPL,GOOGL,MSFT")
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbols = searchParams.get("symbols");

    if (!symbols) {
      return NextResponse.json(
        { error: "Symbols parameter is required" },
        { status: 400 }
      );
    }

    const symbolArray = symbols
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    const validSymbols = symbolArray.filter(isValidSymbol);
    const invalidSymbols = symbolArray.filter((s) => !isValidSymbol(s));

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
      error: `Invalid symbol format: ${s}`,
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
      rateLimited: false,
      allFailed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stock API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
