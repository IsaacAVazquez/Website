"use client";

import React from "react";
import { StockSearch } from "./StockSearch";
import { DataFreshnessIndicator } from "./DataFreshnessIndicator";
import { MetricTooltip } from "./MetricTooltip";
import { useLiveQuote } from "@/hooks/useLiveQuote";
import { useStockData } from "@/hooks/useStockData";
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
  WaccData,
} from "@/types/investment";

interface Props {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  isInPortfolio?: boolean;
}

function fmtN(value: number | undefined, style: "currency" | "percent" | "compact" | "decimal" = "decimal", decimals = 2): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  if (style === "currency") return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: decimals }).format(value);
  if (style === "percent") return `${value.toFixed(decimals)}%`;
  if (style === "compact") return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
  return value.toFixed(decimals);
}

function fmtSigned(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
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

function MetricRow({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "positive" | "negative" }) {
  const valueClass =
    tone === "positive"
      ? "text-[var(--color-success)]"
      : tone === "negative"
        ? "text-[var(--color-error)]"
        : "text-[var(--home-ink)]";

  return (
    <div className="flex items-center justify-between gap-2 border-t border-[var(--home-rule)] py-1.5 first:border-0">
      <dt className="flex items-center text-xs text-[var(--home-ink-muted)]">
        {label}
        <MetricTooltip term={label} />
      </dt>
      <dd className={`text-xs font-semibold tabular-nums ${valueClass}`}>{value}</dd>
    </div>
  );
}

export function ResearchSidebar({ symbol, onSymbolChange, isInPortfolio = false }: Props) {
  const { data: info } = useStockData<CompanyInfo>(symbol || null, "info");
  const { data: fundamentals } = useStockData<Fundamentals>(symbol || null, "fundamentals");
  const { data: dcf } = useStockData<DcfData>(symbol || null, "dcf");
  const { data: profitability } = useStockData<Profitability>(symbol || null, "profitability");
  const { data: marginsRaw } = useStockData<MarginsData>(symbol || null, "margins");
  const { data: beta } = useStockData<BetaData>(symbol || null, "beta");
  const { data: wacc } = useStockData<WaccData>(symbol || null, "wacc");
  const {
    data: priceRaw,
    lastUpdated: datasetLastUpdated,
    freshness: priceFreshness,
  } = useStockData<PriceData>(symbol || null, "price");
  const {
    quote,
    isLoading: quoteLoading,
    error: quoteError,
    lastUpdated: liveQuoteLastUpdated,
  } = useLiveQuote(symbol || null);

  const margins = Array.isArray(marginsRaw) ? marginsRaw[marginsRaw.length - 1] : undefined;
  const prices = React.useMemo(() => {
    if (!Array.isArray(priceRaw)) return [];
    return (priceRaw as (StockPrice & { report_date?: string })[]).map(normalizePriceEntry);
  }, [priceRaw]);

  const latestPrice = prices[prices.length - 1];
  const trailingYear = prices.slice(-252);
  const trailingHigh = trailingYear.length ? Math.max(...trailingYear.map((p) => p.high)) : undefined;
  const trailingLow = trailingYear.length ? Math.min(...trailingYear.map((p) => p.low)) : undefined;
  const historicalPriceAsOf = priceFreshness?.sections.price ?? latestPrice?.date ?? null;
  const snapshotBuiltAt = priceFreshness?.snapshotBuiltAt ?? datasetLastUpdated;
  const historyFreshness = getHistoricalPriceFreshness(historicalPriceAsOf, snapshotBuiltAt);
  const livePrice = quote && !quote.error ? quote.price : undefined;
  const displayedPrice = livePrice ?? latestPrice?.close;
  const displayedDayChangePercent = quote && !quote.error ? quote.changePercent : undefined;
  const displayName = (!quote?.error ? quote?.name : undefined) ?? info?.longName ?? info?.shortName ?? "";

  const stance = dcf?.recommendation ?? null;
  const stanceTone = stance
    ? stance.toLowerCase().includes("buy")
      ? "positive"
      : stance.toLowerCase().includes("sell")
        ? "negative"
        : "default"
    : "default";
  const stanceColorClass =
    stanceTone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : stanceTone === "negative"
        ? "text-red-600 dark:text-red-400"
        : "text-[var(--home-ink-muted)]";

  const priceFreshnessMode = livePrice !== undefined ? "live" : "dataset";
  const priceFreshnessLastUpdated = livePrice !== undefined ? liveQuoteLastUpdated : historicalPriceAsOf;
  const dataFreshnessLastUpdated = snapshotBuiltAt ?? datasetLastUpdated;

  const dcfUpside = dcf?.upside;
  const effectiveWacc = dcf?.wacc ?? wacc?.wacc;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="rounded-[28px] border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))] p-4 shadow-[var(--shadow-sm)]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
            Research Symbol
          </p>
          {isInPortfolio ? (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-success) 15%, transparent)",
                color: "var(--color-success)",
              }}
            >
              In portfolio
            </span>
          ) : null}
        </div>
        <StockSearch value={symbol} onChange={onSymbolChange} />
      </div>

      {symbol ? (
        <>
          {/* Company identity + stance */}
          <div className="rounded-[28px] border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))] p-4 shadow-[var(--shadow-sm)]">
            <p className="text-sm font-semibold leading-snug text-[var(--home-ink)]">
              {[displayName || symbol, symbol !== (displayName || symbol) ? symbol : null, info?.sector, info?.industry].filter(Boolean).join(" · ")}
            </p>
            {stance ? (
              <p className={`mt-2 text-base font-bold ${stanceColorClass}`}>
                {stance}
              </p>
            ) : null}
          </div>

          {/* Live price */}
          <div className="rounded-[28px] border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))] p-4 shadow-[var(--shadow-sm)]">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
              Latest Price
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-[var(--home-ink)]">
                {quoteLoading && displayedPrice === undefined
                  ? "Loading…"
                  : displayedPrice !== undefined
                    ? fmtN(displayedPrice, "currency")
                    : "Unavailable"}
              </span>
              {displayedDayChangePercent !== undefined ? (
                <span
                  className={`text-sm font-semibold ${
                    displayedDayChangePercent >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
                  }`}
                >
                  {fmtSigned(displayedDayChangePercent)}
                </span>
              ) : null}
            </div>
            <div className="mt-2">
              <DataFreshnessIndicator
                lastUpdated={priceFreshnessLastUpdated}
                mode={livePrice !== undefined ? priceFreshnessMode : "price"}
              />
            </div>
            <p className="mt-1 text-[11px] text-[var(--home-ink-muted)]">
              {livePrice !== undefined
                ? `Historical chart through ${formatHistoryAsOf(historicalPriceAsOf)}.`
                : historicalPriceAsOf
                  ? `Showing the latest saved close from ${formatHistoryAsOf(historicalPriceAsOf)}.`
                  : "Live pricing is temporarily unavailable."}
            </p>
            {quoteError && livePrice === undefined ? (
              <p className="mt-1 text-[11px] font-medium text-[var(--color-warning)]">{quoteError}</p>
            ) : null}
            {historyFreshness.isStale ? (
              <p className="mt-1 text-[11px] font-medium text-[var(--color-warning)]">
                Historical series trails the dataset by {historyFreshness.lagDays} days.
              </p>
            ) : null}
          </div>

          {/* Key metrics */}
          <div className="rounded-[28px] border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))] p-4 shadow-[var(--shadow-sm)]">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
              Key Metrics
            </p>
            <dl>
              <MetricRow label="Market Cap" value={fmtN(fundamentals?.marketCap, "compact")} />
              <MetricRow label="P/E TTM" value={fundamentals?.ttmPe?.toFixed(1) ?? "—"} />
              <MetricRow label="EPS TTM" value={fmtN(fundamentals?.ttmEps, "currency")} />
              <MetricRow label="P/S" value={fundamentals?.psRatio?.toFixed(1) ?? "—"} />
              <MetricRow label="P/B" value={fundamentals?.pbRatio?.toFixed(1) ?? "—"} />
              <MetricRow label="Beta 5Y" value={beta?.beta5y?.toFixed(2) ?? "—"} />
              <MetricRow label="Net Margin" value={fmtN(margins?.netMargin, "percent", 1)} />
              <MetricRow label="FCF Margin" value={fmtN(margins?.fcfMargin, "percent", 1)} />
              <MetricRow label="ROIC" value={fmtN(profitability?.roic, "percent", 1)} />
              <MetricRow
                label="DCF Upside"
                value={fmtSigned(dcfUpside)}
                tone={dcfUpside !== undefined ? (dcfUpside > 0 ? "positive" : dcfUpside < -5 ? "negative" : "default") : "default"}
              />
              <MetricRow label="Fair Value" value={fmtN(dcf?.fairValue, "currency")} />
              <MetricRow label="WACC" value={fmtN(effectiveWacc, "percent", 1)} />
              <MetricRow
                label="52W Range"
                value={
                  trailingLow !== undefined && trailingHigh !== undefined
                    ? `${fmtN(trailingLow, "currency", 0)}–${fmtN(trailingHigh, "currency", 0)}`
                    : "—"
                }
              />
            </dl>
          </div>

          {/* Dataset freshness */}
          <div className="rounded-[28px] border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))] px-4 py-3 shadow-[var(--shadow-sm)]">
            <DataFreshnessIndicator lastUpdated={dataFreshnessLastUpdated} mode="dataset" />
          </div>
        </>
      ) : (
        <div className="rounded-[28px] border border-dashed border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))] px-5 py-10 text-center shadow-[var(--shadow-sm)]">
          <p className="text-sm text-[var(--home-ink-muted)]">
            Enter a ticker to see metrics and research data.
          </p>
        </div>
      )}
    </div>
  );
}
