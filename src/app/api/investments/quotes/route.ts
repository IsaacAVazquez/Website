import { NextRequest, NextResponse } from "next/server";
import type { StockQuote } from "@/types/investment";
import { isValidSymbol, yahooFetch } from "@/lib/yahooFinance";

const TEMPORARY_QUOTE_ERROR =
  "Live price is temporarily unavailable. Showing the latest saved data instead.";
const RATE_LIMITED_QUOTE_ERROR =
  "Live price is temporarily unavailable right now. Try again in a few minutes.";
const INVALID_SYMBOL_QUOTE_ERROR = "This symbol is not eligible for live pricing.";
const NO_PRICE_DATA_ERROR = "Live price is unavailable for this symbol right now.";

/**
 * Investments Quotes Route
 * Direct Yahoo chart fetch for portfolio quotes.
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
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean);

    const validSymbols = symbolArray.filter(isValidSymbol);
    const invalidQuotes = symbolArray
      .filter((symbol) => !isValidSymbol(symbol))
      .map((symbol) => errorQuote(symbol, INVALID_SYMBOL_QUOTE_ERROR));

    if (validSymbols.length === 0) {
      return NextResponse.json({
        quotes: invalidQuotes,
        rateLimited: false,
        allFailed: false,
        timestamp: new Date().toISOString(),
      });
    }

    const validQuotes = await Promise.all(validSymbols.map(fetchQuote));
    const allFailed = validQuotes.length > 0 && validQuotes.every((quote) => quote.error);

    return NextResponse.json({
      quotes: [...validQuotes, ...invalidQuotes],
      rateLimited: validQuotes.some((quote) => quote.error === RATE_LIMITED_QUOTE_ERROR),
      allFailed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Investments quotes proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 502 });
  }
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

async function fetchQuote(symbol: string): Promise<StockQuote> {
  try {
    const response = await yahooFetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      8_000
    );

    if (!response.ok) {
      return errorQuote(
        symbol,
        response.status === 429 ? RATE_LIMITED_QUOTE_ERROR : TEMPORARY_QUOTE_ERROR
      );
    }

    const data = await response.json();
    const meta = data?.chart?.result?.[0]?.meta ?? {};
    const price = meta.regularMarketPrice ?? 0;
    const previousClose = meta.previousClose ?? meta.chartPreviousClose ?? 0;
    const change = price - previousClose;
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;

    if (!price) {
      return errorQuote(symbol, NO_PRICE_DATA_ERROR);
    }

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
    };
  } catch {
    return errorQuote(symbol, TEMPORARY_QUOTE_ERROR);
  }
}
