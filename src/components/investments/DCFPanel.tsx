"use client";

import React from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { useStockData } from "@/hooks/useStockData";
import { IconInfoCircle } from "@tabler/icons-react";
import type { DcfData } from "@/types/investment";
import { ErrorState } from "./ErrorState";

interface Props { symbol: string }

function fmt(n: number | undefined, style: "currency" | "percent" | "decimal" = "decimal"): string {
  if (n === undefined || n === null || isNaN(n)) return "—";
  if (style === "currency")
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
  if (style === "percent") return `${n.toFixed(2)}%`;
  return n.toFixed(2);
}

export function DCFPanel({ symbol }: Props) {
  const { data, isLoading, error, isNotFetched, refetch } = useStockData<DcfData>(symbol, "dcf");

  const upside = data?.upside ?? 0;
  const rec = data?.recommendation ?? "";
  const isBuy = rec.toLowerCase().includes("buy");
  const isSell = rec.toLowerCase().includes("sell");

  return (
    <WarmCard padding="sm">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">DCF Fair Value</h3>
      <p className="text-xs text-[var(--text-tertiary)] mb-4">
        Discounted cash flow estimate — for informational purposes only.
      </p>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-[var(--neutral-200)] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (error || !data) && (
        <ErrorState message={error ?? "DCF data unavailable"} isNotFetched={isNotFetched} onRetry={refetch} />
      )}

      {!isLoading && data && !data.error && (
        <>
          {/* Key values */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">Fair Value</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {fmt(data.fairValue, "currency")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">Current Price</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {fmt(data.currentPrice, "currency")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">Upside</p>
              <p
                className={`text-lg font-bold ${
                  upside >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
                }`}
              >
                {upside >= 0 ? "+" : ""}
                {fmt(upside, "percent")}
              </p>
            </div>
          </div>

          {/* Recommendation badge */}
          {rec && (
            <div className="flex justify-center mb-4">
              <span
                className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                  isBuy
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : isSell
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-[var(--surface-secondary)] text-[var(--text-secondary)]"
                }`}
              >
                {rec}
              </span>
            </div>
          )}

          {/* Assumptions */}
          <div className="space-y-1.5 text-sm border-t border-[var(--border-primary)] pt-3">
            {data.wacc !== undefined && (
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">WACC</span>
                <span className="font-medium text-[var(--text-primary)]">{fmt(data.wacc, "percent")}</span>
              </div>
            )}
            {data.growthEstimates &&
              Object.entries(data.growthEstimates).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-[var(--text-secondary)] capitalize">{k.replace(/_/g, " ")}</span>
                  <span className="font-medium text-[var(--text-primary)]">{fmt(v, "percent")}</span>
                </div>
              ))}
          </div>

          {/* Disclaimer */}
          <div className="mt-4 flex items-start gap-1.5 p-2.5 rounded-lg bg-[var(--surface-secondary)]">
            <IconInfoCircle size={14} className="text-[var(--text-tertiary)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
              DCF estimates are based on analyst projections and model assumptions. Not financial
              advice. Past performance is not indicative of future results.
            </p>
          </div>
        </>
      )}
    </WarmCard>
  );
}
