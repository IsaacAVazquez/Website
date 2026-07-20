import { promises as fs } from "fs";
import path from "path";
import { buildInvestmentSnapshot } from "../src/lib/investmentSnapshot";
import {
  getPriceAsOf,
  mergeInvestmentSnapshots,
  normalizeInvestmentSnapshot,
} from "../src/lib/investmentFreshness";
import {
  buildInvestmentsPriceHealth,
  isRecentInvestmentPrice,
} from "../src/lib/investmentsPriceHealth";
import type {
  InvestmentIndexEntry,
  InvestmentSnapshot,
  InvestmentsIndex,
} from "../src/types/investment";

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
const PRICE_HEALTH_MAX_AGE_DAYS = Number.parseInt(
  process.env.MAX_PRICE_AGE_DAYS ?? "7",
  10
);

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

  const builtSnapshot = buildInvestmentSnapshot(symbol, lastUpdated, rawSections);
  const priorSnapshot = await readJson<InvestmentSnapshot>(
    path.join(PUBLIC_DIR, symbol, "snapshot.json")
  );
  const snapshot = priorSnapshot
    ? mergeInvestmentSnapshots(builtSnapshot, priorSnapshot)
    : builtSnapshot;
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

async function sanitizeExistingSnapshot(symbol: string): Promise<void> {
  const snapshotPath = path.join(PUBLIC_DIR, symbol, "snapshot.json");
  const priorSnapshot = await readJson<InvestmentSnapshot>(snapshotPath);
  if (!priorSnapshot) {
    throw new Error(`Missing retained snapshot for stale symbol ${symbol}`);
  }

  const normalized = normalizeInvestmentSnapshot(priorSnapshot);
  await writeJsonAtomic(snapshotPath, `${JSON.stringify(normalized, null, 2)}\n`);
}

async function enrichIndexPriceHealth(
  index: InvestmentsIndex
): Promise<InvestmentsIndex> {
  const existingEntries = new Map(
    (index.entries ?? []).map((entry) => [entry.symbol.toUpperCase(), entry])
  );
  const priceDates: Array<string | null> = [];

  const entries = await Promise.all(
    index.symbols.map(async (symbol): Promise<InvestmentIndexEntry> => {
      const upperSymbol = symbol.toUpperCase();
      const prior = existingEntries.get(upperSymbol);
      const snapshot = await readJson<InvestmentSnapshot>(
        path.join(PUBLIC_DIR, upperSymbol, "snapshot.json")
      );
      const priceAsOf =
        snapshot?.freshness?.sections?.price ??
        getPriceAsOf(snapshot?.sections?.price);
      const isDelayed = !isRecentInvestmentPrice(
        priceAsOf,
        index.lastUpdated,
        PRICE_HEALTH_MAX_AGE_DAYS
      );
      const hasRetainedSections =
        (snapshot?.freshness?.retainedSections?.length ?? 0) > 0;
      const retainedSections = snapshot?.freshness?.retainedSections ?? [];

      priceDates.push(priceAsOf);

      return {
        symbol: upperSymbol,
        shortName: prior?.shortName ?? upperSymbol,
        longName: prior?.longName ?? prior?.shortName ?? upperSymbol,
        searchText: prior?.searchText ?? upperSymbol.toLowerCase(),
        // `stale` is reserved for a failed fetch recovered from an earlier
        // snapshot. Delayed price data and retained optional sections are
        // separate quality dimensions and must not rewrite fetch counts.
        ...(prior?.stale && prior.asOf ? { stale: true } : {}),
        ...(isDelayed ? { priceDelayed: true } : {}),
        ...(hasRetainedSections
          ? { partial: true, retainedSections }
          : {}),
        ...(prior?.asOf ? { asOf: prior.asOf } : {}),
        ...(priceAsOf ? { priceAsOf } : {}),
      };
    })
  );

  const priceHealth = buildInvestmentsPriceHealth(
    priceDates,
    index.lastUpdated,
    PRICE_HEALTH_MAX_AGE_DAYS
  );
  const derivedStaleCount = entries.filter((entry) => entry.stale).length;
  const reportedFreshCount = index.freshCount;
  const reportedStaleCount = index.staleCount;
  const countsReconcile =
    typeof reportedStaleCount === "number" &&
    Number.isInteger(reportedStaleCount) &&
    typeof reportedFreshCount === "number" &&
    Number.isInteger(reportedFreshCount) &&
    reportedStaleCount === derivedStaleCount &&
    reportedFreshCount + reportedStaleCount === entries.length;
  const staleCount = countsReconcile ? reportedStaleCount : derivedStaleCount;
  const freshCount = countsReconcile
    ? reportedFreshCount
    : Math.max(0, entries.length - staleCount);
  const partialCount = entries.filter((entry) => entry.partial).length;

  return {
    ...index,
    freshCount,
    staleCount,
    partialCount,
    entries,
    priceHealth,
  };
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
      .filter((entry) => entry.stale && entry.asOf)
      .map((entry) => entry.symbol.toUpperCase())
  );

  const results = await Promise.allSettled(
    index.symbols.map(async (symbol) => {
      if (staleSymbols.has(symbol.toUpperCase())) {
        // The latest provider fetch failed. Keep the committed snapshot and its
        // original per-section timestamps rather than rebuilding old raw files
        // with this run's global `lastUpdated` value. Re-normalize the retained
        // artifact so legacy error placeholders and retired sections cannot
        // remain reachable through the public static file.
        console.warn(
          `[${symbol}] Latest fetch failed — keeping the existing snapshot and freshness metadata.`
        );
        await sanitizeExistingSnapshot(symbol);
        return;
      }
      const rawPrice = await readJson<unknown>(
        path.join(RAW_DIR, symbol, "price.json")
      );
      const rawPriceAsOf = getPriceAsOf(rawPrice);
      if (
        rawPrice !== undefined &&
        !isRecentInvestmentPrice(
          rawPriceAsOf,
          index.lastUpdated,
          PRICE_HEALTH_MAX_AGE_DAYS
        )
      ) {
        console.warn(
          `[${symbol}] Raw price history is delayed (${rawPriceAsOf ?? "missing"}) — retaining the existing snapshot.`
        );
        await sanitizeExistingSnapshot(symbol);
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

  const enrichedIndex = await enrichIndexPriceHealth(index);
  await writeJsonAtomic(
    path.join(PUBLIC_DIR, "index.json"),
    `${JSON.stringify(enrichedIndex, null, 2)}\n`
  );
}

main().catch((error) => {
  console.error("Failed to build investment snapshots:", error);
  process.exitCode = 1;
});
