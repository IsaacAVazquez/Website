import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import type { InvestmentSection } from "@/types/investment";

const DATA_DIR = join(process.cwd(), "public", "data", "investments");

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

function isValidSymbol(symbol: string): boolean {
  return /^[A-Z0-9.\-]{1,10}$/.test(symbol);
}

function isValidSection(section: string): section is InvestmentSection {
  return (VALID_SECTIONS as string[]).includes(section);
}

/** Allow transcript_{YEAR}_{QUARTER} dynamic sections */
function isTranscriptSection(section: string): boolean {
  return /^transcript_\d{4}_\d{1,2}$/.test(section);
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
    const indexPath = join(DATA_DIR, "index.json");
    let index: { symbols: string[] };
    try {
      const indexRaw = await readFile(indexPath, "utf-8");
      index = JSON.parse(indexRaw);
    } catch {
      return NextResponse.json(
        { error: "Investment data not available. Run: npm run update:investments" },
        { status: 503 }
      );
    }

    if (!index.symbols.includes(symbol)) {
      return NextResponse.json(
        { error: `Symbol ${symbol} not in pre-fetched data. Add it to scripts/investments_symbols.txt and run: npm run update:investments` },
        { status: 404 }
      );
    }

    const filePath = join(DATA_DIR, symbol, `${section}.json`);
    let data: unknown;
    try {
      const raw = await readFile(filePath, "utf-8");
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: `Section "${section}" not available for ${symbol}` },
        { status: 404 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Investments data API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
