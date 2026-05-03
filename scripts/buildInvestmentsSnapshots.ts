import { promises as fs } from "fs";
import path from "path";
import { buildInvestmentSnapshot } from "../src/lib/investmentSnapshot";
import type { InvestmentsIndex } from "../src/types/investment";

type RawSectionName =
  | "info"
  | "fundamentals"
  | "profitability"
  | "margins"
  | "growth"
  | "income_statement"
  | "balance_sheet"
  | "cash_flow"
  | "wacc"
  | "industry"
  | "beta"
  | "news"
  | "price"
  | "officers";

const PROJECT_ROOT = process.cwd();
const DATA_DIR = path.join(PROJECT_ROOT, "public", "data", "investments");
const RAW_SECTIONS: RawSectionName[] = [
  "info",
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
  "price",
  "officers",
];
const REQUIRED_RAW_SECTIONS: RawSectionName[] = [
  "info",
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
  "price",
];

async function readJson<T>(filePath: string): Promise<T | undefined> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

/**
 * Atomically write `content` to `filePath`. Writes to a temp file in the
 * same directory and then renames over the destination. This avoids
 * leaving truncated/half-written files if the process is interrupted
 * mid-write, which the prior direct write was vulnerable to.
 */
async function writeJsonAtomic(filePath: string, content: string): Promise<void> {
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, content, "utf8");
  await fs.rename(tmpPath, filePath);
}

async function buildSymbolSnapshot(
  symbol: string,
  lastUpdated: string | null
): Promise<void> {
  const symbolDir = path.join(DATA_DIR, symbol);
  const rawSections = await RAW_SECTIONS.reduce<Promise<Record<string, unknown>>>(
    async (promise, section) => {
      const acc = await promise;
      const data = await readJson<unknown>(path.join(symbolDir, `${section}.json`));
      if (data !== undefined) {
        acc[section] = data;
      }
      return acc;
    },
    Promise.resolve({})
  );

  const missingRequiredSections = REQUIRED_RAW_SECTIONS.filter(
    (section) => rawSections[section] === undefined
  );
  if (missingRequiredSections.length > 0) {
    throw new Error(
      `Missing raw sections for ${symbol}: ${missingRequiredSections.join(", ")}. Run fetch_investments_data.py before building snapshots.`
    );
  }

  const snapshot = buildInvestmentSnapshot(symbol, lastUpdated, rawSections);
  await writeJsonAtomic(
    path.join(symbolDir, "snapshot.json"),
    `${JSON.stringify(snapshot, null, 2)}\n`
  );
  // NOTE: previously we deleted every per-section raw file here ("legacy
  // cleanup"). That meant any future bug in buildInvestmentSnapshot forced
  // a full ~25-min Python re-fetch to recover. We now keep the raw files
  // on disk so a snapshot rebuild is a fast local-only operation. Disk
  // usage for the curated universe is small (~a few MB).
}

async function main() {
  const index = await readJson<InvestmentsIndex>(path.join(DATA_DIR, "index.json"));
  if (!index) {
    throw new Error("Missing public/data/investments/index.json");
  }

  await Promise.all(
    index.symbols.map((symbol) => buildSymbolSnapshot(symbol, index.lastUpdated))
  );
}

main().catch((error) => {
  console.error("Failed to build investment snapshots:", error);
  process.exitCode = 1;
});
