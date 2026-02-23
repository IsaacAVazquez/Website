"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconBuildingBank,
  IconTarget,
} from "@tabler/icons-react";
import { WarmCard } from "@/components/ui/WarmCard";
import { StockDetail } from "@/types/investment";
import { AnalystRatingGauge } from "./AnalystRatingGauge";

interface ComparisonCardProps {
  stock: StockDetail;
  onRemove: (symbol: string) => void;
  index: number;
}

const ACCENT_COLORS = [
  "var(--color-primary)",
  "#7c3aed",
  "#0891b2",
  "#b45309",
];

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtPct(n: number | null | undefined, asDecimal = false): string {
  if (n == null) return "—";
  const value = asDecimal ? n * 100 : n;
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function fmtLargeNum(n: number | null | undefined): string {
  if (n == null) return "—";
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

export function ComparisonCard({ stock, onRemove, index }: ComparisonCardProps) {
  const [expanded, setExpanded] = useState(false);
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const isUp = stock.change >= 0;

  const upside =
    stock.analyst.targetMeanPrice != null && stock.price > 0
      ? ((stock.analyst.targetMeanPrice - stock.price) / stock.price) * 100
      : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 28, delay: index * 0.07 }}
    >
      <WarmCard padding="none" className="overflow-hidden relative">
        {/* Colored top accent strip */}
        <div
          className="h-1 w-full"
          style={{ background: accent }}
          aria-hidden
        />

        <div className="p-5 sm:p-6">
          {/* Header row: symbol + remove */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-2xl font-black font-mono tracking-tight text-[var(--text-primary)]"
                >
                  {stock.symbol}
                </span>
                <span
                  className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider"
                  style={{
                    background: `${accent}1a`,
                    color: accent,
                  }}
                >
                  {stock.sector || "Stock"}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] truncate max-w-[200px]">
                {stock.name || stock.symbol}
              </p>
            </div>
            <button
              onClick={() => onRemove(stock.symbol)}
              aria-label={`Remove ${stock.symbol}`}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--border-primary)] transition-colors shrink-0 ml-2"
            >
              <IconX className="w-4 h-4 text-[var(--text-tertiary)]" />
            </button>
          </div>

          {/* Price section */}
          <div className="mb-5">
            <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              ${fmt(stock.price)}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {isUp ? (
                <IconTrendingUp className="w-4 h-4" style={{ color: "var(--color-success)" }} />
              ) : (
                <IconTrendingDown className="w-4 h-4 text-[var(--color-error)]" />
              )}
              <span
                className="text-sm font-semibold"
                style={{ color: isUp ? "var(--color-success)" : "var(--color-error)" }}
              >
                {fmtPct(stock.changePercent)} ({isUp ? "+" : ""}{fmt(stock.change)})
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">today</span>
            </div>
          </div>

          {/* Analyst rating gauge */}
          <div
            className="rounded-xl p-4 mb-5"
            style={{ background: "var(--surface-secondary)" }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <IconBuildingBank className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <span className="text-[10px] uppercase tracking-widest font-semibold text-[var(--text-tertiary)]">
                Analyst Consensus
              </span>
            </div>
            <AnalystRatingGauge analyst={stock.analyst} size="sm" />
          </div>

          {/* Price target */}
          {stock.analyst.targetMeanPrice != null && (
            <div
              className="rounded-xl p-4 mb-5 flex items-center justify-between"
              style={{ background: "var(--surface-secondary)" }}
            >
              <div className="flex items-center gap-1.5">
                <IconTarget className="w-4 h-4 text-[var(--text-tertiary)]" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-[var(--text-tertiary)]">
                    Price Target
                  </p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    ${fmt(stock.analyst.targetMeanPrice)}
                  </p>
                </div>
              </div>
              {upside != null && (
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-[var(--text-tertiary)]">
                    Upside
                  </p>
                  <p
                    className="text-lg font-bold"
                    style={{ color: upside >= 0 ? "var(--color-success)" : "var(--color-error)" }}
                  >
                    {fmtPct(upside)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Key metrics grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Market Cap",  value: fmtLargeNum(stock.marketCap) },
              { label: "P/E (TTM)",   value: fmt(stock.trailingPE, 1) },
              { label: "Fwd P/E",     value: fmt(stock.forwardPE, 1) },
              { label: "Profit Margin", value: fmtPct(stock.profitMargins, true) },
              { label: "Revenue Growth", value: fmtPct(stock.revenueGrowth, true) },
              { label: "Beta",        value: fmt(stock.beta, 2) },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
                  {label}
                </span>
                <span className="text-sm font-bold text-[var(--text-primary)] font-mono">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors rounded-lg hover:bg-[var(--surface-secondary)]"
            aria-expanded={expanded}
          >
            {expanded ? (
              <>Less detail <IconChevronUp className="w-3.5 h-3.5" /></>
            ) : (
              <>More detail <IconChevronDown className="w-3.5 h-3.5" /></>
            )}
          </button>

          {/* Expanded metrics */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="pt-3 border-t border-[var(--border-primary)] mt-3 grid grid-cols-2 gap-3"
            >
              {[
                { label: "52-wk High",   value: `$${fmt(stock.fiftyTwoWeekHigh)}` },
                { label: "52-wk Low",    value: `$${fmt(stock.fiftyTwoWeekLow)}` },
                { label: "52-wk Change", value: fmtPct(stock.fiftyTwoWeekChange, true) },
                { label: "Div Yield",    value: fmtPct(stock.dividendYield, true) },
                { label: "ROE",          value: fmtPct(stock.returnOnEquity, true) },
                { label: "ROA",          value: fmtPct(stock.returnOnAssets, true) },
                { label: "Gross Margin", value: fmtPct(stock.grossMargins, true) },
                { label: "Op Margin",    value: fmtPct(stock.operatingMargins, true) },
                { label: "Revenue",      value: fmtLargeNum(stock.totalRevenue) },
                { label: "Total Cash",   value: fmtLargeNum(stock.totalCash) },
                { label: "Total Debt",   value: fmtLargeNum(stock.totalDebt) },
                { label: "P/B",          value: fmt(stock.priceToBook, 2) },
                { label: "PEG Ratio",    value: fmt(stock.pegRatio, 2) },
                { label: "EV",           value: fmtLargeNum(stock.enterpriseValue) },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
                    {label}
                  </span>
                  <span className="text-sm font-bold text-[var(--text-primary)] font-mono">
                    {value}
                  </span>
                </div>
              ))}

              {/* Industry */}
              {stock.industry && (
                <div className="col-span-2 flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
                    Industry
                  </span>
                  <span className="text-sm text-[var(--text-secondary)]">{stock.industry}</span>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </WarmCard>
    </motion.div>
  );
}
