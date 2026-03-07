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

  const TIMEOUT_MS = 12000;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(stocksUrl.toString(), {
        cache: "no-store",
        signal: controller.signal,
      });
      const data = await res.json();
      return NextResponse.json(data, {
        status: res.ok ? 200 : res.status,
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("Investments quotes proxy error:", error);
    const message = error instanceof Error && error.name === "AbortError"
      ? "Quote fetch timed out"
      : "Failed to fetch quotes";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
