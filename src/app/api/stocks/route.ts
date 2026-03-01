import { NextRequest, NextResponse } from "next/server";
import { isValidSymbol } from "@/lib/yahooFinance";

/**
 * Stock API Route
 * Fetches live stock data from Yahoo Finance v8/finance/chart
 *
 * Uses parallel per-symbol requests with browser-like Referer/Origin headers,
 * which bypasses the crumb authentication requirement for v8 chart endpoints.
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

/** Fetch price data from Yahoo Finance v8 chart endpoint (no crumb needed with browser headers) */
async function fetchFromChartAPI(symbols: string[]): Promise<StockQuote[]> {
  const USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
        {
          headers: {
            "User-Agent": USER_AGENT,
            Accept: "application/json",
            Referer: "https://finance.yahoo.com/",
            Origin: "https://finance.yahoo.com",
            "Accept-Language": "en-US,en;q=0.5",
          },
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

    // Fetch all symbols in parallel via v8 chart (browser headers bypass crumb requirement)
    const validQuotes = await fetchFromChartAPI(validSymbols);

    const allFailed =
      validQuotes.length > 0 && validQuotes.every((q) => q.error);

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
