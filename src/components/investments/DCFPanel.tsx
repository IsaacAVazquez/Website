"use client";

import React, { useState } from "react";
import { TerminalPanel } from "./TerminalPanel";
import { useStockData } from "@/hooks/useStockData";
import { IconInfoCircle, IconRefresh } from "@tabler/icons-react";
import type { DcfData } from "@/types/investment";
import { recomputeDcf } from "@/lib/investmentDcf";
import { ErrorState } from "./ErrorState";
import { MetricTooltip } from "./MetricTooltip";
import styles from "@/app/investments/investments.module.css";

interface Props { symbol: string }

function fmt(n: number | undefined, style: "currency" | "percent" | "decimal" = "decimal"): string {
  if (n === undefined || n === null || isNaN(n)) return "—";
  if (style === "currency")
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
  if (style === "percent") return `${n.toFixed(2)}%`;
  return n.toFixed(2);
}

function signedPercent(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(2)}%`;
}

function recommendationFor(upside: number): "Buy" | "Sell" | "Hold" {
  if (upside > 20) return "Buy";
  if (upside < -10) return "Sell";
  return "Hold";
}

type Assumptions = { g: number; r: number; tg: number };

const ASSUMPTION_EPSILON = 0.005;

export function DCFPanel({ symbol }: Props) {
  const { data, isLoading, error, isNotFetched, refetch } = useStockData<DcfData>(symbol, "dcf");

  // Interactive mode needs the raw model inputs (baseFcf + the assumptions
  // that produced the server's fairValue). Older/un-rebuilt snapshots may
  // lack them — fall back to the static read-only display in that case
  // rather than breaking.
  const baseline: Assumptions | null =
    data && !data.error && data.baseFcf !== undefined && data.wacc !== undefined &&
    data.nearTermGrowthPct !== undefined && data.terminalGrowthPct !== undefined
      ? { g: data.nearTermGrowthPct, r: data.wacc, tg: data.terminalGrowthPct }
      : null;
  const interactive = baseline !== null;

  const [assumptions, setAssumptions] = useState<Assumptions | null>(baseline);

  // Reseed when the symbol (or its baseline) changes — switching research
  // symbols shouldn't carry over the previous ticker's edited assumptions.
  // Adjusted directly during render (React's supported pattern for deriving
  // state from a changed key) rather than in an effect, matching the same
  // convention already used by RetirementFields' NumberField.
  const resetKey = `${symbol}:${baseline?.g ?? ""}:${baseline?.r ?? ""}:${baseline?.tg ?? ""}`;
  const [syncedResetKey, setSyncedResetKey] = useState(resetKey);
  if (resetKey !== syncedResetKey) {
    setSyncedResetKey(resetKey);
    setAssumptions(baseline);
  }

  const model =
    interactive && assumptions && data && data.baseFcf !== undefined
      ? recomputeDcf({
          baseFcf: data.baseFcf,
          nearTermGrowthPct: assumptions.g,
          discountRatePct: assumptions.r,
          terminalGrowthPct: assumptions.tg,
          years: data.years ?? 5,
        })
      : null;

  const currentPrice = data?.currentPrice;
  const liveUpside =
    model && currentPrice !== undefined && currentPrice > 0
      ? ((model.fairValue - currentPrice) / currentPrice) * 100
      : undefined;

  const isEdited =
    interactive &&
    assumptions !== null &&
    baseline !== null &&
    (Math.abs(assumptions.g - baseline.g) > ASSUMPTION_EPSILON ||
      Math.abs(assumptions.r - baseline.r) > ASSUMPTION_EPSILON ||
      Math.abs(assumptions.tg - baseline.tg) > ASSUMPTION_EPSILON);

  // Static fallbacks for symbols without raw assumption fields.
  const staticUpside = data?.upside ?? 0;
  const staticRec = data?.recommendation ?? "";

  const displayRec = interactive
    ? (liveUpside !== undefined ? recommendationFor(liveUpside) : "")
    : staticRec;
  const recLower = displayRec.toLowerCase();
  const isBuy = recLower.includes("buy");
  const isSell = recLower.includes("sell");

  function updateAssumption(key: keyof Assumptions, raw: string) {
    const parsed = parseFloat(raw);
    setAssumptions((prev) => (prev ? { ...prev, [key]: Number.isNaN(parsed) ? 0 : parsed } : prev));
  }

  function resetToBaseline() {
    setAssumptions(baseline);
  }

  return (
    <TerminalPanel padding="none">
      <div className={styles.statsCap}>
        <span>DCF fair value</span>
        <span className="text-2xs">
          {interactive ? "Interactive · educational" : "Educational estimate"}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <p className="text-xs text-[var(--home-ink-soft)] mb-4">
          {interactive
            ? "Five-year projection on the committed cash-flow snapshot, growth ramping toward a terminal rate, discounted back at the rate below. Change an assumption and the fair value recomputes in your browser."
            : "Discounted cash flow estimate, for informational purposes only."}
        </p>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 rounded-[var(--radius-sm)] bg-[var(--home-stone)] animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && (error || !data) && (
          <ErrorState message={error ?? "DCF data unavailable"} isNotFetched={isNotFetched} onRetry={refetch} />
        )}

        {!isLoading && data && !data.error && (
          <>
            {interactive && assumptions ? (
              <div className={styles.dcf}>
                <div className={styles.dcfInputs}>
                  <label className={styles.dcfCell}>
                    <span>FCF growth (yrs 1-{data.years ?? 5})</span>
                    <input
                      type="number"
                      step="0.5"
                      inputMode="decimal"
                      value={assumptions.g}
                      onChange={(e) => updateAssumption("g", e.target.value)}
                      aria-label="Near-term FCF growth rate, percent"
                    />
                  </label>
                  <label className={styles.dcfCell}>
                    <span className="flex items-center gap-0.5">
                      Discount rate<MetricTooltip term="WACC" />
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      inputMode="decimal"
                      value={assumptions.r}
                      onChange={(e) => updateAssumption("r", e.target.value)}
                      aria-label="Discount rate, percent"
                    />
                  </label>
                  <label className={styles.dcfCell}>
                    <span>Terminal growth</span>
                    <input
                      type="number"
                      step="0.5"
                      inputMode="decimal"
                      value={assumptions.tg}
                      onChange={(e) => updateAssumption("tg", e.target.value)}
                      aria-label="Terminal growth rate, percent"
                    />
                  </label>
                </div>

                {model ? (
                  <div className={styles.dcfOutputs}>
                    <div className={styles.dcfOutCell}>
                      <span className={styles.dcfOutLabel}>Fair value / share</span>
                      <span className={styles.dcfOutValue}>{fmt(model.fairValue, "currency")}</span>
                    </div>
                    <div className={styles.dcfOutCell}>
                      <span className={styles.dcfOutLabel}>Vs market price</span>
                      <span
                        className={`${styles.dcfOutValue} ${
                          (liveUpside ?? 0) >= 0 ? styles.statPos : styles.statNeg
                        }`}
                      >
                        {liveUpside !== undefined ? signedPercent(liveUpside) : "—"}
                      </span>
                    </div>
                    <div className={styles.dcfOutCell}>
                      <span className={styles.dcfOutLabel}>PV of projected FCF</span>
                      <span className={styles.dcfOutValue}>{fmt(model.pvProjected, "currency")}</span>
                    </div>
                    <div className={styles.dcfOutCell}>
                      <span className={styles.dcfOutLabel}>Terminal value share</span>
                      <span className={styles.dcfOutValue}>{model.terminalSharePct.toFixed(0)}%</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.dcfOutputs}>
                    <div className={styles.dcfOutCell}>
                      <span className={styles.dcfOutLabel}>Model</span>
                      <span className={styles.dcfOutValue}>—</span>
                    </div>
                  </div>
                )}

                {displayRec ? (
                  <div className="flex justify-center my-4">
                    <span
                      className={`px-4 py-1.5 rounded-[var(--radius-sm)] border text-sm font-semibold ${
                        isBuy
                          ? "border-[color-mix(in_srgb,var(--home-positive)_40%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-positive)_10%,transparent)] text-[var(--home-positive)]"
                          : isSell
                          ? "border-[color-mix(in_srgb,var(--home-negative)_40%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-negative)_10%,transparent)] text-[var(--home-negative)]"
                          : "border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink-muted)]"
                      }`}
                    >
                      {displayRec}
                    </span>
                  </div>
                ) : null}

                <div className={styles.dcfFoot}>
                  <p className={styles.dcfNote}>
                    {model
                      ? "Fair value updates instantly from your inputs. Educational model, not investment advice."
                      : "Discount rate has to sit above the terminal growth rate for the model to resolve."}
                  </p>
                  <button
                    type="button"
                    className={`invest-ghost ${styles.dcfReset}`}
                    onClick={resetToBaseline}
                    disabled={!isEdited}
                  >
                    <IconRefresh size={13} aria-hidden="true" />
                    {isEdited ? "Reset to baseline" : "At baseline"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Read-only fallback for snapshots without raw DCF assumptions yet. */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-[var(--home-ink-soft)] mb-1">Fair Value</p>
                    <p className="text-lg font-bold text-[var(--home-ink)] font-mono">
                      {fmt(data.fairValue, "currency")}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[var(--home-ink-soft)] mb-1">Current Price</p>
                    <p className="text-lg font-bold text-[var(--home-ink)] font-mono">
                      {fmt(data.currentPrice, "currency")}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[var(--home-ink-soft)] mb-1">Upside</p>
                    <p
                      className={`text-lg font-bold font-mono ${
                        staticUpside >= 0 ? "text-[var(--home-positive)]" : "text-[var(--home-negative)]"
                      }`}
                    >
                      {staticUpside >= 0 ? "+" : ""}
                      {fmt(staticUpside, "percent")}
                    </p>
                  </div>
                </div>

                {staticRec && (
                  <div className="flex justify-center mb-4">
                    <span
                      className={`px-4 py-1.5 rounded-[var(--radius-sm)] border text-sm font-semibold ${
                        isBuy
                          ? "border-[color-mix(in_srgb,var(--home-positive)_40%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-positive)_10%,transparent)] text-[var(--home-positive)]"
                          : isSell
                          ? "border-[color-mix(in_srgb,var(--home-negative)_40%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-negative)_10%,transparent)] text-[var(--home-negative)]"
                          : "border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink-muted)]"
                      }`}
                    >
                      {staticRec}
                    </span>
                  </div>
                )}

                <div className="space-y-1.5 text-sm border-t border-[var(--home-rule)] pt-3">
                  {data.wacc !== undefined && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-0.5 text-[var(--home-ink-muted)]">WACC<MetricTooltip term="WACC" /></span>
                      <span className="font-medium text-[var(--home-ink)] font-mono">{fmt(data.wacc, "percent")}</span>
                    </div>
                  )}
                  {data.growthEstimates &&
                    Object.entries(data.growthEstimates).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-[var(--home-ink-muted)] capitalize">{k.replace(/_/g, " ")}</span>
                        <span className="font-medium text-[var(--home-ink)] font-mono">{fmt(v, "percent")}</span>
                      </div>
                    ))}
                </div>
              </>
            )}

            {/* Disclaimer */}
            <div className="mt-4 flex items-start gap-1.5 p-2.5 rounded-[var(--radius-sm)] bg-[var(--home-paper-alt)]">
              <IconInfoCircle size={14} className="text-[var(--home-ink-soft)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--home-ink-soft)] leading-relaxed">
                DCF estimates are based on analyst projections and model assumptions. Not financial
                advice. Past performance is not indicative of future results.
              </p>
            </div>
          </>
        )}
      </div>
    </TerminalPanel>
  );
}
