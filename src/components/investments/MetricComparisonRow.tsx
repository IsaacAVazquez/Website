"use client";

import React from "react";
import { motion } from "framer-motion";
import { StockDetail } from "@/types/investment";

interface MetricDef {
  label: string;
  key: keyof StockDetail;
  format: (v: number | null) => string;
  /** higher = better (default true) */
  higherBetter?: boolean;
  /** if true, value is a decimal proportion (e.g. 0.12 = 12%) */
  isDecimal?: boolean;
}

interface MetricComparisonRowProps {
  stocks: StockDetail[];
  metric: MetricDef;
  rowIndex: number;
}

const ACCENT_COLORS = [
  "var(--color-primary)",
  "#7c3aed",
  "#0891b2",
  "#b45309",
];

function getValue(stock: StockDetail, key: keyof StockDetail): number | null {
  const v = stock[key];
  if (v == null || typeof v !== "number") return null;
  return v;
}

export function MetricComparisonRow({ stocks, metric, rowIndex }: MetricComparisonRowProps) {
  const values = stocks.map((s) => getValue(s, metric.key));

  // Find max absolute value for bar sizing (exclude nulls)
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return null;

  // All values null → skip render
  const allNull = values.every((v) => v == null);
  if (allNull) return null;

  const maxAbs = Math.max(...nums.map(Math.abs));
  const higherBetter = metric.higherBetter !== false;

  // Find best/worst among non-null values
  const bestValue = higherBetter ? Math.max(...nums) : Math.min(...nums);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rowIndex * 0.04, duration: 0.35, ease: "easeOut" }}
      className="grid gap-3"
      style={{ gridTemplateColumns: `140px repeat(${stocks.length}, 1fr)` }}
      role="row"
    >
      {/* Label */}
      <div className="flex items-center" role="rowheader">
        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider leading-tight">
          {metric.label}
        </span>
      </div>

      {/* Per-stock bar + value */}
      {stocks.map((stock, i) => {
        const val = values[i];
        const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
        const isBest = val != null && val === bestValue && nums.length > 1;

        // Bar fill percent: 0–100%
        const fillPct =
          val != null && maxAbs !== 0 ? Math.abs(val) / maxAbs : 0;

        const displayVal = metric.format(val);

        return (
          <div key={stock.symbol} className="flex flex-col gap-1" role="cell">
            {/* Bar track */}
            <div className="h-5 w-full rounded-full bg-[var(--border-primary)] overflow-hidden relative">
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: color,
                  opacity: isBest ? 1 : 0.45,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${fillPct * 100}%` }}
                transition={{ delay: rowIndex * 0.04 + 0.3, duration: 0.55, ease: "easeOut" }}
              />
            </div>

            {/* Value label */}
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-bold font-mono"
                style={{
                  color: isBest ? color : "var(--text-secondary)",
                }}
              >
                {displayVal}
              </span>
              {isBest && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                  style={{
                    backgroundColor: `${color}1a`,
                    color: color,
                  }}
                >
                  Best
                </span>
              )}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

// ─── Metric definitions ──────────────────────────────────────────────────────

function fmtLargeNum(n: number | null): string {
  if (n == null) return "—";
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}
function fmtPct(n: number | null, isDecimal = false): string {
  if (n == null) return "—";
  const v = isDecimal ? n * 100 : n;
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}
function fmtNum(n: number | null, dec = 1): string {
  if (n == null) return "—";
  return n.toFixed(dec);
}
function fmtPrice(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toFixed(2)}`;
}

export const METRIC_GROUPS: { groupLabel: string; metrics: MetricDef[] }[] = [
  {
    groupLabel: "Price & Value",
    metrics: [
      {
        label: "Market Cap",
        key: "marketCap",
        format: fmtLargeNum,
        higherBetter: true,
      },
      {
        label: "P/E (Trailing)",
        key: "trailingPE",
        format: (n) => fmtNum(n, 1),
        higherBetter: false,
      },
      {
        label: "Forward P/E",
        key: "forwardPE",
        format: (n) => fmtNum(n, 1),
        higherBetter: false,
      },
      {
        label: "Price / Book",
        key: "priceToBook",
        format: (n) => fmtNum(n, 2),
        higherBetter: false,
      },
      {
        label: "PEG Ratio",
        key: "pegRatio",
        format: (n) => fmtNum(n, 2),
        higherBetter: false,
      },
      {
        label: "52-wk Price",
        key: "fiftyTwoWeekHigh",
        format: fmtPrice,
        higherBetter: true,
      },
    ],
  },
  {
    groupLabel: "Profitability",
    metrics: [
      {
        label: "Profit Margin",
        key: "profitMargins",
        format: (n) => fmtPct(n, true),
        higherBetter: true,
        isDecimal: true,
      },
      {
        label: "Gross Margin",
        key: "grossMargins",
        format: (n) => fmtPct(n, true),
        higherBetter: true,
        isDecimal: true,
      },
      {
        label: "Operating Margin",
        key: "operatingMargins",
        format: (n) => fmtPct(n, true),
        higherBetter: true,
        isDecimal: true,
      },
      {
        label: "Return on Equity",
        key: "returnOnEquity",
        format: (n) => fmtPct(n, true),
        higherBetter: true,
        isDecimal: true,
      },
      {
        label: "Return on Assets",
        key: "returnOnAssets",
        format: (n) => fmtPct(n, true),
        higherBetter: true,
        isDecimal: true,
      },
    ],
  },
  {
    groupLabel: "Growth",
    metrics: [
      {
        label: "Revenue Growth",
        key: "revenueGrowth",
        format: (n) => fmtPct(n, true),
        higherBetter: true,
        isDecimal: true,
      },
      {
        label: "Earnings Growth",
        key: "earningsGrowth",
        format: (n) => fmtPct(n, true),
        higherBetter: true,
        isDecimal: true,
      },
      {
        label: "52-wk Return",
        key: "fiftyTwoWeekChange",
        format: (n) => fmtPct(n, true),
        higherBetter: true,
        isDecimal: true,
      },
    ],
  },
  {
    groupLabel: "Risk & Dividends",
    metrics: [
      {
        label: "Beta",
        key: "beta",
        format: (n) => fmtNum(n, 2),
        higherBetter: false,
      },
      {
        label: "Dividend Yield",
        key: "dividendYield",
        format: (n) => fmtPct(n, true),
        higherBetter: true,
        isDecimal: true,
      },
    ],
  },
  {
    groupLabel: "Financials",
    metrics: [
      {
        label: "Revenue",
        key: "totalRevenue",
        format: fmtLargeNum,
        higherBetter: true,
      },
      {
        label: "Cash",
        key: "totalCash",
        format: fmtLargeNum,
        higherBetter: true,
      },
      {
        label: "Total Debt",
        key: "totalDebt",
        format: fmtLargeNum,
        higherBetter: false,
      },
    ],
  },
];
