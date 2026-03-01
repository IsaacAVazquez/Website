"use client";

import React, { useState } from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { useStockData } from "@/hooks/useStockData";
import type { InvestmentSection } from "@/types/investment";

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

// Raw data from defeatbeta-api can be a DataFrame serialized as array-of-records
// or a nested object. We normalize to { columns, rows } for rendering.
function normalize(raw: unknown): { columns: string[]; rows: Record<string, unknown>[] } | null {
  if (!raw || typeof raw !== "object") return null;
  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;
    const columns = Object.keys(raw[0] as object);
    return { columns, rows: raw as Record<string, unknown>[] };
  }
  // Object of { rowLabel: { period: value } }
  const obj = raw as Record<string, Record<string, unknown>>;
  const rows = Object.entries(obj).map(([label, vals]) => ({ label, ...vals }));
  if (rows.length === 0) return null;
  const allCols = Array.from(new Set(rows.flatMap(Object.keys)));
  return { columns: allCols, rows };
}

function StatementTable({ section, symbol }: { section: InvestmentSection; symbol: string }) {
  const { data, isLoading, error } = useStockData(symbol, section);

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
    return <p className="text-sm text-[var(--text-tertiary)] py-4">{error}</p>;
  }

  const table = normalize(data);
  if (!table) {
    return <p className="text-sm text-[var(--text-tertiary)] py-4">No data available.</p>;
  }

  // Identify the label column (first string column) vs numeric period columns
  const labelCol = table.columns[0];
  const periodCols = table.columns.slice(1, 9); // cap at 8 periods

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs min-w-[480px]" aria-label={`${section.replace("_", " ")} statement`}>
        <thead>
          <tr className="border-b border-[var(--border-primary)]">
            <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-medium w-40 sticky left-0 bg-[var(--surface-elevated)]">
              Metric
            </th>
            {periodCols.map((col) => (
              <th
                key={col}
                className="text-right py-2 px-2 text-[var(--text-tertiary)] font-medium whitespace-nowrap"
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
              className="border-b border-[var(--border-primary)] last:border-0 hover:bg-[var(--surface-secondary)] transition-colors"
            >
              <td className="py-2 px-2 text-[var(--text-secondary)] font-medium sticky left-0 bg-[var(--surface-elevated)] whitespace-nowrap">
                {String(row[labelCol] ?? "")}
              </td>
              {periodCols.map((col) => {
                const val = row[col];
                const n = typeof val === "number" ? val : Number(val);
                const isNeg = !isNaN(n) && n < 0;
                return (
                  <td
                    key={col}
                    className={`py-2 px-2 text-right whitespace-nowrap ${isNeg ? "text-[var(--color-error)]" : "text-[var(--text-primary)]"}`}
                  >
                    {val !== undefined && val !== null ? formatNum(val) : "—"}
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

  return (
    <WarmCard padding="sm">
      {/* Tab navigation */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1" role="tablist" aria-label="Financial statements">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap min-h-[36px] ${
              activeTab === key
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <StatementTable section={activeTab} symbol={symbol} />
    </WarmCard>
  );
}
