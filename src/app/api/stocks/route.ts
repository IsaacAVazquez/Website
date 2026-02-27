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

/** Fallback: fetch price data from Yahoo Finance v8 chart endpoint (no crumb needed) */
async function fallbackToChartAPI(symbols: string[]): Promise<StockQuote[]> {
  const USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
        {
          headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
          cache: "no-store",
        }
      );
      if (!res.ok) return errorQuote(symbol, `HTTP ${res.status}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json();
      const meta = data?.chart?.result?.[0]?.meta ?? {};
      const price: number = meta.regularMarketPrice ?? 0;
      const previousClose: number = meta.previousClose ?? meta.chartPreviousClose ?? 0;
      const change = price - previousClose;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;
      if (!price) return errorQuote(symbol, "No price data");
      return {
        symbol,
        price,
        change,
        changePercent,
        dayHigh: meta.regularMarketDayHigh ?? 0,
        dayLow: meta.regularMarketDayLow ?? 0,
        open: meta.regularMarketOpen ?? 0,
        previousClose,
        volume: meta.regularMarketVolume ?? 0,
        marketCap: 0,
        name: meta.shortName ?? meta.longName ?? symbol,
      } satisfies StockQuote;
    })
  );

  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : errorQuote(symbols[i], "Failed to fetch")
  );
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

    let validQuotes: StockQuote[];

    if (!response.ok) {
      // v7 failed — fall back to individual v8 chart requests (no auth required)
      console.warn(`Yahoo Finance v7 returned HTTP ${response.status}, falling back to v8 chart`);
      validQuotes = await fallbackToChartAPI(validSymbols);
    } else {
      const data = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: any[] = data?.quoteResponse?.result ?? [];

      // Build a map for O(1) lookup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultMap = new Map<string, any>(results.map((r) => [r.symbol, r]));
      validQuotes = validSymbols.map((symbol) =>
        mapQuoteResult(symbol, resultMap.get(symbol))
      );

      // If all failed via v7, fall back to v8 chart
      if (validQuotes.length > 0 && validQuotes.every((q) => q.error)) {
        console.warn("All v7 quotes failed, falling back to v8 chart");
        validQuotes = await fallbackToChartAPI(validSymbols);
      }
    }

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
