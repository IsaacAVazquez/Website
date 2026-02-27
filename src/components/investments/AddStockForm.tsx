"use client";

import React, { useState } from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { PortfolioHolding } from "@/types/investment";
import { IconPlus, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const SYMBOL_REGEX = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/;

interface AddStockFormProps {
  onAdd: (holding: PortfolioHolding) => void;
  existingSymbols?: string[];
}

export function AddStockForm({ onAdd, existingSymbols = [] }: AddStockFormProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    symbol: "",
    shares: "",
    averageCost: "",
  });
  const [symbolError, setSymbolError] = useState<string | null>(null);

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

  const handleSymbolChange = (value: string) => {
    setFormData({ ...formData, symbol: value });
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
                  <input
                    type="text"
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) => handleSymbolChange(e.target.value)}
                    onBlur={() => setSymbolError(validateSymbol(formData.symbol))}
                    placeholder="e.g., AAPL"
                    className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
                    aria-invalid={!!symbolError}
                    aria-describedby={symbolError ? "symbol-error" : undefined}
                    required
                  />
                  {symbolError && (
                    <p id="symbol-error" className="mt-1.5 text-sm text-[var(--color-error)]">
                      {symbolError}
                    </p>
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
                  <label
                    htmlFor="averageCost"
                    className="block text-sm font-semibold text-[var(--text-primary)] mb-2"
                  >
                    Average Cost per Share
                  </label>
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
