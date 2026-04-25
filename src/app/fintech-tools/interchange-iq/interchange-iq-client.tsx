"use client";

import { useState, useMemo, useRef } from "react";
import {
  IconCreditCard,
  IconInfoCircle,
  IconTrendingDown,
  IconBuildingBank,
  IconAlertTriangle,
  IconArrowRight,
} from "@tabler/icons-react";

// ─── Interchange rate data (US, representative 2024 published values) ─────────
// Source: Visa/Mastercard published interchange tables; Amex OptBlue program
const INTERCHANGE = {
  visa_mc_credit: { rate: 0.0165, fixed: 0.10 }, // ~1.65% + $0.10 blended consumer credit
  visa_mc_debit:  { rate: 0.0025, fixed: 0.22 }, // Reg E cap (large-bank debit): 0.05% + $0.22
  amex:           { rate: 0.023,  fixed: 0.00 }, // ~2.30% Amex OptBlue blended average
};

// ─── Processor pricing (current public rates, 2024/2025) ─────────────────────
interface FlatProcessor {
  id: string;
  name: string;
  model: "Flat Rate";
  pctRate: number;
  fixedFee: number;
  note: string;
}
interface ICPlusProcessor {
  id: string;
  name: string;
  model: "Interchange+";
  markupPct: number;
  markupFixed: number;
  note: string;
}
type Processor = FlatProcessor | ICPlusProcessor;

const PROCESSORS: Processor[] = [
  { id: "stripe",      name: "Stripe",       model: "Flat Rate",    pctRate: 0.029,  fixedFee: 0.30,  note: "Standard online card rate" },
  { id: "square",      name: "Square",       model: "Flat Rate",    pctRate: 0.026,  fixedFee: 0.10,  note: "Card-present; online is 2.9%+$0.30" },
  { id: "shopify",     name: "Shopify",      model: "Flat Rate",    pctRate: 0.029,  fixedFee: 0.30,  note: "Shopify Payments basic plan" },
  { id: "paypal",      name: "PayPal",       model: "Flat Rate",    pctRate: 0.0349, fixedFee: 0.49,  note: "Standard checkout rate" },
  { id: "stripe_ic",   name: "Stripe IC+",   model: "Interchange+", markupPct: 0.0025, markupFixed: 0.10, note: "Custom pricing; typically $250k+/yr volume" },
  { id: "adyen",       name: "Adyen",        model: "Interchange+", markupPct: 0.003,  markupFixed: 0.13, note: "Processing markup + blended scheme fees" },
  { id: "checkout",    name: "Checkout.com", model: "Interchange+", markupPct: 0.0025, markupFixed: 0.10, note: "Enterprise tier; volume minimums apply" },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface CardMix {
  creditFraction: number;
  debitFraction:  number;
  amexFraction:   number;
}

interface ProcessorResult {
  id: string;
  name: string;
  model: "Flat Rate" | "Interchange+";
  monthlyFee: number;
  effectiveRate: number;
  note: string;
}

// ─── Calculation ──────────────────────────────────────────────────────────────
function calcInterchange(volume: number, txCount: number, mix: CardMix): number {
  return (
    mix.creditFraction * (INTERCHANGE.visa_mc_credit.rate * volume + INTERCHANGE.visa_mc_credit.fixed * txCount) +
    mix.debitFraction  * (INTERCHANGE.visa_mc_debit.rate  * volume + INTERCHANGE.visa_mc_debit.fixed  * txCount) +
    mix.amexFraction   * (INTERCHANGE.amex.rate           * volume + INTERCHANGE.amex.fixed           * txCount)
  );
}

function calcResults(volume: number, avgTicket: number, mix: CardMix): ProcessorResult[] {
  const txCount = volume / avgTicket;
  const interchange = calcInterchange(volume, txCount, mix);

  return PROCESSORS.map((p): ProcessorResult => {
    const fee =
      p.model === "Flat Rate"
        ? p.pctRate * volume + p.fixedFee * txCount
        : interchange + p.markupPct * volume + p.markupFixed * txCount;

    return {
      id: p.id,
      name: p.name,
      model: p.model,
      monthlyFee: fee,
      effectiveRate: volume > 0 ? fee / volume : 0,
      note: p.note,
    };
  }).sort((a, b) => a.monthlyFee - b.monthlyFee);
}

// ─── Formatting ───────────────────────────────────────────────────────────────
const fmtK = (n: number) =>
  n >= 10_000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

const fmtFull = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Style tokens ─────────────────────────────────────────────────────────────
const labelStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink)",
  fontWeight: 600,
} as const;

const bodyStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink-muted)",
} as const;

const mutedStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))",
} as const;

const accentStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-haze)",
  fontWeight: 600,
} as const;

const sectionHeadingStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink)",
  fontWeight: 600,
  fontSize: "0.72rem",
  textTransform: "uppercase" as const,
  letterSpacing: "0.12em",
};

// ─── Slider ───────────────────────────────────────────────────────────────────
let sliderUid = 0;
function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  hint?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  // Stable id per Slider instance for label/hint association
  const idRef = useRef<string | null>(null);
  if (idRef.current === null) {
    idRef.current = `iq-slider-${++sliderUid}`;
  }
  const inputId = idRef.current;
  const hintId = hint ? `${inputId}-hint` : undefined;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline gap-2">
        <label htmlFor={inputId} className="text-sm" style={labelStyle}>
          {label}
        </label>
        <span
          className="text-sm tabular-nums flex-shrink-0"
          style={accentStyle}
        >
          {format(value)}
        </span>
      </div>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={format(value)}
        aria-describedby={hintId}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
        style={{
          background: `linear-gradient(to right, var(--home-haze) ${pct}%, var(--home-rule) ${pct}%)`,
        }}
      />
      {hint && (
        <p id={hintId} className="text-xs" style={mutedStyle}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function InterchangeIQClient() {
  const [monthlyVolume, setMonthlyVolume] = useState(50_000);
  const [avgTicket,     setAvgTicket]     = useState(85);
  const [creditPct,     setCreditPct]     = useState(65); // % of txns that are Visa/MC credit
  const [amexOfCredit,  setAmexOfCredit]  = useState(18); // % of credit that are Amex
  const [showInfo,      setShowInfo]      = useState(false);

  const cardMix = useMemo<CardMix>(() => {
    const creditFrac = creditPct / 100;
    const amexFrac   = creditFrac * (amexOfCredit / 100);
    return {
      creditFraction: creditFrac - amexFrac,
      debitFraction:  1 - creditFrac,
      amexFraction:   amexFrac,
    };
  }, [creditPct, amexOfCredit]);

  const results  = useMemo(() => calcResults(monthlyVolume, avgTicket, cardMix), [monthlyVolume, avgTicket, cardMix]);
  const maxFee   = results[results.length - 1]?.monthlyFee ?? 1;
  const cheapest = results[0];
  const bestFlat = results.find((r) => r.model === "Flat Rate")!;
  const bestIC   = results.find((r) => r.model === "Interchange+")!;
  const savings  = bestFlat.monthlyFee - bestIC.monthlyFee;

  // Breakeven: avg ticket above which Stripe IC+ beats Stripe flat for this card mix
  const interchangeEffRate =
    cardMix.creditFraction * INTERCHANGE.visa_mc_credit.rate +
    cardMix.debitFraction  * INTERCHANGE.visa_mc_debit.rate  +
    cardMix.amexFraction   * INTERCHANGE.amex.rate;

  const stripeFlat = PROCESSORS.find((p) => p.id === "stripe") as FlatProcessor;
  const stripeIC   = PROCESSORS.find((p) => p.id === "stripe_ic") as ICPlusProcessor;
  const rateDiff   = stripeFlat.pctRate - (interchangeEffRate + stripeIC.markupPct);
  const fixedDiff  = stripeFlat.fixedFee - stripeIC.markupFixed;
  const breakevenTicket = rateDiff > 0 ? fixedDiff / rateDiff : null;

  return (
    <div className="space-y-8">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Monthly Volume",     value: fmtFull(monthlyVolume) },
          { label: "Avg Transaction",    value: fmtFull(avgTicket) },
          { label: "Lowest Cost Option", value: cheapest?.name ?? "—" },
          { label: "Lowest Monthly Fee", value: fmtFull(cheapest?.monthlyFee ?? 0) },
        ].map((s) => (
          <div key={s.label} className="home-card p-4 text-center space-y-1">
            <p className="mb-0 text-xs" style={mutedStyle}>
              {s.label}
            </p>
            <p className="mb-0 text-base tabular-nums" style={accentStyle}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-8">
        {/* ── Inputs ── */}
        <article className="home-card p-6 sm:p-7 space-y-7 self-start">
          <h2 className="flex items-center gap-2 mb-0" style={sectionHeadingStyle}>
            <IconCreditCard className="h-4 w-4" style={{ color: "var(--home-haze)" }} />
            Business Profile
          </h2>

          <Slider
            label="Monthly Processing Volume"
            value={monthlyVolume}
            min={1_000}
            max={500_000}
            step={1_000}
            onChange={setMonthlyVolume}
            format={(v) => `$${v.toLocaleString()}`}
            hint="Total card revenue processed per month"
          />

          <Slider
            label="Average Transaction Size"
            value={avgTicket}
            min={5}
            max={500}
            step={5}
            onChange={setAvgTicket}
            format={(v) => `$${v}`}
            hint="Per-transaction fixed fees matter more at lower ticket sizes"
          />

          <div
            className="pt-5 space-y-5"
            style={{ borderTop: "1px solid var(--home-rule)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm" style={labelStyle}>
                Card Mix
              </span>
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                aria-label="Learn about card mix"
                aria-expanded={showInfo}
                aria-controls="card-mix-info"
                className="rounded-md p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                style={{ color: "var(--home-ink-muted)" }}
              >
                <IconInfoCircle className="h-4 w-4" />
              </button>
            </div>

            {showInfo && (
              <p
                id="card-mix-info"
                role="region"
                className="text-xs rounded-lg p-3 leading-relaxed mb-0"
                style={{
                  ...bodyStyle,
                  background: "color-mix(in srgb, var(--home-paper-alt) 78%, var(--home-elev-mix))",
                  border: "1px solid var(--home-rule)",
                }}
              >
                Different card types carry different interchange rates. Debit cards (regulated Reg E)
                have much lower interchange than consumer credit. Amex runs its own network and
                typically costs more. Your mix determines your effective interchange rate.
              </p>
            )}

            <Slider
              label="% Credit Cards (Visa / Mastercard)"
              value={creditPct}
              min={0}
              max={100}
              step={5}
              onChange={setCreditPct}
              format={(v) => `${v}%`}
              hint={`Debit: ${100 - creditPct}% of all transactions`}
            />

            <Slider
              label="% of Credit Cards that are Amex"
              value={amexOfCredit}
              min={0}
              max={50}
              step={1}
              onChange={setAmexOfCredit}
              format={(v) => `${v}%`}
              hint={`Amex = ${((creditPct / 100) * (amexOfCredit / 100) * 100).toFixed(1)}% of total`}
            />

            {/* Card mix breakdown */}
            <div className="space-y-2 pt-1">
              {[
                { label: "Visa/MC Credit", pct: cardMix.creditFraction * 100, rate: "~1.65% + $0.10" },
                { label: "Debit (Reg E)",  pct: cardMix.debitFraction  * 100, rate: "~0.05% + $0.22" },
                { label: "Amex",           pct: cardMix.amexFraction   * 100, rate: "~2.30%" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-2 text-xs">
                  <div
                    className="h-1.5 rounded-full flex-shrink-0 min-w-[4px]"
                    style={{
                      width: `${Math.max(row.pct, 1)}%`,
                      maxWidth: "50%",
                      opacity: 0.4 + row.pct / 150,
                      background: "var(--home-haze)",
                    }}
                  />
                  <span style={bodyStyle}>
                    {row.label}:{" "}
                    <span className="font-semibold tabular-nums" style={{ color: "var(--home-ink)" }}>
                      {row.pct.toFixed(1)}%
                    </span>
                    <span className="ml-1" style={mutedStyle}>
                      ({row.rate})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* ── Results ── */}
        <div className="space-y-5">
          {/* Insight banner */}
          {savings > 100 ? (
            <div
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{
                border: "1px solid color-mix(in srgb, var(--color-success) 35%, var(--home-rule))",
                background: "color-mix(in srgb, var(--color-success) 8%, var(--home-paper))",
              }}
            >
              <IconTrendingDown
                className="h-5 w-5 flex-shrink-0 mt-0.5"
                style={{ color: "var(--color-success)" }}
              />
              <p className="mb-0 text-sm leading-6" style={{ ...bodyStyle, color: "var(--home-ink)" }}>
                At your volume, <strong style={labelStyle}>{bestIC.name}</strong> saves{" "}
                <strong style={{ ...labelStyle, color: "var(--color-success)" }}>
                  {fmtFull(savings)}/month
                </strong>{" "}
                ({fmtFull(savings * 12)}/year) vs. the best flat-rate option.
                Interchange+ becomes more attractive as volume scales.
              </p>
            </div>
          ) : savings < -50 ? (
            <div
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{
                border: "1px solid color-mix(in srgb, var(--color-warning) 35%, var(--home-rule))",
                background: "color-mix(in srgb, var(--color-warning) 8%, var(--home-paper))",
              }}
            >
              <IconAlertTriangle
                className="h-5 w-5 flex-shrink-0 mt-0.5"
                style={{ color: "var(--color-warning)" }}
              />
              <p className="mb-0 text-sm leading-6" style={{ ...bodyStyle, color: "var(--home-ink)" }}>
                At your volume and ticket size, flat-rate is cheaper. Per-transaction fixed fees on
                interchange+ compound quickly at lower average ticket sizes.
              </p>
            </div>
          ) : (
            <div
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{
                border: "1px solid var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper-alt) 78%, var(--home-elev-mix))",
              }}
            >
              <IconInfoCircle
                className="h-5 w-5 flex-shrink-0 mt-0.5"
                style={{ color: "var(--home-haze)" }}
              />
              <p className="mb-0 text-sm leading-6" style={bodyStyle}>
                Flat-rate and interchange+ are roughly equivalent at your current profile.
                The right choice depends on your growth trajectory and negotiating leverage.
              </p>
            </div>
          )}

          {/* Comparison bars */}
          <article className="home-card p-6 sm:p-7">
            <h2 className="flex items-center gap-2 mb-5" style={sectionHeadingStyle}>
              <IconBuildingBank className="h-4 w-4" style={{ color: "var(--home-haze)" }} />
              Monthly Fee Comparison
            </h2>

            <div className="space-y-5">
              {results.map((r, i) => {
                const barPct = (r.monthlyFee / maxFee) * 100;
                const isBest = i === 0;
                return (
                  <div key={r.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span
                          className="text-sm truncate"
                          style={isBest ? accentStyle : labelStyle}
                        >
                          {r.name}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                          style={{
                            fontFamily: "var(--font-home-sans)",
                            color: "var(--home-ink-muted)",
                            border: "1px solid var(--home-rule)",
                          }}
                        >
                          {r.model}
                        </span>
                        {isBest && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap flex-shrink-0"
                            style={{
                              fontFamily: "var(--font-home-sans)",
                              background: "color-mix(in srgb, var(--home-haze) 14%, var(--home-paper))",
                              color: "var(--home-haze)",
                              border: "1px solid color-mix(in srgb, var(--home-haze) 30%, var(--home-rule))",
                            }}
                          >
                            Cheapest
                          </span>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span
                          className="text-sm tabular-nums"
                          style={isBest ? accentStyle : labelStyle}
                        >
                          {fmtFull(r.monthlyFee)}
                          <span className="font-normal" style={mutedStyle}>
                            /mo
                          </span>
                        </span>
                        <span className="text-xs ml-2 tabular-nums" style={mutedStyle}>
                          ({(r.effectiveRate * 100).toFixed(2)}% eff.)
                        </span>
                      </div>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--home-rule)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${barPct}%`,
                          opacity: isBest ? 1 : 0.35 + 0.5 * (1 - i / results.length),
                          backgroundColor: "var(--home-haze)",
                        }}
                      />
                    </div>
                    <p className="mb-0 text-xs" style={mutedStyle}>
                      {r.note}
                    </p>
                  </div>
                );
              })}
            </div>
          </article>

          {/* Annual projection */}
          <article className="home-card p-6 sm:p-7">
            <h2 className="flex items-center gap-2 mb-4" style={sectionHeadingStyle}>
              <IconArrowRight className="h-4 w-4" style={{ color: "var(--home-haze)" }} />
              Annual Projection: Top 3
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {results.slice(0, 3).map((r, i) => (
                <div
                  key={r.id}
                  className="text-center p-3 rounded-xl space-y-1"
                  style={{
                    background: "color-mix(in srgb, var(--home-paper-alt) 78%, var(--home-elev-mix))",
                    border: "1px solid var(--home-rule)",
                  }}
                >
                  <p className="mb-0 text-xs" style={mutedStyle}>
                    {r.name}
                  </p>
                  <p
                    className="mb-0 text-xl tabular-nums"
                    style={i === 0 ? { ...accentStyle, fontWeight: 700 } : { ...labelStyle, fontWeight: 700 }}
                  >
                    {fmtK(r.monthlyFee * 12)}
                  </p>
                  <p className="mb-0 text-xs" style={mutedStyle}>
                    per year
                  </p>
                </div>
              ))}
            </div>
          </article>

          {/* Breakeven insight */}
          {breakevenTicket !== null && breakevenTicket > 0 && (
            <article
              className="home-card p-6 sm:p-7 space-y-2"
              style={{
                border: "1px solid color-mix(in srgb, var(--home-haze) 30%, var(--home-rule))",
              }}
            >
              <h2 className="text-sm mb-0" style={labelStyle}>
                Breakeven: Stripe Flat vs. Stripe IC+
              </h2>
              <p className="mb-0 text-sm leading-6" style={bodyStyle}>
                With your card mix, Stripe IC+ becomes cheaper than Stripe flat-rate when avg ticket exceeds{" "}
                <strong className="tabular-nums" style={accentStyle}>
                  ${breakevenTicket.toFixed(2)}
                </strong>
                .
                {avgTicket >= breakevenTicket ? (
                  <span> Your current avg ticket (${avgTicket}) is <strong style={labelStyle}>above</strong> that, so IC+ wins on unit economics.</span>
                ) : (
                  <span> Your current avg ticket (${avgTicket}) is <strong style={labelStyle}>below</strong> that, so flat-rate wins per transaction.</span>
                )}
              </p>
              <p className="mb-0 text-xs" style={mutedStyle}>
                Note: Stripe IC+ requires a custom contract and typically $250k+/year in volume.
              </p>
            </article>
          )}
        </div>
      </div>

      {/* Education */}
      <div
        className="pt-8 space-y-6"
        style={{ borderTop: "1px solid var(--home-rule)" }}
      >
        <h2
          className="mb-0 text-lg"
          style={{ ...labelStyle, fontSize: "1.125rem" }}
        >
          How Payment Processing Fees Work
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              title: "What is interchange?",
              body: "Interchange is the fee the card-issuing bank charges every time a card is swiped or typed. It's set by Visa and Mastercard, not your processor. It flows: Issuer ← Acquirer ← Merchant. Your processor doesn't set it; they just pass it through (or bundle it into a flat rate).",
            },
            {
              title: "Flat-rate vs. Interchange+",
              body: "Flat-rate (e.g., 2.9% + $0.30) bundles interchange, network assessments, and processor markup into one predictable number. Interchange+ passes the actual interchange cost through to you and adds a transparent markup, which is cheaper at scale when your card mix is favorable.",
            },
            {
              title: "Caveats & real-world nuance",
              body: "These are representative averages. Real interchange has 300+ rate categories by card type, industry code, and auth method. IC+ is typically available to merchants processing $250k+/yr. Card-present transactions have lower interchange than online. Always get actual quotes. This tool is directional, not definitive.",
            },
          ].map((card) => (
            <article key={card.title} className="home-card p-6 sm:p-7 space-y-2">
              <h3 className="mb-0 text-sm" style={labelStyle}>
                {card.title}
              </h3>
              <p className="mb-0 text-sm leading-6" style={bodyStyle}>
                {card.body}
              </p>
            </article>
          ))}
        </div>
        <p className="mb-0 text-xs text-center" style={mutedStyle}>
          Interchange rates based on published 2024 Visa/Mastercard US schedules and Amex OptBlue program averages.
          Processor fees from public pricing pages. For educational purposes only. Actual rates vary by industry, card type, and negotiated terms.
        </p>
      </div>
    </div>
  );
}
