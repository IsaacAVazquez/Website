import { NextRequest, NextResponse } from "next/server";
import type { InvestmentSection } from "@/types/investment";
import {
  transformSection,
  transformIndustryWithStockValues,
  computeDcf,
  isTranscriptSection,
} from "@/lib/investmentTransforms";

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
  "transcripts",
  "news",
  "dcf",
  "info",
  "officers",
];

async function fetchJsonFile(
  request: NextRequest,
  symbol: string | null,
  fileName: string
): Promise<unknown | null> {
  const pathname = symbol
    ? `/data/investments/${symbol}/${fileName}`
    : `/data/investments/${fileName}`;

  const fileUrl = new URL(pathname, request.nextUrl.origin);

  try {
    const response = await fetch(fileUrl, {
      next: { revalidate: 3600 },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch ${pathname}: HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Investments data file fetch error:", error);
    return null;
  }
}

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

    if (!isValidSection(section) && !isTranscriptSection(section)) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }

    // Verify the symbol is in the pre-fetched index
    const indexData = await fetchJsonFile(request, null, "index.json");
    if (!indexData) {
      return NextResponse.json(
        { error: "Investment data not available. Run: npm run update:investments" },
        { status: 503 }
      );
    }
    const index = indexData as { symbols: string[] };

    if (!index.symbols.includes(symbol)) {
      return NextResponse.json(
        { error: `Symbol ${symbol} not in pre-fetched data` },
        { status: 404 }
      );
    }

    if (section === "dcf") {
      try {
        const [waccRaw, fundRaw, growthRaw, priceRaw] = await Promise.all([
          fetchJsonFile(request, symbol, "wacc.json"),
          fetchJsonFile(request, symbol, "fundamentals.json"),
          fetchJsonFile(request, symbol, "growth.json"),
          fetchJsonFile(request, symbol, "price.json"),
        ]);
        const dcfData = computeDcf(waccRaw, fundRaw, growthRaw, priceRaw);
        return NextResponse.json(dcfData, {
          headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
        });
      } catch {
        return NextResponse.json({ error: "DCF calculation failed" }, { status: 500 });
      }
    }

    if (section === "industry") {
      const industryData = await fetchJsonFile(request, symbol, "industry.json");
      if (!industryData) {
        return NextResponse.json(
          { error: `Section "industry" not available for ${symbol}` },
          { status: 404 }
        );
      }
      const [fundRaw, profRaw, marginsRaw] = await Promise.all([
        fetchJsonFile(request, symbol, "fundamentals.json"),
        fetchJsonFile(request, symbol, "profitability.json"),
        fetchJsonFile(request, symbol, "margins.json"),
      ]);
      const transformed = transformIndustryWithStockValues(industryData, fundRaw, profRaw, marginsRaw);
      return NextResponse.json(transformed, {
        headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
      });
    }

    const data = await fetchJsonFile(request, symbol, `${section}.json`);
    if (!data) {
      return NextResponse.json(
        { error: `Section "${section}" not available for ${symbol}` },
        { status: 404 }
      );
    }
    const transformed = transformSection(section, data);

    return NextResponse.json(transformed, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Investments data API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
