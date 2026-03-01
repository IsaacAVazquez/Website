"use client";

import { useState, useEffect, useRef } from "react";
import type { InvestmentSection } from "@/types/investment";

interface UseStockDataState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isNotFetched: boolean;
}

// In-memory cache: `${symbol}:${section}` → data
const cache = new Map<string, unknown>();
// In-flight promise cache to deduplicate concurrent requests
const inflight = new Map<string, Promise<unknown>>();

async function fetchSection<T>(symbol: string, section: string): Promise<T> {
  const key = `${symbol}:${section}`;

  if (cache.has(key)) return cache.get(key) as T;

  if (!inflight.has(key)) {
    const promise = fetch(`/api/investments/data/${symbol}?section=${section}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw Object.assign(new Error(data.error ?? "Not found"), { status: res.status });
        cache.set(key, data);
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
): UseStockDataState<T> {
  const [state, setState] = useState<UseStockDataState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isNotFetched: false,
  });
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!symbol) {
      setState({ data: null, isLoading: false, error: null, isNotFetched: false });
      return;
    }

    const upperSymbol = symbol.toUpperCase();
    const key = `${upperSymbol}:${section}`;

    // Serve from cache immediately if available
    if (cache.has(key)) {
      setState({ data: cache.get(key) as T, isLoading: false, error: null, isNotFetched: false });
      return;
    }

    setState({ data: null, isLoading: true, error: null, isNotFetched: false });

    fetchSection<T>(upperSymbol, section)
      .then((data) => {
        if (!isMounted.current) return;
        setState({ data, isLoading: false, error: null, isNotFetched: false });
      })
      .catch((err: Error & { status?: number }) => {
        if (!isMounted.current) return;
        const isNotFetched = err.status === 404 || err.status === 503;
        setState({ data: null, isLoading: false, error: err.message, isNotFetched });
      });
  }, [symbol, section]);

  return state;
}
