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
    <div className="h-1.5 bg-[var(--c97-rule)] overflow-hidden flex-1">
      <div
        className="h-full origin-left transition-transform duration-500"
        style={{
          transform: `scaleX(${pct / 100})`,
          backgroundColor: positive ? "var(--c97-positive)" : "var(--c97-negative)",
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
    <div className="flex items-center border-b border-[var(--c97-rule)] last:border-0" style={{ gap: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-1)" }}>
      <span className="flex items-center gap-0.5 text-sm text-[var(--c97-ink-2)] w-40 shrink-0">
        {label}
        <MetricTooltip term={label} />
      </span>
      <Bar value={value} max={max} />
      <span
        className={`text-sm font-medium w-16 text-right shrink-0 ${
          positive ? "text-[var(--c97-positive)]" : "text-[var(--c97-negative)]"
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
      <h3 className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginBottom: "var(--c97-sp-1)" }}>Profitability and margins</h3>

      {isLoading ? (
        <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-1)" }} role="status" aria-busy="true">
          <span className="sr-only">Loading profitability</span>
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="c97-skeleton" style={{ height: 32 }} />
          ))}
        </div>
      ) : (
        <>
          {prof && !prof.error && (
            <div style={{ marginBottom: "var(--c97-sp-2)" }}>
              <p className="text-xs font-medium text-[var(--c97-label)] uppercase tracking-wide" style={{ marginBottom: "var(--c97-sp-1)" }}>Returns</p>
              <MetricRow label="Return on equity (ROE)" value={prof.roe} max={50} />
              <MetricRow label="Return on assets (ROA)" value={prof.roa} max={30} />
              <MetricRow label="Return on inv. capital" value={prof.roic} max={40} />
              <MetricRow label="Asset turnover" value={prof.assetTurnover} max={2} unit="ratio" />
              <MetricRow label="Equity multiplier" value={prof.equityMultiplier} max={10} unit="ratio" />
            </div>
          )}

          {margins && !margins.error && (
            <div>
              <p className="text-xs font-medium text-[var(--c97-label)] uppercase tracking-wide" style={{ marginBottom: "var(--c97-sp-1)" }}>Margins (latest)</p>
              <MetricRow label="Gross margin" value={margins.grossMargin} />
              <MetricRow label="Operating margin" value={margins.operatingMargin} />
              <MetricRow label="Net margin" value={margins.netMargin} />
              <MetricRow label="EBITDA margin" value={margins.ebitdaMargin} />
              <MetricRow label="FCF margin" value={margins.fcfMargin} />
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
