import { NextRequest, NextResponse } from "next/server";
import type { InvestmentSection } from "@/types/investment";
import { getInvestmentContext, getInvestmentDataEnvelope } from "@/lib/investmentsData";

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
  "revenue_segments",
  "beta",
  "news",
  "dcf",
  "info",
  "officers",
];

function isValidSymbol(symbol: string): boolean {
  return /^[A-Z0-9.-]{1,10}$/.test(symbol);
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

    if (!isValidSymbol(symbol)) {
      return NextResponse.json({ error: "Invalid symbol" }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const section = searchParams.get("section") ?? "fundamentals";

    if (!isValidSection(section)) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }

    const options = { assetOrigin: request.nextUrl.origin };
    const context = await getInvestmentContext(symbol, options);
    const envelope = await getInvestmentDataEnvelope(symbol, section, context, options);

    return NextResponse.json(envelope, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    const err = error as Error & {
      status?: number;
      source?: string;
      capabilities?: Record<string, boolean>;
      lastUpdated?: string | null;
      freshness?: unknown;
    };
    console.error("Investments data API error:", error);
    return NextResponse.json(
      {
        error: err.message || "Internal server error",
        source: err.source,
        capabilities: err.capabilities,
        lastUpdated: err.lastUpdated ?? null,
        freshness: err.freshness ?? null,
      },
      { status: err.status ?? 500 }
    );
  }
}
