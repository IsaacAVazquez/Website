"use client";

import React from "react";
import { TerminalPanel } from "./TerminalPanel";
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
      ? "bg-[var(--c97-panel)] text-[var(--c97-ink-2)]"
      : favorable
        ? "bg-[color-mix(in_srgb,var(--c97-positive)_12%,var(--c97-panel))] text-[color-mix(in_srgb,var(--c97-positive)_70%,var(--c97-ink))]"
        : "bg-[color-mix(in_srgb,var(--c97-negative)_11%,var(--c97-panel))] text-[color-mix(in_srgb,var(--c97-negative)_70%,var(--c97-ink))]";
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  return (
    <span
      className={`inline-flex items-center text-xs font-medium py-0.5 ${tone}`}
      style={{ marginLeft: "var(--c97-sp-1)", paddingInline: "var(--c97-sp-0)" }}
    >
      {sign}{Math.abs(pct).toFixed(1)}% vs industry
    </span>
  );
}

export function IndustryPanel({ symbol }: Props) {
  const { data: raw, isLoading, error, isNotFetched, refetch } = useStockData<IndustryData>(symbol, "industry");
  const rows = extractRows(raw);

  return (
    <TerminalPanel padding="sm">
      <h3 className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginBottom: "var(--c97-sp-1)" }}>
        Industry comparison
      </h3>

      {isLoading && (
        <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-1)" }} role="status" aria-busy="true">
          <span className="sr-only">Loading industry comparison</span>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="c97-skeleton" style={{ height: 40 }} />
          ))}
        </div>
      )}

      {!isLoading && (error || rows.length === 0) && (
        <ErrorState message={error ?? "Industry data unavailable"} isNotFetched={isNotFetched} onRetry={refetch} />
      )}

      {!isLoading && rows.length > 0 && (
        <div className="overflow-x-auto" role="region" tabIndex={0} aria-label="Industry comparison">
          <table className="w-full text-sm min-w-[400px]" aria-label="Industry comparison table">
            <thead>
              <tr className="border-b border-[var(--c97-rule)]">
                <th className="text-left text-[var(--c97-label)] font-medium" style={{ paddingBlock: "var(--c97-sp-1)" }}>Metric</th>
                <th className="text-right text-[var(--c97-label)] font-medium" style={{ paddingBlock: "var(--c97-sp-1)" }}>This stock</th>
                <th className="text-right text-[var(--c97-label)] font-medium" style={{ paddingBlock: "var(--c97-sp-1)" }}>Industry avg</th>
                <th className="text-right text-[var(--c97-label)] font-medium" style={{ paddingBlock: "var(--c97-sp-1)" }}>vs Avg</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-[var(--c97-rule)] last:border-0 hover:bg-[var(--c97-panel)] transition-colors">
                  <td className="text-[var(--c97-ink-2)]" style={{ paddingBlock: "var(--c97-sp-1)" }}>{row.metric}</td>
                  <td className="text-right font-medium text-[var(--c97-ink)]" style={{ paddingBlock: "var(--c97-sp-1)" }}>
                    {formatComparisonMetricValue(row.metric, row.value)}
                  </td>
                  <td className="text-right text-[var(--c97-ink-2)]" style={{ paddingBlock: "var(--c97-sp-1)" }}>
                    {formatComparisonMetricValue(row.metric, row.industryAvg)}
                  </td>
                  <td className="text-right" style={{ paddingBlock: "var(--c97-sp-1)" }}>
                    <Indicator metric={row.metric} value={row.value} avg={row.industryAvg} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </TerminalPanel>
  );
}
