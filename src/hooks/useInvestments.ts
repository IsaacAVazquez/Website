"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  PortfolioHolding,
  EnhancedHolding,
  PortfolioSummary,
  StockQuote,
} from "@/types/investment";
import type { PortfolioSnapshot } from "@/components/investments/PortfolioPerformanceChart";

const STORAGE_KEY = "portfolio_holdings";
const SNAPSHOTS_KEY = "portfolio_snapshots";
const MAX_SNAPSHOTS = 365;

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

function loadSnapshots(): PortfolioSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    return raw ? (JSON.parse(raw) as PortfolioSnapshot[]) : [];
  } catch {
    return [];
  }
}

function saveSnapshot(snapshot: PortfolioSnapshot): void {
  if (typeof window === "undefined") return;
  const existing = loadSnapshots();
  // One snapshot per day (idempotent)
  if (existing.some((s) => s.date === snapshot.date)) return;
  const updated = [...existing, snapshot];
  // Keep max entries, drop oldest
  const trimmed = updated.length > MAX_SNAPSHOTS ? updated.slice(-MAX_SNAPSHOTS) : updated;
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(trimmed));
}

// ─── Quote fetching with retry ───────────────────────────────────────────────

async function fetchQuotesWithStatus(
  symbols: string[]
): Promise<{ quotes: Map<string, StockQuote>; warning: string | null }> {
  if (symbols.length === 0) return { quotes: new Map(), warning: null };

  const MAX_RETRIES = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
      const res = await fetch(`/api/investments/quotes?symbols=${symbols.join(",")}`);
      if (!res.ok) {
        // Retry on server errors (502/503/504)
        if (res.status >= 502 && res.status <= 504 && attempt < MAX_RETRIES) {
          lastError = new Error(`Quote fetch failed: HTTP ${res.status}`);
          continue;
        }
        throw new Error(`Failed to fetch quotes: HTTP ${res.status}`);
      }
      const data = await res.json();
      const map = new Map<string, StockQuote>();
      for (const q of data.quotes ?? []) {
        map.set(q.symbol, q);
      }
      return {
        quotes: map,
        warning: data.allFailed
          ? "Live prices are temporarily unavailable. Portfolio totals are using your saved cost basis."
          : null,
      };
    } catch (err) {
      lastError = err as Error;
      if (attempt >= MAX_RETRIES) throw lastError;
    }
  }
  throw lastError ?? new Error("Failed to fetch quotes");
}

// ─── Derived data ─────────────────────────────────────────────────────────────

function hasUsableQuote(quote?: StockQuote): quote is StockQuote {
  return !!quote && !quote.error && Number.isFinite(quote.price) && quote.price > 0;
}

export function buildEnhanced(
  holdings: PortfolioHolding[],
  quotes: Map<string, StockQuote>,
  isLoading: boolean
): EnhancedHolding[] {
  const totalValue = holdings.reduce((sum, h) => {
    const q = quotes.get(h.symbol);
    const marketPrice = hasUsableQuote(q) ? q.price : h.averageCost;
    return sum + h.shares * marketPrice;
  }, 0);

  return holdings.map((h) => {
    const q = quotes.get(h.symbol);
    const currentPrice = hasUsableQuote(q) ? q.price : h.averageCost;
    const currentValue = h.shares * currentPrice;
    const totalCost = h.shares * h.averageCost;
    const gainLoss = currentValue - totalCost;
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
    const dayChange = hasUsableQuote(q) ? h.shares * q.change : 0;
    const dayChangePercent = hasUsableQuote(q) ? q.changePercent : 0;
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
      name: hasUsableQuote(q) ? q.name : h.symbol,
      isLoading: isLoading && !hasUsableQuote(q),
      error: q?.error,
    };
  });
}

export function buildSummary(enhanced: EnhancedHolding[]): PortfolioSummary {
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
  error: string | null;
  lastUpdated: Date | null;
  snapshots: PortfolioSnapshot[];
  addHolding: (holding: PortfolioHolding) => void;
  updateHolding: (symbol: string, updates: Partial<PortfolioHolding>) => void;
  removeHolding: (symbol: string) => void;
  refetch: () => void;
}

export function useInvestments(): UseInvestmentsReturn {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [quotes, setQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const isMounted = useRef(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    isMounted.current = true;
    setHoldings(loadHoldings());
    setSnapshots(loadSnapshots());
    return () => { isMounted.current = false; };
  }, []);

  const fetchAllQuotes = useCallback(async (currentHoldings: PortfolioHolding[]) => {
    if (currentHoldings.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const symbols = currentHoldings.map((h) => h.symbol);
      const { quotes: q, warning } = await fetchQuotesWithStatus(symbols);
      if (isMounted.current) {
        setQuotes(q);
        setLastUpdated(new Date());
        setError(warning);

        // Record daily snapshot
        const enhanced = buildEnhanced(currentHoldings, q, false);
        const summary = buildSummary(enhanced);
        const totalCost = enhanced.reduce((s, h) => s + h.totalCost, 0);
        const today = new Date().toISOString().split("T")[0];
        const snap: PortfolioSnapshot = {
          date: today,
          totalValue: summary.totalValue,
          totalCost,
          holdingCount: currentHoldings.length,
        };
        saveSnapshot(snap);
        setSnapshots(loadSnapshots());
      }
    } catch (err) {
      if (isMounted.current) {
        setError((err as Error).message || "Live prices are temporarily unavailable.");
      }
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
    dayChangePercent: (() => {
      const previousValue = rawSummary.totalValue - rawSummary.dayChange;
      return previousValue > 0 ? (rawSummary.dayChange / previousValue) * 100 : 0;
    })(),
  };

  return {
    holdings,
    enhancedHoldings,
    summary,
    isLoading,
    error,
    lastUpdated,
    snapshots,
    addHolding,
    updateHolding,
    removeHolding,
    refetch,
  };
}
