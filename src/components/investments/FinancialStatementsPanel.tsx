"use client";

import React, { useState } from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { useStockData } from "@/hooks/useStockData";
import type { InvestmentSection } from "@/types/investment";
import { ErrorState } from "./ErrorState";

interface Props { symbol: string }

type StatementType = "income_statement" | "balance_sheet" | "cash_flow";
type Period = "quarterly" | "annual";

const TABS: { key: StatementType; label: string }[] = [
  { key: "income_statement", label: "Income Statement" },
  { key: "balance_sheet",    label: "Balance Sheet" },
  { key: "cash_flow",        label: "Cash Flow" },
];

function formatNum(val: unknown): string {
  const n = typeof val === "number" ? val : Number(val);
  if (isNaN(n)) return String(val ?? "—");
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

// API returns { quarterly: [...], annual: [...] } for financial statements.
// Pick the selected period array and normalize to { columns, rows } for rendering.
function normalize(
  raw: unknown,
  period: Period
): { columns: string[]; rows: Record<string, unknown>[] } | null {
  if (!raw || typeof raw !== "object") return null;

  let arr: unknown;

  if (Array.isArray(raw)) {
    arr = raw;
  } else {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj[period])) {
      arr = obj[period];
    } else if (Array.isArray(obj.quarterly)) {
      arr = obj.quarterly;
    } else {
      // Fallback: object of { rowLabel: { period: value } }
      const rows = Object.entries(obj).map(([label, vals]) => ({
        label,
        ...(vals as Record<string, unknown>),
      }));
      if (rows.length === 0) return null;
      const allCols = Array.from(new Set(rows.flatMap(Object.keys)));
      return { columns: allCols, rows };
    }
  }

  if (!Array.isArray(arr) || arr.length === 0) return null;
  const columns = Object.keys(arr[0] as object);
  return { columns, rows: arr as Record<string, unknown>[] };
}

function StatementTable({
  section,
  symbol,
  period,
}: {
  section: InvestmentSection;
  symbol: string;
  period: Period;
}) {
  const { data, isLoading, error, isNotFetched, refetch } = useStockData(symbol, section);

  if (isLoading) {
    return (
      <div className="space-y-2 py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-7 rounded bg-[var(--neutral-200)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} isNotFetched={isNotFetched} onRetry={refetch} />;
  }

  const table = normalize(data, period);
  if (!table) {
    return <p className="text-sm text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))] py-4">No data available.</p>;
  }

  // Identify the label column (first string column) vs numeric period columns
  const labelCol = table.columns[0];
  const periodCols = table.columns.slice(1, 9); // cap at 8 periods

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs min-w-[480px]" aria-label={`${section.replace("_", " ")} statement`}>
        <thead>
          <tr className="border-b border-[var(--home-rule)]">
            <th className="text-left py-2 px-2 text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))] font-medium w-40 sticky left-0 bg-[color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))]">
              Metric
            </th>
            {periodCols.map((col) => (
              <th
                key={col}
                className="text-right py-2 px-2 text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))] font-medium whitespace-nowrap"
              >
                {String(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[var(--home-rule)] last:border-0 hover:bg-[var(--home-paper-alt)] transition-colors"
            >
              <td className="py-2 px-2 text-[var(--home-ink-muted)] font-medium sticky left-0 bg-[color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))] whitespace-nowrap">
                {String(row[labelCol] ?? "")}
              </td>
              {periodCols.map((col) => {
                const val = row[col];
                const n = typeof val === "number" ? val : Number(val);
                const isNeg = !isNaN(n) && n < 0;
                return (
                  <td
                    key={col}
                    className={`py-2 px-2 text-right whitespace-nowrap ${isNeg ? "text-[var(--color-error)]" : "text-[var(--home-ink)]"}`}
                  >
                    {val !== undefined && val !== null && val !== "*" ? formatNum(val) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FinancialStatementsPanel({ symbol }: Props) {
  const [activeTab, setActiveTab] = useState<StatementType>("income_statement");
  const [period, setPeriod] = useState<Period>("quarterly");

  return (
    <WarmCard padding="sm">
      {/* Statement type tabs + period toggle */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Financial statements">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap min-h-[36px] ${
                activeTab === key
                  ? "bg-[var(--home-haze)] text-white"
                  : "text-[var(--home-ink-muted)] hover:bg-[var(--home-paper-alt)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Period toggle */}
        <div className="flex gap-1 shrink-0" role="group" aria-label="Period">
          {(["quarterly", "annual"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition capitalize min-h-[36px] ${
                period === p
                  ? "bg-[var(--neutral-200)] text-[var(--home-ink)]"
                  : "text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))] hover:bg-[var(--home-paper-alt)]"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <StatementTable section={activeTab} symbol={symbol} period={period} />
    </WarmCard>
  );
}
