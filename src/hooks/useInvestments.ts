"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  PortfolioHolding,
  EnhancedHolding,
  PortfolioSummary,
  StockQuote,
} from "@/types/investment";

const STORAGE_KEY = "portfolio_holdings";

// ─── localStorage helpers ────────────────────────────────────────────────────

function loadHoldings(): PortfolioHolding[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PortfolioHolding[]) : [];
  } catch {
    return [];
  }
}

function saveHoldings(holdings: PortfolioHolding[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}

// ─── Quote fetching ──────────────────────────────────────────────────────────

async function fetchQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
  if (symbols.length === 0) return new Map();
  const res = await fetch(`/api/investments/quotes?symbols=${symbols.join(",")}`);
  if (!res.ok) throw new Error("Failed to fetch quotes");
  const data = await res.json();
  const map = new Map<string, StockQuote>();
  for (const q of data.quotes ?? []) {
    map.set(q.symbol, q);
  }
  return map;
}

// ─── Derived data ─────────────────────────────────────────────────────────────

function buildEnhanced(
  holdings: PortfolioHolding[],
  quotes: Map<string, StockQuote>,
  isLoading: boolean
): EnhancedHolding[] {
  const totalValue = holdings.reduce((sum, h) => {
    const q = quotes.get(h.symbol);
    return sum + h.shares * (q?.price ?? h.averageCost);
  }, 0);

  return holdings.map((h) => {
    const q = quotes.get(h.symbol);
    const currentPrice = q?.price ?? h.averageCost;
    const currentValue = h.shares * currentPrice;
    const totalCost = h.shares * h.averageCost;
    const gainLoss = currentValue - totalCost;
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
    const dayChange = h.shares * (q?.change ?? 0);
    const dayChangePercent = q?.changePercent ?? 0;
    const allocationPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : null;

    return {
      ...h,
      currentPrice,
      currentValue,
      totalCost,
      gainLoss,
      gainLossPercent,
      dayChange,
      dayChangePercent,
      allocationPercent,
      name: q?.name ?? h.symbol,
      isLoading: isLoading && !q,
      error: q?.error,
    };
  });
}

function buildSummary(enhanced: EnhancedHolding[]): PortfolioSummary {
  return enhanced.reduce(
    (acc, h) => ({
      totalValue: acc.totalValue + h.currentValue,
      totalCost: acc.totalCost + h.totalCost,
      totalGainLoss: acc.totalGainLoss + h.gainLoss,
      totalGainLossPercent: 0, // computed below
      dayChange: acc.dayChange + h.dayChange,
      dayChangePercent: 0, // computed below
    }),
    { totalValue: 0, totalCost: 0, totalGainLoss: 0, totalGainLossPercent: 0, dayChange: 0, dayChangePercent: 0 }
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseInvestmentsReturn {
  holdings: PortfolioHolding[];
  enhancedHoldings: EnhancedHolding[];
  summary: PortfolioSummary;
  isLoading: boolean;
  lastUpdated: Date | null;
  addHolding: (holding: PortfolioHolding) => void;
  updateHolding: (symbol: string, updates: Partial<PortfolioHolding>) => void;
  removeHolding: (symbol: string) => void;
  refetch: () => void;
}

export function useInvestments(): UseInvestmentsReturn {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [quotes, setQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMounted = useRef(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    isMounted.current = true;
    setHoldings(loadHoldings());
    return () => { isMounted.current = false; };
  }, []);

  const fetchAllQuotes = useCallback(async (currentHoldings: PortfolioHolding[]) => {
    if (currentHoldings.length === 0) return;
    setIsLoading(true);
    try {
      const symbols = currentHoldings.map((h) => h.symbol);
      const q = await fetchQuotes(symbols);
      if (isMounted.current) {
        setQuotes(q);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("useInvestments: quote fetch failed", err);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  // Fetch quotes whenever holdings change
  useEffect(() => {
    fetchAllQuotes(holdings);
  }, [holdings, fetchAllQuotes]);

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  const addHolding = useCallback((holding: PortfolioHolding) => {
    setHoldings((prev) => {
      const existing = prev.findIndex((h) => h.symbol === holding.symbol);
      let next: PortfolioHolding[];
      if (existing >= 0) {
        // Merge: weighted-average cost, sum shares
        const old = prev[existing];
        const totalShares = old.shares + holding.shares;
        const avgCost =
          (old.shares * old.averageCost + holding.shares * holding.averageCost) / totalShares;
        next = prev.map((h, i) =>
          i === existing ? { ...h, shares: totalShares, averageCost: avgCost } : h
        );
      } else {
        next = [...prev, holding];
      }
      saveHoldings(next);
      return next;
    });
  }, []);

  const updateHolding = useCallback((symbol: string, updates: Partial<PortfolioHolding>) => {
    setHoldings((prev) => {
      const next = prev.map((h) => (h.symbol === symbol ? { ...h, ...updates } : h));
      saveHoldings(next);
      return next;
    });
  }, []);

  const removeHolding = useCallback((symbol: string) => {
    setHoldings((prev) => {
      const next = prev.filter((h) => h.symbol !== symbol);
      saveHoldings(next);
      return next;
    });
  }, []);

  const refetch = useCallback(() => {
    fetchAllQuotes(holdings);
  }, [holdings, fetchAllQuotes]);

  // ─── Derived ──────────────────────────────────────────────────────────────

  const enhancedHoldings = buildEnhanced(holdings, quotes, isLoading);

  const rawSummary = buildSummary(enhancedHoldings);
  const summary: PortfolioSummary = {
    ...rawSummary,
    totalGainLossPercent:
      rawSummary.totalCost > 0
        ? (rawSummary.totalGainLoss / rawSummary.totalCost) * 100
        : 0,
    dayChangePercent:
      rawSummary.totalValue > 0
        ? (rawSummary.dayChange / (rawSummary.totalValue - rawSummary.dayChange)) * 100
        : 0,
  };

  return {
    holdings,
    enhancedHoldings,
    summary,
    isLoading,
    lastUpdated,
    addHolding,
    updateHolding,
    removeHolding,
    refetch,
  };
}
