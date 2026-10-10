"use client";

import React from "react";
import { TerminalPanel } from "./TerminalPanel";
import { useStockData } from "@/hooks/useStockData";
import {
  formatComparisonMetricValue,
  isLowerBetterMetric,
} from "@/lib/investmentFormatting";
import type { BetaData, Fundamentals, IndustryData, WaccData } from "@/types/investment";
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
  // A value equal to the average is neither side. It read "Below" before.
  const isEqual = hasComparison && value === industryAvg;
  // Favorable side depends on the metric: below-average P/E reads cheap, but
  // below-average ROE or margin is a weakness.
  const favorable = hasComparison && !isEqual
    ? isLowerBetterMetric(label)
      ? !isAbove
      : value > industryAvg
    : null;
  return (
    <div className="flex items-center border-b border-[var(--c97-rule)] last:border-0" style={{ gap: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-1)" }}>
      <span className="text-sm text-[var(--c97-ink-2)] flex-1">{label}</span>
      <div className="flex items-center shrink-0" style={{ gap: "var(--c97-sp-2)" }}>
        <div className="text-right">
          <p className="text-xs text-[var(--c97-label)]">Stock</p>
          <p className="text-sm font-semibold text-[var(--c97-ink)]">{formatComparisonMetricValue(label, value)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--c97-label)]">Industry</p>
          <p className="text-sm text-[var(--c97-ink-2)]">{formatComparisonMetricValue(label, industryAvg)}</p>
        </div>
        {hasComparison && (
          <>
            <span
              style={{ paddingInline: "var(--c97-sp-0)" }}
              className={`text-xs font-medium py-0.5 ${
                favorable === null
                  ? "bg-[var(--c97-panel)] text-[var(--c97-ink-2)]"
                  : favorable
                    ? "bg-[color-mix(in_srgb,var(--c97-positive)_12%,var(--c97-panel))] text-[color-mix(in_srgb,var(--c97-positive)_70%,var(--c97-ink))]"
                    : "bg-[color-mix(in_srgb,var(--c97-negative)_11%,var(--c97-panel))] text-[color-mix(in_srgb,var(--c97-negative)_70%,var(--c97-ink))]"
              }`}
            >
              {isEqual ? "Matches" : isAbove ? "Above" : "Below"}
            </span>
            {/* The verdict was colour alone; the badge's text only says which side. */}
            {favorable !== null ? (
              <span className="sr-only">{favorable ? "Favorable" : "Unfavorable"}</span>
            ) : null}
          </>
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
    <div className="border border-[var(--c97-rule)] bg-[var(--c97-panel)]" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)" }}>
      <p className="flex items-center text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--c97-label)]" style={{ gap: "var(--c97-sp-0)" }}>
        {label}
        <MetricTooltip term={label} />
      </p>
      <p className="text-lg font-semibold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-1)" }}>{value}</p>
      {detail ? (
        <p className="text-xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>{detail}</p>
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
  const rows = extractRows(industryRaw);

  if (!showIndustryComparison) {
    return (
      <TerminalPanel padding="sm">
        <h3 className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginBottom: "var(--c97-sp-0)" }}>
          Valuation snapshot
        </h3>
        <p className="text-xs text-[var(--c97-label)]" style={{ marginBottom: "var(--c97-sp-2)" }}>
          Standalone valuation view when industry comparison data is unavailable
          for this curated research symbol.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: "var(--c97-sp-1)" }}>
          <StandaloneMetric
            label="P/E (TTM)"
            value={formatValue(fundamentals?.ttmPe)}
          />
          <StandaloneMetric
            label="P/S ratio"
            value={formatValue(fundamentals?.psRatio)}
          />
          <StandaloneMetric
            label="P/B ratio"
            value={formatValue(fundamentals?.pbRatio)}
          />
          <StandaloneMetric
            label="PEG ratio"
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
            label="Market cap"
            value={
              fundamentals?.marketCap !== undefined
                ? new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    notation: "compact",
                    minimumFractionDigits: 0,
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
      <h3 className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginBottom: "var(--c97-sp-0)" }}>Valuation vs industry</h3>
      <p className="text-xs text-[var(--c97-label)]" style={{ marginBottom: "var(--c97-sp-1)" }}>
        Comparing this stock&apos;s valuation ratios against its industry average.
      </p>

      {isLoading && (
        <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-1)" }} role="status" aria-busy="true">
          <span className="sr-only">Loading valuation ratios</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="c97-skeleton" style={{ height: 40 }} />
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
