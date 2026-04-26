"use client";

import React from "react";
import {
  IconBookmark,
  IconExternalLink,
  IconFileText,
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react";
import { useLiveQuote } from "@/hooks/useLiveQuote";
import { useStockData } from "@/hooks/useStockData";
import type { CompanyInfo } from "@/types/investment";

interface Props {
  symbol: string;
  isInPortfolio?: boolean;
  portfolioShares?: number | null;
  onAddToPortfolio?: () => void;
}

const TICKER_TONE: Record<string, string> = {
  NVDA: "#5C8531",
  AAPL: "#12110F",
  MSFT: "#4D8AD0",
  GOOGL: "#4A6CF0",
  AMZN: "#1F7A6E",
  TSLA: "#B22B2F",
  "BRK.B": "#6B5A3E",
  SPY: "#3F4B57",
};

function tonForSymbol(symbol: string): string {
  const direct = TICKER_TONE[symbol];
  if (direct) return direct;
  // Hash for stable per-symbol color when not curated
  let h = 0;
  for (let i = 0; i < symbol.length; i++) {
    h = (h << 5) - h + symbol.charCodeAt(i);
    h |= 0;
  }
  const palette = ["#5672F8", "#5C8531", "#B22B2F", "#1F7A6E", "#4D8AD0", "#6B5A3E", "#3F4B57", "#615B52"];
  return palette[Math.abs(h) % palette.length];
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

function logoChars(symbol: string): string {
  return symbol.replace(".", "").slice(0, 2).toUpperCase();
}

export function ResearchAssetHeader({
  symbol,
  isInPortfolio = false,
  portfolioShares = null,
  onAddToPortfolio,
}: Props) {
  const { data: info } = useStockData<CompanyInfo>(symbol || null, "info");
  const {
    quote,
    isLoading: quoteLoading,
    error: quoteError,
    lastUpdated,
  } = useLiveQuote(symbol || null);

  const upper = symbol.toUpperCase();
  const tone = tonForSymbol(upper);
  const quoteName = !quote?.error ? quote?.name : undefined;
  const displayName =
    info?.longName ||
    info?.shortName ||
    (quoteName && quoteName.toUpperCase() !== upper ? quoteName : null) ||
    upper;

  const livePrice = quote && !quote.error ? quote.price : undefined;
  const dayChange = quote && !quote.error ? quote.change : undefined;
  const dayChangePct = quote && !quote.error ? quote.changePercent : undefined;
  const px = formatBalance(livePrice);
  const positive = (dayChange ?? 0) >= 0;

  return (
    <section className="research-asset-card" aria-label={`${upper} asset summary`}>
      <div className="research-asset-row">
        <div
          className="research-asset-logo"
          aria-hidden="true"
          style={{ background: tone }}
        >
          {logoChars(upper)}
        </div>

        <div className="research-asset-meta">
          <div className="research-asset-titleline">
            <h1>{displayName}</h1>
            <span className="research-ticker-pill">
              {upper}
              {info?.industry || info?.sector ? " · " : null}
              {info?.industry || info?.sector || ""}
            </span>
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
          </div>
          {info?.longBusinessSummary ? (
            <p className="research-asset-bio">{info.longBusinessSummary}</p>
          ) : (
            <p className="research-asset-bio research-asset-bio--muted">
              {quoteError && !info
                ? "Live price is temporarily unavailable. Curated fundamentals below."
                : "Loading company description…"}
            </p>
          )}
        </div>

        <div className="research-asset-price">
          <span className="research-asset-price-eyebrow">
            <span className="invest-hero-livedot" aria-hidden="true" />
            {livePrice !== undefined
              ? "Live quote"
              : quoteLoading
                ? "Fetching live quote"
                : "Last close"}
          </span>
          <p className="research-asset-px">
            <span>{px.whole}</span>
            <span className="cents">{px.cents}</span>
          </p>
          <div className="research-asset-delta">
            <span className={`chip ${positive ? "pos" : "neg"}`}>
              {formatSignedCurrency(dayChange)}
            </span>
            <span className={positive ? "pos" : "neg"}>
              {formatPercent(dayChangePct)} today
            </span>
          </div>
        </div>
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
        <a
          href="#thesis-notes"
          className="invest-ghost"
        >
          <IconBookmark size={14} aria-hidden="true" />
          Research notes
        </a>
        <span className="invest-ghost research-asset-actions-clock" aria-hidden="true">
          <IconRefresh size={14} aria-hidden="true" />
          {formatRefreshLabel(lastUpdated)}
        </span>
      </div>
    </section>
  );
}
