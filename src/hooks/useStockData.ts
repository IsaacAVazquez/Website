"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
