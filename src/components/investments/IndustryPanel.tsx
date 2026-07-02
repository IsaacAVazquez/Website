"use client";

import React from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { useStockData } from "@/hooks/useStockData";
import {
  formatComparisonMetricValue,
  isLowerBetterMetric,
} from "@/lib/investmentFormatting";
import type { IndustryData } from "@/types/investment";
import { ErrorState } from "./ErrorState";

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

function Indicator({ metric, value, avg }: { metric: string; value: number | undefined; avg: number | undefined }) {
  if (value === undefined || avg === undefined || isNaN(value) || isNaN(avg)) return null;
  const pct = avg !== 0 ? ((value - avg) / Math.abs(avg)) * 100 : 0;
  // Whether sitting above the industry average is favorable depends on the
  // metric: a high P/E reads expensive, a high ROE or margin reads strong.
  const favorable = isLowerBetterMetric(metric) ? pct < 0 : pct > 0;
  const tone =
    pct === 0
      ? "bg-[var(--home-paper-alt)] text-[var(--home-ink-muted)]"
      : favorable
        ? "bg-[color-mix(in_srgb,var(--home-positive)_12%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-positive)_70%,var(--home-ink))]"
        : "bg-[color-mix(in_srgb,var(--home-negative)_11%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-negative)_70%,var(--home-ink))]";
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  return (
    <span className={`ml-2 inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${tone}`}>
      {sign}{Math.abs(pct).toFixed(1)}% vs industry
    </span>
  );
}

export function IndustryPanel({ symbol }: Props) {
  const { data: raw, isLoading, error, isNotFetched, refetch } = useStockData<IndustryData>(symbol, "industry");
  const rows = extractRows(raw);

  return (
    <WarmCard padding="sm">
      <h3 className="text-sm font-semibold text-[var(--home-ink)] mb-3">
        Industry Comparison
      </h3>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-[var(--home-stone)] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (error || rows.length === 0) && (
        <ErrorState message={error ?? "Industry data unavailable"} isNotFetched={isNotFetched} onRetry={refetch} />
      )}

      {!isLoading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]" aria-label="Industry comparison table">
            <thead>
              <tr className="border-b border-[var(--home-rule)]">
                <th className="text-left py-2 text-[var(--home-ink-soft)] font-medium">Metric</th>
                <th className="text-right py-2 text-[var(--home-ink-soft)] font-medium">This Stock</th>
                <th className="text-right py-2 text-[var(--home-ink-soft)] font-medium">Industry Avg</th>
                <th className="text-right py-2 text-[var(--home-ink-soft)] font-medium">vs Avg</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-[var(--home-rule)] last:border-0 hover:bg-[var(--home-paper-alt)] transition-colors">
                  <td className="py-2.5 text-[var(--home-ink-muted)]">{row.metric}</td>
                  <td className="py-2.5 text-right font-medium text-[var(--home-ink)]">
                    {formatComparisonMetricValue(row.metric, row.value)}
                  </td>
                  <td className="py-2.5 text-right text-[var(--home-ink-muted)]">
                    {formatComparisonMetricValue(row.metric, row.industryAvg)}
                  </td>
                  <td className="py-2.5 text-right">
                    <Indicator metric={row.metric} value={row.value} avg={row.industryAvg} />
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
