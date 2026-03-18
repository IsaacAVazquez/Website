import type { InvestmentIndexEntry, InvestmentsIndex } from "@/types/investment";

function normalizeName(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
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
  const shortName = normalizeName(entry.shortName, symbol);
  const longName = normalizeName(entry.longName, shortName);

  return {
    symbol,
    shortName,
    longName,
    searchText: normalizeName(entry.searchText, buildSearchText({ symbol, shortName, longName })),
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
      })
    );
  });

  return {
    ...index,
    symbols: index.symbols.map((symbol) => symbol.trim().toUpperCase()),
    entries: index.symbols
      .map((symbol) => bySymbol.get(symbol.trim().toUpperCase()))
      .filter((entry): entry is InvestmentIndexEntry => !!entry),
  };
}
