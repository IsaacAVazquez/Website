"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StockQuote } from "@/types/investment";

interface QuotePayload {
  quotes?: StockQuote[];
  timestamp?: string;
}

interface CachedQuote {
  quote: StockQuote;
  lastUpdated: string | null;
  fetchedAt: number;
}

interface UseLiveQuoteState {
  quote: StockQuote | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface UseLiveQuoteReturn extends UseLiveQuoteState {
  refetch: () => void;
}

const QUOTE_TTL_MS = 60 * 1000;
const quoteCache = new Map<string, CachedQuote>();
const inflightQuotes = new Map<string, Promise<CachedQuote>>();

const EMPTY_STATE: UseLiveQuoteState = {
  quote: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

async function fetchQuote(symbol: string): Promise<CachedQuote> {
  const upperSymbol = symbol.toUpperCase();
  const cached = quoteCache.get(upperSymbol);
  if (cached && Date.now() - cached.fetchedAt < QUOTE_TTL_MS) {
    return cached;
  }

  const inflight = inflightQuotes.get(upperSymbol);
  if (inflight) {
    return inflight;
  }

  const promise = fetch(`/api/investments/quotes?symbols=${encodeURIComponent(upperSymbol)}`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch live quote: HTTP ${response.status}`);
      }

      const payload = (await response.json()) as QuotePayload;
      const quote = payload.quotes?.find((item) => item.symbol === upperSymbol);

      if (!quote) {
        throw new Error(`Live quote unavailable for ${upperSymbol}`);
      }

      const cachedEntry: CachedQuote = {
        quote,
        lastUpdated: payload.timestamp ?? new Date().toISOString(),
        fetchedAt: Date.now(),
      };

      quoteCache.set(upperSymbol, cachedEntry);
      return cachedEntry;
    })
    .finally(() => inflightQuotes.delete(upperSymbol));

  inflightQuotes.set(upperSymbol, promise);
  return promise;
}

export function useLiveQuote(symbol: string | null): UseLiveQuoteReturn {
  const [state, setState] = useState<UseLiveQuoteState>(EMPTY_STATE);
  const [fetchKey, setFetchKey] = useState(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!symbol) {
      return;
    }

    const upperSymbol = symbol.toUpperCase();

    Promise.resolve().then(() => {
      if (!isMounted.current) return;
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));
    });

    fetchQuote(upperSymbol)
      .then((entry) => {
        if (!isMounted.current) return;

        setState({
          quote: entry.quote,
          isLoading: false,
          error: entry.quote.error ?? null,
          lastUpdated: entry.lastUpdated,
        });
      })
      .catch((error) => {
        if (!isMounted.current) return;

        setState({
          quote: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to fetch live quote",
          lastUpdated: null,
        });
      });
  }, [fetchKey, symbol]);

  const refetch = useCallback(() => {
    if (!symbol) return;
    quoteCache.delete(symbol.toUpperCase());
    setFetchKey((current) => current + 1);
  }, [symbol]);

  if (!symbol) {
    return {
      ...EMPTY_STATE,
      refetch,
    };
  }

  return {
    ...state,
    refetch,
  };
}

export const __testUtils = {
  clearQuoteCache() {
    quoteCache.clear();
    inflightQuotes.clear();
  },
};
