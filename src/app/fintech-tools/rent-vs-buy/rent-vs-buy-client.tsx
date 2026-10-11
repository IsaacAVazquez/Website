"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRentVsBuy } from "@/hooks/useRentVsBuy";
import { useLocalStoragePersistenceStatus } from "@/hooks/useLocalStorageString";
import { RENT_VS_BUY_BOUNDS, RENT_VS_BUY_STORAGE_KEY } from "@/lib/rentVsBuy/persistence";
import type { RentVsBuyInput, RentVsBuyResult } from "@/lib/rentVsBuy/types";
import { formatCompactCurrency } from "@/lib/retirement/format";
import { fitLabel } from "@/app/travel-deals/fareGauge";
import { netWorthChart } from "./netWorthChart";
import "./rent-vs-buy.css";

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
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

/** The chart's marker label: "4y 6m". */
function formatBreakEvenShort(breakEvenYears: number) {
  const years = Math.floor(breakEvenYears);
  const months = Math.round((breakEvenYears - years) * 12);
  if (years === 0) return `${months}m`;
  if (months === 0) return `${years}y`;
  return `${years}y ${months}m`;
}

function formatLead(result: RentVsBuyResult) {
  const leader = result.netWorthDeltaAtHorizon >= 0 ? "buying" : "renting";
  return `At year ${result.horizonYears}, ${leader} leads by ${formatCurrency(Math.abs(result.netWorthDeltaAtHorizon))}`;
}

const VERDICT_TITLE: Record<RentVsBuyResult["verdict"], string> = {
  buying: "Buying comes out ahead",
  renting: "Renting comes out ahead",
  close: "It's close to a wash",
};

// ── Net-worth chart ─────────────────────────────────────────────────────────
// The chart draws at its container's measured width, so its 13px labels are
// real pixels at every size. Colours come from the route stylesheet's
// --rvb-* properties, which re-resolve on a theme change with no script.
function NetWorthChart({ result }: { result: RentVsBuyResult }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(260, Math.round(entry.contentRect.width))));
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const height = Math.round(Math.min(230, Math.max(210, width * 0.4)));
  const chart = useMemo(() => netWorthChart(result, width, height), [result, width, height]);

  // The end labels only fit beside the lines on a chart this wide; on a phone
  // the table under the chart names the two lines instead.
  const showEndLabels = width >= 480;
  // Nudge the two end labels apart when the lines finish close together.
  const nudge = Math.abs(chart.buyerEndY - chart.renterEndY) < 18 ? 9 : 0;
  const buyerLabelY = chart.buyerEndY <= chart.renterEndY ? chart.buyerEndY - nudge : chart.buyerEndY + nudge;
  const renterLabelY = chart.renterEndY <= chart.buyerEndY ? chart.renterEndY - nudge : chart.renterEndY + nudge;

  const breakEvenText = result.breakEvenYears === null ? "" : `Break-even ${formatBreakEvenShort(result.breakEvenYears)}`;
  // Body-face digits advance a little over half an em, so 0.62em per glyph is a safe width.
  const breakEvenLabelX =
    chart.breakEvenX === null ? 0 : fitLabel(chart.breakEvenX, breakEvenText.length * 13 * 0.62 + 8, 0, chart.width);

  const description = `Net worth by year, buyer versus renter. ${formatBreakEven(result)}. ${formatLead(result)}.`;

  return (
    <div ref={frameRef} className="rvb-chart">
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label={description}>
        {chart.yTicks.map((tick) => (
          <g key={tick.value}>
            <line x1={0} x2={chart.width} y1={tick.y} y2={tick.y} className="rvb-grid" />
            <text x={0} y={tick.y - 5} className="rvb-axis">
              {formatCompactCurrency(tick.value)}
            </text>
          </g>
        ))}

        {chart.zeroY !== null ? <line x1={0} x2={chart.width} y1={chart.zeroY} y2={chart.zeroY} className="rvb-zero" /> : null}

        {chart.breakEvenX !== null ? (
          <>
            <line x1={chart.breakEvenX} x2={chart.breakEvenX} y1={20} y2={chart.height - 22} className="rvb-breakeven" />
            <text x={breakEvenLabelX} y={13} textAnchor="middle" className="rvb-label">
              {breakEvenText}
            </text>
          </>
        ) : null}

        <polyline points={chart.renterLine} className="rvb-line" data-series="renter" />
        <polyline points={chart.buyerLine} className="rvb-line" data-series="buyer" />

        {showEndLabels ? (
          <>
            <text x={chart.buyerEndX - 10} y={buyerLabelY - 8} textAnchor="end" className="rvb-label">
              Buyer
            </text>
            <text x={chart.renterEndX - 10} y={renterLabelY - 8} textAnchor="end" className="rvb-label">
              Renter
            </text>
          </>
        ) : null}

        <text x={chart.xForYear(0)} y={chart.height - 6} className="rvb-axis">
          Today
        </text>
        <text x={chart.xForYear(result.horizonYears)} y={chart.height - 6} textAnchor="end" className="rvb-axis">
          {`Year ${result.horizonYears}`}
        </text>
      </svg>
    </div>
  );
}

// ── Input row ───────────────────────────────────────────────────────────────
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
  /** The five headline inputs print larger than the rest. */
  large?: boolean;
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
  large = false,
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
    <div className="rvb-row" data-size={large ? "large" : undefined}>
      <label htmlFor={id} className="rvb-row-label">
        {label}
      </label>
      <span className="rvb-cell" data-disabled={disabled || undefined}>
        {prefix ? <span aria-hidden="true">{prefix}</span> : null}
        <input
          id={id}
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
        />
        {suffix ? <span aria-hidden="true">{suffix}</span> : null}
      </span>
      {hint ? (
        <span id={hintId} className="rvb-row-note">
          {hint}
        </span>
      ) : null}
      {outOfRange ? (
        <span id={rangeId} className="rvb-row-note">
          {max !== undefined
            ? `Between ${min.toLocaleString("en-US")} and ${max.toLocaleString("en-US")}`
            : `At least ${min.toLocaleString("en-US")}`}
        </span>
      ) : null}
    </div>
  );
}

export function RentVsBuyClient() {
  const { input, result, setField, reset } = useRentVsBuy();
  const persistenceStatus = useLocalStoragePersistenceStatus(RENT_VS_BUY_STORAGE_KEY);
  // Each NumberField keeps a local draft while typing, so Reset remounts the
  // fields to drop any draft still showing a value the store no longer holds.
  const [resetKey, setResetKey] = useState(0);
  const ids = useId();

  // A printed scenario needs every input on it, so the closed groups open for the print.
  useEffect(() => {
    const openGroups = () => {
      document.querySelectorAll<HTMLDetailsElement>(".rvb-group").forEach((group) => {
        group.open = true;
      });
    };
    window.addEventListener("beforeprint", openGroups);
    return () => window.removeEventListener("beforeprint", openGroups);
  }, []);

  const num = <K extends keyof RentVsBuyInput>(key: K) =>
    (value: number) => setField(key, value as RentVsBuyInput[K]);

  return (
    <div className="rvb">
      <div className="rvb-page c97-shell c97-frame">
        <header className="rvb-title">
          <h1>Rent vs. Buy Calculator</h1>
          <p>
            This compares your net worth on each path month by month, crediting the renter with the cash a buyer puts
            down and investing whatever the cheaper side saves each month.
          </p>
          <a href="#assumptions-and-limits" className="rvb-link">
            Assumptions and limits
          </a>
        </header>

        <div className="rvb-calc">
          <section className="rvb-inputs" aria-labelledby={`${ids}-numbers`}>
            <div className="rvb-section-head">
              <h2 id={`${ids}-numbers`}>Your numbers</h2>
              <button
                type="button"
                className="rvb-reset"
                onClick={() => {
                  reset();
                  setResetKey((current) => current + 1);
                }}
              >
                Reset
              </button>
            </div>
            {/* Keyed on the rows and not the section, so Reset keeps keyboard focus when the fields remount. */}
            <div key={resetKey}>
              <NumberField large {...RENT_VS_BUY_BOUNDS.homePrice} label="Home price" prefix="$" step={5000} value={input.homePrice} onChange={num("homePrice")} />
              <NumberField large {...RENT_VS_BUY_BOUNDS.monthlyRent} label="Monthly rent" prefix="$" step={50} value={input.monthlyRent} onChange={num("monthlyRent")} />
              <NumberField large {...RENT_VS_BUY_BOUNDS.yearsStaying} label="Years staying" suffix="yrs" step={1} value={input.yearsStaying} onChange={num("yearsStaying")} />
              <NumberField large {...RENT_VS_BUY_BOUNDS.downPaymentPercent} label="Down payment" suffix="%" step={1} value={input.downPaymentPercent} onChange={num("downPaymentPercent")} />
              <NumberField large {...RENT_VS_BUY_BOUNDS.mortgageRatePercent} label="Mortgage rate" suffix="%" step={0.05} value={input.mortgageRatePercent} onChange={num("mortgageRatePercent")} />
            </div>
          </section>

          {/* On a phone this wrapper becomes display: contents, so the result can print first and the fine print last. */}
          <div className="rvb-aside">
            <section className="rvb-result" aria-labelledby={`${ids}-result`}>
              <h2 id={`${ids}-result`} className="sr-only">
                Result
              </h2>
              <p role="status" aria-live="polite" className="rvb-verdict">
                <span>{VERDICT_TITLE[result.verdict]}</span>
                {". "}
                <span className="rvb-verdict-detail">
                  {formatBreakEven(result)}. {formatLead(result)}.
                </span>
              </p>

              <NetWorthChart result={result} />

              <table className="rvb-table">
                <caption className="sr-only">Buying and renting compared</caption>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="sr-only">Figure</span>
                    </th>
                    <th scope="col">
                      <span className="rvb-swatch" data-series="buyer" aria-hidden="true" />
                      Buying
                    </th>
                    <th scope="col">
                      <span className="rvb-swatch" data-series="renter" aria-hidden="true" />
                      Renting
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">
                      Cash at the start
                      <span>Down payment and closing costs, which the renter keeps invested</span>
                    </th>
                    <td>{formatCurrency(result.upfrontCash)}</td>
                    <td>{formatCurrency(result.upfrontCash)}</td>
                  </tr>
                  <tr>
                    <th scope="row">
                      Monthly cost, year 1<span>All in, after any tax benefit</span>
                    </th>
                    <td>{formatCurrency(result.monthlyBuyingCostYear1)}</td>
                    <td>{formatCurrency(result.monthlyRentingCostYear1)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Mortgage payment, monthly</th>
                    <td>{formatCurrency(result.monthlyPaymentYear1)}</td>
                    <td className="rvb-none">None</td>
                  </tr>
                  <tr className="rvb-total">
                    <th scope="row">Net worth at year {result.horizonYears}</th>
                    <td>{formatCurrency(result.buyerNetWorthAtHorizon)}</td>
                    <td>{formatCurrency(result.renterNetWorthAtHorizon)}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <p id="assumptions-and-limits" className="rvb-fine">
              <span className="rvb-fine-label">Assumptions and limits</span>{" "}
              Educational only, not financial or tax advice. Figures are nominal dollars. {result.assumptions.taxNote} Tax
              figures are for tax year {result.assumptions.taxYear}, were read from the IRS and the text of the law on{" "}
              {result.assumptions.asOf}, and have not had an independent review. The default mortgage rate of{" "}
              {result.assumptions.defaultMortgageRatePercent}% is the Freddie Mac 30 year fixed average as of{" "}
              {result.assumptions.mortgageRateAsOf}.
            </p>
          </div>

          <section className="rvb-more" aria-labelledby={`${ids}-more`}>
            <h2 id={`${ids}-more`}>The rest of the model</h2>
            <div key={resetKey}>
              <details className="rvb-group">
                <summary>
                  The home you&apos;d buy <span>8 inputs</span>
                </summary>
                <NumberField {...RENT_VS_BUY_BOUNDS.loanTermYears} label="Loan term" suffix="yrs" step={1} value={input.loanTermYears} onChange={num("loanTermYears")} />
                <NumberField {...RENT_VS_BUY_BOUNDS.propertyTaxPercent} label="Property tax" suffix="%/yr" step={0.05} value={input.propertyTaxPercent} onChange={num("propertyTaxPercent")} />
                <NumberField {...RENT_VS_BUY_BOUNDS.homeInsuranceAnnual} label="Home insurance" prefix="$" suffix="/yr" step={100} value={input.homeInsuranceAnnual} onChange={num("homeInsuranceAnnual")} />
                <NumberField {...RENT_VS_BUY_BOUNDS.maintenancePercent} label="Maintenance" suffix="%/yr" step={0.1} value={input.maintenancePercent} onChange={num("maintenancePercent")} />
                <NumberField {...RENT_VS_BUY_BOUNDS.hoaMonthly} label="HOA dues" prefix="$" suffix="/mo" step={25} value={input.hoaMonthly} onChange={num("hoaMonthly")} />
                <NumberField {...RENT_VS_BUY_BOUNDS.closingCostPercent} label="Closing costs" suffix="%" step={0.5} value={input.closingCostPercent} onChange={num("closingCostPercent")} />
                <NumberField {...RENT_VS_BUY_BOUNDS.sellingCostPercent} label="Selling costs" suffix="%" step={0.5} value={input.sellingCostPercent} onChange={num("sellingCostPercent")} />
                <NumberField {...RENT_VS_BUY_BOUNDS.homeAppreciationPercent} label="Home appreciation" suffix="%/yr" step={0.25} value={input.homeAppreciationPercent} onChange={num("homeAppreciationPercent")} />
              </details>

              <details className="rvb-group">
                <summary>
                  The rent you&apos;d pay <span>2 inputs</span>
                </summary>
                <NumberField {...RENT_VS_BUY_BOUNDS.rentGrowthPercent} label="Rent growth" suffix="%/yr" step={0.25} value={input.rentGrowthPercent} onChange={num("rentGrowthPercent")} />
                <NumberField {...RENT_VS_BUY_BOUNDS.rentersInsuranceMonthly} label="Renter's insurance" prefix="$" suffix="/mo" step={5} value={input.rentersInsuranceMonthly} onChange={num("rentersInsuranceMonthly")} />
              </details>

              <details className="rvb-group">
                <summary>
                  Returns and taxes <span>4 inputs</span>
                </summary>
                <NumberField {...RENT_VS_BUY_BOUNDS.investmentReturnPercent} label="Investment return" suffix="%/yr" step={0.25} value={input.investmentReturnPercent} onChange={num("investmentReturnPercent")} />
                <NumberField {...RENT_VS_BUY_BOUNDS.generalInflationPercent} label="Inflation" suffix="%/yr" step={0.25} value={input.generalInflationPercent} onChange={num("generalInflationPercent")} />
                <label className="rvb-row rvb-check">
                  <span className="rvb-row-label">Itemize deductions</span>
                  <input type="checkbox" checked={input.itemizes} onChange={(event) => setField("itemizes", event.target.checked)} />
                </label>
                <NumberField
                  {...RENT_VS_BUY_BOUNDS.marginalTaxRatePercent}
                  label="Marginal tax rate"
                  suffix="%"
                  step={1}
                  value={input.marginalTaxRatePercent}
                  onChange={num("marginalTaxRatePercent")}
                  disabled={!input.itemizes}
                  hint="Used only when you itemize deductions."
                />
              </details>
            </div>

            {persistenceStatus === "memory-only" ? (
              <p role="status" className="rvb-storage">
                Browser storage is unavailable, so changes last only while this tab is open.
              </p>
            ) : (
              <p className="rvb-storage">Saved in your browser. No account, no server.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
