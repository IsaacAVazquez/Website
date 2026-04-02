"use client";

import type {
  InvestmentCapabilities,
  InvestmentDataSource,
  InvestmentSnapshot,
  InvestmentsIndex,
} from "@/types/investment";
import { normalizeInvestmentSnapshot } from "@/lib/investmentFreshness";
import { normalizeInvestmentsIndex } from "@/lib/investmentsIndex";

type CachedEntry<T> = {
  data: T;
  timestamp: number;
};

const INDEX_TTL_MS = 5 * 60 * 1000;
const SNAPSHOT_TTL_MS = 5 * 60 * 1000;

const indexCache = new Map<string, CachedEntry<InvestmentsIndex>>();
const snapshotCache = new Map<string, CachedEntry<InvestmentSnapshot>>();
const indexInflight = new Map<string, Promise<InvestmentsIndex>>();
const snapshotInflight = new Map<string, Promise<InvestmentSnapshot>>();

export interface ClientInvestmentDataError extends Error {
  status: number;
  source: InvestmentDataSource | null;
  capabilities: InvestmentCapabilities;
  lastUpdated: string | null;
}

function createClientInvestmentDataError(
  message: string,
  options: {
    status: number;
    source?: InvestmentDataSource | null;
    capabilities?: InvestmentCapabilities;
    lastUpdated?: string | null;
  }
): ClientInvestmentDataError {
  return Object.assign(new Error(message), {
    status: options.status,
    source: options.source ?? "prefetched",
    capabilities: options.capabilities ?? {},
    lastUpdated: options.lastUpdated ?? null,
  });
}

async function fetchJson<T>(url: string): Promise<{ data: T; status: number }> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw Object.assign(new Error(`Failed to load ${url}: HTTP ${response.status}`), {
        status: response.status,
      });
    }

    return {
      data: (await response.json()) as T,
      status: response.status,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      "status" in error &&
      typeof (error as { status?: unknown }).status === "number"
    ) {
      throw error;
    }

    throw Object.assign(new Error(`Failed to load ${url}`), { status: 503 });
  }
}

export async function getClientInvestmentsIndex(): Promise<InvestmentsIndex> {
  const cacheKey = "index";
  const cached = indexCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < INDEX_TTL_MS) {
    return cached.data;
  }

  const existing = indexInflight.get(cacheKey);
  if (existing) {
    return existing;
  }

  const promise = fetchJson<InvestmentsIndex>("/data/investments/index.json")
    .then((data) => {
      const normalized = normalizeInvestmentsIndex(data.data);
      indexCache.set(cacheKey, { data: normalized, timestamp: Date.now() });
      return normalized;
    })
    .catch(() => {
      throw createClientInvestmentDataError(
        "The research universe is temporarily unavailable.",
        { status: 503 }
      );
    })
    .finally(() => indexInflight.delete(cacheKey));

  indexInflight.set(cacheKey, promise);
  return promise;
}

export async function getClientInvestmentSnapshot(
  symbol: string
): Promise<InvestmentSnapshot> {
  const upperSymbol = symbol.toUpperCase();
  const cached = snapshotCache.get(upperSymbol);
  if (cached && Date.now() - cached.timestamp < SNAPSHOT_TTL_MS) {
    return cached.data;
  }

  const existing = snapshotInflight.get(upperSymbol);
  if (existing) {
    return existing;
  }

  const promise = getClientInvestmentsIndex()
    .then(async (index) => {
      if (!index.symbols.includes(upperSymbol)) {
        throw createClientInvestmentDataError(
          `${upperSymbol} is not in the curated research universe.`,
          {
            status: 404,
            lastUpdated: index.lastUpdated,
          }
        );
      }

      try {
        const snapshotResponse = await fetchJson<InvestmentSnapshot>(
          `/data/investments/${encodeURIComponent(upperSymbol)}/snapshot.json`
        );
        const snapshot = normalizeInvestmentSnapshot(snapshotResponse.data);
        snapshotCache.set(upperSymbol, {
          data: snapshot,
          timestamp: Date.now(),
        });
        return snapshot;
      } catch {
        throw createClientInvestmentDataError(
          `Curated research data for ${upperSymbol} is temporarily unavailable.`,
          {
            status: 503,
            lastUpdated: index.lastUpdated,
          }
        );
      }
    })
    .finally(() => snapshotInflight.delete(upperSymbol));

  snapshotInflight.set(upperSymbol, promise);
  return promise;
}

export function clearClientInvestmentDataCaches() {
  indexCache.clear();
  snapshotCache.clear();
  indexInflight.clear();
  snapshotInflight.clear();
}

export const clearClientInvestmentDataCachesForTests = clearClientInvestmentDataCaches;
