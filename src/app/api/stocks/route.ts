import { NextRequest, NextResponse } from "next/server";

/**
 * Stock API Route
 * Fetches live stock data from Yahoo Finance
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

    const symbolArray = symbols.split(",").map(s => s.trim().toUpperCase());

    // Use Yahoo Finance API (free, no key required)
    const quotes = await Promise.all(
      symbolArray.map(async (symbol) => {
        try {
          // Using Yahoo Finance query API
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch data for ${symbol}`);
          }

          const data = await response.json();
          const result = data.chart.result[0];
          const meta = result.meta;
          const quote = result.indicators.quote[0];

          // Calculate change and change percent
          const currentPrice = meta.regularMarketPrice || 0;
          const previousClose = meta.previousClose || meta.chartPreviousClose || 0;
          const change = currentPrice - previousClose;
          const changePercent = previousClose ? (change / previousClose) * 100 : 0;

          return {
            symbol: symbol,
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            dayHigh: meta.regularMarketDayHigh || 0,
            dayLow: meta.regularMarketDayLow || 0,
            open: quote.open?.[quote.open.length - 1] || 0,
            previousClose: previousClose,
            volume: quote.volume?.[quote.volume.length - 1] || 0,
            marketCap: 0, // Not available in this endpoint
            name: meta.symbol,
          } as StockQuote;
        } catch (error) {
          console.error(`Error fetching ${symbol}:`, error);
          return {
            symbol: symbol,
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
            error: 'Failed to fetch data'
          } as StockQuote & { error: string };
        }
      })
    );

    return NextResponse.json({
      quotes,
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
