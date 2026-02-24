import { NextRequest, NextResponse } from "next/server";
import { yahooFetch, isRateLimited, isValidSymbol } from "@/lib/yahooFinance";

/**
 * Stock API Route
 * Fetches live stock data from Yahoo Finance v7/finance/quote
 *
 * Uses a SINGLE batch request for all symbols instead of N parallel requests,
 * which dramatically reduces rate-limiting risk.
 *
 * Query Parameters:
 * - symbols: comma-separated list of stock symbols (e.g., "AAPL,GOOGL,MSFT")
 */

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  volume: number;
  marketCap: number;
  name: string;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQuoteResult(symbol: string, r: any): StockQuote {
  if (!r) {
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
      error: "Symbol not found",
    };
  }
  return {
    symbol,
    price: r.regularMarketPrice ?? 0,
    change: r.regularMarketChange ?? 0,
    changePercent: r.regularMarketChangePercent ?? 0,
    dayHigh: r.regularMarketDayHigh ?? 0,
    dayLow: r.regularMarketDayLow ?? 0,
    open: r.regularMarketOpen ?? 0,
    previousClose: r.regularMarketPreviousClose ?? 0,
    volume: r.regularMarketVolume ?? 0,
    marketCap: r.marketCap ?? 0,
    name: r.shortName ?? r.longName ?? symbol,
  };
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

    const invalidQuotes = invalidSymbols.map((s) =>
      errorQuote(s, `Invalid symbol format: ${s}`)
    );

    // Nothing valid to fetch — return early
    if (validSymbols.length === 0) {
      return NextResponse.json({
        quotes: invalidQuotes,
        rateLimited: false,
        allFailed: false,
        timestamp: new Date().toISOString(),
      });
    }

    // Single batch request — far fewer API calls than fetching each symbol separately
    const fields = [
      "symbol",
      "shortName",
      "regularMarketPrice",
      "regularMarketChange",
      "regularMarketChangePercent",
      "regularMarketDayHigh",
      "regularMarketDayLow",
      "regularMarketOpen",
      "regularMarketPreviousClose",
      "regularMarketVolume",
      "marketCap",
    ].join(",");

    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${validSymbols.join(",")}&fields=${fields}`;
    const response = await yahooFetch(url);

    // Rate limited — return error quotes for all valid symbols
    if (response.status === 429) {
      const rateLimitedQuotes = validSymbols.map((s) =>
        errorQuote(s, "Rate limited — try again in a minute")
      );
      return NextResponse.json(
        {
          quotes: [...rateLimitedQuotes, ...invalidQuotes],
          rateLimited: true,
          allFailed: true,
          timestamp: new Date().toISOString(),
        },
        { status: 429 }
      );
    }

    if (!response.ok) {
      throw new Error(`Yahoo Finance returned HTTP ${response.status}`);
    }

    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any[] = data?.quoteResponse?.result ?? [];

    // Build a map for O(1) lookup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultMap = new Map<string, any>(results.map((r) => [r.symbol, r]));

    const validQuotes = validSymbols.map((symbol) =>
      mapQuoteResult(symbol, resultMap.get(symbol))
    );

    const allFailed =
      validQuotes.length > 0 && validQuotes.every((q) => q.error);

    return NextResponse.json({
      quotes: [...validQuotes, ...invalidQuotes],
      rateLimited: isRateLimited(),
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
