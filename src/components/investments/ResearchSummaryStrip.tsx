"use client";

import React from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { useStockData } from "@/hooks/useStockData";
import type {
  BetaData,
  CompanyInfo,
  DcfData,
  Fundamentals,
  MarginsData,
  PriceData,
  Profitability,
  StockPrice,
} from "@/types/investment";

interface Props {
  symbol: string;
}

function formatCurrency(value: number | undefined, maximumFractionDigits = 2): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(value);
}

function formatPercent(value: number | undefined, signed = false): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

function formatCompact(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(raw: string | undefined): string {
  if (!raw) return "—";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function normalizePriceEntry(entry: StockPrice & { report_date?: string }): StockPrice {
  return {
    date: entry.report_date ?? entry.date,
    open: entry.open,
    high: entry.high,
    low: entry.low,
    close: entry.close,
    volume: entry.volume,
  };
}

function MetricTile({
  label,
  value,
  tone = "default",
  detail,
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative";
  detail?: string;
}) {
  const toneClass =
    tone === "positive"
      ? "text-[var(--color-success)]"
      : tone === "negative"
        ? "text-[var(--color-error)]"
        : "text-[var(--text-primary)]";

  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)]/70 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        {label}
      </p>
      <p className={`mt-2 text-xl font-semibold ${toneClass}`}>{value}</p>
      {detail ? <p className="mt-1 text-xs text-[var(--text-secondary)]">{detail}</p> : null}
    </div>
  );
}

export function ResearchSummaryStrip({ symbol }: Props) {
  const { data: info } = useStockData<CompanyInfo>(symbol, "info");
  const { data: fundamentals } = useStockData<Fundamentals>(symbol, "fundamentals");
  const { data: dcf } = useStockData<DcfData>(symbol, "dcf");
  const { data: profitability } = useStockData<Profitability>(symbol, "profitability");
  const { data: marginsRaw } = useStockData<MarginsData>(symbol, "margins");
  const { data: beta } = useStockData<BetaData>(symbol, "beta");
  const { data: priceRaw, isLoading: priceLoading } = useStockData<PriceData>(symbol, "price");
  const margins = Array.isArray(marginsRaw) ? marginsRaw[marginsRaw.length - 1] : undefined;
  const prices = React.useMemo(() => {
    if (!Array.isArray(priceRaw)) return [];
    return (priceRaw as (StockPrice & { report_date?: string })[]).map(normalizePriceEntry);
  }, [priceRaw]);

  const latestPrice = prices[prices.length - 1];
  const previousPrice = prices[prices.length - 2];
  const trailingYear = prices.slice(-252);
  const trailingHigh = trailingYear.length ? Math.max(...trailingYear.map((item) => item.high)) : undefined;
  const trailingLow = trailingYear.length ? Math.min(...trailingYear.map((item) => item.low)) : undefined;
  const dayChangePercent =
    latestPrice && previousPrice && previousPrice.close
      ? ((latestPrice.close - previousPrice.close) / previousPrice.close) * 100
      : undefined;

  const displayName = info?.shortName ?? info?.longName ?? symbol;
  const stance = dcf?.recommendation ?? "Researching";
  const stanceTone =
    stance.toLowerCase().includes("buy")
      ? "positive"
      : stance.toLowerCase().includes("sell")
        ? "negative"
        : "default";

  return (
    <WarmCard
      padding="none"
      className="relative overflow-hidden border-[color-mix(in_srgb,var(--color-primary)_18%,var(--border-primary))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_8%,var(--surface-elevated))_0%,var(--surface-elevated)_40%,color-mix(in_srgb,var(--color-success)_8%,var(--surface-elevated))_100%)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--color-primary)_18%,transparent),transparent_34%)]" />
      <div className="relative p-5 sm:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                {symbol}
              </span>
              {info?.sector ? (
                <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
                  {info.sector}
                </span>
              ) : null}
              {info?.industry ? (
                <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                  {info.industry}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
                  {displayName}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Research workspace for valuation, quality, and event signals.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Price
                </p>
                <div className="mt-1 flex items-end gap-3">
                  <span className="text-2xl font-semibold text-[var(--text-primary)]">
                    {priceLoading ? "Loading..." : formatCurrency(latestPrice?.close)}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      (dayChangePercent ?? 0) >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
                    }`}
                  >
                    {formatPercent(dayChangePercent, true)}
                  </span>
                </div>
              </div>
            </div>

            {info?.longBusinessSummary ? (
              <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-secondary)] line-clamp-3">
                {info.longBusinessSummary}
              </p>
            ) : null}
          </div>

          <div className="min-w-[260px] rounded-3xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Market Take
            </p>
            <p
              className={`mt-3 text-2xl font-semibold ${
                stanceTone === "positive"
                  ? "text-[var(--color-success)]"
                  : stanceTone === "negative"
                    ? "text-[var(--color-error)]"
                    : "text-[var(--text-primary)]"
              }`}
            >
              {stance}
            </p>
            <div className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
              <div className="flex items-center justify-between gap-4">
                <span>DCF upside</span>
                <span className="font-medium text-[var(--text-primary)]">{formatPercent(dcf?.upside, true)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Net margin</span>
                <span className="font-medium text-[var(--text-primary)]">{formatPercent(margins?.netMargin)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>ROIC</span>
                <span className="font-medium text-[var(--text-primary)]">{formatPercent(profitability?.roic)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Latest trading day</span>
                <span className="font-medium text-[var(--text-primary)]">{formatDate(latestPrice?.date)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <MetricTile
            label="52W Range"
            value={`${formatCurrency(trailingLow, 0)} - ${formatCurrency(trailingHigh, 0)}`}
          />
          <MetricTile label="Market Cap" value={formatCompact(fundamentals?.marketCap)} />
          <MetricTile label="P/E" value={fundamentals?.ttmPe?.toFixed(2) ?? "—"} />
          <MetricTile label="Beta" value={beta?.beta5y?.toFixed(2) ?? "—"} />
          <MetricTile
            label="DCF Upside"
            value={formatPercent(dcf?.upside, true)}
            tone={(dcf?.upside ?? 0) >= 0 ? "positive" : "negative"}
            detail={dcf?.fairValue ? `Fair value ${formatCurrency(dcf.fairValue)}` : undefined}
          />
          <MetricTile
            label="Quality"
            value={formatPercent(profitability?.roe)}
            tone={(profitability?.roe ?? 0) >= 15 ? "positive" : "default"}
            detail={margins?.fcfMargin !== undefined ? `FCF margin ${formatPercent(margins.fcfMargin)}` : undefined}
          />
        </div>
      </div>
    </WarmCard>
  );
}
