"use client";

import type { InvestmentSnapshot, InvestmentsIndex } from "@/types/investment";
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

async function fetchJson<T>(url: string, fallbackMessage: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      response.status === 404 ? fallbackMessage : `Failed to load ${url}: HTTP ${response.status}`
    );
  }
  return response.json() as Promise<T>;
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

  const promise = fetchJson<InvestmentsIndex>(
    "/data/investments/index.json",
    "Curated research index is temporarily unavailable."
  )
    .then((data) => {
      const normalized = normalizeInvestmentsIndex(data);
      indexCache.set(cacheKey, { data: normalized, timestamp: Date.now() });
      return normalized;
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

  const promise = fetchJson<InvestmentSnapshot>(
    `/data/investments/${encodeURIComponent(upperSymbol)}/snapshot.json`,
    "Research is currently available for curated symbols only."
  )
    .then((data) => {
      snapshotCache.set(upperSymbol, { data, timestamp: Date.now() });
      return data;
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
