"use client";

import { useId, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Home,
  Building2,
  Landmark,
  RotateCcw,
  Scale,
  TrendingUp,
  Info,
} from "lucide-react";
import { getReducedMotionVariants, fadeInVariants } from "@/components/investments/animations";
import { useRentVsBuy } from "@/hooks/useRentVsBuy";
import type { RentVsBuyInput, RentVsBuyResult } from "@/lib/rentVsBuy/types";

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

function formatBreakEven(result: RentVsBuyResult) {
  if (result.breakEvenYears === null) {
    return `Buying never catches renting within ${result.horizonYears} years`;
  }
  const years = Math.floor(result.breakEvenYears);
  const months = Math.round((result.breakEvenYears - years) * 12);
  if (years === 0) return `Buying pulls ahead after about ${months} months`;
  if (months === 0) return `Buying pulls ahead around year ${years}`;
  return `Buying pulls ahead around year ${years}, month ${months}`;
}

const VERDICT_COPY: Record<RentVsBuyResult["verdict"], { title: string; tone: string }> = {
  buying: { title: "Buying comes out ahead", tone: "var(--home-positive)" },
  renting: { title: "Renting comes out ahead", tone: "var(--home-signal)" },
  close: { title: "It's close to a wash", tone: "var(--home-ink)" },
};

// ── Small net-worth chart ──────────────────────────────────────────────────
function NetWorthChart({ result }: { result: RentVsBuyResult }) {
  const points = useMemo(() => {
    const years = [0, ...result.yearly.map((y) => y.year)];
    const buyer = [0, ...result.yearly.map((y) => y.buyerNetWorth)];
    const renter = [result.upfrontCash, ...result.yearly.map((y) => y.renterNetWorth)];
    const all = [...buyer, ...renter];
    const min = Math.min(0, ...all);
    const max = Math.max(...all, 1);
    const width = 320;
    const height = 150;
    const padX = 6;
    const padY = 10;
    const x = (i: number) => padX + (i / (years.length - 1)) * (width - padX * 2);
    const y = (v: number) =>
      height - padY - ((v - min) / (max - min || 1)) * (height - padY * 2);
    const line = (series: number[]) => series.map((v, i) => `${x(i)},${y(v)}`).join(" ");
    // The years array is [0, 1, 2, …] so a fractional break-even year maps
    // straight onto the x index.
    const breakEvenX =
      result.breakEvenYears === null ? null : x(result.breakEvenYears);
    return {
      width,
      height,
      buyerLine: line(buyer),
      renterLine: line(renter),
      zeroY: y(0),
      breakEvenX,
    };
  }, [result]);

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${points.width} ${points.height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Net worth over ${result.horizonYears} years. ${formatBreakEven(result)}.`}
      >
        <line
          x1={0}
          y1={points.zeroY}
          x2={points.width}
          y2={points.zeroY}
          stroke="var(--home-rule)"
          strokeWidth={1}
        />
        {points.breakEvenX !== null && points.breakEvenX !== undefined ? (
          <line
            x1={points.breakEvenX}
            y1={0}
            x2={points.breakEvenX}
            y2={points.height}
            stroke="var(--home-positive)"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.7}
          />
        ) : null}
        <polyline
          points={points.renterLine}
          fill="none"
          stroke="var(--home-signal)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <polyline
          points={points.buyerLine}
          fill="none"
          stroke="var(--home-positive)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </svg>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-[var(--home-ink-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "var(--home-positive)" }}
            aria-hidden="true"
          />
          Buyer net worth
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "var(--home-signal)" }}
            aria-hidden="true"
          />
          Renter net worth
        </span>
      </figcaption>
    </figure>
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
}: FieldProps) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      <span className="block text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
        {label}
      </span>
      <span className="mt-1.5 flex min-h-touch items-center rounded-[var(--radius-xl)] border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 focus-within:ring-2 focus-within:ring-[var(--home-signal)] focus-within:ring-offset-2">
        {prefix ? (
          <span className="mr-1 text-xs text-[var(--home-ink-muted)]" aria-hidden="true">
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
          value={String(value)}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full border-0 bg-transparent py-2 text-xs text-[var(--home-ink)] [font-variant-numeric:tabular-nums] focus-visible:outline-none"
        />
        {suffix ? (
          <span className="ml-1 text-2xs text-[var(--home-ink-muted)]" aria-hidden="true">
            {suffix}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function RentVsBuyClient() {
  const { input, result, setField, reset } = useRentVsBuy();
  const shouldReduceMotion = useReducedMotion();
  const motionVariants = shouldReduceMotion
    ? getReducedMotionVariants().fadeInVariants
    : fadeInVariants;

  const verdict = VERDICT_COPY[result.verdict];
  const num = <K extends keyof RentVsBuyInput>(key: K) =>
    (value: number) => setField(key, value as RentVsBuyInput[K]);

  return (
    <section className="home-page min-h-screen" aria-label="Rent vs. buy calculator">
      <div className="home-shell home-section">
        <motion.div
          variants={motionVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >
          <div className="tool-topbar">
            <div className="min-w-0">
              <p className="tool-crumbs">
                Fintech Tools / <strong>Rent vs. Buy</strong>
              </p>
              <h1>Rent vs. Buy Calculator</h1>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-touch items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-4 text-1xs font-semibold text-[var(--home-ink-muted)] transition hover:border-[var(--home-signal)] hover:text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset
            </button>
          </div>

          <p className="max-w-2xl text-sm leading-7 text-[var(--home-ink-muted)]">
            Most rent-vs-buy comparisons stop at the monthly payment, but the honest
            question is what you are worth years from now on each path. This tool runs a
            month-by-month model that credits the renter the money a buyer sinks into a
            down payment and closing costs, invests every month's cost difference on
            whichever side spends less, and then finds the year buying finally pulls ahead.
          </p>

          <div className="tool-meta-chip" role="status" aria-live="polite">
            <span
              className="tool-meta-chip-dot"
              style={{ background: verdict.tone }}
              aria-hidden="true"
            />
            <span>
              <strong style={{ color: verdict.tone }}>{verdict.title}</strong>
            </span>
            <span className="tool-meta-chip-divider" aria-hidden="true">
              ·
            </span>
            <span>
              Over {result.horizonYears} years · {formatBreakEven(result)}
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
            {/* Inputs */}
            <div className="flex flex-col gap-5">
              <section className="tool-card" aria-label="The home you would buy">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-[var(--home-signal)]" aria-hidden="true" />
                  <div>
                    <p className="tool-section-kicker">Buying</p>
                    <h2 className="tool-section-title">The home you'd buy</h2>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
              </section>

              <section className="tool-card" aria-label="The rent you would pay">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[var(--home-signal)]" aria-hidden="true" />
                  <div>
                    <p className="tool-section-kicker">Renting</p>
                    <h2 className="tool-section-title">The rent you'd pay</h2>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <NumberField label="Monthly rent" prefix="$" step={50} value={input.monthlyRent} onChange={num("monthlyRent")} />
                  <NumberField label="Rent growth" suffix="%/yr" step={0.25} min={-10} value={input.rentGrowthPercent} onChange={num("rentGrowthPercent")} />
                  <NumberField label="Renter's insurance" prefix="$" suffix="/mo" step={5} value={input.rentersInsuranceMonthly} onChange={num("rentersInsuranceMonthly")} />
                </div>
              </section>

              <section className="tool-card" aria-label="Money and taxes">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-[var(--home-signal)]" aria-hidden="true" />
                  <div>
                    <p className="tool-section-kicker">Money &amp; taxes</p>
                    <h2 className="tool-section-title">Assumptions</h2>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <NumberField label="Investment return" suffix="%/yr" step={0.25} min={-10} value={input.investmentReturnPercent} onChange={num("investmentReturnPercent")} />
                  <NumberField label="Inflation" suffix="%/yr" step={0.25} value={input.generalInflationPercent} onChange={num("generalInflationPercent")} />
                  <NumberField label="Marginal tax rate" suffix="%" step={1} max={60} value={input.marginalTaxRatePercent} onChange={num("marginalTaxRatePercent")} />
                  <NumberField label="Years staying" suffix="yrs" step={1} min={1} max={40} value={input.yearsStaying} onChange={num("yearsStaying")} />
                  <label className="block">
                    <span className="block text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
                      Filing status
                    </span>
                    <select
                      aria-label="Filing status"
                      value={input.filingStatus}
                      onChange={(event) =>
                        setField("filingStatus", event.target.value as RentVsBuyInput["filingStatus"])
                      }
                      className="mt-1.5 min-h-touch w-full rounded-[var(--radius-xl)] border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-xs text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
                    >
                      <option value="single">Single</option>
                      <option value="married">Married filing jointly</option>
                    </select>
                  </label>
                  <label className="flex min-h-touch cursor-pointer items-center justify-between gap-3 self-end rounded-[var(--radius-xl)] border border-[var(--home-rule)] bg-[var(--home-paper)] px-3">
                    <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
                      Itemize deductions
                    </span>
                    <input
                      type="checkbox"
                      checked={input.itemizes}
                      onChange={(event) => setField("itemizes", event.target.checked)}
                      className="h-4 w-4 accent-[var(--home-signal)]"
                    />
                  </label>
                </div>
              </section>
            </div>

            {/* Result rail */}
            <aside
              aria-label="Result"
              className="flex flex-col gap-4 rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_74%,var(--home-elev-mix))] p-5 shadow-[var(--shadow-sm)] lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
            >
              <div>
                <p className="tool-rail-label" id="rail-verdict">
                  <Scale size={12} aria-hidden="true" />
                  Verdict
                </p>
                <p className="text-lg font-semibold" style={{ color: verdict.tone }}>
                  {verdict.title}
                </p>
                <p className="mt-1 text-1xs text-[var(--home-ink-muted)]">{formatBreakEven(result)}</p>
              </div>

              <NetWorthChart result={result} />

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[var(--home-rule)] pt-4 text-1xs">
                <div>
                  <dt className="text-[var(--home-ink-muted)]">Buy · monthly (yr 1)</dt>
                  <dd className="font-semibold text-[var(--home-ink)] [font-variant-numeric:tabular-nums]">
                    {formatCurrency(result.monthlyBuyingCostYear1)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--home-ink-muted)]">Rent · monthly (yr 1)</dt>
                  <dd className="font-semibold text-[var(--home-ink)] [font-variant-numeric:tabular-nums]">
                    {formatCurrency(result.monthlyRentingCostYear1)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--home-ink-muted)]">Cash to buy</dt>
                  <dd className="font-semibold text-[var(--home-ink)] [font-variant-numeric:tabular-nums]">
                    {formatCurrency(result.upfrontCash)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--home-ink-muted)]">Monthly P&amp;I</dt>
                  <dd className="font-semibold text-[var(--home-ink)] [font-variant-numeric:tabular-nums]">
                    {formatCurrency(result.monthlyPaymentYear1)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--home-ink-muted)]">Buyer net worth · yr {result.horizonYears}</dt>
                  <dd className="font-semibold text-[var(--home-positive)] [font-variant-numeric:tabular-nums]">
                    {formatCurrency(result.buyerNetWorthAtHorizon)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--home-ink-muted)]">Renter net worth · yr {result.horizonYears}</dt>
                  <dd className="font-semibold text-[var(--home-signal)] [font-variant-numeric:tabular-nums]">
                    {formatCurrency(result.renterNetWorthAtHorizon)}
                  </dd>
                </div>
              </dl>

              <div className="flex items-center justify-between gap-3 rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-1xs font-semibold text-[var(--home-ink)]">
                  <TrendingUp className="h-3.5 w-3.5 text-[var(--home-signal)]" aria-hidden="true" />
                  Net-worth gap at year {result.horizonYears}
                </span>
                <span
                  className="text-sm font-semibold [font-variant-numeric:tabular-nums]"
                  style={{
                    color:
                      result.netWorthDeltaAtHorizon >= 0
                        ? "var(--home-positive)"
                        : "var(--home-signal)",
                  }}
                >
                  {formatSignedCurrency(result.netWorthDeltaAtHorizon)}
                </span>
              </div>

              <details className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2.5 text-1xs text-[var(--home-ink-muted)]">
                <summary className="flex cursor-pointer items-center gap-1.5 font-semibold text-[var(--home-ink)]">
                  <Info className="h-3.5 w-3.5" aria-hidden="true" />
                  Assumptions &amp; limits
                </summary>
                <p className="mt-2 leading-6">
                  Educational only, not financial or tax advice. Figures are nominal
                  dollars. {result.assumptions.taxNote} SALT cap{" "}
                  {formatCurrency(result.assumptions.saltCap)}, standard deduction{" "}
                  {formatCurrency(result.assumptions.standardDeduction)}, primary-residence
                  gains exclusion {formatCurrency(result.assumptions.capitalGainsExclusion)}.
                  Tax figures as of {result.assumptions.asOf} and not yet re-pinned to a
                  primary source.
                </p>
              </details>

              <p className="tool-rail-foot">
                <Home size={14} aria-hidden="true" />
                Saved in your browser. No account, no server.
              </p>
            </aside>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
