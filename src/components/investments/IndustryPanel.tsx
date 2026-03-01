"use client";

import React from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { useStockData } from "@/hooks/useStockData";
import type { IndustryData } from "@/types/investment";

interface Props { symbol: string }

interface Row { metric: string; value: number | undefined; industryAvg: number | undefined }

function extractRows(raw: unknown): Row[] {
  if (!raw || typeof raw !== "object") return [];
  if (Array.isArray(raw)) {
    return (raw as Record<string, unknown>[]).map((r) => ({
      metric: String(r.metric ?? r.industry ?? ""),
      value: r.value !== undefined ? Number(r.value) : undefined,
      industryAvg: r.industryAvg !== undefined ? Number(r.industryAvg) : undefined,
    }));
  }
  return Object.entries(raw as Record<string, unknown>).map(([k, v]) => ({
    metric: k,
    value: typeof v === "number" ? v : undefined,
    industryAvg: undefined,
  }));
}

function Indicator({ value, avg }: { value: number | undefined; avg: number | undefined }) {
  if (value === undefined || avg === undefined || isNaN(value) || isNaN(avg)) return null;
  const pct = avg !== 0 ? ((value - avg) / Math.abs(avg)) * 100 : 0;
  const above = pct > 0;
  return (
    <span
      className={`ml-2 inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${
        above
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      }`}
    >
      {above ? "+" : ""}{pct.toFixed(1)}% vs industry
    </span>
  );
}

export function IndustryPanel({ symbol }: Props) {
  const { data: raw, isLoading, error } = useStockData<IndustryData>(symbol, "industry");
  const rows = extractRows(raw);

  return (
    <WarmCard padding="sm">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
        Industry Comparison
      </h3>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-[var(--neutral-200)] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (error || rows.length === 0) && (
        <p className="text-sm text-[var(--text-tertiary)]">Industry data unavailable.</p>
      )}

      {!isLoading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]" aria-label="Industry comparison table">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="text-left py-2 text-[var(--text-tertiary)] font-medium">Metric</th>
                <th className="text-right py-2 text-[var(--text-tertiary)] font-medium">This Stock</th>
                <th className="text-right py-2 text-[var(--text-tertiary)] font-medium">Industry Avg</th>
                <th className="text-right py-2 text-[var(--text-tertiary)] font-medium">vs Avg</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-[var(--border-primary)] last:border-0 hover:bg-[var(--surface-secondary)] transition-colors">
                  <td className="py-2.5 text-[var(--text-secondary)]">{row.metric}</td>
                  <td className="py-2.5 text-right font-medium text-[var(--text-primary)]">
                    {row.value !== undefined ? row.value.toFixed(2) : "—"}
                  </td>
                  <td className="py-2.5 text-right text-[var(--text-secondary)]">
                    {row.industryAvg !== undefined ? row.industryAvg.toFixed(2) : "—"}
                  </td>
                  <td className="py-2.5 text-right">
                    <Indicator value={row.value} avg={row.industryAvg} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WarmCard>
  );
}
