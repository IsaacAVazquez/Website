"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { InvestmentSection } from "@/types/investment";
import {
  transformSection,
  transformIndustryWithStockValues,
  computeDcf,
  isTranscriptSection,
} from "@/lib/investmentTransforms";

interface UseStockDataState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isNotFetched: boolean;
  lastUpdated: number | null;
}

export interface UseStockDataReturn<T> extends UseStockDataState<T> {
  refetch: () => void;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory cache: `${symbol}:${section}` → { data, timestamp }
const cache = new Map<string, { data: unknown; timestamp: number }>();
// In-flight promise cache to deduplicate concurrent requests
const inflight = new Map<string, Promise<unknown>>();

/** Fetch a single raw JSON file from the CDN. Returns null on 404. */
async function fetchCdnJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  }
  return res.json() as Promise<T>;
}

/** Fetch raw JSON, apply transforms, and handle composite sections (dcf, industry). */
async function fetchAndTransform<T>(symbol: string, section: string): Promise<T> {
  const base = `/data/investments/${symbol}`;

  // --- DCF: needs 4 files ---
  if (section === "dcf") {
    const [waccRaw, fundRaw, growthRaw, priceRaw] = await Promise.all([
      fetchCdnJson(`${base}/wacc.json`),
      fetchCdnJson(`${base}/fundamentals.json`),
      fetchCdnJson(`${base}/growth.json`),
      fetchCdnJson(`${base}/price.json`),
    ]);
    return computeDcf(waccRaw, fundRaw, growthRaw, priceRaw) as T;
  }

  // --- Industry: needs industry + fundamentals + profitability + margins ---
  if (section === "industry") {
    const [industryRaw, fundRaw, profRaw, marginsRaw] = await Promise.all([
      fetchCdnJson(`${base}/industry.json`),
      fetchCdnJson(`${base}/fundamentals.json`),
      fetchCdnJson(`${base}/profitability.json`),
      fetchCdnJson(`${base}/margins.json`),
    ]);
    if (!industryRaw) {
      throw Object.assign(
        new Error(`Section "industry" not available for ${symbol}`),
        { status: 404 },
      );
    }
    return transformIndustryWithStockValues(industryRaw, fundRaw, profRaw, marginsRaw) as T;
  }

  // --- Individual transcript ---
  if (isTranscriptSection(section)) {
    const raw = await fetchCdnJson(`${base}/transcripts.json`);
    if (!raw) {
      throw Object.assign(new Error(`Transcripts not available for ${symbol}`), { status: 404 });
    }
    return transformSection(section, raw) as T;
  }

  // --- Standard single-file sections ---
  const raw = await fetchCdnJson(`${base}/${section}.json`);
  if (!raw) {
    throw Object.assign(
      new Error(`Section "${section}" not available for ${symbol}`),
      { status: 404 },
    );
  }
  return transformSection(section, raw) as T;
}

async function fetchSection<T>(symbol: string, section: string): Promise<T> {
  const key = `${symbol}:${section}`;

  // Serve from cache if fresh
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }

  if (!inflight.has(key)) {
    const promise = fetchAndTransform<T>(symbol, section)
      .then((data) => {
        cache.set(key, { data, timestamp: Date.now() });
        return data;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, promise);
  }

  return inflight.get(key) as Promise<T>;
}

export function useStockData<T>(
  symbol: string | null,
  section: InvestmentSection | string
): UseStockDataReturn<T> {
  const [state, setState] = useState<UseStockDataState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isNotFetched: false,
    lastUpdated: null,
  });
  const isMounted = useRef(true);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!symbol) {
      setState({ data: null, isLoading: false, error: null, isNotFetched: false, lastUpdated: null });
      return;
    }

    const upperSymbol = symbol.toUpperCase();
    const key = `${upperSymbol}:${section}`;

    // Serve from cache immediately if fresh
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setState({ data: cached.data as T, isLoading: false, error: null, isNotFetched: false, lastUpdated: cached.timestamp });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    fetchSection<T>(upperSymbol, section)
      .then((data) => {
        if (!isMounted.current) return;
        const entry = cache.get(key);
        setState({ data, isLoading: false, error: null, isNotFetched: false, lastUpdated: entry?.timestamp ?? Date.now() });
      })
      .catch((err: Error & { status?: number }) => {
        if (!isMounted.current) return;
        const isNotFetched = err.status === 404 || err.status === 503;
        setState({ data: null, isLoading: false, error: err.message, isNotFetched, lastUpdated: null });
      });
  }, [symbol, section, fetchKey]);

  const refetch = useCallback(() => {
    if (!symbol) return;
    const key = `${symbol.toUpperCase()}:${section}`;
    cache.delete(key);
    setFetchKey((k) => k + 1);
  }, [symbol, section]);

  return { ...state, refetch };
}
