"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PortfolioHolding, StockQuote, EnhancedHolding, PortfolioSummary, HoldingSortField, SortDirection } from "@/types/investment";

const STORAGE_KEY = "portfolio_holdings";

/**
 * Custom hook for managing investment portfolio
 * Handles localStorage persistence and stock data fetching
 */
export function useInvestments() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [quotesReady, setQuotesReady] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortField, setSortField] = useState<HoldingSortField>('value');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Load holdings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHoldings(parsed);
        if (parsed.length === 0) {
          setQuotesReady(true);
          setLoading(false);
        }
      } else {
        setQuotesReady(true);
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to load holdings:", err);
      setQuotesReady(true);
      setLoading(false);
    }
    setInitialized(true);
  }, []);

  // Save holdings to localStorage
  const saveHoldings = useCallback((newHoldings: PortfolioHolding[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHoldings));
      setHoldings(newHoldings);
    } catch (err) {
      console.error("Failed to save holdings:", err);
      setError("Failed to save portfolio data");
    }
  }, []);

  // Fetch stock quotes with a given AbortSignal for cancellation
  const fetchQuotes = useCallback(async (signal?: AbortSignal) => {
    if (holdings.length === 0) {
      setQuotes([]);
      setQuotesReady(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // If a parent signal aborts, propagate to our controller
    const onParentAbort = () => controller.abort();
    signal?.addEventListener("abort", onParentAbort);

    try {
      const symbols = holdings.map(h => h.symbol).join(",");
      const response = await fetch(`/api/stocks?symbols=${symbols}`, {
        signal: controller.signal,
      });

      // If the caller cancelled, don't update state
      if (signal?.aborted) return;

      const data = await response.json();

      if (response.status === 429 || data.allFailed) {
        setError("Yahoo Finance rate limit reached — try again in a minute");
        setQuotes(data.quotes || []);
      } else if (!response.ok) {
        throw new Error("Failed to fetch stock data");
      } else {
        if (data.rateLimited) {
          setError("Some stock data may be incomplete due to rate limiting");
        }
        setQuotes(data.quotes || []);
      }
    } catch (err) {
      // If the caller cancelled, don't update state with stale errors
      if (signal?.aborted) return;

      console.error("Failed to fetch quotes:", err);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Request timed out — try refreshing");
      } else {
        setError("Failed to fetch stock data");
      }
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onParentAbort);
      if (!signal?.aborted) {
        setLoading(false);
        setQuotesReady(true);
        setLastUpdated(new Date());
      }
    }
  }, [holdings]);

  // Auto-fetch quotes when holdings change; abort stale requests on re-run
  useEffect(() => {
    if (!initialized) return;
    const controller = new AbortController();
    fetchQuotes(controller.signal);
    return () => controller.abort();
  }, [initialized, fetchQuotes]);

  // Add holding (rejects duplicates)
  const addHolding = useCallback((holding: PortfolioHolding): boolean => {
    if (holdings.some(h => h.symbol === holding.symbol)) {
      setError(`${holding.symbol} is already in your portfolio`);
      return false;
    }
    const newHoldings = [...holdings, holding];
    saveHoldings(newHoldings);
    return true;
  }, [holdings, saveHoldings]);

  // Update holding
  const updateHolding = useCallback((symbol: string, updates: Partial<PortfolioHolding>) => {
    const newHoldings = holdings.map(h =>
      h.symbol === symbol ? { ...h, ...updates } : h
    );
    saveHoldings(newHoldings);
  }, [holdings, saveHoldings]);

  // Remove holding
  const removeHolding = useCallback((symbol: string) => {
    const newHoldings = holdings.filter(h => h.symbol !== symbol);
    saveHoldings(newHoldings);
  }, [holdings, saveHoldings]);

  // Calculate enhanced holdings with current prices
  const baseEnhancedHoldings: EnhancedHolding[] = holdings.map(holding => {
    const quote = quotes.find(q => q.symbol === holding.symbol);
    const hasValidQuote = quote != null && !quote.error && quote.price > 0;

    if (!hasValidQuote) {
      const totalCost = holding.averageCost * holding.shares;
      return {
        ...holding,
        currentPrice: holding.averageCost,
        currentValue: totalCost,
        totalCost,
        gainLoss: 0,
        gainLossPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
        allocationPercent: 0,
        hasError: quotesReady,
      };
    }

    const currentPrice = quote.price;
    const currentValue = currentPrice * holding.shares;
    const totalCost = holding.averageCost * holding.shares;
    const gainLoss = currentValue - totalCost;
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
    const dayChange = (quote.change || 0) * holding.shares;
    const dayChangePercent = quote.changePercent || 0;

    return {
      ...holding,
      currentPrice,
      currentValue,
      totalCost,
      gainLoss,
      gainLossPercent,
      dayChange,
      dayChangePercent,
      allocationPercent: 0,
    };
  });

  // Calculate portfolio summary
  const summary: PortfolioSummary = baseEnhancedHoldings.reduce(
    (acc, holding) => ({
      totalValue: acc.totalValue + holding.currentValue,
      totalCost: acc.totalCost + holding.totalCost,
      totalGainLoss: acc.totalGainLoss + holding.gainLoss,
      totalGainLossPercent: 0,
      dayChange: acc.dayChange + holding.dayChange,
      dayChangePercent: 0,
    }),
    {
      totalValue: 0,
      totalCost: 0,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      dayChange: 0,
      dayChangePercent: 0,
    }
  );

  // Calculate percentages
  if (summary.totalCost > 0) {
    summary.totalGainLossPercent = (summary.totalGainLoss / summary.totalCost) * 100;
  }
  const previousTotalValue = summary.totalValue - summary.dayChange;
  if (previousTotalValue > 0) {
    summary.dayChangePercent = (summary.dayChange / previousTotalValue) * 100;
  }

  // Compute allocation % and apply sorting
  const enhancedHoldings = useMemo(() => {
    const withAllocation = baseEnhancedHoldings.map(h => ({
      ...h,
      allocationPercent: summary.totalValue > 0 ? (h.currentValue / summary.totalValue) * 100 : 0,
    }));

    return withAllocation.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'value':
          cmp = a.currentValue - b.currentValue;
          break;
        case 'gainLoss':
          cmp = a.gainLoss - b.gainLoss;
          break;
        case 'dayChange':
          cmp = a.dayChange - b.dayChange;
          break;
        case 'symbol':
          cmp = a.symbol.localeCompare(b.symbol);
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [baseEnhancedHoldings, summary.totalValue, sortField, sortDirection]);

  return {
    holdings,
    quotes,
    enhancedHoldings,
    summary,
    loading,
    error,
    initialized,
    quotesReady,
    lastUpdated,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    addHolding,
    updateHolding,
    removeHolding,
    refreshQuotes: fetchQuotes,
  };
}
