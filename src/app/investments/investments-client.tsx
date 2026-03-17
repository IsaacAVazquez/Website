"use client";

import React, { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useInvestments } from "@/hooks/useInvestments";
import {
  containerVariants,
  itemVariants,
  fadeInVariants,
  getReducedMotionVariants,
} from "@/components/investments/animations";

const PortfolioTracker = lazy(() =>
  import("@/components/investments/PortfolioTracker").then((m) => ({ default: m.PortfolioTracker }))
);
const StockResearch = lazy(() =>
  import("@/components/investments/StockResearch").then((m) => ({ default: m.StockResearch }))
);

function TabFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

type Tab = "portfolio" | "research";

const TABS: { key: Tab; label: string }[] = [
  { key: "research",  label: "Research" },
  { key: "portfolio", label: "My Portfolio" },
];

export function InvestmentsClient() {
  const [activeTab, setActiveTab] = useState<Tab>("research");
  const [researchSymbol, setResearchSymbol] = useState("AAPL");
  const { holdings } = useInvestments();
  const portfolioSymbols = holdings.map((h) => h.symbol);
  const shouldReduceMotion = useReducedMotion();
  const shellClassName =
    activeTab === "research"
      ? "mx-auto w-full max-w-[1880px] px-4 py-10 sm:px-6 xl:px-8 2xl:px-10"
      : "mx-auto w-full max-w-[1500px] px-4 py-10 sm:px-6 xl:px-8";

  const variants = shouldReduceMotion ? getReducedMotionVariants() : { containerVariants, itemVariants, fadeInVariants };

  function handleResearch(symbol: string) {
    setResearchSymbol(symbol);
    setActiveTab("research");
  }

  return (
    <div className="min-h-screen bg-[var(--surface-primary)]">
      <div className={shellClassName}>
        {/* Page header */}
        <motion.div
          className="mb-8"
          variants={variants.fadeInVariants}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1">
            Investment Research Platform
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Public fintech product exploring portfolio analytics, valuation,
            financial statements, and curated equity research workflows.
          </p>
        </motion.div>

        {/* Top-level tabs */}
        <div
          className="flex gap-1 mb-8 border-b border-[var(--border-primary)]"
          role="tablist"
          aria-label="Investments tabs"
        >
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition border-b-2 -mb-px min-h-[44px] ${
                activeTab === key
                  ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--surface-secondary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab panels with crossfade */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            role="tabpanel"
            aria-label={`${activeTab} panel`}
            className="w-full"
            variants={variants.fadeInVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <Suspense fallback={<TabFallback />}>
              {activeTab === "portfolio" && <PortfolioTracker onResearch={handleResearch} />}
              {activeTab === "research" && (
                <StockResearch
                  initialSymbol={researchSymbol}
                  portfolioSymbols={portfolioSymbols}
                />
              )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
