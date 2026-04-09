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

// ─── Score helpers ─────────────────────────────────────────────────────────

/** Normalize two values between 0–100. Returns [scoreA, scoreB]. */
function normalizeTwo(
  a: number | null | undefined,
  b: number | null | undefined,
  higherIsBetter: boolean,
): [number, number] {
  const numA = a ?? null;
  const numB = b ?? null;
  if (numA === null && numB === null) return [50, 50];
  if (numA === null) return [20, 80];
  if (numB === null) return [80, 20];

  const va = higherIsBetter ? numA : -numA;
  const vb = higherIsBetter ? numB : -numB;
  if (va === vb) return [50, 50];

  const min = Math.min(va, vb);
  const max = Math.max(va, vb);
  const range = max - min;
  if (range === 0) return [50, 50];

  return [((va - min) / range) * 100, ((vb - min) / range) * 100];
}

/**
 * Composite score across multiple metric pairs.
 * Each pair is normalized independently, then scores are averaged.
 */
function compositeScore(
  valuesA: (number | null | undefined)[],
  valuesB: (number | null | undefined)[],
  higherIsBetter: boolean,
): [number, number] {
  const sumA: number[] = [];
  const sumB: number[] = [];
  for (let i = 0; i < valuesA.length; i++) {
    const [sa, sb] = normalizeTwo(valuesA[i], valuesB[i], higherIsBetter);
    sumA.push(sa);
    sumB.push(sb);
  }
  if (sumA.length === 0) return [50, 50];
  const avgA = sumA.reduce((s, v) => s + v, 0) / sumA.length;
  const avgB = sumB.reduce((s, v) => s + v, 0) / sumB.length;
  return [avgA, avgB];
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
        <div className="w-[320px] h-[320px] rounded-full bg-[var(--neutral-200)]" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-[var(--home-rule)] p-5 space-y-3">
          <div className="h-4 w-32 rounded bg-[var(--neutral-200)]" />
          {[1, 2, 3, 4].map((j) => (
            <div key={j} className="h-8 rounded bg-[var(--neutral-200)]" />
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

  // ── Radar scores ───────────────────────────────────────────────────────
  const radarData = useMemo((): RadarDimension[] => {
    // 1. Valuation (lower P/E, P/S, P/B = better)
    const [valA, valB] = compositeScore(
      [fundA?.ttmPe, fundA?.psRatio, fundA?.pbRatio],
      [fundB?.ttmPe, fundB?.psRatio, fundB?.pbRatio],
      false, // lower is better
    );

    // 2. Growth (higher avg YoY growth = better)
    const [growA, growB] = normalizeTwo(avgGrowth(growthRawA), avgGrowth(growthRawB), true);

    // 3. Profitability (higher ROE, ROA, net margin = better)
    const [profScoreA, profScoreB] = compositeScore(
      [profA?.roe, profA?.roa, marginsA?.netMargin],
      [profB?.roe, profB?.roa, marginsB?.netMargin],
      true,
    );

    // 4. Safety (lower beta = higher score)
    const [safeA, safeB] = normalizeTwo(betaA?.beta5y, betaB?.beta5y, false);

    // 5. DCF Upside (higher = better)
    const [dcfScoreA, dcfScoreB] = normalizeTwo(dcfA?.upside, dcfB?.upside, true);

    return [
      { dimension: "Valuation",    scoreA: valA,       scoreB: valB },
      { dimension: "Growth",       scoreA: growA,      scoreB: growB },
      { dimension: "Profitability",scoreA: profScoreA, scoreB: profScoreB },
      { dimension: "Safety",       scoreA: safeA,      scoreB: safeB },
      { dimension: "DCF Upside",   scoreA: dcfScoreA,  scoreB: dcfScoreB },
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
    { label: "DCF Fair Value",   valueA: fmt(dcfA?.fairValue, "currency"),  valueB: fmt(dcfB?.fairValue, "currency"),  higherIsBetter: true },
    { label: "Current Price",    valueA: fmt(dcfA?.currentPrice, "currency"), valueB: fmt(dcfB?.currentPrice, "currency"), higherIsBetter: false },
    { label: "DCF Upside %",     valueA: fmt(dcfA?.upside, "percent"),      valueB: fmt(dcfB?.upside, "percent"),      higherIsBetter: true },
    { label: "WACC",             valueA: fmt(dcfA?.wacc, "percent"),        valueB: fmt(dcfB?.wacc, "percent"),        higherIsBetter: false },
    { label: "Beta (5Y)",        valueA: fmt(betaA?.beta5y),                valueB: fmt(betaB?.beta5y),                higherIsBetter: false },
  ];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, white)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-end">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
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

          <div className="flex min-h-[46px] items-center justify-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-4 text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
            vs
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
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
          <div className="rounded-[28px] border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, white)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
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
