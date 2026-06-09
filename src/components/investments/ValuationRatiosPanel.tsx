"use client";

import React from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { useStockData } from "@/hooks/useStockData";
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

function fmt(n: number | undefined): string {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return n.toFixed(2);
}

function CompareRow({ label, value, industryAvg }: { label: string; value: number | undefined; industryAvg: number | undefined }) {
  const hasComparison = value !== undefined && industryAvg !== undefined && !isNaN(value) && !isNaN(industryAvg);
  const better = hasComparison ? value <= industryAvg : null; // lower P/E = better (rule of thumb)
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--home-rule)] last:border-0">
      <span className="text-sm text-[var(--home-ink-muted)] flex-1">{label}</span>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="text-xs text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">Stock</p>
          <p className="text-sm font-semibold text-[var(--home-ink)]">{fmt(value)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">Industry</p>
          <p className="text-sm text-[var(--home-ink-muted)]">{fmt(industryAvg)}</p>
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
    <div className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))] px-4 py-3">
      <p className="flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
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
      <WarmCard padding="sm">
        <h3 className="text-sm font-semibold text-[var(--home-ink)] mb-1">
          Valuation Snapshot
        </h3>
        <p className="text-xs text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))] mb-4">
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
                    notation: "compact",
                    maximumFractionDigits: 2,
                  }).format(fundamentals.marketCap)
                : "—"
            }
          />
        </div>
      </WarmCard>
    );
  }

  return (
    <WarmCard padding="sm">
      <h3 className="text-sm font-semibold text-[var(--home-ink)] mb-1">Valuation vs Industry</h3>
      <p className="text-xs text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))] mb-3">
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
    </WarmCard>
  );
}
