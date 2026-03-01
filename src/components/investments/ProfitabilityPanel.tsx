"use client";

import React from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { useStockData } from "@/hooks/useStockData";
import type { Profitability, MarginsData } from "@/types/investment";

interface Props { symbol: string }

function fmt(n: number | undefined): string {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return `${n.toFixed(2)}%`;
}

function Bar({ value, max = 100 }: { value: number | undefined; max?: number }) {
  const pct = Math.min(Math.max((value ?? 0) / max, 0), 1) * 100;
  const positive = (value ?? 0) >= 0;
  return (
    <div className="h-1.5 rounded-full bg-[var(--neutral-200)] overflow-hidden flex-1">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          backgroundColor: positive ? "var(--color-success)" : "var(--color-error)",
        }}
        aria-hidden="true"
      />
    </div>
  );
}

function MetricRow({ label, value, max }: { label: string; value: number | undefined; max?: number }) {
  const positive = (value ?? 0) >= 0;
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[var(--border-primary)] last:border-0">
      <span className="text-sm text-[var(--text-secondary)] w-40 shrink-0">{label}</span>
      <Bar value={value} max={max} />
      <span
        className={`text-sm font-medium w-16 text-right shrink-0 ${
          positive ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
        }`}
      >
        {fmt(value)}
      </span>
    </div>
  );
}

export function ProfitabilityPanel({ symbol }: Props) {
  const { data: prof, isLoading: profLoading } = useStockData<Profitability>(symbol, "profitability");
  // Margins is an array; grab the most recent entry
  const { data: marginsRaw, isLoading: marginsLoading } = useStockData<MarginsData>(symbol, "margins");

  const margins = Array.isArray(marginsRaw) ? marginsRaw[marginsRaw.length - 1] : undefined;
  const isLoading = profLoading || marginsLoading;

  return (
    <WarmCard padding="sm">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Profitability & Margins</h3>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-[var(--neutral-200)] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {prof && !prof.error && (
            <div className="mb-4">
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">Returns</p>
              <MetricRow label="Return on Equity (ROE)" value={prof.roe} max={50} />
              <MetricRow label="Return on Assets (ROA)" value={prof.roa} max={30} />
              <MetricRow label="Return on Inv. Capital" value={prof.roic} max={40} />
              <MetricRow label="Asset Turnover" value={prof.assetTurnover} max={3} />
              <MetricRow label="Equity Multiplier" value={prof.equityMultiplier} max={10} />
            </div>
          )}

          {margins && !margins.error && (
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">Margins (latest)</p>
              <MetricRow label="Gross Margin" value={margins.grossMargin} />
              <MetricRow label="Operating Margin" value={margins.operatingMargin} />
              <MetricRow label="Net Margin" value={margins.netMargin} />
              <MetricRow label="EBITDA Margin" value={margins.ebitdaMargin} />
              <MetricRow label="FCF Margin" value={margins.fcfMargin} />
            </div>
          )}

          {(!prof || prof.error) && (!margins || margins.error) && (
            <p className="text-sm text-[var(--text-tertiary)]">Profitability data unavailable.</p>
          )}
        </>
      )}
    </WarmCard>
  );
}
