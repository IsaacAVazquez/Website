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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [quotesReady, setQuotesReady] = useState(false);

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

  // Fetch stock quotes
  const fetchQuotes = useCallback(async () => {
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

    try {
      const symbols = holdings.map(h => h.symbol).join(",");
      const response = await fetch(`/api/stocks?symbols=${symbols}`, {
        signal: controller.signal,
      });

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
      console.error("Failed to fetch quotes:", err);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Request timed out — try refreshing");
      } else {
        setError("Failed to fetch stock data");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setQuotesReady(true);
    }
  }, [holdings]);

  // Auto-fetch quotes when holdings change
  useEffect(() => {
    if (initialized) {
      fetchQuotes();
    }
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
  const enhancedHoldings: EnhancedHolding[] = holdings.map(holding => {
    const quote = quotes.find(q => q.symbol === holding.symbol);
    const hasValidQuote = quote != null && !quote.error && quote.price > 0;

    if (!hasValidQuote) {
      // Fall back to cost basis when no valid quote available
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
        hasError: quotesReady, // Only mark as error after quotes have been attempted
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
  const previousTotalValue = summary.totalValue - summary.dayChange;
  if (previousTotalValue > 0) {
    summary.dayChangePercent = (summary.dayChange / previousTotalValue) * 100;
  }

  return {
    holdings,
    quotes,
    enhancedHoldings,
    summary,
    loading,
    error,
    initialized,
    quotesReady,
    addHolding,
    updateHolding,
    removeHolding,
    refreshQuotes: fetchQuotes,
  };
}
