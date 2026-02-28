"use client";

import React, { useState, useEffect, useRef } from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { PortfolioHolding } from "@/types/investment";
import { IconPlus, IconX, IconLoader2 } from "@tabler/icons-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const SYMBOL_REGEX = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/;

interface AddStockFormProps {
  onAdd: (holding: PortfolioHolding) => void;
  existingSymbols?: string[];
  prefillSymbol?: string | null;
  onPrefillUsed?: () => void;
}

interface StockInfo {
  name: string;
  price: number;
}

export function AddStockForm({ onAdd, existingSymbols = [], prefillSymbol, onPrefillUsed }: AddStockFormProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    symbol: "",
    shares: "",
    averageCost: "",
  });
  const [symbolError, setSymbolError] = useState<string | null>(null);
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [symbolLookupLoading, setSymbolLookupLoading] = useState(false);
  const lookupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prefill symbol from external trigger (e.g. quick-add chips)
  useEffect(() => {
    if (prefillSymbol) {
      setIsOpen(true);
      setFormData(prev => ({ ...prev, symbol: prefillSymbol }));
      onPrefillUsed?.();
    }
  }, [prefillSymbol, onPrefillUsed]);

  const validateSymbol = (raw: string): string | null => {
    const sym = raw.trim().toUpperCase();
    if (!sym) return null;
    if (!SYMBOL_REGEX.test(sym)) {
      return "Enter a valid ticker (1-5 letters, e.g. AAPL)";
    }
    if (existingSymbols.includes(sym)) {
      return `${sym} is already in your portfolio`;
    }
    return null;
  };

  // Debounced symbol lookup: fetch company name + current price
  useEffect(() => {
    const sym = formData.symbol.trim().toUpperCase();
    if (!SYMBOL_REGEX.test(sym)) {
      setStockInfo(null);
      setSymbolLookupLoading(false);
      return;
    }
    if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
    setSymbolLookupLoading(true);
    lookupTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stocks?symbols=${sym}`);
        const data = await res.json();
        const quote = data?.quotes?.find((q: { symbol: string }) => q.symbol === sym);
        if (quote && !quote.error && quote.price > 0) {
          setStockInfo({ name: quote.name || sym, price: quote.price });
        } else {
          setStockInfo(null);
        }
      } catch {
        setStockInfo(null);
      } finally {
        setSymbolLookupLoading(false);
      }
    }, 600);
    return () => {
      if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.symbol]);

  const handleSymbolChange = (value: string) => {
    setFormData({ ...formData, symbol: value });
    setStockInfo(null);
    if (symbolError) {
      setSymbolError(validateSymbol(value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateSymbol(formData.symbol);
    if (error) {
      setSymbolError(error);
      return;
    }

    const holding: PortfolioHolding = {
      symbol: formData.symbol.toUpperCase().trim(),
      shares: parseFloat(formData.shares),
      averageCost: parseFloat(formData.averageCost),
      purchaseDate: new Date().toISOString(),
    };

    onAdd(holding);
    setFormData({ symbol: "", shares: "", averageCost: "" });
    setSymbolError(null);
    setStockInfo(null);
    setIsOpen(false);
  };

  const isValid =
    formData.symbol &&
    parseFloat(formData.shares) > 0 &&
    parseFloat(formData.averageCost) > 0 &&
    !symbolError;

  return (
    <div>
      {!isOpen ? (
        <ModernButton
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => setIsOpen(true)}
        >
          <IconPlus className="w-5 h-5 mr-2" />
          Add Investment
        </ModernButton>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
          >
            <WarmCard padding="lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  Add New Investment
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-[var(--surface-secondary)] rounded-xl transition-colors"
                  aria-label="Close form"
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Stock Symbol */}
                <div>
                  <label
                    htmlFor="symbol"
                    className="block text-sm font-semibold text-[var(--text-primary)] mb-2"
                  >
                    Stock Symbol
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="symbol"
                      value={formData.symbol}
                      onChange={(e) => handleSymbolChange(e.target.value.toUpperCase())}
                      onBlur={() => setSymbolError(validateSymbol(formData.symbol))}
                      placeholder="e.g., AAPL"
                      className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors uppercase"
                      aria-invalid={!!symbolError}
                      aria-describedby={symbolError ? "symbol-error" : undefined}
                      required
                    />
                    {symbolLookupLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <IconLoader2 className="w-4 h-4 text-[var(--text-tertiary)] animate-spin" />
                      </div>
                    )}
                  </div>
                  {symbolError && (
                    <p id="symbol-error" className="mt-1.5 text-sm text-[var(--color-error)]">
                      {symbolError}
                    </p>
                  )}
                  {stockInfo && !symbolError && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
                      <span className="text-sm font-semibold text-[var(--color-primary)]">{stockInfo.name}</span>
                      <span className="text-sm text-[var(--text-secondary)]">—</span>
                      <span className="text-sm font-mono text-[var(--text-primary)]">
                        ${stockInfo.price.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Number of Shares */}
                <div>
                  <label
                    htmlFor="shares"
                    className="block text-sm font-semibold text-[var(--text-primary)] mb-2"
                  >
                    Number of Shares
                  </label>
                  <input
                    type="number"
                    id="shares"
                    value={formData.shares}
                    onChange={(e) =>
                      setFormData({ ...formData, shares: e.target.value })
                    }
                    placeholder="e.g., 10"
                    step="0.001"
                    min="0"
                    className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
                    required
                  />
                </div>

                {/* Average Cost per Share */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="averageCost"
                      className="block text-sm font-semibold text-[var(--text-primary)]"
                    >
                      Average Cost per Share
                    </label>
                    {stockInfo && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, averageCost: stockInfo.price.toFixed(2) }))}
                        className="text-xs font-medium text-[var(--color-primary)] hover:underline"
                      >
                        Use current price (${stockInfo.price.toFixed(2)})
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    id="averageCost"
                    value={formData.averageCost}
                    onChange={(e) =>
                      setFormData({ ...formData, averageCost: e.target.value })
                    }
                    placeholder="e.g., 150.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <ModernButton
                    type="submit"
                    variant="primary"
                    size="md"
                    fullWidth
                    disabled={!isValid}
                  >
                    Add to Portfolio
                  </ModernButton>
                  <ModernButton
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </ModernButton>
                </div>
              </form>
            </WarmCard>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
