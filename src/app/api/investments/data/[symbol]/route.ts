import { NextRequest, NextResponse } from "next/server";
import type { InvestmentSection } from "@/types/investment";
import { getInvestmentContext, getInvestmentDataEnvelope } from "@/lib/investmentsData";
import { FinnhubAllowlistUnavailableError, isAllowedSymbol } from "@/lib/finnhub";
import { logger } from "@/lib/logger";
import { buildQueryCacheHeaders, NO_STORE_HEADERS } from "@/lib/apiCacheHeaders";

const VALID_SECTIONS: InvestmentSection[] = [
  "price",
  "fundamentals",
  "profitability",
  "margins",
  "growth",
  "income_statement",
  "balance_sheet",
  "cash_flow",
  "wacc",
  "industry",
  "beta",
  "news",
  "info",
  "officers",
];

const SUCCESS_CACHE_HEADERS = buildQueryCacheHeaders(
  "public, max-age=3600, stale-while-revalidate=86400"
);

/**
 * Strict symbol shape. Forbids leading dots/dashes and consecutive
 * separators; requires at least one alphanumeric and capped at 10 chars.
 */
function isValidSymbolFormat(symbol: string): boolean {
  if (typeof symbol !== "string" || symbol.length === 0 || symbol.length > 10) {
    return false;
  }
  return /^[A-Z][A-Z0-9]*([.-][A-Z0-9]+)*$/.test(symbol);
}

function isValidSection(section: string): section is InvestmentSection {
  return (VALID_SECTIONS as string[]).includes(section);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol: rawSymbol } = await params;
    const symbol = rawSymbol.toUpperCase();

    // Validate format BEFORE doing any filesystem access.
    if (!isValidSymbolFormat(symbol)) {
      return NextResponse.json(
        { error: "Invalid symbol" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Reject symbols outside the curated universe BEFORE doing any
    // filesystem access. The allowlist is loaded once at module init and
    // shared with the quote proxies.
    if (!(await isAllowedSymbol(symbol, { assetOrigin: request.nextUrl.origin }))) {
      return NextResponse.json(
        { error: "Symbol not found" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const section = searchParams.get("section") ?? "fundamentals";

    if (!isValidSection(section)) {
      return NextResponse.json(
        { error: "Invalid section" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const options = { assetOrigin: request.nextUrl.origin };
    const context = await getInvestmentContext(symbol, options);
    const envelope = await getInvestmentDataEnvelope(symbol, section, context, options);

    return NextResponse.json(envelope, {
      headers: SUCCESS_CACHE_HEADERS,
    });
  } catch (error) {
    if (error instanceof FinnhubAllowlistUnavailableError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: NO_STORE_HEADERS }
      );
    }

    const err = error as Error & { status?: number };
    logger.error("Investments data API error", error);
    const status = err.status ?? 500;
    const message =
      status === 404
        ? "Symbol not found"
        : status === 400
          ? "Invalid symbol"
          : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status, headers: NO_STORE_HEADERS }
    );
  }
}
