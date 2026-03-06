"use client";

import React from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { useStockData } from "@/hooks/useStockData";
import type { IndustryData } from "@/types/investment";
import { ErrorState } from "./ErrorState";

interface Props { symbol: string }

interface IndustryRow {
  metric?: string;
  value?: number;
  industryAvg?: number;
  [key: string]: unknown;
}

function fmt(n: number | undefined): string {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return n.toFixed(2);
}

function CompareRow({ label, value, industryAvg }: { label: string; value: number | undefined; industryAvg: number | undefined }) {
  const hasComparison = value !== undefined && industryAvg !== undefined && !isNaN(value) && !isNaN(industryAvg);
  const better = hasComparison ? value <= industryAvg : null; // lower P/E = better (rule of thumb)
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--border-primary)] last:border-0">
      <span className="text-sm text-[var(--text-secondary)] flex-1">{label}</span>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="text-xs text-[var(--text-tertiary)]">Stock</p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{fmt(value)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--text-tertiary)]">Industry</p>
          <p className="text-sm text-[var(--text-secondary)]">{fmt(industryAvg)}</p>
        </div>
        {hasComparison && (
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              better
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {better ? "Below" : "Above"}
          </span>
        )}
      </div>
    </div>
  );
}

function extractRows(raw: unknown): IndustryRow[] {
  if (!raw || typeof raw !== "object") return [];
  if (Array.isArray(raw)) return raw as IndustryRow[];
  return Object.entries(raw as Record<string, unknown>).map(([metric, rest]) => ({
    metric,
    ...(typeof rest === "object" && rest !== null ? (rest as object) : { value: Number(rest) }),
  }));
}

export function ValuationRatiosPanel({ symbol }: Props) {
  const { data: industryRaw, isLoading, error, isNotFetched, refetch } = useStockData<IndustryData>(symbol, "industry");
  const rows = extractRows(industryRaw);

  return (
    <WarmCard padding="sm">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Valuation vs Industry</h3>
      <p className="text-xs text-[var(--text-tertiary)] mb-3">
        Comparing this stock&apos;s valuation ratios against its industry average.
      </p>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-[var(--neutral-200)] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (error || rows.length === 0) && (
        <ErrorState message={error ?? "Industry comparison data unavailable"} isNotFetched={isNotFetched} onRetry={refetch} />
      )}

      {!isLoading && rows.length > 0 && (
        <>
          {rows.map((row, i) => (
            <CompareRow
              key={i}
              label={String(row.metric ?? `Metric ${i + 1}`)}
              value={row.value !== undefined ? Number(row.value) : undefined}
              industryAvg={row.industryAvg !== undefined ? Number(row.industryAvg) : undefined}
            />
          ))}
        </>
      )}
    </WarmCard>
  );
}
