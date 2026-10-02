"use client";

import { useId, useMemo, useState } from "react";
import { Building2, Home, Landmark, RotateCcw } from "lucide-react";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { useRentVsBuy } from "@/hooks/useRentVsBuy";
import { useLocalStoragePersistenceStatus } from "@/hooks/useLocalStorageString";
import { RENT_VS_BUY_STORAGE_KEY } from "@/lib/rentVsBuy/persistence";
import type { RentVsBuyInput, RentVsBuyResult } from "@/lib/rentVsBuy/types";
import { formatCompactCurrency } from "@/lib/retirement/format";
import { fitLabel } from "@/app/travel-deals/fareGauge";
import { netWorthChart } from "./netWorthChart";
import "./rent-vs-buy.css";

const ROUTE = "/fintech-tools/rent-vs-buy";

function formatCurrency(value: number, fractionDigits = 0) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function formatSignedCurrency(value: number) {
  const sign = value < 0 ? "-" : "+";
  return `${sign}${formatCurrency(Math.abs(value))}`;
}

const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? "" : "s"}`;

function formatBreakEven(result: RentVsBuyResult) {
  if (result.breakEvenYears === null) {
    return `Buying is not ahead at the end of ${plural(result.horizonYears, "year")}`;
  }
  const years = Math.floor(result.breakEvenYears);
  const months = Math.round((result.breakEvenYears - years) * 12);
  // "after about 1 year and 6 months" rather than "around year 1, month 6",
  // which read as the second year to anyone counting from year 1.
  if (years === 0) return `Buying pulls ahead after about ${plural(months, "month")}`;
  if (months === 0) return `Buying pulls ahead after about ${plural(years, "year")}`;
  return `Buying pulls ahead after about ${plural(years, "year")} and ${plural(months, "month")}`;
}

/** A short form for the hero readout: "4y 6m" or "Not within 7 years". */
function formatBreakEvenShort(result: RentVsBuyResult) {
  if (result.breakEvenYears === null) {
    return `Not within ${plural(result.horizonYears, "year")}`;
  }
  const years = Math.floor(result.breakEvenYears);
  const months = Math.round((result.breakEvenYears - years) * 12);
  if (years === 0) return `${months}m`;
  if (months === 0) return `${years}y`;
  return `${years}y ${months}m`;
}

const VERDICT_TITLE: Record<RentVsBuyResult["verdict"], string> = {
  buying: "Buying comes out ahead",
  renting: "Renting comes out ahead",
  close: "It's close to a wash",
};

// ── Net-worth signature ─────────────────────────────────────────────────────
function NetWorthChartSignature({ result }: { result: RentVsBuyResult }) {
  const chart = useMemo(() => netWorthChart(result), [result]);

  // Nudge the two end-of-line labels apart when the lines finish close
  // together, so "Buyer" and "Renter" don't print on top of each other. The
  // threshold and offset are sized for the larger mobile type (the same
  // viewBox coordinates render both sizes), so they're generous at desktop.
  const endGap = Math.abs(chart.buyerEndY - chart.renterEndY);
  const nudge = endGap < 40 ? 16 : 0;
  const buyerLabelY = chart.buyerEndY <= chart.renterEndY ? chart.buyerEndY - nudge : chart.buyerEndY + nudge;
  const renterLabelY = chart.renterEndY <= chart.buyerEndY ? chart.renterEndY - nudge : chart.renterEndY + nudge;

  // The label prints twice, fitted inside the frame for each type size
  // (mono glyphs advance about 0.62em; 15 units wide, 30 on phones), and the
  // stylesheet shows the one that matches the screen.
  const breakEvenText = `Break-even ${formatBreakEvenShort(result)}`;
  const fitBreakEven = (unit: number) =>
    chart.breakEvenX === null ? 0 : fitLabel(chart.breakEvenX, breakEvenText.length * unit * 0.62 + 8, 0, chart.width);

  const description = `Net worth by year, buyer versus renter. ${formatBreakEven(result)}. At year ${result.horizonYears}, ${
    result.netWorthDeltaAtHorizon >= 0 ? "buying" : "renting"
  } leads by ${formatCurrency(Math.abs(result.netWorthDeltaAtHorizon))}.`;

  return (
    <>
      <svg
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        role="img"
        aria-label={description}
        className="c97-rvb-signature"
      >
        {chart.yTicks.map((tick) => (
          <g key={tick.value}>
            <line x1={0} x2={chart.width} y1={tick.y} y2={tick.y} stroke="var(--c97-rule)" strokeWidth={1} />
            <text x={4} y={tick.y - 4} className="c97-rvb-axis">
              {formatCompactCurrency(tick.value)}
            </text>
          </g>
        ))}

        {chart.zeroY !== null ? (
          <line x1={0} x2={chart.width} y1={chart.zeroY} y2={chart.zeroY} stroke="var(--c97-ink-2)" strokeWidth={1.5} />
        ) : null}

        {chart.breakEvenX !== null ? (
          <>
            <line
              x1={chart.breakEvenX}
              x2={chart.breakEvenX}
              y1={0}
              y2={chart.height - 20}
              stroke="var(--c97-ink)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <text x={fitBreakEven(15)} y={32} textAnchor="middle" className="c97-rvb-label c97-rvb-wide">
              {breakEvenText}
            </text>
            <text x={fitBreakEven(30)} y={32} textAnchor="middle" className="c97-rvb-label c97-rvb-narrow">
              {breakEvenText}
            </text>
          </>
        ) : null}

        <polyline
          points={chart.renterLine}
          fill="none"
          stroke="var(--c97-chart-3)"
          strokeWidth={2.5}
          strokeDasharray="7 5"
          strokeLinejoin="round"
        />
        <polyline points={chart.buyerLine} fill="none" stroke="var(--c97-chart-1)" strokeWidth={2.5} strokeLinejoin="round" />

        <text x={chart.buyerEndX - 20} y={buyerLabelY} textAnchor="end" className="c97-rvb-label c97-rvb-end">
          Buyer
        </text>
        <text x={chart.renterEndX - 20} y={renterLabelY} textAnchor="end" className="c97-rvb-label c97-rvb-end">
          Renter
        </text>

        <text x={chart.xForYear(0)} y={chart.height - 6} className="c97-rvb-axis">
          Today
        </text>
        <text x={chart.xForYear(result.horizonYears)} y={chart.height - 6} textAnchor="end" className="c97-rvb-axis">
          {`Year ${result.horizonYears}`}
        </text>
      </svg>
      <div style={{ display: "flex", gap: "var(--c97-sp-3)", marginTop: "var(--c97-sp-2)", flexWrap: "wrap" }}>
        <span className="c97-rvb-swatch">
          <span className="c97-rvb-swatch-mark" data-series="buyer" aria-hidden="true" />
          <span className="c97-kicker" style={{ color: "var(--c97-ink)" }}>
            Buyer
          </span>
        </span>
        <span className="c97-rvb-swatch">
          <span className="c97-rvb-swatch-mark" data-series="renter" aria-hidden="true" />
          <span className="c97-kicker" style={{ color: "var(--c97-ink)" }}>
            Renter
          </span>
        </span>
      </div>
    </>
  );
}

// ── Field primitives ───────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  suffix?: string;
  prefix?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  hint?: string;
}

function NumberField({
  label,
  suffix,
  prefix,
  value,
  min = 0,
  max,
  step = 1,
  onChange,
  disabled = false,
  hint,
}: FieldProps) {
  const id = useId();
  // The typed text stays local until it parses, so clearing a field to retype it
  // no longer snaps to the stored minimum on the first keystroke.
  const [draft, setDraft] = useState<string | null>(null);
  // The store clamps an out-of-range value, and the field snaps to it on blur,
  // so say so while the typed value is still showing.
  const typed = draft !== null && draft.trim() !== "" ? Number(draft) : NaN;
  const outOfRange = Number.isFinite(typed) && (typed < min || (max !== undefined && typed > max));
  const hintId = `${id}-hint`;
  const rangeId = `${id}-range`;
  const describedBy = [hint ? hintId : null, outOfRange ? rangeId : null].filter(Boolean).join(" ") || undefined;
  return (
    <label htmlFor={id} className="block">
      <span className="c97-kicker" style={{ display: "block", marginBottom: "var(--c97-sp-1)" }}>
        {label}
      </span>
      <span
        className="c97-field"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--c97-sp-1)",
          ...(disabled ? { background: "none", borderBottom: "1px dashed var(--c97-ink-2)" } : null),
        }}
      >
        {prefix ? (
          <span aria-hidden="true" style={{ color: "var(--c97-ink-2)", fontSize: "var(--c97-fs-small)" }}>
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          aria-label={label}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={draft ?? String(value)}
          disabled={disabled}
          aria-invalid={outOfRange || undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (next.trim() !== "" && Number.isFinite(Number(next))) onChange(Number(next));
          }}
          onBlur={() => setDraft(null)}
          className="c97-mono"
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            background: "transparent",
            padding: 0,
            color: "var(--c97-ink)",
            fontSize: "var(--c97-fs-body)",
          }}
        />
        {suffix ? (
          <span aria-hidden="true" style={{ color: "var(--c97-ink-2)", fontSize: "var(--c97-fs-small)" }}>
            {suffix}
          </span>
        ) : null}
      </span>
      {hint ? (
        <span id={hintId} className="c97-meta" style={{ display: "block", marginTop: "var(--c97-sp-1)" }}>
          {hint}
        </span>
      ) : null}
      {outOfRange ? (
        <span id={rangeId} className="c97-meta" style={{ display: "block", marginTop: "var(--c97-sp-1)" }}>
          {max !== undefined ? `Between ${min} and ${max}` : `At least ${min}`}
        </span>
      ) : null}
    </label>
  );
}

export function RentVsBuyClient() {
  const { input, result, setField, reset } = useRentVsBuy();
  const persistenceStatus = useLocalStoragePersistenceStatus(RENT_VS_BUY_STORAGE_KEY);
  // Each NumberField keeps a local draft while typing, so Reset remounts the
  // fields to drop any draft still showing a value the store no longer holds.
  const [resetKey, setResetKey] = useState(0);

  const num = <K extends keyof RentVsBuyInput>(key: K) =>
    (value: number) => setField(key, value as RentVsBuyInput[K]);

  const lead = PROJECT_PRESS[ROUTE].lead;
  const standfirst =
    "Most rent-vs-buy comparisons stop at the monthly payment, but the honest question is what you are worth years from now on each path. This tool runs a month-by-month model that credits the renter the money a buyer sinks into a down payment and closing costs, invests every month's cost difference on whichever side spends less, and then finds the year buying finally pulls ahead.";

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="Rent vs. Buy Calculator"
        standfirst={standfirst}
        readouts={[
          {
            label: "Break-even",
            value: formatBreakEvenShort(result),
            detail:
              result.breakEvenYears === null
                ? undefined
                : `Staying ${plural(result.horizonYears, "year")}`,
          },
          {
            label: "Net worth gap",
            value: formatSignedCurrency(result.netWorthDeltaAtHorizon),
            detail: `Buyer minus renter at year ${result.horizonYears}`,
          },
          {
            label: "Cash to buy",
            value: formatCurrency(result.upfrontCash),
            detail: "Down payment + closing costs",
          },
        ]}
      >
        <div data-c97-surface="paper" className="c97-offset" style={{ padding: "var(--c97-sp-3)" }}>
          <p role="status" aria-live="polite" className="c97-serif c97-h3" style={{ margin: 0 }}>
            <span>{VERDICT_TITLE[result.verdict]}</span>
            {". "}
            <span className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
              {formatBreakEven(result)}.
            </span>
          </p>

          <div style={{ marginTop: "var(--c97-sp-3)" }}>
            <NetWorthChartSignature result={result} />
          </div>

          <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)", marginTop: "var(--c97-sp-3)" }}>
            Educational only, not financial or tax advice.
          </p>
          <p style={{ marginTop: "var(--c97-sp-2)" }}>
            <span className="c97-kicker">Assumptions &amp; limits</span>
            <span
              className="c97-prose"
              style={{ display: "block", fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)", marginTop: "var(--c97-sp-1)" }}
            >
              Figures are nominal dollars. {result.assumptions.taxNote} Tax figures are for tax year{" "}
              {result.assumptions.taxYear}, were read from the IRS and the text of the law on{" "}
              {result.assumptions.asOf}, and have not had an independent review. The default mortgage rate of{" "}
              {result.assumptions.defaultMortgageRatePercent}% is the Freddie Mac 30 year fixed average as of{" "}
              {result.assumptions.mortgageRateAsOf}.
            </span>
          </p>
        </div>
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--c97-sp-3)", flexWrap: "wrap" }}>
            <p className="c97-kicker">Your numbers</p>
            <button
              type="button"
              onClick={() => {
                reset();
                setResetKey((current) => current + 1);
              }}
              className="c97-btn-ghost"
            >
              <RotateCcw size={14} aria-hidden="true" style={{ marginRight: "var(--c97-sp-1)" }} />
              Reset
            </button>
          </div>

          <div key={resetKey} style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-5)", marginTop: "var(--c97-sp-4)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--c97-sp-2)" }}>
                <Home size={18} aria-hidden="true" />
                <h2 className="c97-poster-sm">The home you&apos;d buy</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2" style={{ marginTop: "var(--c97-sp-3)" }}>
                <NumberField label="Home price" prefix="$" step={5000} value={input.homePrice} onChange={num("homePrice")} />
                <NumberField label="Down payment" suffix="%" step={1} max={100} value={input.downPaymentPercent} onChange={num("downPaymentPercent")} />
                <NumberField label="Mortgage rate" suffix="%" step={0.05} value={input.mortgageRatePercent} onChange={num("mortgageRatePercent")} />
                <NumberField label="Loan term" suffix="yrs" step={1} value={input.loanTermYears} onChange={num("loanTermYears")} />
                <NumberField label="Property tax" suffix="%/yr" step={0.05} value={input.propertyTaxPercent} onChange={num("propertyTaxPercent")} />
                <NumberField label="Home insurance" prefix="$" suffix="/yr" step={100} value={input.homeInsuranceAnnual} onChange={num("homeInsuranceAnnual")} />
                <NumberField label="Maintenance" suffix="%/yr" step={0.1} value={input.maintenancePercent} onChange={num("maintenancePercent")} />
                <NumberField label="HOA dues" prefix="$" suffix="/mo" step={25} value={input.hoaMonthly} onChange={num("hoaMonthly")} />
                <NumberField label="Closing costs" suffix="%" step={0.5} value={input.closingCostPercent} onChange={num("closingCostPercent")} />
                <NumberField label="Selling costs" suffix="%" step={0.5} value={input.sellingCostPercent} onChange={num("sellingCostPercent")} />
                <NumberField label="Home appreciation" suffix="%/yr" step={0.25} min={-10} value={input.homeAppreciationPercent} onChange={num("homeAppreciationPercent")} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--c97-sp-2)" }}>
                <Building2 size={18} aria-hidden="true" />
                <h2 className="c97-poster-sm">The rent you&apos;d pay</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2" style={{ marginTop: "var(--c97-sp-3)" }}>
                <NumberField label="Monthly rent" prefix="$" step={50} value={input.monthlyRent} onChange={num("monthlyRent")} />
                <NumberField label="Rent growth" suffix="%/yr" step={0.25} min={-10} value={input.rentGrowthPercent} onChange={num("rentGrowthPercent")} />
                <NumberField label="Renter's insurance" prefix="$" suffix="/mo" step={5} value={input.rentersInsuranceMonthly} onChange={num("rentersInsuranceMonthly")} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--c97-sp-2)" }}>
                <Landmark size={18} aria-hidden="true" />
                <h2 className="c97-poster-sm">Assumptions</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2" style={{ marginTop: "var(--c97-sp-3)" }}>
                <NumberField label="Investment return" suffix="%/yr" step={0.25} min={-10} value={input.investmentReturnPercent} onChange={num("investmentReturnPercent")} />
                <NumberField label="Inflation" suffix="%/yr" step={0.25} value={input.generalInflationPercent} onChange={num("generalInflationPercent")} />
                <NumberField
                  label="Marginal tax rate"
                  suffix="%"
                  step={1}
                  max={60}
                  value={input.marginalTaxRatePercent}
                  onChange={num("marginalTaxRatePercent")}
                  disabled={!input.itemizes}
                  hint="Used only when you itemize deductions."
                />
                <NumberField label="Years staying" suffix="yrs" step={1} min={1} max={40} value={input.yearsStaying} onChange={num("yearsStaying")} />
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--c97-sp-2)",
                    minHeight: "44px",
                  }}
                >
                  <span className="c97-kicker">Itemize deductions</span>
                  <input
                    type="checkbox"
                    className="c97-check"
                    checked={input.itemizes}
                    onChange={(event) => setField("itemizes", event.target.checked)}
                  />
                </label>
              </div>
            </div>
          </div>

          {persistenceStatus === "memory-only" ? (
            <p role="status" className="c97-panel c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)", marginTop: "var(--c97-sp-4)" }}>
              Browser storage is unavailable, so changes last only while this tab is open.
            </p>
          ) : (
            <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)", marginTop: "var(--c97-sp-4)" }}>
              Saved in your browser. No account, no server.
            </p>
          )}
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="c97-shell">
          <h2 className="c97-poster-sm">What the numbers say</h2>
          <table className="c97-table" style={{ marginTop: "var(--c97-sp-3)" }}>
            <thead>
              <tr>
                <th>Figure</th>
                <th data-align="end">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Buy, monthly (year 1)</td>
                <td data-align="end" className="c97-mono">
                  {formatCurrency(result.monthlyBuyingCostYear1)}
                </td>
              </tr>
              <tr>
                <td>Rent, monthly (year 1)</td>
                <td data-align="end" className="c97-mono">
                  {formatCurrency(result.monthlyRentingCostYear1)}
                </td>
              </tr>
              <tr>
                <td>Cash to buy</td>
                <td data-align="end" className="c97-mono">
                  {formatCurrency(result.upfrontCash)}
                </td>
              </tr>
              <tr>
                <td>Monthly P&amp;I</td>
                <td data-align="end" className="c97-mono">
                  {formatCurrency(result.monthlyPaymentYear1)}
                </td>
              </tr>
              <tr>
                <td>Buyer net worth, year {result.horizonYears}</td>
                <td data-align="end" className="c97-mono">
                  {formatCurrency(result.buyerNetWorthAtHorizon)}
                </td>
              </tr>
              <tr>
                <td>Renter net worth, year {result.horizonYears}</td>
                <td data-align="end" className="c97-mono">
                  {formatCurrency(result.renterNetWorthAtHorizon)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
