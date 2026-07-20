import type { InvestmentIndexEntry, InvestmentsIndex } from "@/types/investment";
import { getCuratedCompanyName } from "@/lib/investmentCompanyNames";

function normalizeName(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function normalizeSearchText(value: string | undefined, fallback: string): string {
  return normalizeName(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchText(entry: Pick<InvestmentIndexEntry, "symbol" | "shortName" | "longName">): string {
  return `${entry.symbol} ${entry.shortName} ${entry.longName}`
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeInvestmentIndexEntry(
  entry: Partial<InvestmentIndexEntry> & { symbol: string }
): InvestmentIndexEntry {
  const symbol = entry.symbol.trim().toUpperCase();
  const curatedCompanyName = getCuratedCompanyName(symbol);
  const rawShortName = normalizeName(entry.shortName, symbol);
  const rawLongName = normalizeName(entry.longName, rawShortName);
  const shortName =
    rawShortName !== symbol ? rawShortName : curatedCompanyName ?? rawShortName;
  const longName =
    rawLongName !== symbol ? rawLongName : curatedCompanyName ?? shortName;
  const fallbackSearchText = buildSearchText({ symbol, shortName, longName });
  const symbolOnlySearchText = buildSearchText({
    symbol,
    shortName: symbol,
    longName: symbol,
  });
  const rawSearchText = normalizeSearchText(entry.searchText, fallbackSearchText);

  return {
    symbol,
    shortName,
    longName,
    searchText:
      rawSearchText === symbolOnlySearchText ? fallbackSearchText : rawSearchText,
    ...(entry.stale ? { stale: true } : {}),
    ...(entry.asOf ? { asOf: entry.asOf } : {}),
    ...(entry.priceAsOf ? { priceAsOf: entry.priceAsOf } : {}),
    ...(entry.priceDelayed ? { priceDelayed: true } : {}),
    ...(entry.partial ? { partial: true } : {}),
    ...(entry.retainedSections?.length
      ? { retainedSections: [...entry.retainedSections] }
      : {}),
  };
}

export function normalizeInvestmentsIndex(index: InvestmentsIndex): InvestmentsIndex {
  const fallbackEntries = index.symbols.map((symbol) =>
    normalizeInvestmentIndexEntry({ symbol })
  );

  const suppliedEntries = Array.isArray(index.entries)
    ? index.entries
        .filter((entry): entry is InvestmentIndexEntry => !!entry && typeof entry.symbol === "string")
        .map((entry) => normalizeInvestmentIndexEntry(entry))
    : [];

  const bySymbol = new Map<string, InvestmentIndexEntry>();

  fallbackEntries.forEach((entry) => bySymbol.set(entry.symbol, entry));
  suppliedEntries.forEach((entry) => {
    const base = bySymbol.get(entry.symbol);
    bySymbol.set(
      entry.symbol,
      normalizeInvestmentIndexEntry({
        symbol: entry.symbol,
        shortName: entry.shortName || base?.shortName || entry.symbol,
        longName: entry.longName || base?.longName || entry.shortName || entry.symbol,
        searchText: entry.searchText,
        stale: entry.stale,
        asOf: entry.asOf,
        priceAsOf: entry.priceAsOf,
        priceDelayed: entry.priceDelayed,
        partial: entry.partial,
        retainedSections: entry.retainedSections,
      })
    );
  });

  const entries = index.symbols
    .map((symbol) => bySymbol.get(symbol.trim().toUpperCase()))
    .filter((entry): entry is InvestmentIndexEntry => !!entry);
  const derivedStaleCount = entries.filter((entry) => entry.stale).length;

  return {
    ...index,
    symbols: index.symbols.map((symbol) => symbol.trim().toUpperCase()),
    freshCount: index.freshCount ?? Math.max(0, entries.length - derivedStaleCount),
    staleCount: index.staleCount ?? derivedStaleCount,
    partialCount: index.partialCount ?? entries.filter((entry) => entry.partial).length,
    entries,
  };
}
