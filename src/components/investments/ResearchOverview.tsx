"use client";

import { ExternalLink } from "lucide-react";
import React from "react";
import { TerminalPanel } from "./TerminalPanel";
import { useStockData } from "@/hooks/useStockData";
import { DATE_ONLY_TIME_ZONE } from "@/lib/date-formatters";
import type {
  CompanyInfo,
  GrowthData,
  Margin,
  MarginsData,
  NewsData,
  NewsItem,
  OfficersData,
  Profitability,
} from "@/types/investment";

interface Props {
  symbol: string;
  showNews?: boolean;
}

// `raw` (a news item's reportDate) is a bare YYYY-MM-DD from the provider,
// which parses as UTC midnight, so it prints in UTC to keep its day. In the
// display zone it printed the day before.
function formatDate(raw: string | undefined): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: DATE_ONLY_TIME_ZONE,
  });
}

function newsMonogram(item: NewsItem): string {
  const source = item.publisher?.trim() || item.title?.trim() || "";
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "•";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <div className="flex items-start border-b border-[var(--c97-rule)] last:border-0" style={{ gap: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-1)" }}>
      <div
        aria-hidden="true"
        className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center border border-[var(--c97-rule)] bg-[var(--c97-panel)] text-xs font-semibold tracking-[0.04em] text-[var(--c97-ink-2)]"
      >
        {newsMonogram(item)}
      </div>
      <div className="min-w-0 flex-1">
        {item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-start text-sm font-medium text-[var(--c97-ink)] hover:text-[var(--c97-accent)] transition line-clamp-2" style={{ gap: "var(--c97-sp-0)" }}
          >
            <span>{item.title}</span>
            <ExternalLink size={12} className="shrink-0 text-[var(--c97-label)]" style={{ marginTop: "var(--c97-sp-0)" }} />
          </a>
        ) : (
          <p className="text-sm font-medium leading-6 text-[var(--c97-ink)] line-clamp-2">{item.title}</p>
        )}
        <div className="flex items-center" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-0)" }}>
          {item.publisher ? (
            <span className="text-xs text-[var(--c97-ink-2)]">{item.publisher}</span>
          ) : null}
          {item.publisher && item.reportDate ? (
            <span aria-hidden="true" className="text-[var(--c97-label)]">·</span>
          ) : null}
          {item.reportDate ? (
            <span
              className="text-2xs uppercase tracking-[0.04em] text-[var(--c97-label)]"
              style={{ fontFamily: "var(--c97-font-mono)" }}
            >
              {formatDate(item.reportDate)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatPercent(value: number | undefined, signed = false): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function formatPay(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function buildSignals({
  profitability,
  margins,
  growth,
}: {
  profitability?: Profitability;
  margins?: Margin;
  growth?: GrowthData;
}) {
  const signals: { label: string; tone: "positive" | "neutral" | "negative"; body: string }[] = [];

  if (profitability?.roic !== undefined || margins?.netMargin !== undefined) {
    const roic = profitability?.roic ?? 0;
    const netMargin = margins?.netMargin ?? 0;
    signals.push({
      label: "Quality",
      tone: roic >= 12 || netMargin >= 15 ? "positive" : roic <= 5 && netMargin <= 5 ? "negative" : "neutral",
      body: `ROIC ${formatPercent(profitability?.roic)} and net margin ${formatPercent(margins?.netMargin)}.`,
    });
  }

  const growthItems = Array.isArray(growth) ? growth : [];
  const strongestGrowth = growthItems
    .map((item) => ({
      label: String(item.metric ?? item.reportDate ?? "Growth"),
      yoyGrowth: Number(item.yoyGrowth ?? item.value),
    }))
    .filter((item) => !Number.isNaN(item.yoyGrowth))
    .sort((a, b) => Math.abs(b.yoyGrowth) - Math.abs(a.yoyGrowth))[0];

  if (strongestGrowth) {
    signals.push({
      label: "Momentum",
      tone: strongestGrowth.yoyGrowth >= 10 ? "positive" : strongestGrowth.yoyGrowth <= -5 ? "negative" : "neutral",
      body: `${strongestGrowth.label} at ${formatPercent(strongestGrowth.yoyGrowth, true)} YoY.`,
    });
  }

  return signals.slice(0, 3);
}

function toneClasses(tone: "positive" | "neutral" | "negative") {
  if (tone === "positive") return "border-[color-mix(in_srgb,var(--c97-positive)_30%,var(--c97-rule))] bg-[color-mix(in_srgb,var(--c97-positive)_9%,var(--c97-panel))] text-[color-mix(in_srgb,var(--c97-positive)_70%,var(--c97-ink))]";
  if (tone === "negative") return "border-[color-mix(in_srgb,var(--c97-negative)_30%,var(--c97-rule))] bg-[color-mix(in_srgb,var(--c97-negative)_9%,var(--c97-panel))] text-[color-mix(in_srgb,var(--c97-negative)_70%,var(--c97-ink))]";
  return "border-[var(--c97-rule)] bg-[var(--c97-panel)] text-[var(--c97-ink-2)]";
}

export function ResearchOverview({ symbol, showNews = true }: Props) {
  const { data: info } = useStockData<CompanyInfo>(symbol, "info");
  const { data: profitability } = useStockData<Profitability>(symbol, "profitability");
  const { data: marginsRaw } = useStockData<MarginsData>(symbol, "margins");
  const { data: growth } = useStockData<GrowthData>(symbol, "growth");
  const { data: officersRaw } = useStockData<OfficersData>(symbol, "officers");
  const { data: newsRaw } = useStockData<NewsData>(showNews ? symbol : null, "news");

  const margins = Array.isArray(marginsRaw) ? marginsRaw[marginsRaw.length - 1] : undefined;
  const newsItems = React.useMemo(() => {
    if (!showNews || !Array.isArray(newsRaw)) return [];
    return [...newsRaw].sort((a, b) => {
      const ta = a.reportDate ? new Date(a.reportDate).getTime() : 0;
      const tb = b.reportDate ? new Date(b.reportDate).getTime() : 0;
      return tb - ta;
    });
  }, [showNews, newsRaw]);
  const officers = Array.isArray(officersRaw) ? officersRaw.slice(0, 8) : [];
  const signals = buildSignals({ profitability: profitability ?? undefined, margins, growth: growth ?? undefined });

  return (
    <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-2)" }}>
      {/* Company bio */}
      <TerminalPanel
        padding="none"
        className="overflow-hidden border-[color-mix(in_srgb,var(--c97-accent)_16%,var(--c97-rule))] "
      >
        <div className="p-[var(--c97-sp-2)] sm:p-[var(--c97-sp-3)]">
          <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--c97-label)]">
            About
          </p>
          <p className="text-sm leading-[1.7] text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
            {info?.longBusinessSummary ??
              "A company summary is not available for this symbol, but the core valuation, quality, and operating metrics are still available from the research snapshot."}
          </p>
          {info?.website ? (
            <a
              href={info.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-medium text-[var(--c97-accent)] hover:underline" style={{ gap: "var(--c97-sp-0)", marginTop: "var(--c97-sp-2)" }}
            >
              {info.website.replace(/^https?:\/\//, "")}
            </a>
          ) : null}
        </div>
      </TerminalPanel>

      {/* Officers */}
      {officers.length > 0 ? (
        <TerminalPanel
          padding="none"
         
        >
          <div className="p-[var(--c97-sp-2)] sm:p-[var(--c97-sp-3)]">
            <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--c97-label)]">
              Leadership
            </p>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-2)" }}>
              {officers.map((officer, i) => (
                <div
                  key={i}
                  className="border border-[var(--c97-rule)] bg-[var(--c97-panel)]" style={{ padding: "var(--c97-sp-1)" }}
                >
                  <p className="text-sm font-semibold leading-tight text-[var(--c97-ink)]">
                    {officer.name ?? "—"}
                  </p>
                  {officer.title ? (
                    <p className="mt-0.5 text-xs leading-snug text-[var(--c97-ink-2)]">
                      {officer.title}
                    </p>
                  ) : null}
                  {officer.totalPay ? (
                    <p className="text-2xs font-medium text-[var(--c97-accent)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                      {formatPay(officer.totalPay)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </TerminalPanel>
      ) : null}

      {/* Signals + News */}
      <div
        className={`grid ${newsItems.length > 0 ? "lg:grid-cols-2" : ""}`}
        style={{ gap: "var(--c97-sp-2)" }}
      >
        {/* Signals */}
        <TerminalPanel
          padding="sm"
          className="border-[color-mix(in_srgb,var(--c97-positive)_18%,var(--c97-rule))] "
        >
          <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--c97-label)]">
            Signals
          </p>
          <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-2)" }}>
            {signals.length > 0 ? (
              signals.map((signal) => (
                <div
                  key={signal.label}
                  style={{ padding: "var(--c97-sp-1) var(--c97-sp-2)" }}
                  className={`border ${toneClasses(signal.tone)}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">{signal.label}</p>
                  <p className="text-sm leading-6 text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-1)" }}>{signal.body}</p>
                </div>
              ))
            ) : (
              <div className="border border-[var(--c97-rule)] text-sm text-[var(--c97-ink-2)]" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)" }}>
                Signals will appear once valuation and operating data are available.
              </div>
            )}
          </div>
        </TerminalPanel>

        {/* News */}
        {newsItems.length > 0 ? (
          <TerminalPanel padding="sm">
            <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--c97-label)]">
              Latest news
            </p>
            <div className="max-h-[400px] overflow-y-auto" style={{ marginTop: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-0)" }}>
              {newsItems.map((item, i) => (
                <NewsCard key={item.uuid ?? i} item={item} />
              ))}
            </div>
          </TerminalPanel>
        ) : !showNews ? (
          <TerminalPanel padding="sm">
            <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--c97-label)]">
              Snapshot mode
            </p>
            <p className="text-sm leading-6 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
              Valuation, quality, and operating data are available while the curated headline feed is unavailable.
            </p>
          </TerminalPanel>
        ) : null}
      </div>
    </div>
  );
}
