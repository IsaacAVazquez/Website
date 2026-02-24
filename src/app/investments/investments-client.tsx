"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useInvestments } from "@/hooks/useInvestments";
import { PortfolioSummary } from "@/components/investments/PortfolioSummary";
import { StockCard } from "@/components/investments/StockCard";
import { AddStockForm } from "@/components/investments/AddStockForm";
import { WarmCard } from "@/components/ui/WarmCard";
import {
  IconChartLine,
  IconAlertCircle,
  IconTrendingUp,
  IconChartBar,
  IconScaleOutline,
} from "@tabler/icons-react";

const FEATURES = [
  {
    icon: IconTrendingUp,
    label: "Real-Time Tracking",
    desc: "Live prices via Yahoo Finance",
  },
  {
    icon: IconChartBar,
    label: "Portfolio Analytics",
    desc: "Gain/loss and daily changes",
  },
  {
    icon: IconScaleOutline,
    label: "Compare Stocks",
    desc: "Side-by-side analysis",
    href: "/investments/compare",
  },
];

function InvestmentsPageSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--surface-primary)]">
      {/* Hero skeleton */}
      <section className="border-b border-[var(--border-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="h-7 w-24 rounded-full bg-[var(--neutral-200)] dark:bg-[var(--neutral-700)] animate-pulse mb-6" />
          <div className="h-12 w-80 rounded-lg bg-[var(--neutral-200)] dark:bg-[var(--neutral-700)] animate-pulse mb-4" />
          <div className="h-6 w-[32rem] max-w-full rounded-lg bg-[var(--neutral-100)] dark:bg-[var(--neutral-800)] animate-pulse mb-10" />
          <div className="flex gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 w-44 rounded-xl bg-[var(--neutral-100)] dark:bg-[var(--neutral-800)] animate-pulse" />
            ))}
          </div>
        </div>
      </section>

      {/* Content skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <ContentSkeleton />
      </section>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="space-y-8">
      {/* Summary skeleton */}
      <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-8">
        <div className="h-4 w-28 rounded bg-[var(--neutral-200)] dark:bg-[var(--neutral-700)] animate-pulse mb-3" />
        <div className="h-12 w-48 rounded-lg bg-[var(--neutral-200)] dark:bg-[var(--neutral-700)] animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <div className="h-4 w-20 rounded bg-[var(--neutral-100)] dark:bg-[var(--neutral-800)] animate-pulse mb-2" />
              <div className="h-8 w-32 rounded bg-[var(--neutral-200)] dark:bg-[var(--neutral-700)] animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-6">
            <div className="h-7 w-20 rounded bg-[var(--neutral-200)] dark:bg-[var(--neutral-700)] animate-pulse mb-2" />
            <div className="h-4 w-40 rounded bg-[var(--neutral-100)] dark:bg-[var(--neutral-800)] animate-pulse mb-6" />
            <div className="h-10 w-32 rounded bg-[var(--neutral-200)] dark:bg-[var(--neutral-700)] animate-pulse mb-6" />
            <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-[var(--border-primary)]">
              <div className="h-8 w-24 rounded bg-[var(--neutral-100)] dark:bg-[var(--neutral-800)] animate-pulse" />
              <div className="h-8 w-24 rounded bg-[var(--neutral-100)] dark:bg-[var(--neutral-800)] animate-pulse" />
            </div>
            <div className="h-8 w-36 rounded bg-[var(--neutral-200)] dark:bg-[var(--neutral-700)] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InvestmentsClient() {
  const shouldReduceMotion = useReducedMotion();
  const {
    holdings,
    enhancedHoldings,
    summary,
    loading,
    error,
    initialized,
    quotesReady,
    addHolding,
    removeHolding,
    refreshQuotes,
  } = useInvestments();

  const existingSymbols = holdings.map(h => h.symbol);

  // Full-page skeleton before localStorage has been read
  if (!initialized) {
    return <InvestmentsPageSkeleton />;
  }

  const showContentSkeleton = loading && !quotesReady && enhancedHoldings.length > 0;
  const showEmptyState = quotesReady && enhancedHoldings.length === 0;
  const showPortfolio = enhancedHoldings.length > 0;

  return (
    <div className="min-h-screen bg-[var(--surface-primary)]">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--border-primary)]">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(var(--border-primary) 1px, transparent 1px), linear-gradient(90deg, var(--border-primary) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
          aria-hidden
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--color-primary)] text-white">
              <span
                className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"
                aria-hidden
              />
              Live Data
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              Powered by Yahoo Finance
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--text-primary)] mb-4 leading-[1.05]">
            Investment{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--color-primary), #7c3aed)",
              }}
            >
              Portfolio
            </span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed">
            Track your investments in real-time with live stock market data.
            Monitor portfolio performance, gains, losses, and daily market
            changes all in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {FEATURES.map(({ icon: Icon, label, desc, href }) => {
              const content = (
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] text-sm">
                  <Icon className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                  <div>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {label}
                    </span>
                    <span className="text-[var(--text-tertiary)] ml-1.5 text-xs hidden sm:inline">
                      {desc}
                    </span>
                  </div>
                </div>
              );

              if (href) {
                return (
                  <Link
                    key={label}
                    href={href}
                    className="hover:border-[var(--color-primary)] transition-colors rounded-xl"
                  >
                    {content}
                  </Link>
                );
              }

              return <div key={label}>{content}</div>;
            })}
          </div>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
            className="mb-8"
          >
            <WarmCard padding="md">
              <div className="flex items-center gap-3 text-[var(--text-tertiary)]">
                <IconAlertCircle className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </div>
            </WarmCard>
          </motion.div>
        )}

        {/* Content skeleton while quotes are loading for the first time */}
        {showContentSkeleton && <ContentSkeleton />}

        {/* Portfolio view */}
        {!showContentSkeleton && showPortfolio && (
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
          >
            {/* Portfolio Summary */}
            <div className="mb-12">
              <PortfolioSummary
                summary={summary}
                loading={loading}
                onRefresh={refreshQuotes}
              />
            </div>

            {/* Add Stock Form */}
            <div className="mb-12">
              <AddStockForm onAdd={addHolding} existingSymbols={existingSymbols} />
            </div>

            {/* Holdings Grid */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
                Your Holdings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enhancedHoldings.map((holding, index) => (
                  <motion.div
                    key={holding.symbol}
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: shouldReduceMotion ? 0 : index * 0.05 }}
                  >
                    <StockCard
                      holding={holding}
                      onRemove={removeHolding}
                      loading={loading}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!showContentSkeleton && showEmptyState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.1 }}
          >
            {/* Add Stock Form first */}
            <div className="mb-12">
              <AddStockForm onAdd={addHolding} existingSymbols={existingSymbols} />
            </div>

            <WarmCard padding="xl">
              <div className="text-center py-12">
                <IconChartLine className="w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                  Start Building Your Portfolio
                </h3>
                <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">
                  Add your first investment to begin tracking your portfolio
                  performance with real-time market data.
                </p>
                <div className="flex flex-col gap-3 max-w-sm mx-auto">
                  <div className="text-sm text-[var(--text-secondary)] text-left">
                    <p className="font-semibold mb-2">
                      Popular stocks to track:
                    </p>
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
      </section>

      {/* ── Disclaimer ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <p className="text-xs text-[var(--text-tertiary)] border-t border-[var(--border-primary)] pt-6 leading-relaxed">
          <strong className="font-semibold">Disclaimer:</strong> Data is sourced
          from Yahoo Finance and may be delayed or inaccurate. Nothing on this
          page constitutes financial advice. Always conduct your own research
          before making investment decisions.
        </p>
      </section>
    </div>
  );
}
