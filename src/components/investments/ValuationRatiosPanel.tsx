"use client";

import React from "react";
import { TerminalPanel } from "./TerminalPanel";
import { useStockData } from "@/hooks/useStockData";
import {
  formatComparisonMetricValue,
  isLowerBetterMetric,
} from "@/lib/investmentFormatting";
import type { BetaData, DcfData, Fundamentals, IndustryData, WaccData } from "@/types/investment";
import { ErrorState } from "./ErrorState";
import { MetricTooltip } from "./MetricTooltip";

interface Props {
  symbol: string;
  showIndustryComparison?: boolean;
}

interface IndustryRow {
  metric?: string;
  value?: number;
  industryAvg?: number;
  [key: string]: unknown;
}

function CompareRow({ label, value, industryAvg }: { label: string; value: number | undefined; industryAvg: number | undefined }) {
  const hasComparison = value !== undefined && industryAvg !== undefined && !isNaN(value) && !isNaN(industryAvg);
  const isAbove = hasComparison && value > industryAvg;
  // Favorable side depends on the metric: below-average P/E reads cheap, but
  // below-average ROE or margin is a weakness.
  const favorable = hasComparison
    ? isLowerBetterMetric(label)
      ? !isAbove
      : value >= industryAvg
    : null;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--home-rule)] last:border-0">
      <span className="text-sm text-[var(--home-ink-muted)] flex-1">{label}</span>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="text-xs text-[var(--home-ink-soft)]">Stock</p>
          <p className="text-sm font-semibold text-[var(--home-ink)]">{formatComparisonMetricValue(label, value)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--home-ink-soft)]">Industry</p>
          <p className="text-sm text-[var(--home-ink-muted)]">{formatComparisonMetricValue(label, industryAvg)}</p>
        </div>
        {hasComparison && (
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              favorable
                ? "bg-[color-mix(in_srgb,var(--home-positive)_12%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-positive)_70%,var(--home-ink))]"
                : "bg-[color-mix(in_srgb,var(--home-negative)_11%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-negative)_70%,var(--home-ink))]"
            }`}
          >
            {isAbove ? "Above" : "Below"}
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

function StandaloneMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--home-rule)] bg-[var(--home-paper-raised)] px-4 py-3">
      <p className="flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-soft)]">
        {label}
        <MetricTooltip term={label} />
      </p>
      <p className="mt-2 text-lg font-semibold text-[var(--home-ink)]">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs text-[var(--home-ink-muted)]">{detail}</p>
      ) : null}
    </div>
  );
}

function formatValue(value: number | undefined, style: "decimal" | "percent" | "currency" = "decimal") {
  if (value === undefined || Number.isNaN(value)) {
    return "—";
  }
  if (style === "percent") {
    return `${value.toFixed(2)}%`;
  }
  if (style === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  }
  return value.toFixed(2);
}

export function ValuationRatiosPanel({
  symbol,
  showIndustryComparison = true,
}: Props) {
  const { data: industryRaw, isLoading, error, isNotFetched, refetch } = useStockData<IndustryData>(
    showIndustryComparison ? symbol : null,
    "industry"
  );
  const { data: fundamentals } = useStockData<Fundamentals>(symbol, "fundamentals");
  const { data: wacc } = useStockData<WaccData>(symbol, "wacc");
  const { data: beta } = useStockData<BetaData>(symbol, "beta");
  const { data: dcf } = useStockData<DcfData>(symbol, "dcf");
  const rows = extractRows(industryRaw);

  if (!showIndustryComparison) {
    return (
      <TerminalPanel padding="sm">
        <h3 className="text-sm font-semibold text-[var(--home-ink)] mb-1">
          Valuation Snapshot
        </h3>
        <p className="text-xs text-[var(--home-ink-soft)] mb-4">
          Standalone valuation view when industry comparison data is unavailable
          for this curated research symbol.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StandaloneMetric
            label="P/E (TTM)"
            value={formatValue(fundamentals?.ttmPe)}
          />
          <StandaloneMetric
            label="P/S Ratio"
            value={formatValue(fundamentals?.psRatio)}
          />
          <StandaloneMetric
            label="P/B Ratio"
            value={formatValue(fundamentals?.pbRatio)}
          />
          <StandaloneMetric
            label="PEG Ratio"
            value={formatValue(fundamentals?.pegRatio)}
          />
          <StandaloneMetric
            label="Beta (5Y)"
            value={formatValue(beta?.beta5y)}
          />
          <StandaloneMetric
            label="WACC"
            value={formatValue(wacc?.wacc, "percent")}
          />
          <StandaloneMetric
            label="DCF Fair Value"
            value={formatValue(dcf?.fairValue, "currency")}
            detail={
              dcf?.upside !== undefined
                ? `${formatValue(dcf.upside, "percent")} implied upside`
                : undefined
            }
          />
          <StandaloneMetric
            label="Market Cap"
            value={
              fundamentals?.marketCap !== undefined
                ? new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    notation: "compact",
                    maximumFractionDigits: 2,
                  }).format(fundamentals.marketCap)
                : "—"
            }
          />
        </div>
      </TerminalPanel>
    );
  }

  return (
    <TerminalPanel padding="sm">
      <h3 className="text-sm font-semibold text-[var(--home-ink)] mb-1">Valuation vs Industry</h3>
      <p className="text-xs text-[var(--home-ink-soft)] mb-3">
        Comparing this stock&apos;s valuation ratios against its industry average.
      </p>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-[var(--home-stone)] animate-pulse" />
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
    </TerminalPanel>
  );
}
