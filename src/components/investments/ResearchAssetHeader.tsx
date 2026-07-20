"use client";

import React from "react";
import {
  IconExternalLink,
  IconFileText,
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react";
import { useLiveQuote } from "@/hooks/useLiveQuote";
import { useStockData } from "@/hooks/useStockData";
import { DataFreshnessIndicator } from "./DataFreshnessIndicator";
import { formatHistoryAsOf } from "@/lib/investmentsHistory";
import type {
  BetaData,
  CompanyInfo,
  Fundamentals,
  MarginsData,
  PriceData,
  Profitability,
  StockPrice,
} from "@/types/investment";
import { holdingColor } from "./holdingPalette";
import styles from "@/app/investments/investments.module.css";

interface Props {
  symbol: string;
  isInPortfolio?: boolean;
  portfolioShares?: number | null;
  onAddToPortfolio?: () => void;
}



function formatBalance(n: number | undefined): { whole: string; cents: string } {
  if (n === undefined || !Number.isFinite(n)) return { whole: "—", cents: "" };
  const sign = n < 0 ? "−" : "";
  const abs = Math.abs(n);
  const whole = Math.floor(abs);
  const cents = Math.round((abs - whole) * 100);
  return {
    whole: `${sign}$${whole.toLocaleString("en-US")}`,
    cents: `.${cents.toString().padStart(2, "0")}`,
  };
}

function formatSignedCurrency(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  const abs = Math.abs(n);
  return `${sign}$${abs.toFixed(2)}`;
}

function formatPercent(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(2)}%`;
}

function formatRefreshLabel(raw: string | Date | null | undefined): string {
  if (!raw) return "Refresh";
  const d = raw instanceof Date ? raw : new Date(raw);
  if (isNaN(d.getTime())) return "Refresh";
  const minutes = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (minutes < 1) return "Refreshed just now";
  if (minutes === 1) return "Refreshed 1m ago";
  if (minutes < 60) return `Refreshed ${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  return `Refreshed ${h}h ago`;
}

function formatMarketAsOf(raw: string | null | undefined): string {
  if (!raw) return "an earlier response";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "an earlier response";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatCompactCurrency(n: number | undefined): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

function formatRatio(n: number | undefined, decimals = 1): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return "—";
  return n.toFixed(decimals);
}

function formatPercent1(n: number | undefined, signed = false): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return "—";
  const sign = signed && n > 0 ? "+" : signed && n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(1)}%`;
}

function formatRange(low: number | undefined, high: number | undefined): string {
  if (low === undefined || high === undefined) return "—";
  const fmt = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(v);
  return `${fmt(low)}–${fmt(high)}`;
}

function getPriceDate(entry: (StockPrice & { report_date?: string }) | undefined): string | undefined {
  return entry?.date ?? entry?.report_date;
}

// Mirrors DataFreshnessIndicator's STALE_DATASET_THRESHOLD_DAYS (7). Defined at
// module scope so the relative-time read isn't flagged as impure during render.
function isSnapshotStale(snapshotBuiltAt: string | null): boolean {
  if (!snapshotBuiltAt) return false;
  const days = Math.floor((Date.now() - new Date(snapshotBuiltAt).getTime()) / 86_400_000);
  return days >= 7;
}

interface KeyMetric {
  label: string;
  hint: string;
  value: string;
  tone?: "default" | "pos" | "neg";
}

interface KeyMetricCellProps {
  metric: KeyMetric;
}

function KeyMetricCell({ metric }: KeyMetricCellProps) {
  const valueColor =
    metric.tone === "pos"
      ? "text-[var(--home-positive)]"
      : metric.tone === "neg"
        ? "text-[var(--home-negative)]"
        : "text-[var(--home-ink)]";
  return (
    <div className="research-key-metric">
      <span
        className="research-key-metric-label"
        title={metric.hint}
      >
        {metric.label}
      </span>
      <span
        className={`research-key-metric-value ${valueColor}`}
      >
        {metric.value}
      </span>
    </div>
  );
}

export function ResearchAssetHeader({
  symbol,
  isInPortfolio = false,
  portfolioShares = null,
  onAddToPortfolio,
}: Props) {
  const { data: info, freshness } = useStockData<CompanyInfo>(symbol || null, "info");
  const { data: fundamentals } = useStockData<Fundamentals>(symbol || null, "fundamentals");
  const { data: profitability } = useStockData<Profitability>(symbol || null, "profitability");
  const { data: marginsRaw } = useStockData<MarginsData>(symbol || null, "margins");
  const { data: beta } = useStockData<BetaData>(symbol || null, "beta");
  const { data: priceRaw } = useStockData<PriceData>(symbol || null, "price");
  const {
    quote,
    isLoading: quoteLoading,
    error: quoteError,
    lastUpdated,
  } = useLiveQuote(symbol || null);

  const margins = Array.isArray(marginsRaw) ? marginsRaw[marginsRaw.length - 1] : undefined;
  const trailingYear = React.useMemo(() => {
    if (!Array.isArray(priceRaw)) return [];
    return (priceRaw as StockPrice[]).slice(-252);
  }, [priceRaw]);
  const latestHistoricalPrice = trailingYear[trailingYear.length - 1] as
    | (StockPrice & { report_date?: string })
    | undefined;
  const savedClose =
    typeof latestHistoricalPrice?.close === "number" &&
    Number.isFinite(latestHistoricalPrice.close)
      ? latestHistoricalPrice.close
      : undefined;
  const savedCloseLabel = formatHistoryAsOf(getPriceDate(latestHistoricalPrice));
  const trailingHigh = trailingYear.length
    ? Math.max(...trailingYear.map((p) => p.high ?? p.close ?? 0))
    : undefined;
  const trailingLow = trailingYear.length
    ? Math.min(...trailingYear.map((p) => p.low ?? p.close ?? 0))
    : undefined;
  const keyMetrics: KeyMetric[] = [
    {
      label: "Market cap",
      hint: "Total equity value at the latest close.",
      value: formatCompactCurrency(fundamentals?.marketCap),
    },
    {
      label: "P/E TTM",
      hint: "Price to trailing-12-month earnings.",
      value: formatRatio(fundamentals?.ttmPe, 1),
    },
    {
      label: "EPS TTM",
      hint: "Trailing-12-month earnings per share.",
      value:
        fundamentals?.ttmEps !== undefined
          ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(fundamentals.ttmEps)
          : "—",
    },
    {
      label: "Net margin",
      hint: "Trailing-12-month net income divided by revenue.",
      value: formatPercent1(margins?.netMargin),
    },
    {
      label: "ROIC",
      hint: "Return on invested capital. How efficiently the business converts capital to profit.",
      value: formatPercent1(profitability?.roic),
      tone:
        profitability?.roic === undefined
          ? "default"
          : profitability.roic >= 12
            ? "pos"
            : profitability.roic <= 5
              ? "neg"
              : "default",
    },
    {
      label: "Beta 5Y",
      hint: "Five-year price beta vs. the market.",
      value: formatRatio(beta?.beta5y, 2),
    },
  ];

  // 52-week range as a positioned dot on a track, not text — the trailing
  // low/high and the current display price already come from the same
  // trailingYear price series computed above.
  const rangeDisplayPrice = quote && !quote.error ? quote.price : savedClose;
  const weekRangePosition =
    trailingLow !== undefined &&
    trailingHigh !== undefined &&
    trailingHigh > trailingLow &&
    rangeDisplayPrice !== undefined
      ? Math.min(100, Math.max(0, ((rangeDisplayPrice - trailingLow) / (trailingHigh - trailingLow)) * 100))
      : null;

  const upper = symbol.toUpperCase();
  const tone = holdingColor(upper);
  const quoteName = !quote?.error ? quote?.name : undefined;
  const displayName =
    info?.longName ||
    info?.shortName ||
    (quoteName && quoteName.toUpperCase() !== upper ? quoteName : null) ||
    upper;

  const hasCurrentQuote = Boolean(quote && !quote.error && !quote.isFallback);
  const livePrice = hasCurrentQuote ? quote?.price : undefined;
  const savedMarketPrice = quote?.isFallback && !quote.error ? quote.price : undefined;
  const dayChange = hasCurrentQuote ? quote?.change : undefined;
  const dayChangePct = hasCurrentQuote ? quote?.changePercent : undefined;
  const displayPrice = livePrice ?? savedMarketPrice ?? savedClose;
  const px =
    displayPrice !== undefined
      ? formatBalance(displayPrice)
      : { whole: "Unavailable", cents: "" };
  const positive = (dayChange ?? 0) >= 0;
  const priceEyebrow =
    livePrice !== undefined
      ? "Latest market quote"
      : savedMarketPrice !== undefined
        ? "Saved market quote"
        : quoteLoading && savedClose === undefined
          ? "Fetching market quote"
          : savedClose !== undefined
            ? `Price as of ${savedCloseLabel}`
            : "No price data";
  const showSavedCloseNote =
    livePrice === undefined && savedMarketPrice === undefined && savedClose !== undefined && !quoteLoading;
  const showSavedMarketNote = savedMarketPrice !== undefined && !quoteLoading;
  const showQuoteUnavailableNote = livePrice === undefined && Boolean(quoteError);
  const savedMarketLabel = formatMarketAsOf(lastUpdated ?? quote?.asOf);

  // Surface snapshot staleness honestly: when the curated fundamentals snapshot
  // is more than a week old (e.g. a symbol served from a prior run because the
  // latest fetch failed for it), badge the "as of" date. Fresh symbols stay
  // quiet. Note this is the fundamentals snapshot age, not the market quote.
  const snapshotBuiltAt = freshness?.snapshotBuiltAt ?? null;
  const snapshotIsStale = isSnapshotStale(snapshotBuiltAt);
  const retainedSections = freshness?.retainedSections ?? [];

  return (
    <section className="research-asset-card" aria-label={`${upper} asset summary`}>
      <div className="research-asset-row">
        <span
          className="research-asset-logo"
          aria-hidden="true"
          style={{ background: tone }}
        />

        <div className="research-asset-meta">
          <div className="research-asset-titleline">
            <h2>{displayName}</h2>
            <span className="research-ticker-pill">{upper}</span>
            {isInPortfolio ? (
              <span className="research-badge-pill held">
                Held
                {typeof portfolioShares === "number" && portfolioShares > 0
                  ? ` · ${portfolioShares.toLocaleString("en-US", { maximumFractionDigits: 4 })} sh`
                  : ""}
              </span>
            ) : null}
            {info?.sector ? (
              <span className="research-badge-pill tag">{info.sector}</span>
            ) : null}
            {info?.industry && info.industry !== info.sector ? (
              <span className="research-badge-pill tag">{info.industry}</span>
            ) : null}
            {retainedSections.length > 0 ? (
              <span
                className="research-badge-pill tag"
                title={`Earlier valid data retained for: ${retainedSections.join(", ")}.`}
              >
                Partial snapshot
              </span>
            ) : null}
            {snapshotIsStale && snapshotBuiltAt ? (
              <span
                className="research-asset-stale"
                title="This company's research data comes from an earlier snapshot. The market quote above is sourced separately."
              >
                <DataFreshnessIndicator lastUpdated={snapshotBuiltAt} mode="dataset" />
              </span>
            ) : null}
          </div>

          {weekRangePosition !== null ? (
            <div className={styles.weekRange} aria-label="52-week range">
              <div className={styles.weekRangeTrack}>
                <span className={styles.weekRangeMark} style={{ left: `${weekRangePosition}%` }} />
              </div>
              <div className={styles.weekRangeCaption}>
                <span>52W {formatRange(trailingLow, trailingHigh)}</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="research-asset-price">
          <span className="research-asset-price-eyebrow">
            {livePrice !== undefined ? (
              <span className="invest-hero-livedot" aria-hidden="true" />
            ) : null}
            {priceEyebrow}
          </span>
          <p className="research-asset-px">
            <span>{px.whole}</span>
            <span className="cents">{px.cents}</span>
          </p>
          <div className="research-asset-delta">
            {livePrice !== undefined ? (
              <>
                <span className={`chip ${positive ? "pos" : "neg"}`}>
                  {formatSignedCurrency(dayChange)}
                </span>
                <span className={positive ? "pos" : "neg"}>
                  {formatPercent(dayChangePct)} latest session
                </span>
              </>
            ) : (
              <>
                {showSavedMarketNote ? (
                  <span>Showing the last saved market quote from {savedMarketLabel}.</span>
                ) : null}
                {showSavedCloseNote ? (
                  <span>Showing the latest saved close from {savedCloseLabel}.</span>
                ) : null}
                {showQuoteUnavailableNote ? (
                  <span>Market quote is temporarily unavailable.</span>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="research-key-metrics" role="list" aria-label="Key metrics">
        {keyMetrics.map((metric) => (
          <KeyMetricCell key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="research-asset-actions">
        {!isInPortfolio && onAddToPortfolio ? (
          <button
            type="button"
            className="invest-ghost is-primary"
            onClick={onAddToPortfolio}
          >
            <IconPlus size={14} aria-hidden="true" />
            Add to portfolio
          </button>
        ) : null}
        {info?.website ? (
          <a
            href={info.website}
            target="_blank"
            rel="noopener noreferrer"
            className="invest-ghost"
          >
            <IconExternalLink size={14} aria-hidden="true" />
            Investor relations
          </a>
        ) : null}
        <a
          href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${upper}&type=&dateb=&owner=include&count=40`}
          target="_blank"
          rel="noopener noreferrer"
          className="invest-ghost"
        >
          <IconFileText size={14} aria-hidden="true" />
          SEC filings
        </a>
        <span className="invest-ghost research-asset-actions-clock" aria-hidden="true">
          <IconRefresh size={14} aria-hidden="true" />
          {formatRefreshLabel(lastUpdated)}
        </span>
      </div>
    </section>
  );
}
