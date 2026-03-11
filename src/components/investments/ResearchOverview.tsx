"use client";

import React from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { useStockData } from "@/hooks/useStockData";
import { FundamentalsPanel } from "./FundamentalsPanel";
import { NewsPanel } from "./NewsPanel";
import type {
  CompanyInfo,
  DcfData,
  GrowthData,
  MarginsData,
  NewsData,
  Profitability,
} from "@/types/investment";

interface Props {
  symbol: string;
}

function formatPercent(value: number | undefined, signed = false): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function formatCompactPercent(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(0)}%`;
}

function buildSignals({
  dcf,
  profitability,
  margins,
  growth,
}: {
  dcf?: DcfData;
  profitability?: Profitability;
  margins?: MarginsData extends Array<infer U> ? U : never;
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
  return "border-[var(--border-primary)] bg-[var(--surface-secondary)] text-[var(--text-secondary)]";
}

export function ResearchOverview({ symbol }: Props) {
  const { data: info } = useStockData<CompanyInfo>(symbol, "info");
  const { data: dcf } = useStockData<DcfData>(symbol, "dcf");
  const { data: profitability } = useStockData<Profitability>(symbol, "profitability");
  const { data: marginsRaw } = useStockData<MarginsData>(symbol, "margins");
  const { data: growth } = useStockData<GrowthData>(symbol, "growth");
  const { data: newsRaw } = useStockData<NewsData>(symbol, "news");

  const margins = Array.isArray(marginsRaw) ? marginsRaw[marginsRaw.length - 1] : undefined;
  const newsItems = Array.isArray(newsRaw) ? newsRaw : [];
  const leadHeadline = newsItems[0];
  const signals = buildSignals({ dcf, profitability, margins, growth });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_0.9fr]">
        <WarmCard
          padding="none"
          className="overflow-hidden border-[color-mix(in_srgb,var(--color-primary)_16%,var(--border-primary))]"
        >
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                Thesis Snapshot
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                What matters first
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                {info?.longBusinessSummary ??
                  "Business summary is unavailable for this symbol, but the valuation, quality, and operating signals below are still loaded from the research dataset."}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Business Lens
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center justify-between gap-4">
                      <span>Sector</span>
                      <span className="font-medium text-[var(--text-primary)]">{info?.sector ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Industry</span>
                      <span className="font-medium text-[var(--text-primary)]">{info?.industry ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Employees</span>
                      <span className="font-medium text-[var(--text-primary)]">
                        {info?.fullTimeEmployees?.toLocaleString("en-US") ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Country</span>
                      <span className="font-medium text-[var(--text-primary)]">{info?.country ?? "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Operating Read
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center justify-between gap-4">
                      <span>ROIC</span>
                      <span className="font-medium text-[var(--text-primary)]">{formatPercent(profitability?.roic)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>ROE</span>
                      <span className="font-medium text-[var(--text-primary)]">{formatPercent(profitability?.roe)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Net Margin</span>
                      <span className="font-medium text-[var(--text-primary)]">{formatPercent(margins?.netMargin)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>FCF Margin</span>
                      <span className="font-medium text-[var(--text-primary)]">{formatPercent(margins?.fcfMargin)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-primary)] bg-[var(--surface-secondary)] p-5 sm:p-6 lg:border-l lg:border-t-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                Signals
              </p>
              <div className="mt-4 space-y-3">
                {signals.length > 0 ? (
                  signals.map((signal) => (
                    <div
                      key={signal.label}
                      className={`rounded-2xl border px-4 py-3 ${toneClasses(signal.tone)}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em]">{signal.label}</p>
                      <p className="mt-2 text-sm leading-6">{signal.body}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-[var(--border-primary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                    Research signals will appear once valuation and operating data are available.
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Lead Narrative
                </p>
                <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
                  {leadHeadline?.title ?? "No recent headline in the research dataset."}
                </p>
                {leadHeadline?.publisher ? (
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    {leadHeadline.publisher}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="sm" className="border-[color-mix(in_srgb,var(--color-success)_18%,var(--border-primary))]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Valuation Call
          </p>
          <div className="mt-4">
            <p className="text-3xl font-semibold text-[var(--text-primary)]">
              {dcf?.recommendation ?? "Awaiting model"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {dcf?.upside !== undefined
                ? `The model currently points to ${formatPercent(dcf.upside, true)} relative to the latest market price.`
                : "DCF output is not available yet for this symbol."}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                Fair Value
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                {dcf?.fairValue !== undefined ? `$${dcf.fairValue.toFixed(2)}` : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                WACC
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                {formatCompactPercent(dcf?.wacc)}
              </p>
            </div>
          </div>
        </WarmCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <FundamentalsPanel symbol={symbol} />
        <NewsPanel symbol={symbol} />
      </div>
    </div>
  );
}
