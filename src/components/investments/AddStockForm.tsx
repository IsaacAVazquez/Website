"use client";

import React, { useState } from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { PortfolioHolding } from "@/types/investment";
import { IconPlus, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";

interface AddStockFormProps {
  onAdd: (holding: PortfolioHolding) => void;
}

export function AddStockForm({ onAdd }: AddStockFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    symbol: "",
    shares: "",
    averageCost: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const holding: PortfolioHolding = {
      symbol: formData.symbol.toUpperCase().trim(),
      shares: parseFloat(formData.shares),
      averageCost: parseFloat(formData.averageCost),
      purchaseDate: new Date().toISOString(),
    };

    onAdd(holding);
    setFormData({ symbol: "", shares: "", averageCost: "" });
    setIsOpen(false);
  };

  const isValid = formData.symbol && formData.shares && formData.averageCost;

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
            transition={{ duration: 0.3 }}
          >
            <WarmCard padding="lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-black dark:text-white">
                  Add New Investment
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded transition-colors"
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
                    className="block text-sm font-semibold text-black dark:text-white mb-2"
                  >
                    Stock Symbol
                  </label>
                  <input
                    type="text"
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) =>
                      setFormData({ ...formData, symbol: e.target.value })
                    }
                    placeholder="e.g., AAPL"
                    className="w-full px-4 py-3 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-600 text-black dark:text-white placeholder-neutral-400 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
                    required
                  />
                </div>

                {/* Number of Shares */}
                <div>
                  <label
                    htmlFor="shares"
                    className="block text-sm font-semibold text-black dark:text-white mb-2"
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
                    className="w-full px-4 py-3 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-600 text-black dark:text-white placeholder-neutral-400 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
                    required
                  />
                </div>

                {/* Average Cost per Share */}
                <div>
                  <label
                    htmlFor="averageCost"
                    className="block text-sm font-semibold text-black dark:text-white mb-2"
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
                    className="w-full px-4 py-3 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-600 text-black dark:text-white placeholder-neutral-400 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
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
