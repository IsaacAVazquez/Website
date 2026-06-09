"use client";

import React from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { useStockData } from "@/hooks/useStockData";
import { IconExternalLink } from "@tabler/icons-react";
import type {
  CompanyInfo,
  DcfData,
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

function formatDate(raw: string | undefined): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <div className="py-3 border-b border-[var(--home-rule)] last:border-0">
      <div className="min-w-0">
        {item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-start gap-1 text-sm font-medium text-[var(--home-ink)] hover:text-[var(--home-haze)] transition line-clamp-2"
          >
            <span>{item.title}</span>
            <IconExternalLink size={12} className="mt-1 shrink-0 text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]" />
          </a>
        ) : (
          <p className="text-sm font-medium leading-6 text-[var(--home-ink)] line-clamp-2">{item.title}</p>
        )}
        <div className="mt-1 flex items-center gap-2">
          {item.publisher ? (
            <span className="text-xs text-[var(--home-ink-muted)]">{item.publisher}</span>
          ) : null}
          {item.reportDate ? (
            <span className="text-xs text-[var(--home-ink-muted)]">{formatDate(item.reportDate)}</span>
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
  dcf,
  profitability,
  margins,
  growth,
}: {
  dcf?: DcfData;
  profitability?: Profitability;
  margins?: Margin;
  growth?: GrowthData;
}) {
  const signals: { label: string; tone: "positive" | "neutral" | "negative"; body: string }[] = [];

  if (dcf?.upside !== undefined) {
    signals.push({
      label: "Valuation",
      tone: dcf.upside >= 15 ? "positive" : dcf.upside <= -10 ? "negative" : "neutral",
      body:
        dcf.upside >= 15
          ? `Model implies ${formatPercent(dcf.upside, true)} upside.`
          : dcf.upside <= -10
            ? `Model implies ${formatPercent(dcf.upside, true)} downside.`
            : `Model sits near fair value at ${formatPercent(dcf.upside, true)}.`,
    });
  }

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
  if (tone === "positive") return "border-emerald-200/70 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300";
  if (tone === "negative") return "border-red-200/70 bg-red-500/8 text-red-700 dark:text-red-300";
  return "border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink-muted)]";
}

export function ResearchOverview({ symbol, showNews = true }: Props) {
  const { data: info } = useStockData<CompanyInfo>(symbol, "info");
  const { data: dcf } = useStockData<DcfData>(symbol, "dcf");
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
  const signals = buildSignals({ dcf: dcf ?? undefined, profitability: profitability ?? undefined, margins, growth: growth ?? undefined });

  return (
    <div className="space-y-5">
      {/* Company bio */}
      <WarmCard
        padding="none"
        className="overflow-hidden rounded-[30px] border-[color-mix(in_srgb,var(--home-haze)_16%,var(--home-rule))] shadow-[var(--shadow-sm)]"
      >
        <div className="p-5 sm:p-6">
          <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
            About
          </p>
          <p className="mt-3 text-sm leading-[1.7] text-[var(--home-ink-muted)] w-full max-w-full overflow-hidden text-ellipsis ">
            {info?.longBusinessSummary ??
              "A company summary is not available for this symbol, but the core valuation, quality, and operating metrics are still available from the research snapshot."}
          </p>
          {info?.website ? (
            <a
              href={info.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--home-haze)] hover:underline"
            >
              {info.website.replace(/^https?:\/\//, "")}
            </a>
          ) : null}
        </div>
      </WarmCard>

      {/* Officers */}
      {officers.length > 0 ? (
        <WarmCard
          padding="none"
          className="rounded-[30px] shadow-[var(--shadow-sm)]"
        >
          <div className="p-5 sm:p-6">
            <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
              Leadership
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {officers.map((officer, i) => (
                <div
                  key={i}
                  className="rounded-[20px] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-3"
                >
                  <p className="text-sm font-semibold leading-tight text-[var(--home-ink)]">
                    {officer.name ?? "—"}
                  </p>
                  {officer.title ? (
                    <p className="mt-0.5 text-xs leading-snug text-[var(--home-ink-muted)]">
                      {officer.title}
                    </p>
                  ) : null}
                  {officer.totalPay ? (
                    <p className="mt-1.5 text-2xs font-medium text-[var(--home-haze)]">
                      {formatPay(officer.totalPay)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </WarmCard>
      ) : null}

      {/* Signals + News */}
      <div className={`grid gap-5 ${newsItems.length > 0 ? "lg:grid-cols-2" : ""}`}>
        {/* Signals */}
        <WarmCard
          padding="sm"
          className="rounded-[30px] border-[color-mix(in_srgb,var(--color-success)_18%,var(--home-rule))] shadow-[var(--shadow-sm)]"
        >
          <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
            Signals
          </p>
          <div className="mt-4 space-y-3">
            {signals.length > 0 ? (
              signals.map((signal) => (
                <div
                  key={signal.label}
                  className={`rounded-[24px] border px-4 py-3 ${toneClasses(signal.tone)}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">{signal.label}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--home-ink)]">{signal.body}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-[var(--home-rule)] px-4 py-3 text-sm text-[var(--home-ink-muted)]">
                Signals will appear once valuation and operating data are available.
              </div>
            )}
          </div>
        </WarmCard>

        {/* News */}
        {newsItems.length > 0 ? (
          <WarmCard padding="sm" className="rounded-[30px] shadow-[var(--shadow-sm)]">
            <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
              Latest News
            </p>
            <div className="mt-3 max-h-[400px] overflow-y-auto pr-1">
              {newsItems.map((item, i) => (
                <NewsCard key={item.uuid ?? i} item={item} />
              ))}
            </div>
          </WarmCard>
        ) : !showNews ? (
          <WarmCard padding="sm" className="rounded-[30px] shadow-[var(--shadow-sm)]">
            <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
              Snapshot Mode
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--home-ink-muted)]">
              Valuation, quality, and operating data are available while the curated headline feed is unavailable.
            </p>
          </WarmCard>
        ) : null}
      </div>
    </div>
  );
}
