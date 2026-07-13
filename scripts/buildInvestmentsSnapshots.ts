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
// Raw per-section fetch output (script-only, never deployed).
const RAW_DIR = path.join(PROJECT_ROOT, "data", "investments-raw");
// Deployed artifacts: index.json + per-symbol snapshot.json.
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public", "data", "investments");
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
  const rawSymbolDir = path.join(RAW_DIR, symbol);
  const rawSections = await RAW_SECTIONS.reduce<Promise<Record<string, unknown>>>(
    async (promise, section) => {
      const acc = await promise;
      const data = await readJson<unknown>(path.join(rawSymbolDir, `${section}.json`));
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
    // Stale-served symbols (recovered by fetch_investments_data.py from a
    // prior snapshot when their fetch failed) have no raw sections on disk.
    // Keep serving the committed snapshot instead of failing the whole build.
    if (Object.keys(rawSections).length === 0) {
      const priorSnapshot = await readJson<unknown>(
        path.join(PUBLIC_DIR, symbol, "snapshot.json")
      );
      if (priorSnapshot !== undefined) {
        console.warn(
          `[${symbol}] No raw sections on disk — keeping the existing snapshot (stale-served).`
        );
        return;
      }
    }
    throw new Error(
      `Missing raw sections for ${symbol}: ${missingRequiredSections.join(", ")}. Run fetch_investments_data.py before building snapshots.`
    );
  }

  const snapshot = buildInvestmentSnapshot(symbol, lastUpdated, rawSections);
  const publicSymbolDir = path.join(PUBLIC_DIR, symbol);
  await fs.mkdir(publicSymbolDir, { recursive: true });
  await writeJsonAtomic(
    path.join(publicSymbolDir, "snapshot.json"),
    `${JSON.stringify(snapshot, null, 2)}\n`
  );
  // NOTE: previously we deleted every per-section raw file here ("legacy
  // cleanup"). That meant any future bug in buildInvestmentSnapshot forced
  // a full ~25-min Python re-fetch to recover. We keep the raw files in
  // data/investments-raw/ so a snapshot rebuild is a fast local-only
  // operation — and out of public/ so they never ship with a deploy.
}

async function main() {
  const index = await readJson<InvestmentsIndex>(path.join(PUBLIC_DIR, "index.json"));
  if (!index) {
    throw new Error("Missing public/data/investments/index.json");
  }

  // Use allSettled so one failing symbol does not abort the others and leave
  // the deployed public/data/investments set half-applied. Successful symbols
  // still complete; failures are collected, logged, and surfaced via a
  // non-zero exit code so CI does not silently pass a partial refresh.
  const staleSymbols = new Set(
    (index.entries ?? [])
      .filter((entry) => entry.stale)
      .map((entry) => entry.symbol.toUpperCase())
  );

  const results = await Promise.allSettled(
    index.symbols.map(async (symbol) => {
      if (staleSymbols.has(symbol.toUpperCase())) {
        // The latest provider fetch failed. Keep the committed snapshot and its
        // original per-section timestamps rather than rebuilding old raw files
        // with this run's global `lastUpdated` value.
        console.warn(
          `[${symbol}] Latest fetch failed — keeping the existing snapshot and freshness metadata.`
        );
        return;
      }
      await buildSymbolSnapshot(symbol, index.lastUpdated);
    })
  );

  const failures = results.flatMap((result, i) =>
    result.status === "rejected"
      ? [{ symbol: index.symbols[i], reason: result.reason as unknown }]
      : []
  );

  if (failures.length > 0) {
    for (const { symbol, reason } of failures) {
      console.error(
        `[${symbol}] Failed to build snapshot:`,
        reason instanceof Error ? reason.message : reason
      );
    }
    console.error(
      `Investment snapshot build completed with ${failures.length} of ${index.symbols.length} symbol(s) failing.`
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Failed to build investment snapshots:", error);
  process.exitCode = 1;
});
