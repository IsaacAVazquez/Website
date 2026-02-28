"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  IconChartBar,
  IconRefresh,
  IconInfoCircle,
} from "@tabler/icons-react";
import { StockDetail } from "@/types/investment";
import { StockSearchBar } from "./StockSearchBar";
import { ComparisonCard } from "./ComparisonCard";
import { MetricComparisonRow, METRIC_GROUPS } from "./MetricComparisonRow";

const DEFAULT_SYMBOLS = ["AAPL", "MSFT"];
const PORTFOLIO_STORAGE_KEY = "portfolio_holdings";

export function StockComparisonTool() {
  const shouldReduceMotion = useReducedMotion();
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [stockData, setStockData] = useState<Record<string, StockDetail>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);
  const [portfolioSymbols, setPortfolioSymbols] = useState<{ symbol: string; label: string }[]>([]);

  const fetchStock = useCallback(async (symbol: string) => {
    setLoading((prev) => ({ ...prev, [symbol]: true }));
    setErrors((prev) => {
      const n = { ...prev };
      delete n[symbol];
      return n;
    });

    try {
      const res = await fetch(`/api/stocks/detail?symbol=${symbol}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StockDetail = await res.json();
      if (data.error) throw new Error(data.error);
      setStockData((prev) => ({ ...prev, [symbol]: data }));
    } catch (err) {
      console.error(`Error fetching ${symbol}:`, err);
      setErrors((prev) => ({
        ...prev,
        [symbol]: `Could not load data for ${symbol}`,
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [symbol]: false }));
    }
  }, []);

  const addStock = useCallback(
    (symbol: string) => {
      if (selectedSymbols.includes(symbol)) return;
      setSelectedSymbols((prev) => [...prev, symbol]);
      fetchStock(symbol);
    },
    [selectedSymbols, fetchStock]
  );

  const removeStock = useCallback((symbol: string) => {
    setSelectedSymbols((prev) => prev.filter((s) => s !== symbol));
    setStockData((prev) => {
      const n = { ...prev };
      delete n[symbol];
      return n;
    });
    setErrors((prev) => {
      const n = { ...prev };
      delete n[symbol];
      return n;
    });
  }, []);

  const refreshAll = useCallback(() => {
    selectedSymbols.forEach(fetchStock);
  }, [selectedSymbols, fetchStock]);

  const loadDefaults = useCallback(() => {
    setInitialized(true);
    DEFAULT_SYMBOLS.forEach(addStock);
  }, [addStock]);

  // Auto-load defaults on mount
  useEffect(() => {
    if (!initialized && selectedSymbols.length === 0) {
      loadDefaults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Read portfolio holdings from localStorage for suggestions
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPortfolioSymbols(
            parsed.map((h: { symbol: string }) => ({ symbol: h.symbol, label: h.symbol }))
          );
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Stocks that have loaded data
  const loadedStocks = selectedSymbols
    .filter((s) => stockData[s] != null)
    .map((s) => stockData[s]);

  const isAnyLoading = Object.values(loading).some(Boolean);

  return (
    <div className="space-y-10">
      {/* Search + selected chips */}
      <div className="space-y-5">
        <StockSearchBar
          selectedSymbols={selectedSymbols}
          onAdd={addStock}
          onRemove={removeStock}
          loading={loading}
          maxStocks={4}
          errors={errors}
          onRetry={fetchStock}
          suggestedSymbols={portfolioSymbols}
        />

        {/* Actions row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-sm text-[var(--text-tertiary)]">
            {selectedSymbols.length === 0
              ? "Search for stocks above to start comparing"
              : `Comparing ${selectedSymbols.length} stock${selectedSymbols.length > 1 ? "s" : ""}`}
          </span>

          {selectedSymbols.length > 0 && (
            <button
              onClick={refreshAll}
              disabled={isAnyLoading}
              aria-label="Refresh all stock data"
              className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
            >
              <IconRefresh className={`w-4 h-4 ${isAnyLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          )}
        </div>

      </div>

      {/* Comparison cards grid */}
      <AnimatePresence mode="popLayout">
        {loadedStocks.length > 0 && (
          <motion.section
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Stock comparison cards"
          >
            <div
              className={[
                "grid gap-5",
                loadedStocks.length === 1 ? "grid-cols-1 max-w-sm" : "",
                loadedStocks.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "",
                loadedStocks.length === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "",
                loadedStocks.length === 4 ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <AnimatePresence>
                {loadedStocks.map((stock, i) => (
                  <ComparisonCard
                    key={stock.symbol}
                    stock={stock}
                    onRemove={removeStock}
                    index={i}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Metrics comparison section — only when 2+ stocks loaded */}
      <AnimatePresence>
        {loadedStocks.length >= 2 && (
          <motion.section
            key="metrics"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.2 }}
            aria-label="Side-by-side metric comparison"
          >
            {/* Section header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                  <IconChartBar className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Metric Comparison
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                <IconInfoCircle className="w-3.5 h-3.5" />
                Bars are relative to the highest value across stocks
              </div>
            </div>

            {/* Stock symbol legend */}
            <div className="flex flex-wrap gap-3 mb-6">
              {loadedStocks.map((stock, i) => {
                const colors = [
                  "var(--color-primary)",
                  "#7c3aed",
                  "#0891b2",
                  "#b45309",
                ];
                return (
                  <div key={stock.symbol} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: colors[i] }}
                      aria-hidden
                    />
                    <span className="text-xs font-mono font-bold text-[var(--text-secondary)]">
                      {stock.symbol}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)] hidden sm:inline">
                      {stock.name?.split(" ").slice(0, 2).join(" ")}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Group tabs */}
            <div
              className="flex gap-1 p-1 rounded-xl bg-[var(--surface-secondary)] mb-8 overflow-x-auto"
              role="tablist"
              aria-label="Metric categories"
            >
              {METRIC_GROUPS.map((group, i) => (
                <button
                  key={group.groupLabel}
                  role="tab"
                  aria-selected={activeGroup === i}
                  onClick={() => setActiveGroup(i)}
                  className={[
                    "flex-1 min-w-max px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap",
                    activeGroup === i
                      ? "bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
                  ].join(" ")}
                >
                  {group.groupLabel}
                </button>
              ))}
            </div>

            {/* Column headers row */}
            <div
              className="grid mb-3"
              style={{
                gridTemplateColumns: `140px repeat(${loadedStocks.length}, 1fr)`,
              }}
              role="rowgroup"
              aria-label="Metric column headers"
            >
              <div />
              {loadedStocks.map((stock, i) => {
                const colors = [
                  "var(--color-primary)",
                  "#7c3aed",
                  "#0891b2",
                  "#b45309",
                ];
                return (
                  <div key={stock.symbol} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: colors[i] }}
                      aria-hidden
                    />
                    <span
                      className="text-xs font-mono font-bold"
                      style={{ color: colors[i] }}
                    >
                      {stock.symbol}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Metric rows */}
            <div
              className="rounded-xl border border-[var(--border-primary)] overflow-hidden"
              role="table"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeGroup}
                  initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -12 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                  role="rowgroup"
                >
                  {METRIC_GROUPS[activeGroup].metrics.map((metric, ri) => (
                    <div
                      key={metric.key as string}
                      className={[
                        "px-5 py-4",
                        ri % 2 === 0
                          ? "bg-[var(--surface-elevated)]"
                          : "bg-[var(--surface-secondary)]",
                      ].join(" ")}
                    >
                      <MetricComparisonRow
                        stocks={loadedStocks}
                        metric={metric}
                        rowIndex={ri}
                      />
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

    </div>
  );
}
