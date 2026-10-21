"use client";

import { useCallback } from "react";
import type {
  InvestmentCapabilities,
  InvestmentDataEnvelope,
  InvestmentDataSource,
  InvestmentSnapshot,
  InvestmentSnapshotFreshness,
  InvestmentSection,
} from "@/types/investment";
import {
  clearClientInvestmentDataCaches,
  getClientInvestmentSnapshot,
} from "@/lib/investmentsClientData";
import { useKeyedRequest, type KeyedRequestAction } from "./useKeyedRequest";

interface UseStockDataState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isNotFetched: boolean;
  lastUpdated: string | null;
  freshness: InvestmentSnapshotFreshness | null;
  source: InvestmentDataSource | null;
  capabilities: InvestmentCapabilities;
}

interface UseStockDataReturn<T> extends UseStockDataState<T> {
  refetch: () => void;
}

const EMPTY_CAPABILITIES: InvestmentCapabilities = {};
const EMPTY_STATE = {
  data: null,
  isLoading: false,
  error: null,
  isNotFetched: false,
  lastUpdated: null,
  freshness: null,
  source: null,
  capabilities: EMPTY_CAPABILITIES,
} as const;

type StockDataError = Error & {
  status?: number;
  source?: InvestmentDataSource | null;
  capabilities?: InvestmentCapabilities;
  lastUpdated?: string | null;
  freshness?: InvestmentSnapshotFreshness | null;
};

type StockDataAction<T> = KeyedRequestAction<InvestmentDataEnvelope<T>>;

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
        freshness: snapshot.freshness ?? null,
      }
    );
  }

  return {
    data: data as T,
    source: snapshot.source,
    capabilities: snapshot.capabilities,
    lastUpdated: snapshot.lastUpdated,
    freshness: snapshot.freshness ?? null,
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
      if (action.preserve && state.data !== null) {
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
        data: action.result.data,
        isLoading: false,
        error: null,
        isNotFetched: false,
        lastUpdated: action.result.lastUpdated,
        freshness: action.result.freshness ?? null,
        source: action.result.source,
        capabilities: action.result.capabilities,
      };
    case "error": {
      if (action.preserve && state.data !== null) {
        return {
          ...state,
          isLoading: false,
          error: null,
          isNotFetched: false,
        };
      }

      const error = action.error as StockDataError;
      return {
        data: null,
        isLoading: false,
        error: error.message,
        isNotFetched: error.status === 404,
        lastUpdated: error.lastUpdated ?? null,
        freshness: error.freshness ?? null,
        source: error.source ?? null,
        capabilities: error.capabilities ?? {},
      };
    }
    default:
      return state;
  }
}

export function useStockData<T>(
  symbol: string | null,
  section: InvestmentSection | string
): UseStockDataReturn<T> {
  // The key carries the section so a section switch on the same symbol reads
  // as a new resource rather than a refetch that keeps the old data showing.
  const key = symbol ? `${symbol.toUpperCase()}:${section}` : null;
  const load = useCallback(
    (key: string) => fetchSection<T>(key.split(":")[0], section),
    [section]
  );
  const { state, refetch } = useKeyedRequest(
    key,
    load,
    stockDataReducer<T>,
    EMPTY_STATE as UseStockDataState<T>,
    clearClientInvestmentDataCaches
  );

  return { ...state, refetch };
}

export const __testUtils = {
  clearCaches: clearClientInvestmentDataCaches,
};
