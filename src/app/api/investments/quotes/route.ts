import { NextRequest, NextResponse } from "next/server";

/**
 * Investments Quotes Route
 * Thin proxy over /api/stocks — keeps the investments layer decoupled.
 *
 * GET /api/investments/quotes?symbols=AAPL,MSFT
 */
export async function GET(request: NextRequest) {
  const symbols = request.nextUrl.searchParams.get("symbols");

  if (!symbols) {
    return NextResponse.json({ error: "symbols parameter is required" }, { status: 400 });
  }

  const stocksUrl = new URL("/api/stocks", request.nextUrl.origin);
  stocksUrl.searchParams.set("symbols", symbols);

  try {
    const res = await fetch(stocksUrl.toString(), { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Investments quotes proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}
