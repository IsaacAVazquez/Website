import { NextRequest, NextResponse } from "next/server";
import type { InvestmentSection } from "@/types/investment";
import { promises as fsAsync, readFileSync } from "fs";
import path from "path";
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

/**
 * Resolve the base directory for pre-built investment JSON files.
 *
 * In Next.js, files in `public/` are served statically but are also available
 * on the filesystem at build time. During local dev the working directory is
 * the project root, so `public/data/investments` works directly. On Netlify
 * (and other hosts) the working directory may differ, so we also try
 * `process.cwd()` and a path relative to this source file.
 */
function getDataDir(): string {
  // Next.js sets process.cwd() to the project root in both dev and prod
  return path.join(process.cwd(), "public", "data", "investments");
}

/** Read and parse a JSON file from the investments data directory. Returns null if missing. */
async function readJsonFile(filePath: string): Promise<unknown | null> {
  try {
    const content = await fsAsync.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/** Synchronous JSON file read for use in non-async helpers */
function readJsonFileSync(filePath: string): unknown | null {
  try {
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
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

    const dataDir = getDataDir();

    // Verify the symbol is in the pre-fetched index
    const indexData = await readJsonFile(path.join(dataDir, "index.json"));
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
        const waccRaw = readJsonFileSync(path.join(dataDir, symbol, "wacc.json"));
        const fundRaw = readJsonFileSync(path.join(dataDir, symbol, "fundamentals.json"));
        const growthRaw = readJsonFileSync(path.join(dataDir, symbol, "growth.json"));
        const priceRaw = readJsonFileSync(path.join(dataDir, symbol, "price.json"));
        const dcfData = computeDcf(waccRaw, fundRaw, growthRaw, priceRaw);
        return NextResponse.json(dcfData, {
          headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
        });
      } catch {
        return NextResponse.json({ error: "DCF calculation failed" }, { status: 500 });
      }
    }

    if (section === "industry") {
      const industryData = await readJsonFile(path.join(dataDir, symbol, "industry.json"));
      if (!industryData) {
        return NextResponse.json(
          { error: `Section "industry" not available for ${symbol}` },
          { status: 404 }
        );
      }
      const fundRaw = readJsonFileSync(path.join(dataDir, symbol, "fundamentals.json"));
      const profRaw = readJsonFileSync(path.join(dataDir, symbol, "profitability.json"));
      const marginsRaw = readJsonFileSync(path.join(dataDir, symbol, "margins.json"));
      const transformed = transformIndustryWithStockValues(industryData, fundRaw, profRaw, marginsRaw);
      return NextResponse.json(transformed, {
        headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
      });
    }

    const data = await readJsonFile(path.join(dataDir, symbol, `${section}.json`));
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
