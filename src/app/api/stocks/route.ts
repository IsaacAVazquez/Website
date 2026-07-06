import { NextResponse } from "next/server";

/**
 * Deprecated and retired: /api/stocks.
 *
 * This was an orphaned near-duplicate of /api/investments/quotes (same Finnhub
 * allowlist and quote shape) with no first-party consumer, yet it still spent
 * Finnhub quota. It now returns 410 Gone with Deprecation/Sunset headers so any
 * lingering caller fails loudly and can migrate to /api/investments/quotes.
 */

// 2026-07-06 (a Monday) — the date this route was retired.
const SUNSET_DATE = "Mon, 06 Jul 2026 00:00:00 GMT";

export function GET(): NextResponse {
  return NextResponse.json(
    {
      error: "Gone",
      message: "/api/stocks has been retired. Use /api/investments/quotes instead.",
    },
    {
      status: 410,
      headers: {
        Deprecation: "true",
        Sunset: SUNSET_DATE,
        Link: '</api/investments/quotes>; rel="successor-version"',
        "Cache-Control": "no-store",
      },
    }
  );
}
