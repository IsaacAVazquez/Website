"use client";

import { useState, useEffect, useCallback } from "react";
import { PortfolioHolding, StockQuote, EnhancedHolding, PortfolioSummary } from "@/types/investment";

const STORAGE_KEY = "portfolio_holdings";

/**
 * Custom hook for managing investment portfolio
 * Handles localStorage persistence and stock data fetching
 */
export function useInvestments() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load holdings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHoldings(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load holdings:", err);
    }
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

  // Fetch stock quotes
  const fetchQuotes = useCallback(async () => {
    if (holdings.length === 0) {
      setQuotes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const symbols = holdings.map(h => h.symbol).join(",");
      const response = await fetch(`/api/stocks?symbols=${symbols}`);

      if (!response.ok) {
        throw new Error("Failed to fetch stock data");
      }

      const data = await response.json();
      setQuotes(data.quotes || []);
    } catch (err) {
      console.error("Failed to fetch quotes:", err);
      setError("Failed to fetch stock data");
    } finally {
      setLoading(false);
    }
  }, [holdings]);

  // Auto-fetch quotes when holdings change
  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Add holding
  const addHolding = useCallback((holding: PortfolioHolding) => {
    const newHoldings = [...holdings, holding];
    saveHoldings(newHoldings);
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
  const enhancedHoldings: EnhancedHolding[] = holdings.map(holding => {
    const quote = quotes.find(q => q.symbol === holding.symbol);
    const currentPrice = quote?.price || 0;
    const currentValue = currentPrice * holding.shares;
    const totalCost = holding.averageCost * holding.shares;
    const gainLoss = currentValue - totalCost;
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
    const dayChange = (quote?.change || 0) * holding.shares;
    const dayChangePercent = quote?.changePercent || 0;

    return {
      ...holding,
      currentPrice,
      currentValue,
      totalCost,
      gainLoss,
      gainLossPercent,
      dayChange,
      dayChangePercent,
    };
  });

  // Calculate portfolio summary
  const summary: PortfolioSummary = enhancedHoldings.reduce(
    (acc, holding) => ({
      totalValue: acc.totalValue + holding.currentValue,
      totalCost: acc.totalCost + holding.totalCost,
      totalGainLoss: acc.totalGainLoss + holding.gainLoss,
      totalGainLossPercent: 0, // Will calculate after
      dayChange: acc.dayChange + holding.dayChange,
      dayChangePercent: 0, // Will calculate after
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
  if (summary.totalValue > 0) {
    summary.dayChangePercent = (summary.dayChange / (summary.totalValue - summary.dayChange)) * 100;
  }

  return {
    holdings,
    quotes,
    enhancedHoldings,
    summary,
    loading,
    error,
    addHolding,
    updateHolding,
    removeHolding,
    refreshQuotes: fetchQuotes,
  };
}
