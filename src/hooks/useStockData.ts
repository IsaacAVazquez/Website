"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type {
  InvestmentCapabilities,
  InvestmentDataEnvelope,
  InvestmentDataSource,
  InvestmentSection,
} from "@/types/investment";

interface UseStockDataState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isNotFetched: boolean;
  lastUpdated: string | null;
  source: InvestmentDataSource | null;
  capabilities: InvestmentCapabilities;
}

export interface UseStockDataReturn<T> extends UseStockDataState<T> {
  refetch: () => void;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const EMPTY_CAPABILITIES: InvestmentCapabilities = {};
const EMPTY_STATE = {
  data: null,
  isLoading: false,
  error: null,
  isNotFetched: false,
  lastUpdated: null,
  source: null,
  capabilities: EMPTY_CAPABILITIES,
} as const;

// In-memory cache: `${symbol}:${section}` → envelope + timestamp
const cache = new Map<
  string,
  { envelope: InvestmentDataEnvelope<unknown>; timestamp: number }
>();
// In-flight promise cache to deduplicate concurrent requests
const inflight = new Map<string, Promise<InvestmentDataEnvelope<unknown>>>();

async function fetchEnvelope<T>(
  symbol: string,
  section: string
): Promise<InvestmentDataEnvelope<T>> {
  const response = await fetch(
    `/api/investments/data/${encodeURIComponent(symbol)}?section=${encodeURIComponent(section)}`
  );
  const payload = (await response.json()) as
    | InvestmentDataEnvelope<T>
    | {
        error?: string;
        source?: InvestmentDataSource;
        capabilities?: InvestmentCapabilities;
        lastUpdated?: string | null;
      };

  if (!response.ok) {
    const errorMessage =
      "error" in payload ? payload.error ?? `HTTP ${response.status}` : `HTTP ${response.status}`;
    throw Object.assign(new Error(errorMessage), {
      status: response.status,
      source: payload.source ?? null,
      capabilities: payload.capabilities ?? {},
      lastUpdated: payload.lastUpdated ?? null,
    });
  }

  return payload as InvestmentDataEnvelope<T>;
}

async function fetchSection<T>(
  symbol: string,
  section: string
): Promise<InvestmentDataEnvelope<T>> {
  const key = `${symbol}:${section}`;

  // Serve from cache if fresh
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.envelope as InvestmentDataEnvelope<T>;
  }

  if (!inflight.has(key)) {
    const promise = fetchEnvelope<T>(symbol, section)
      .then((envelope) => {
        cache.set(key, { envelope, timestamp: Date.now() });
        return envelope;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, promise);
  }

  return inflight.get(key) as Promise<InvestmentDataEnvelope<T>>;
}

export function useStockData<T>(
  symbol: string | null,
  section: InvestmentSection | string
): UseStockDataReturn<T> {
  const [state, setState] = useState<UseStockDataState<T>>({
    ...(EMPTY_STATE as UseStockDataState<T>),
  });
  const isMounted = useRef(true);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!symbol) {
      return;
    }

    const upperSymbol = symbol.toUpperCase();
    const key = `${upperSymbol}:${section}`;

    // Serve from cache immediately if fresh
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      Promise.resolve(cached.envelope).then((envelope) => {
        if (!isMounted.current) return;
        setState({
          data: envelope.data as T,
          isLoading: false,
          error: null,
          isNotFetched: false,
          lastUpdated: envelope.lastUpdated,
          source: envelope.source,
          capabilities: envelope.capabilities,
        });
      });
      return;
    }

    Promise.resolve().then(() => {
      if (!isMounted.current) return;
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
    });

    fetchSection<T>(upperSymbol, section)
      .then((envelope) => {
        if (!isMounted.current) return;
        setState({
          data: envelope.data,
          isLoading: false,
          error: null,
          isNotFetched: false,
          lastUpdated: envelope.lastUpdated,
          source: envelope.source,
          capabilities: envelope.capabilities,
        });
      })
      .catch(
        (
          err: Error & {
            status?: number;
            source?: InvestmentDataSource | null;
            capabilities?: InvestmentCapabilities;
            lastUpdated?: string | null;
          }
        ) => {
        if (!isMounted.current) return;
        const isNotFetched = err.status === 404 || err.status === 503;
        setState({
          data: null,
          isLoading: false,
          error: err.message,
          isNotFetched,
          lastUpdated: err.lastUpdated ?? null,
          source: err.source ?? null,
          capabilities: err.capabilities ?? {},
        });
      }
      );
  }, [symbol, section, fetchKey]);

  const refetch = useCallback(() => {
    if (!symbol) return;
    const key = `${symbol.toUpperCase()}:${section}`;
    cache.delete(key);
    setFetchKey((k) => k + 1);
  }, [symbol, section]);

  if (!symbol) {
    return {
      ...(EMPTY_STATE as UseStockDataState<T>),
      refetch,
    };
  }

  return { ...state, refetch };
}
