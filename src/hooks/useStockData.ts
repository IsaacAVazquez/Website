"use client";

import { useReducer, useEffect, useRef, useCallback, useState } from "react";
import type {
  InvestmentCapabilities,
  InvestmentDataEnvelope,
  InvestmentDataSource,
  InvestmentSnapshot,
  InvestmentSection,
} from "@/types/investment";
import {
  clearClientInvestmentDataCaches,
  clearClientInvestmentDataCachesForTests,
  getClientInvestmentSnapshot,
} from "@/lib/investmentsClientData";

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

type StockDataError = Error & {
  status?: number;
  source?: InvestmentDataSource | null;
  capabilities?: InvestmentCapabilities;
  lastUpdated?: string | null;
};

type StockDataAction<T> =
  | { type: "reset" }
  | { type: "start"; preserveData: boolean }
  | { type: "success"; envelope: InvestmentDataEnvelope<T> }
  | { type: "error"; error: StockDataError; preserveData: boolean };

function buildEnvelopeFromSnapshot<T>(
  snapshot: InvestmentSnapshot,
  symbol: string,
  section: string
): InvestmentDataEnvelope<T> {
  const data = snapshot.sections[section as InvestmentSection];
  if (data === undefined || data === null) {
    throw Object.assign(
      new Error(`Section "${section}" not available for ${symbol}`),
      {
        status: 404,
        source: snapshot.source as InvestmentDataSource,
        capabilities: snapshot.capabilities,
        lastUpdated: snapshot.lastUpdated,
      }
    );
  }

  return {
    data: data as T,
    source: snapshot.source,
    capabilities: snapshot.capabilities,
    lastUpdated: snapshot.lastUpdated,
  };
}

async function fetchSection<T>(
  symbol: string,
  section: string
): Promise<InvestmentDataEnvelope<T>> {
  const snapshot = await getClientInvestmentSnapshot(symbol);
  return buildEnvelopeFromSnapshot<T>(snapshot, symbol, section);
}

function stockDataReducer<T>(
  state: UseStockDataState<T>,
  action: StockDataAction<T>
): UseStockDataState<T> {
  switch (action.type) {
    case "reset":
      return { ...(EMPTY_STATE as UseStockDataState<T>) };
    case "start":
      if (action.preserveData && state.data !== null) {
        return {
          ...state,
          isLoading: true,
          error: null,
          isNotFetched: false,
        };
      }

      return {
        ...(EMPTY_STATE as UseStockDataState<T>),
        isLoading: true,
      };
    case "success":
      return {
        data: action.envelope.data,
        isLoading: false,
        error: null,
        isNotFetched: false,
        lastUpdated: action.envelope.lastUpdated,
        source: action.envelope.source,
        capabilities: action.envelope.capabilities,
      };
    case "error":
      if (action.preserveData && state.data !== null) {
        return {
          ...state,
          isLoading: false,
          error: null,
          isNotFetched: false,
        };
      }

      return {
        data: null,
        isLoading: false,
        error: action.error.message,
        isNotFetched: action.error.status === 404,
        lastUpdated: action.error.lastUpdated ?? null,
        source: action.error.source ?? null,
        capabilities: action.error.capabilities ?? {},
      };
    default:
      return state;
  }
}

export function useStockData<T>(
  symbol: string | null,
  section: InvestmentSection | string
): UseStockDataReturn<T> {
  const [state, dispatch] = useReducer(stockDataReducer<T>, EMPTY_STATE as UseStockDataState<T>);
  const isMounted = useRef(true);
  const latestRequestId = useRef(0);
  const previousResourceKey = useRef<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!symbol) {
      previousResourceKey.current = null;
      dispatch({ type: "reset" });
      return;
    }

    let cancelled = false;
    const upperSymbol = symbol.toUpperCase();
    const resourceKey = `${upperSymbol}:${section}`;
    const preserveData = previousResourceKey.current === resourceKey;
    previousResourceKey.current = resourceKey;
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    dispatch({ type: "start", preserveData });

    fetchSection<T>(upperSymbol, section)
      .then((envelope) => {
        if (cancelled || !isMounted.current || latestRequestId.current !== requestId) return;
        dispatch({ type: "success", envelope });
      })
      .catch((err: StockDataError) => {
        if (cancelled || !isMounted.current || latestRequestId.current !== requestId) return;
        dispatch({ type: "error", error: err, preserveData });
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, section, fetchKey]);

  const refetch = useCallback(() => {
    if (!symbol) return;
    clearClientInvestmentDataCaches();
    setFetchKey((k) => k + 1);
  }, [symbol]);

  if (!symbol) {
    return {
      ...(EMPTY_STATE as UseStockDataState<T>),
      refetch,
    };
  }

  return { ...state, refetch };
}

export const __testUtils = {
  clearCaches: clearClientInvestmentDataCachesForTests,
};
