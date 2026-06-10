"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useStockData } from "@/hooks/useStockData";
import { getClientInvestmentsIndex } from "@/lib/investmentsClientData";
import { ComparisonRadarChart, type RadarDimension } from "./ComparisonRadarChart";
import { ComparisonMetricTable, type MetricRow } from "./ComparisonMetricTable";
import type {
  Fundamentals,
  Profitability,
  MarginsData,
  BetaData,
  DcfData,
  InvestmentsIndex,
} from "@/types/investment";

const FALLBACK_SYMBOLS = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "NVDA",
  "META",
  "AVGO",
  "ORCL",
  "CRM",
  "ADBE",
  "BRK-B",
  "JPM",
  "V",
  "MA",
  "BAC",
  "GS",
  "UNH",
  "JNJ",
  "LLY",
  "PFE",
  "ABBV",
  "TSLA",
  "WMT",
  "PG",
  "COST",
  "KO",
  "HD",
  "MCD",
  "NKE",
  "XOM",
  "CVX",
  "CAT",
  "UNP",
  "GE",
  "BA",
  "NFLX",
  "DIS",
  "NEE",
  "AMD",
  "INTC",
];

function useIndexSymbols(): string[] {
  const [symbols, setSymbols] = useState<string[]>(FALLBACK_SYMBOLS);
  useEffect(() => {
    getClientInvestmentsIndex()
      .then((data: InvestmentsIndex) => {
        if (data.symbols?.length > 0) setSymbols(data.symbols);
      })
      .catch(() => {});
  }, []);
  return symbols;
}

// ─── Formatting helpers ────────────────────────────────────────────────────

function fmt(v: number | null | undefined, style: "decimal" | "percent" | "currency" = "decimal"): string | null {
  if (v === null || v === undefined || isNaN(v)) return null;
  if (style === "percent") return `${v.toFixed(2)}%`;
  if (style === "currency")
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(v);
  return v.toFixed(2);
}

// ─── Absolute score benchmarks (0–100 against market norms) ───────────────
// Values are in the same units the API returns:
//   P/E, P/S, P/B  → raw ratio  (25 = 25×)
//   ROE/ROA/margin → percentage (25 = 25%)
//   Beta           → decimal    (1.2)
//   Growth/DCF     → percentage (20 = 20%)

function avg(scores: number[]): number {
  return scores.length === 0 ? 50 : scores.reduce((a, b) => a + b, 0) / scores.length;
}

function scoreValuation(
  pe: number | null | undefined,
  ps: number | null | undefined,
  pb: number | null | undefined,
): number {
  const scores: number[] = [];
  if (pe != null && isFinite(pe) && pe > 0) {
    scores.push(pe < 10 ? 95 : pe < 15 ? 82 : pe < 20 ? 68 : pe < 30 ? 52 : pe < 45 ? 35 : pe < 70 ? 20 : 8);
  }
  if (ps != null && isFinite(ps) && ps > 0) {
    scores.push(ps < 1 ? 95 : ps < 2 ? 80 : ps < 5 ? 62 : ps < 10 ? 42 : ps < 20 ? 22 : 8);
  }
  if (pb != null && isFinite(pb) && pb > 0) {
    scores.push(pb < 1 ? 95 : pb < 2 ? 82 : pb < 4 ? 65 : pb < 8 ? 45 : pb < 15 ? 25 : 8);
  }
  return avg(scores);
}

function scoreGrowth(growthRate: number | null): number {
  if (growthRate == null || !isFinite(growthRate)) return 50;
  // growthRate is in percentage units (e.g. 25 = 25%)
  return growthRate > 30 ? 95 : growthRate > 20 ? 82 : growthRate > 10 ? 67 : growthRate > 5 ? 52 : growthRate > 0 ? 36 : growthRate > -10 ? 20 : 8;
}

function scoreProfitability(
  roe: number | null | undefined,
  roa: number | null | undefined,
  netMargin: number | null | undefined,
): number {
  const scores: number[] = [];
  if (roe != null && isFinite(roe)) {
    scores.push(roe > 30 ? 95 : roe > 20 ? 80 : roe > 10 ? 65 : roe > 0 ? 42 : 10);
  }
  if (roa != null && isFinite(roa)) {
    scores.push(roa > 15 ? 95 : roa > 10 ? 80 : roa > 5 ? 65 : roa > 0 ? 42 : 10);
  }
  if (netMargin != null && isFinite(netMargin)) {
    scores.push(netMargin > 30 ? 95 : netMargin > 20 ? 80 : netMargin > 10 ? 62 : netMargin > 5 ? 44 : netMargin > 0 ? 26 : 8);
  }
  return avg(scores);
}

function scoreSafety(beta: number | null | undefined): number {
  if (beta == null || !isFinite(beta)) return 50;
  return beta < 0.3 ? 95 : beta < 0.6 ? 82 : beta < 0.8 ? 70 : beta < 1.0 ? 60 : beta < 1.2 ? 50 : beta < 1.5 ? 36 : beta < 2.0 ? 22 : 10;
}

function scoreDcfUpside(upside: number | null | undefined): number {
  if (upside == null || !isFinite(upside)) return 50;
  return upside > 50 ? 95 : upside > 30 ? 80 : upside > 15 ? 65 : upside > 5 ? 50 : upside > 0 ? 36 : upside > -15 ? 22 : 8;
}

// ─── Growth data helpers ───────────────────────────────────────────────────

interface GrowthRecord {
  metric?: string;
  yoyGrowth?: number;
  value?: number;
  [key: string]: unknown;
}

function avgGrowth(raw: unknown): number | null {
  if (!raw || typeof raw !== "object") return null;
  const values: number[] = [];
  if (Array.isArray(raw)) {
    for (const r of raw as GrowthRecord[]) {
      const g = r.yoyGrowth ?? r.value;
      if (g !== undefined && !isNaN(Number(g))) values.push(Number(g));
    }
  } else if (!("error" in (raw as object))) {
    for (const v of Object.values(raw as Record<string, unknown>)) {
      const g = Number(v);
      if (!isNaN(g)) values.push(g);
    }
  }
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function findGrowthMetric(raw: unknown, keywords: string[]): number | null {
  if (!Array.isArray(raw)) return null;
  const lower = keywords.map((k) => k.toLowerCase());
  for (const r of raw as GrowthRecord[]) {
    const name = String(r.metric ?? "").toLowerCase();
    if (lower.some((k) => name.includes(k))) {
      const g = r.yoyGrowth ?? r.value;
      if (g !== undefined && !isNaN(Number(g))) return Number(g);
    }
  }
  return null;
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-center">
        <div className="w-[320px] h-[320px] rounded-full bg-[var(--home-stone)]" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-[var(--home-rule)] p-5 space-y-3">
          <div className="h-4 w-32 rounded bg-[var(--home-stone)]" />
          {[1, 2, 3, 4].map((j) => (
            <div key={j} className="h-8 rounded bg-[var(--home-stone)]" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function ComparisonTab() {
  const SYMBOLS = useIndexSymbols();
  const [symbolA, setSymbolA] = React.useState("AAPL");
  const [symbolB, setSymbolB] = React.useState("MSFT");

  // ── Fetch data for stock A ──────────────────────────────────────────────
  const { data: fundA, isLoading: l1 } = useStockData<Fundamentals>(symbolA, "fundamentals");
  const { data: growthRawA, isLoading: l2 } = useStockData(symbolA, "growth");
  const { data: profA, isLoading: l3 } = useStockData<Profitability>(symbolA, "profitability");
  const { data: marginsRawA, isLoading: l4 } = useStockData<MarginsData>(symbolA, "margins");
  const { data: betaA, isLoading: l5 } = useStockData<BetaData>(symbolA, "beta");
  const { data: dcfA, isLoading: l6 } = useStockData<DcfData>(symbolA, "dcf");

  // ── Fetch data for stock B ──────────────────────────────────────────────
  const { data: fundB, isLoading: l7 } = useStockData<Fundamentals>(symbolB, "fundamentals");
  const { data: growthRawB, isLoading: l8 } = useStockData(symbolB, "growth");
  const { data: profB, isLoading: l9 } = useStockData<Profitability>(symbolB, "profitability");
  const { data: marginsRawB, isLoading: l10 } = useStockData<MarginsData>(symbolB, "margins");
  const { data: betaB, isLoading: l11 } = useStockData<BetaData>(symbolB, "beta");
  const { data: dcfB, isLoading: l12 } = useStockData<DcfData>(symbolB, "dcf");

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11 || l12;

  // ── Derived: latest margins ─────────────────────────────────────────────
  const marginsA = Array.isArray(marginsRawA) ? marginsRawA[marginsRawA.length - 1] : undefined;
  const marginsB = Array.isArray(marginsRawB) ? marginsRawB[marginsRawB.length - 1] : undefined;

  // ── Radar scores (absolute benchmarks — independent of comparison stock) ──
  const radarData = useMemo((): RadarDimension[] => {
    return [
      {
        dimension: "Valuation",
        scoreA: scoreValuation(fundA?.ttmPe, fundA?.psRatio, fundA?.pbRatio),
        scoreB: scoreValuation(fundB?.ttmPe, fundB?.psRatio, fundB?.pbRatio),
      },
      {
        dimension: "Growth",
        scoreA: scoreGrowth(avgGrowth(growthRawA)),
        scoreB: scoreGrowth(avgGrowth(growthRawB)),
      },
      {
        dimension: "Profitability",
        scoreA: scoreProfitability(profA?.roe, profA?.roa, marginsA?.netMargin),
        scoreB: scoreProfitability(profB?.roe, profB?.roa, marginsB?.netMargin),
      },
      {
        dimension: "Safety",
        scoreA: scoreSafety(betaA?.beta5y),
        scoreB: scoreSafety(betaB?.beta5y),
      },
      {
        dimension: "DCF Upside",
        scoreA: scoreDcfUpside(dcfA?.upside),
        scoreB: scoreDcfUpside(dcfB?.upside),
      },
    ];
  }, [fundA, fundB, growthRawA, growthRawB, profA, profB, marginsA, marginsB, betaA, betaB, dcfA, dcfB]);

  // ── Metric table rows ──────────────────────────────────────────────────
  const valuationRows: MetricRow[] = [
    { label: "P/E (TTM)",  valueA: fmt(fundA?.ttmPe),   valueB: fmt(fundB?.ttmPe),   higherIsBetter: false },
    { label: "P/S Ratio",  valueA: fmt(fundA?.psRatio),  valueB: fmt(fundB?.psRatio),  higherIsBetter: false },
    { label: "P/B Ratio",  valueA: fmt(fundA?.pbRatio),  valueB: fmt(fundB?.pbRatio),  higherIsBetter: false },
    { label: "PEG Ratio",  valueA: fmt(fundA?.pegRatio), valueB: fmt(fundB?.pegRatio), higherIsBetter: false },
  ];

  const growthRows: MetricRow[] = [
    {
      label: "Revenue YoY",
      valueA: fmt(findGrowthMetric(growthRawA, ["revenue", "total revenue"]), "percent"),
      valueB: fmt(findGrowthMetric(growthRawB, ["revenue", "total revenue"]), "percent"),
      higherIsBetter: true,
    },
    {
      label: "Operating Income YoY",
      valueA: fmt(findGrowthMetric(growthRawA, ["operating income", "operating"]), "percent"),
      valueB: fmt(findGrowthMetric(growthRawB, ["operating income", "operating"]), "percent"),
      higherIsBetter: true,
    },
    {
      label: "Net Income YoY",
      valueA: fmt(findGrowthMetric(growthRawA, ["net income", "net"]), "percent"),
      valueB: fmt(findGrowthMetric(growthRawB, ["net income", "net"]), "percent"),
      higherIsBetter: true,
    },
    {
      label: "FCF YoY",
      valueA: fmt(findGrowthMetric(growthRawA, ["free cash flow", "fcf"]), "percent"),
      valueB: fmt(findGrowthMetric(growthRawB, ["free cash flow", "fcf"]), "percent"),
      higherIsBetter: true,
    },
    {
      label: "EPS YoY",
      valueA: fmt(findGrowthMetric(growthRawA, ["eps", "earnings per share"]), "percent"),
      valueB: fmt(findGrowthMetric(growthRawB, ["eps", "earnings per share"]), "percent"),
      higherIsBetter: true,
    },
  ];

  const profitabilityRows: MetricRow[] = [
    { label: "Gross Margin",  valueA: fmt(marginsA?.grossMargin, "percent"),  valueB: fmt(marginsB?.grossMargin, "percent"),  higherIsBetter: true },
    { label: "Net Margin",    valueA: fmt(marginsA?.netMargin, "percent"),    valueB: fmt(marginsB?.netMargin, "percent"),    higherIsBetter: true },
    { label: "ROE",           valueA: fmt(profA?.roe, "percent"),             valueB: fmt(profB?.roe, "percent"),             higherIsBetter: true },
    { label: "ROA",           valueA: fmt(profA?.roa, "percent"),             valueB: fmt(profB?.roa, "percent"),             higherIsBetter: true },
    { label: "ROIC",          valueA: fmt(profA?.roic, "percent"),            valueB: fmt(profB?.roic, "percent"),            higherIsBetter: true },
  ];

  const dcfRows: MetricRow[] = [
    // Absolute per-share prices aren't comparable across two different
    // companies, so neither side gets a "better" flag.
    { label: "DCF Fair Value",   valueA: fmt(dcfA?.fairValue, "currency"),  valueB: fmt(dcfB?.fairValue, "currency"),  higherIsBetter: null },
    { label: "Current Price",    valueA: fmt(dcfA?.currentPrice, "currency"), valueB: fmt(dcfB?.currentPrice, "currency"), higherIsBetter: null },
    { label: "DCF Upside %",     valueA: fmt(dcfA?.upside, "percent"),      valueB: fmt(dcfB?.upside, "percent"),      higherIsBetter: true },
    { label: "WACC",             valueA: fmt(dcfA?.wacc, "percent"),        valueB: fmt(dcfB?.wacc, "percent"),        higherIsBetter: false },
    { label: "Beta (5Y)",        valueA: fmt(betaA?.beta5y),                valueB: fmt(betaB?.beta5y),                higherIsBetter: false },
  ];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[var(--home-rule)] bg-[var(--home-paper-raised)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-end">
          <div className="flex flex-col gap-2">
            <label className="text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-soft)]">
              Stock A
            </label>
            <select
              value={symbolA}
              onChange={(e) => setSymbolA(e.target.value)}
              className="min-h-[46px] rounded-2xl border border-[var(--home-haze)] bg-[var(--home-paper)] px-3 py-2 text-sm font-semibold text-[var(--home-haze)] focus:outline-none focus:ring-2 focus:ring-[var(--home-haze)]"
              aria-label="Select first stock to compare"
            >
              {SYMBOLS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex min-h-[46px] items-center justify-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">
            vs
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-soft)]">
              Stock B
            </label>
            <select
              value={symbolB}
              onChange={(e) => setSymbolB(e.target.value)}
              className="min-h-[46px] rounded-2xl border border-[var(--color-warning)] bg-[var(--home-paper)] px-3 py-2 text-sm font-semibold text-[var(--color-warning)] focus:outline-none focus:ring-2 focus:ring-[var(--color-warning)]"
              aria-label="Select second stock to compare"
            >
              {SYMBOLS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--home-ink-muted)]">
          Compare valuation, growth, profitability, risk, and DCF upside using the same curated data snapshot for both companies.
        </p>
      </div>

      {isLoading ? (
        <Skeleton />
      ) : (
        <>
          <div className="rounded-[28px] border border-[var(--home-rule)] bg-[var(--home-paper-raised)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <ComparisonRadarChart
              data={radarData}
              symbolA={symbolA}
              symbolB={symbolB}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <ComparisonMetricTable
              title="Valuation"
              rows={valuationRows}
              symbolA={symbolA}
              symbolB={symbolB}
            />
            <ComparisonMetricTable
              title="Growth (YoY)"
              rows={growthRows}
              symbolA={symbolA}
              symbolB={symbolB}
            />
            <ComparisonMetricTable
              title="Profitability"
              rows={profitabilityRows}
              symbolA={symbolA}
              symbolB={symbolB}
            />
            <ComparisonMetricTable
              title="DCF &amp; Risk"
              rows={dcfRows}
              symbolA={symbolA}
              symbolB={symbolB}
            />
          </div>
        </>
      )}
    </div>
  );
}
