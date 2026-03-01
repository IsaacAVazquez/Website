"use client";

import React from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { useStockData } from "@/hooks/useStockData";
import type { Fundamentals, CompanyInfo, BetaData, WaccData } from "@/types/investment";

interface Props { symbol: string }

function fmt(n: number | undefined, style: "currency" | "percent" | "compact" | "decimal" = "decimal"): string {
  if (n === undefined || n === null || isNaN(n)) return "—";
  if (style === "currency") return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  if (style === "percent") return `${n.toFixed(2)}%`;
  if (style === "compact") return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-[var(--border-primary)] last:border-0">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 rounded bg-[var(--neutral-200)] animate-pulse" />
      ))}
    </div>
  );
}

export function FundamentalsPanel({ symbol }: Props) {
  const { data: info, isLoading: infoLoading } = useStockData<CompanyInfo>(symbol, "info");
  const { data: fund, isLoading: fundLoading } = useStockData<Fundamentals>(symbol, "fundamentals");
  const { data: wacc } = useStockData<WaccData>(symbol, "wacc");
  const { data: beta } = useStockData<BetaData>(symbol, "beta");

  return (
    <div className="space-y-4">
      {/* Company info */}
      <WarmCard padding="sm">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Company</h3>
        {infoLoading ? (
          <SectionSkeleton rows={3} />
        ) : info && !info.error ? (
          <>
            {info.longBusinessSummary && (
              <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-4">
                {info.longBusinessSummary}
              </p>
            )}
            <div className="grid grid-cols-2 gap-x-4">
              {info.sector && <MetricRow label="Sector" value={info.sector} />}
              {info.industry && <MetricRow label="Industry" value={info.industry} />}
              {info.fullTimeEmployees && (
                <MetricRow
                  label="Employees"
                  value={info.fullTimeEmployees.toLocaleString("en-US")}
                />
              )}
              {info.country && <MetricRow label="Country" value={info.country} />}
              {info.website && (
                <div className="flex justify-between py-2 border-b border-[var(--border-primary)] last:border-0 col-span-2">
                  <span className="text-sm text-[var(--text-secondary)]">Website</span>
                  <a
                    href={info.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline truncate max-w-[200px]"
                  >
                    {info.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--text-tertiary)]">Company info unavailable.</p>
        )}
      </WarmCard>

      {/* Key metrics */}
      <WarmCard padding="sm">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Key Metrics</h3>
        {fundLoading ? (
          <SectionSkeleton />
        ) : fund && !fund.error ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <MetricRow label="Market Cap" value={fmt(fund.marketCap, "compact")} />
            <MetricRow label="P/E (TTM)" value={fmt(fund.ttmPe)} />
            <MetricRow label="EPS (TTM)" value={fmt(fund.ttmEps, "currency")} />
            <MetricRow label="P/S Ratio" value={fmt(fund.psRatio)} />
            <MetricRow label="P/B Ratio" value={fmt(fund.pbRatio)} />
            <MetricRow label="PEG Ratio" value={fmt(fund.pegRatio)} />
            {wacc && !wacc.error && <MetricRow label="WACC" value={fmt(wacc.wacc, "percent")} />}
            {beta && !beta.error && <MetricRow label="Beta (5Y)" value={fmt(beta.beta5y)} />}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-tertiary)]">Fundamentals unavailable.</p>
        )}
      </WarmCard>
    </div>
  );
}
