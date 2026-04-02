"use client";

import React from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { useStockData } from "@/hooks/useStockData";
import { useLiveQuote } from "@/hooks/useLiveQuote";
import { DataFreshnessIndicator } from "./DataFreshnessIndicator";
import { formatHistoryAsOf, getHistoricalPriceFreshness } from "@/lib/investmentsHistory";
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

function getHistoricalDayChangePercent(prices: StockPrice[]): number | undefined {
  if (prices.length < 2) return undefined;
  const latest = prices[prices.length - 1];
  const previous = prices[prices.length - 2];
  if (!latest || !previous || previous.close === 0) return undefined;
  return ((latest.close - previous.close) / previous.close) * 100;
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
    <div className="flex min-h-[112px] flex-col justify-between rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)]/70 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        {label}
      </p>
      <p className={`mt-3 text-lg font-semibold leading-tight xl:text-xl ${toneClass}`}>{value}</p>
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
  const {
    data: priceRaw,
    lastUpdated: datasetLastUpdated,
  } = useStockData<PriceData>(symbol, "price");
  const {
    quote,
    isLoading: quoteLoading,
    error: quoteError,
    lastUpdated: liveQuoteLastUpdated,
  } = useLiveQuote(symbol);
  const margins = Array.isArray(marginsRaw) ? marginsRaw[marginsRaw.length - 1] : undefined;
  const prices = React.useMemo(() => {
    if (!Array.isArray(priceRaw)) return [];
    return (priceRaw as (StockPrice & { report_date?: string })[]).map(normalizePriceEntry);
  }, [priceRaw]);

  const latestPrice = prices[prices.length - 1];
  const historicalDayChangePercent = getHistoricalDayChangePercent(prices);
  const trailingYear = prices.slice(-252);
  const trailingHigh = trailingYear.length ? Math.max(...trailingYear.map((item) => item.high)) : undefined;
  const trailingLow = trailingYear.length ? Math.min(...trailingYear.map((item) => item.low)) : undefined;
  const historyFreshness = getHistoricalPriceFreshness(latestPrice?.date, datasetLastUpdated);
  const livePrice = quote && !quote.error ? quote.price : undefined;
  const displayedPrice = livePrice ?? latestPrice?.close;
  const displayedDayChangePercent =
    (quote && !quote.error ? quote.changePercent : undefined) ?? historicalDayChangePercent;
  const displayName = (!quote?.error ? quote?.name : undefined) ?? info?.longName ?? info?.shortName ?? symbol;
  const stance = dcf?.recommendation ?? "Researching";
  const stanceTone =
    stance.toLowerCase().includes("buy")
      ? "positive"
      : stance.toLowerCase().includes("sell")
        ? "negative"
        : "default";
  const priceFreshnessMode = livePrice !== undefined ? "live" : "dataset";
  const priceFreshnessLastUpdated =
    livePrice !== undefined ? liveQuoteLastUpdated : datasetLastUpdated ?? latestPrice?.date ?? null;

  return (
    <WarmCard
      padding="none"
      className="relative overflow-hidden rounded-[30px] border-[color-mix(in_srgb,var(--color-primary)_18%,var(--border-primary))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_8%,var(--surface-elevated))_0%,var(--surface-elevated)_42%,color-mix(in_srgb,var(--color-success)_8%,var(--surface-elevated))_100%)] shadow-[var(--shadow-sm)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--color-primary)_18%,transparent),transparent_34%)]" />
      <div className="relative p-5 sm:p-6 lg:p-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,360px)] xl:items-start">
          <div className="min-w-0">
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

            <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] xl:text-[2.15rem]">
                  {displayName}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Snapshot-backed view of valuation, quality, and market context.
                </p>
              </div>

              <div className="rounded-3xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-3.5 shadow-[var(--shadow-sm)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      Latest Price
                    </p>
                  </div>
                  <DataFreshnessIndicator
                    lastUpdated={priceFreshnessLastUpdated}
                    mode={priceFreshnessMode}
                  />
                </div>
                <div className="mt-1 flex items-end gap-3">
                  <span className="text-2xl font-semibold text-[var(--text-primary)]">
                    {quoteLoading && displayedPrice === undefined
                      ? "Loading…"
                      : displayedPrice !== undefined
                        ? formatCurrency(displayedPrice)
                        : "Unavailable"}
                  </span>
                  {displayedDayChangePercent !== undefined ? (
                    <span
                      className={`text-sm font-semibold ${
                        displayedDayChangePercent >= 0
                          ? "text-[var(--color-success)]"
                          : "text-[var(--color-error)]"
                      }`}
                    >
                      {formatPercent(displayedDayChangePercent, true)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  {livePrice !== undefined
                    ? `Historical chart through ${formatHistoryAsOf(latestPrice?.date)}.`
                    : latestPrice?.date
                      ? `Showing the latest available close from ${formatHistoryAsOf(latestPrice.date)}.`
                      : "Live pricing is temporarily unavailable."}
                </p>
                {quoteError && livePrice === undefined ? (
                  <p className="mt-1 text-xs font-medium text-[var(--color-warning)]">
                    {quoteError}
                  </p>
                ) : null}
                {historyFreshness.isStale ? (
                  <p className="mt-1 text-xs font-medium text-[var(--color-warning)]">
                    Historical series trails the dataset by {historyFreshness.lagDays} days.
                  </p>
                ) : null}
              </div>
            </div>

            {info?.longBusinessSummary ? (
              <p className="mt-4 max-w-[72ch] text-sm leading-6 text-[var(--text-secondary)] line-clamp-3">
                {info.longBusinessSummary}
              </p>
            ) : null}
          </div>

          <div className="h-full rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)] lg:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Current Read
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
                <span>History as of</span>
                <span className="font-medium text-[var(--text-primary)]">{formatDate(latestPrice?.date)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
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
