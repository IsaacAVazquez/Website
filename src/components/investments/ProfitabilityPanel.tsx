"use client";

import React from "react";
import { TerminalPanel } from "./TerminalPanel";
import { useStockData } from "@/hooks/useStockData";
import type { Profitability, MarginsData } from "@/types/investment";
import { ErrorState } from "./ErrorState";
import { MetricTooltip } from "./MetricTooltip";

interface Props { symbol: string }

function fmt(n: number | undefined, unit: "percent" | "ratio" = "percent"): string {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return unit === "ratio" ? `${n.toFixed(2)}×` : `${n.toFixed(2)}%`;
}

function Bar({ value, max = 100 }: { value: number | undefined; max?: number }) {
  const pct = Math.min(Math.max((value ?? 0) / max, 0), 1) * 100;
  const positive = (value ?? 0) >= 0;
  return (
    <div className="h-1.5 rounded-full bg-[var(--home-stone)] overflow-hidden flex-1">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${pct}%`,
          backgroundColor: positive ? "var(--home-positive)" : "var(--home-negative)",
        }}
        aria-hidden="true"
      />
    </div>
  );
}

function MetricRow({
  label,
  value,
  max,
  unit = "percent",
}: {
  label: string;
  value: number | undefined;
  max?: number;
  unit?: "percent" | "ratio";
}) {
  const positive = (value ?? 0) >= 0;
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[var(--home-rule)] last:border-0">
      <span className="flex items-center gap-0.5 text-sm text-[var(--home-ink-muted)] w-40 shrink-0">
        {label}
        <MetricTooltip term={label} />
      </span>
      <Bar value={value} max={max} />
      <span
        className={`text-sm font-medium w-16 text-right shrink-0 ${
          positive ? "text-[var(--home-positive)]" : "text-[var(--home-negative)]"
        }`}
      >
        {fmt(value, unit)}
      </span>
    </div>
  );
}

export function ProfitabilityPanel({ symbol }: Props) {
  const { data: prof, isLoading: profLoading, error: profError, isNotFetched: profNotFetched, refetch: refetchProf } = useStockData<Profitability>(symbol, "profitability");
  // Margins is an array; grab the most recent entry
  const { data: marginsRaw, isLoading: marginsLoading, error: marginsError, isNotFetched: marginsNotFetched, refetch: refetchMargins } = useStockData<MarginsData>(symbol, "margins");

  const margins = Array.isArray(marginsRaw) ? marginsRaw[marginsRaw.length - 1] : undefined;
  const isLoading = profLoading || marginsLoading;

  return (
    <TerminalPanel padding="sm">
      <h3 className="text-sm font-semibold text-[var(--home-ink)] mb-3">Profitability & Margins</h3>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-[var(--home-stone)] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {prof && !prof.error && (
            <div className="mb-4">
              <p className="text-xs font-medium text-[var(--home-ink-soft)] uppercase tracking-wide mb-2">Returns</p>
              <MetricRow label="Return on Equity (ROE)" value={prof.roe} max={50} />
              <MetricRow label="Return on Assets (ROA)" value={prof.roa} max={30} />
              <MetricRow label="Return on Inv. Capital" value={prof.roic} max={40} />
              <MetricRow label="Asset Turnover" value={prof.assetTurnover} max={2} unit="ratio" />
              <MetricRow label="Equity Multiplier" value={prof.equityMultiplier} max={10} unit="ratio" />
            </div>
          )}

          {margins && !margins.error && (
            <div>
              <p className="text-xs font-medium text-[var(--home-ink-soft)] uppercase tracking-wide mb-2">Margins (latest)</p>
              <MetricRow label="Gross Margin" value={margins.grossMargin} />
              <MetricRow label="Operating Margin" value={margins.operatingMargin} />
              <MetricRow label="Net Margin" value={margins.netMargin} />
              <MetricRow label="EBITDA Margin" value={margins.ebitdaMargin} />
              <MetricRow label="FCF Margin" value={margins.fcfMargin} />
            </div>
          )}

          {(!prof || prof.error) && (!margins || margins.error) && (
            <ErrorState message={profError ?? marginsError ?? "Profitability data unavailable"} isNotFetched={profNotFetched && marginsNotFetched} onRetry={() => { refetchProf(); refetchMargins(); }} />
          )}
        </>
      )}
    </TerminalPanel>
  );
}
