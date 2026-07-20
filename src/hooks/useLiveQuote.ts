"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { StockQuote } from "@/types/investment";

interface QuotePayload {
  quotes?: StockQuote[];
  timestamp?: string;
  error?: string;
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

type LiveQuoteAction =
  | { type: "reset" }
  | { type: "start"; preserveQuote: boolean }
  | { type: "success"; entry: CachedQuote }
  | { type: "error"; message: string; preserveQuote: boolean };

function liveQuoteReducer(
  state: UseLiveQuoteState,
  action: LiveQuoteAction
): UseLiveQuoteState {
  switch (action.type) {
    case "reset":
      return EMPTY_STATE;
    case "start":
      if (action.preserveQuote && state.quote) {
        return {
          ...state,
          isLoading: true,
          error: null,
        };
      }

      return {
        ...EMPTY_STATE,
        isLoading: true,
      };
    case "success":
      return {
        quote: action.entry.quote,
        isLoading: false,
        error: action.entry.quote.error ?? null,
        lastUpdated: action.entry.lastUpdated,
      };
    case "error":
      if (action.preserveQuote && state.quote) {
        // Keep showing the last good quote, but don't swallow the failure —
        // consumers gate values on `quote && !quote.error`, so surfacing the
        // hook-level error only feeds the freshness messaging.
        return {
          ...state,
          isLoading: false,
          error: action.message,
        };
      }

      return {
        quote: null,
        isLoading: false,
        error: action.message,
        lastUpdated: null,
      };
    default:
      return state;
  }
}

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
      let payload: QuotePayload | null;
      try {
        payload = (await response.json()) as QuotePayload;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        // Failures arrive as 503/400 with the structured body still attached
        // (per-symbol error placeholders plus a top-level error). Surface the
        // specific message so the UI can explain rate limits and eligibility.
        const message =
          payload?.quotes?.find((item) => item.symbol === upperSymbol)?.error ??
          payload?.error;
        throw new Error(
          typeof message === "string" && message.length > 0
            ? message
            : "Live pricing is temporarily unavailable."
        );
      }

      const quote = payload?.quotes?.find((item) => item.symbol === upperSymbol);

      if (!quote) {
        throw new Error("Live pricing is temporarily unavailable.");
      }

      if (quote.error) {
        throw new Error(quote.error);
      }

      const cachedEntry: CachedQuote = {
        quote,
        lastUpdated: payload?.timestamp ?? new Date().toISOString(),
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
  const [state, dispatch] = useReducer(liveQuoteReducer, EMPTY_STATE);
  const [fetchKey, setFetchKey] = useState(0);
  const isMounted = useRef(true);
  const latestRequestId = useRef(0);
  const previousSymbol = useRef<string | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!symbol) {
      previousSymbol.current = null;
      dispatch({ type: "reset" });
      return;
    }

    let cancelled = false;
    const upperSymbol = symbol.toUpperCase();
    const preserveQuote = previousSymbol.current === upperSymbol;
    previousSymbol.current = upperSymbol;
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    dispatch({ type: "start", preserveQuote });

    fetchQuote(upperSymbol)
      .then((entry) => {
        if (cancelled || !isMounted.current || latestRequestId.current !== requestId) return;

        dispatch({ type: "success", entry });
      })
      .catch((error) => {
        if (cancelled || !isMounted.current || latestRequestId.current !== requestId) return;

        dispatch({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Live pricing is temporarily unavailable.",
          preserveQuote,
        });
      });

    return () => {
      cancelled = true;
    };
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
