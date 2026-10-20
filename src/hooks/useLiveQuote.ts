"use client";

import { useEffect } from "react";
import type { StockQuote } from "@/types/investment";
import { useKeyedRequest, type KeyedRequestAction } from "./useKeyedRequest";

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

interface UseLiveQuoteReturn extends UseLiveQuoteState {
  refetch: () => void;
}

const QUOTE_TTL_MS = 60 * 1000;
const MAX_CURRENT_QUOTE_AGE_MS = 4 * 24 * 60 * 60 * 1000;
const quoteCache = new Map<string, CachedQuote>();
const inflightQuotes = new Map<string, Promise<CachedQuote>>();

const EMPTY_STATE: UseLiveQuoteState = {
  quote: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

type LiveQuoteAction = KeyedRequestAction<CachedQuote> | { type: "expire" };

function liveQuoteReducer(
  state: UseLiveQuoteState,
  action: LiveQuoteAction
): UseLiveQuoteState {
  switch (action.type) {
    case "reset":
      return EMPTY_STATE;
    case "start":
      if (action.preserve && state.quote) {
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
        quote: action.result.quote,
        isLoading: false,
        error: action.result.quote.error ?? null,
        lastUpdated: action.result.lastUpdated,
      };
    case "expire":
      if (!state.quote || state.quote.isFallback) return state;
      return {
        ...state,
        quote: { ...state.quote, isFallback: true },
      };
    case "error": {
      const message =
        action.error instanceof Error
          ? action.error.message
          : "Market quote is temporarily unavailable.";
      if (action.preserve && state.quote) {
        // Keep showing the last good value, but mark it as saved so consumers
        // cannot present its old day move as a current market response.
        return {
          ...state,
          quote: { ...state.quote, isFallback: true },
          isLoading: false,
          error: message,
        };
      }

      return {
        quote: null,
        isLoading: false,
        error: message,
        lastUpdated: null,
      };
    }
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
      let payload: QuotePayload | null = null;
      try {
        payload = (await response.json()) as QuotePayload;
      } catch {
        // Keep the default null payload so the generic provider error is used.
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
            : "Market quote is temporarily unavailable."
        );
      }

      const quote = payload?.quotes?.find((item) => item.symbol === upperSymbol);

      if (!quote) {
        throw new Error("Market quote is temporarily unavailable.");
      }

      if (quote.error) {
        throw new Error(quote.error);
      }

      if (quote.source !== "finnhub") {
        throw new Error("Market quote source could not be verified.");
      }

      const sourceTimestamp = quote.asOf ? Date.parse(quote.asOf) : Number.NaN;
      const ageMs = Date.now() - sourceTimestamp;
      if (
        !Number.isFinite(sourceTimestamp) ||
        ageMs < -5 * 60 * 1000 ||
        ageMs > MAX_CURRENT_QUOTE_AGE_MS
      ) {
        throw new Error("Market quote is not current enough to display.");
      }

      const cachedEntry: CachedQuote = {
        quote,
        // Prefer the provider's market timestamp. The top-level payload time is
        // only when this API response was assembled and must not make an old
        // or after-hours quote look newly traded.
        lastUpdated: quote.asOf ?? payload?.timestamp ?? null,
        fetchedAt: Date.now(),
      };

      quoteCache.set(upperSymbol, cachedEntry);
      return cachedEntry;
    })
    .finally(() => inflightQuotes.delete(upperSymbol));

  inflightQuotes.set(upperSymbol, promise);
  return promise;
}

function forgetQuote(symbol: string) {
  quoteCache.delete(symbol);
}

export function useLiveQuote(symbol: string | null): UseLiveQuoteReturn {
  const key = symbol ? symbol.toUpperCase() : null;
  const { state, dispatch, refetch } = useKeyedRequest(
    key,
    fetchQuote,
    liveQuoteReducer,
    EMPTY_STATE,
    forgetQuote,
  );

  useEffect(() => {
    if (!key) return;
    const revalidate = () => {
      if (document.visibilityState === "hidden") return;
      if (inflightQuotes.has(key)) return;
      const cached = quoteCache.get(key);
      if (cached && Date.now() - cached.fetchedAt < QUOTE_TTL_MS) return;
      refetch();
    };

    const intervalId = window.setInterval(revalidate, QUOTE_TTL_MS);
    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", revalidate);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", revalidate);
    };
  }, [key, refetch]);

  useEffect(() => {
    const sourceTimestamp = state.quote?.asOf
      ? Date.parse(state.quote.asOf)
      : Number.NaN;
    if (
      !state.quote ||
      state.quote.isFallback ||
      !Number.isFinite(sourceTimestamp)
    ) {
      return;
    }
    const remainingMs = sourceTimestamp + MAX_CURRENT_QUOTE_AGE_MS - Date.now();
    const timeoutId = window.setTimeout(
      () => dispatch({ type: "expire" }),
      Math.max(0, remainingMs),
    );
    return () => window.clearTimeout(timeoutId);
  }, [state.quote, dispatch]);

  return { ...state, refetch };
}

export const __testUtils = {
  clearQuoteCache() {
    quoteCache.clear();
    inflightQuotes.clear();
  },
};
