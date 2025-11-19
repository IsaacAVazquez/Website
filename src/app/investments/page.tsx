"use client";

import React from "react";
import { motion } from "framer-motion";
import { useInvestments } from "@/hooks/useInvestments";
import { PortfolioSummary } from "@/components/investments/PortfolioSummary";
import { StockCard } from "@/components/investments/StockCard";
import { AddStockForm } from "@/components/investments/AddStockForm";
import { PerformanceChart } from "@/components/investments/PerformanceChart";
import { WarmCard } from "@/components/ui/WarmCard";
import { IconChartLine, IconAlertCircle } from "@tabler/icons-react";

export default function InvestmentsPage() {
  const {
    enhancedHoldings,
    summary,
    loading,
    error,
    addHolding,
    removeHolding,
    refreshQuotes,
  } = useInvestments();

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#1C1410]">
      {/* Header Section */}
      <section className="pentagram-section bg-white dark:bg-[#1C1410]">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto"
          >
            {/* Page Title */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-4">
                <IconChartLine className="w-12 h-12 text-black dark:text-white" />
                <h1 className="editorial-heading text-[#2D1B12] dark:text-[#FFFCF7]">
                  Investment Portfolio
                </h1>
              </div>
              <p className="editorial-body text-[#4A3426] dark:text-[#D4A88E] max-w-3xl">
                Track your investments in real-time with live stock market data. Monitor your portfolio performance, gains, losses, and daily market changes all in one place.
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <WarmCard padding="md">
                  <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                    <IconAlertCircle className="w-5 h-5" />
                    <p className="text-sm">{error}</p>
                  </div>
                </WarmCard>
              </motion.div>
            )}

            {/* Portfolio Summary */}
            {enhancedHoldings.length > 0 && (
              <div className="mb-12">
                <PortfolioSummary
                  summary={summary}
                  loading={loading}
                  onRefresh={refreshQuotes}
                />
              </div>
            )}

            {/* Add Stock Form */}
            <div className="mb-12">
              <AddStockForm onAdd={addHolding} />
            </div>

            {/* Performance Chart */}
            {enhancedHoldings.length > 0 && (
              <div className="mb-12">
                <PerformanceChart
                  totalValue={summary.totalValue}
                  totalGainLoss={summary.totalGainLoss}
                />
              </div>
            )}

            {/* Holdings Grid */}
            {enhancedHoldings.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
                  Your Holdings
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {enhancedHoldings.map((holding) => (
                    <StockCard
                      key={holding.symbol}
                      holding={holding}
                      onRemove={removeHolding}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <WarmCard padding="xl">
                  <div className="text-center py-12">
                    <IconChartLine className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-black dark:text-white mb-3">
                      Start Building Your Portfolio
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mb-6">
                      Add your first investment to begin tracking your portfolio performance with real-time market data.
                    </p>
                    <div className="flex flex-col gap-3 max-w-sm mx-auto">
                      <div className="text-sm text-neutral-500 dark:text-neutral-400 text-left">
                        <p className="font-semibold mb-2">Popular stocks to track:</p>
                        <ul className="space-y-1 font-mono">
                          <li>• AAPL - Apple Inc.</li>
                          <li>• GOOGL - Alphabet Inc.</li>
                          <li>• MSFT - Microsoft Corporation</li>
                          <li>• TSLA - Tesla, Inc.</li>
                          <li>• AMZN - Amazon.com, Inc.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </WarmCard>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Bottom Spacing */}
      <div className="h-8" aria-hidden="true" />
    </div>
  );
}
