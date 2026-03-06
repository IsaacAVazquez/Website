"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { InvestmentSection } from "@/types/investment";

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

async function fetchWithRetry<T>(url: string, retries = 2, delay = 1000): Promise<T> {
  let lastError: Error & { status?: number } = new Error("Fetch failed");

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        const err = Object.assign(new Error(data.error ?? "Not found"), { status: res.status });
        // Only retry on 5xx, not 4xx
        if (res.status >= 500 && attempt < retries) {
          lastError = err;
          await new Promise((r) => setTimeout(r, delay * (attempt + 1)));
          continue;
        }
        throw err;
      }

      return data as T;
    } catch (err) {
      lastError = err as Error & { status?: number };
      // Don't retry HTTP client errors
      if (lastError.status && lastError.status < 500) throw lastError;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delay * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

async function fetchSection<T>(symbol: string, section: string): Promise<T> {
  const key = `${symbol}:${section}`;

  // Serve from cache if fresh
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }

  if (!inflight.has(key)) {
    const promise = fetchWithRetry<T>(
      `/api/investments/data/${symbol}?section=${section}`
    )
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
