import { NextRequest, NextResponse } from "next/server";

/**
 * Detailed Stock Data API Route
 * Fetches comprehensive stock data including analyst ratings from Yahoo Finance
 *
 * Query Parameters:
 * - symbol: stock ticker symbol (e.g., "AAPL")
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol")?.toUpperCase();

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 }
    );
  }

  try {
    const [chartData, summaryData] = await Promise.allSettled([
      fetchChartData(symbol),
      fetchSummaryData(symbol),
    ]);

    const chart = chartData.status === "fulfilled" ? chartData.value : null;
    const summary = summaryData.status === "fulfilled" ? summaryData.value : null;

    if (!chart && !summary) {
      return NextResponse.json(
        { error: `Failed to fetch data for ${symbol}` },
        { status: 500 }
      );
    }

    const detail = buildStockDetail(symbol, chart, summary);

    return NextResponse.json(detail, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error(`Error fetching detail for ${symbol}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch data for ${symbol}` },
      { status: 500 }
    );
  }
}

async function fetchChartData(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`Chart fetch failed: ${res.status}`);
  return res.json();
}

async function fetchSummaryData(symbol: string) {
  const modules = [
    "financialData",
    "recommendationTrend",
    "summaryDetail",
    "defaultKeyStatistics",
    "assetProfile",
  ].join(",");

  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${modules}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`Summary fetch failed: ${res.status}`);
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeRaw(obj: any, path: string[], fallback: number | null = null): number | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = obj;
  for (const key of path) {
    if (cur == null) return fallback;
    cur = cur[key];
  }
  if (cur == null) return fallback;
  // Yahoo Finance wraps values in { raw, fmt } objects
  if (typeof cur === "object" && "raw" in cur) return cur.raw ?? fallback;
  if (typeof cur === "number") return cur;
  return fallback;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeStr(obj: any, path: string[], fallback = ""): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = obj;
  for (const key of path) {
    if (cur == null) return fallback;
    cur = cur[key];
  }
  if (typeof cur === "string") return cur;
  return fallback;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildStockDetail(symbol: string, chart: any, summary: any) {
  // Chart data (price, daily change)
  const meta = chart?.chart?.result?.[0]?.meta ?? {};
  const currentPrice: number = meta.regularMarketPrice ?? 0;
  const previousClose: number = meta.previousClose ?? meta.chartPreviousClose ?? 0;
  const change: number = currentPrice - previousClose;
  const changePercent: number = previousClose ? (change / previousClose) * 100 : 0;

  // Summary modules
  const fd = summary?.quoteSummary?.result?.[0]?.financialData ?? {};
  const rt = summary?.quoteSummary?.result?.[0]?.recommendationTrend?.trend ?? [];
  const sd = summary?.quoteSummary?.result?.[0]?.summaryDetail ?? {};
  const ks = summary?.quoteSummary?.result?.[0]?.defaultKeyStatistics ?? {};
  const ap = summary?.quoteSummary?.result?.[0]?.assetProfile ?? {};

  // Analyst consensus from current month trend
  const currentTrend = rt[0] ?? {};
  const strongBuy: number = currentTrend.strongBuy ?? 0;
  const buy: number = currentTrend.buy ?? 0;
  const hold: number = currentTrend.hold ?? 0;
  const sell: number = currentTrend.sell ?? 0;
  const strongSell: number = currentTrend.strongSell ?? 0;
  const totalAnalysts = strongBuy + buy + hold + sell + strongSell;

  // Recommendation mean: 1=Strong Buy, 2=Buy, 3=Hold, 4=Sell, 5=Strong Sell
  const recommendationMean: number = safeRaw(fd, ["recommendationMean"]) ?? 3;
  const recommendationKey: string = safeStr(fd, ["recommendationKey"]) || "hold";

  return {
    symbol,
    name: safeStr(ap, ["longName"]) || safeStr(ap, ["shortName"]) || symbol,
    sector: safeStr(ap, ["sector"]),
    industry: safeStr(ap, ["industry"]),
    description: safeStr(ap, ["longBusinessSummary"]),
    website: safeStr(ap, ["website"]),
    employees: safeRaw(ap, ["fullTimeEmployees"]),

    // Price data
    price: currentPrice,
    change,
    changePercent,
    open: safeRaw(meta, ["regularMarketOpen"]) ?? 0,
    dayHigh: safeRaw(meta, ["regularMarketDayHigh"]) ?? 0,
    dayLow: safeRaw(meta, ["regularMarketDayLow"]) ?? 0,
    previousClose,
    volume: safeRaw(meta, ["regularMarketVolume"]) ?? 0,

    // 52-week
    fiftyTwoWeekHigh: safeRaw(sd, ["fiftyTwoWeekHigh"]) ?? safeRaw(meta, ["fiftyTwoWeekHigh"]),
    fiftyTwoWeekLow: safeRaw(sd, ["fiftyTwoWeekLow"]) ?? safeRaw(meta, ["fiftyTwoWeekLow"]),
    fiftyTwoWeekChange: safeRaw(ks, ["52WeekChange"]),

    // Moving averages
    fiftyDayAverage: safeRaw(sd, ["fiftyDayAverage"]),
    twoHundredDayAverage: safeRaw(sd, ["twoHundredDayAverage"]),

    // Valuation
    marketCap: safeRaw(sd, ["marketCap"]) ?? safeRaw(meta, ["marketCap"]) ?? 0,
    enterpriseValue: safeRaw(ks, ["enterpriseValue"]),
    trailingPE: safeRaw(sd, ["trailingPE"]),
    forwardPE: safeRaw(sd, ["forwardPE"]) ?? safeRaw(ks, ["forwardPE"]),
    pegRatio: safeRaw(ks, ["pegRatio"]),
    priceToBook: safeRaw(ks, ["priceToBook"]),
    bookValue: safeRaw(ks, ["bookValue"]),

    // Profitability
    profitMargins: safeRaw(fd, ["profitMargins"]) ?? safeRaw(ks, ["profitMargins"]),
    operatingMargins: safeRaw(fd, ["operatingMargins"]),
    grossMargins: safeRaw(fd, ["grossMargins"]),
    returnOnAssets: safeRaw(fd, ["returnOnAssets"]),
    returnOnEquity: safeRaw(fd, ["returnOnEquity"]),

    // Growth
    revenueGrowth: safeRaw(fd, ["revenueGrowth"]),
    earningsGrowth: safeRaw(fd, ["earningsGrowth"]),

    // Income / balance
    totalRevenue: safeRaw(fd, ["totalRevenue"]),
    totalCash: safeRaw(fd, ["totalCash"]),
    totalDebt: safeRaw(fd, ["totalDebt"]),

    // Dividends
    dividendYield: safeRaw(sd, ["dividendYield"]),
    dividendRate: safeRaw(sd, ["dividendRate"]),
    payoutRatio: safeRaw(sd, ["payoutRatio"]),

    // Risk
    beta: safeRaw(sd, ["beta"]),

    // Volume
    averageVolume: safeRaw(sd, ["averageVolume"]),

    // Analyst ratings
    analyst: {
      recommendationMean,
      recommendationKey,
      targetHighPrice: safeRaw(fd, ["targetHighPrice"]),
      targetLowPrice: safeRaw(fd, ["targetLowPrice"]),
      targetMeanPrice: safeRaw(fd, ["targetMeanPrice"]),
      targetMedianPrice: safeRaw(fd, ["targetMedianPrice"]),
      numberOfAnalysts: safeRaw(fd, ["numberOfAnalystOpinions"]) ?? totalAnalysts,
      breakdown: { strongBuy, buy, hold, sell, strongSell, total: totalAnalysts },
    },
  };
}
