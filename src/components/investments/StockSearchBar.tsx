"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { IconSearch, IconPlus, IconX, IconLoader2, IconAlertCircle, IconRefresh } from "@tabler/icons-react";

interface StockSearchBarProps {
  selectedSymbols: string[];
  onAdd: (symbol: string) => void;
  onRemove: (symbol: string) => void;
  loading?: Record<string, boolean>;
  maxStocks?: number;
  errors?: Record<string, string>;
  onRetry?: (symbol: string) => void;
  suggestedSymbols?: { symbol: string; label: string }[];
}

const POPULAR_STOCKS = [
  { symbol: "AAPL",  name: "Apple" },
  { symbol: "MSFT",  name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "NVDA",  name: "NVIDIA" },
  { symbol: "META",  name: "Meta" },
  { symbol: "AMZN",  name: "Amazon" },
  { symbol: "TSLA",  name: "Tesla" },
  { symbol: "JPM",   name: "JPMorgan" },
  { symbol: "V",     name: "Visa" },
  { symbol: "UNH",   name: "UnitedHealth" },
  { symbol: "XOM",   name: "ExxonMobil" },
  { symbol: "WMT",   name: "Walmart" },
  { symbol: "COST",  name: "Costco" },
  { symbol: "SPY",   name: "S&P 500 ETF" },
  { symbol: "QQQ",   name: "Nasdaq ETF" },
  { symbol: "BRK.B", name: "Berkshire" },
];

export function StockSearchBar({
  selectedSymbols,
  onAdd,
  onRemove,
  loading = {},
  maxStocks = 4,
  errors = {},
  onRetry,
  suggestedSymbols = [],
}: StockSearchBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAdd = selectedSymbols.length < maxStocks;

  const filtered = POPULAR_STOCKS.filter(
    (s) =>
      !selectedSymbols.includes(s.symbol) &&
      (s.symbol.toLowerCase().includes(input.toLowerCase()) ||
        s.name.toLowerCase().includes(input.toLowerCase()))
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const sym = input.trim().toUpperCase();
    if (sym && !selectedSymbols.includes(sym) && canAdd) {
      onAdd(sym);
      setInput("");
    }
  };

  const handleSuggestionClick = (symbol: string) => {
    if (!selectedSymbols.includes(symbol) && canAdd) {
      onAdd(symbol);
      setInput("");
    }
    inputRef.current?.focus();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-search-bar]")) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Input */}
      <div data-search-bar className="relative">
        <form onSubmit={handleSubmit} className="relative">
          <div
            className={[
              "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200",
              "bg-[var(--surface-elevated)]",
              focused
                ? "border-[var(--color-primary)] shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
                : "border-[var(--border-primary)]",
            ].join(" ")}
          >
            <IconSearch className="w-5 h-5 text-[var(--text-tertiary)] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder={
                canAdd
                  ? `Add a stock (${maxStocks - selectedSymbols.length} remaining)…`
                  : `Max ${maxStocks} stocks selected`
              }
              disabled={!canAdd}
              aria-label="Search for a stock to compare"
              className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm outline-none disabled:opacity-50"
            />
            {input && (
              <button
                type="button"
                onClick={() => setInput("")}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Clear search"
              >
                <IconX className="w-4 h-4" />
              </button>
            )}
            {input && canAdd && (
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-secondary)] transition-colors"
              >
                <IconPlus className="w-3.5 h-3.5" />
                Add
              </button>
            )}
          </div>
        </form>

        {/* Dropdown suggestions */}
        <AnimatePresence>
          {focused && filtered.length > 0 && canAdd && (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -8, scaleY: shouldReduceMotion ? 1 : 0.92 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8, scaleY: shouldReduceMotion ? 1 : 0.92 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.15, ease: "easeOut" }}
              style={{ transformOrigin: "top" }}
              className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] shadow-xl overflow-hidden"
            >
              <div className="p-2 max-h-56 overflow-y-auto">
                <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
                  {input ? "Matching stocks" : "Popular stocks"}
                </p>
                {filtered.slice(0, 8).map((stock) => (
                  <button
                    key={stock.symbol}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSuggestionClick(stock.symbol);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-16 font-bold text-sm font-mono text-[var(--text-primary)]">
                        {stock.symbol}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)]">{stock.name}</span>
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconPlus className="w-4 h-4 text-[var(--color-primary)]" />
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected chips */}
      {selectedSymbols.length > 0 && (
        <div className="flex flex-wrap gap-2" role="list" aria-label="Selected stocks">
          <AnimatePresence>
            {selectedSymbols.map((sym) => {
              const hasError = !!errors[sym];
              return (
                <motion.div
                  key={sym}
                  role="listitem"
                  layout
                  initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.75 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.75 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 25 }}
                  className={[
                    "flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border text-sm font-semibold",
                    hasError
                      ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-[var(--color-error)]"
                      : "border-[var(--border-accent)] bg-[var(--surface-elevated)] text-[var(--color-primary)]",
                  ].join(" ")}
                >
                  {loading[sym] ? (
                    <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : hasError ? (
                    <IconAlertCircle className="w-3.5 h-3.5" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" aria-hidden />
                  )}
                  <span className="font-mono tracking-wide">{sym}</span>
                  {hasError && onRetry && (
                    <button
                      onClick={() => onRetry(sym)}
                      aria-label={`Retry ${sym}`}
                      className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <IconRefresh className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => onRemove(sym)}
                    aria-label={`Remove ${sym}`}
                    className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-[var(--border-primary)] transition-colors"
                  >
                    <IconX className="w-3 h-3 text-[var(--text-secondary)]" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Portfolio suggestions + Quick-add chips when nothing selected */}
      {selectedSymbols.length === 0 && (
        <div className="flex flex-col gap-4">
          {suggestedSymbols.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-widest font-semibold">
                From your portfolio
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedSymbols
                  .filter(s => !selectedSymbols.includes(s.symbol))
                  .map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSuggestionClick(stock.symbol)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 text-xs font-mono font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all duration-150"
                    >
                      {stock.symbol}
                    </button>
                  ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-widest font-semibold">
              Quick add
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_STOCKS.slice(0, 8).map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => handleSuggestionClick(stock.symbol)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-xs font-mono font-semibold text-[var(--text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-150"
                >
                  {stock.symbol}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
