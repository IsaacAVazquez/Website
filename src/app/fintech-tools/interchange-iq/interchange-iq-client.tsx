"use client";

import { useState, useMemo } from "react";
import { WarmCard } from "@/components/ui/WarmCard";
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

// ─── Slider ───────────────────────────────────────────────────────────────────
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
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline gap-2">
        <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
        <span className="text-sm font-semibold text-[var(--color-primary)] tabular-nums flex-shrink-0">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--color-primary) ${pct}%, var(--border-primary) ${pct}%)`,
        }}
      />
      {hint && <p className="text-xs text-[var(--text-tertiary)]">{hint}</p>}
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
          <WarmCard key={s.label} padding="md" className="text-center">
            <p className="text-xs text-[var(--text-tertiary)] mb-1">{s.label}</p>
            <p className="text-base font-bold text-[var(--color-primary)] tabular-nums">{s.value}</p>
          </WarmCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-8">

        {/* ── Inputs ── */}
        <WarmCard padding="lg" className="space-y-7 self-start">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-[0.12em]">
            <IconCreditCard className="h-4 w-4 text-[var(--color-primary)]" />
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

          <div className="border-t border-[var(--border-primary)] pt-5 space-y-5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">Card Mix</span>
              <button
                onClick={() => setShowInfo(!showInfo)}
                aria-label="Learn about card mix"
                className="text-[var(--text-tertiary)] hover:text-[var(--color-primary)] transition-colors"
              >
                <IconInfoCircle className="h-4 w-4" />
              </button>
            </div>

            {showInfo && (
              <p className="text-xs text-[var(--text-secondary)] bg-[var(--surface-secondary)] rounded-lg p-3 leading-relaxed">
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
                    className="h-1.5 rounded-full bg-[var(--color-primary)] flex-shrink-0 min-w-[4px]"
                    style={{ width: `${Math.max(row.pct, 1)}%`, maxWidth: "50%", opacity: 0.4 + row.pct / 150 }}
                  />
                  <span className="text-[var(--text-secondary)]">
                    {row.label}: <span className="font-medium tabular-nums">{row.pct.toFixed(1)}%</span>
                    <span className="text-[var(--text-tertiary)] ml-1">({row.rate})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </WarmCard>

        {/* ── Results ── */}
        <div className="space-y-5">

          {/* Insight banner */}
          {savings > 100 ? (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-success,#22c55e)]/25 bg-[var(--color-success,#22c55e)]/5">
              <IconTrendingDown className="h-5 w-5 text-[var(--color-success,#22c55e)] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--text-primary)]">
                At your volume, <strong>{bestIC.name}</strong> saves{" "}
                <strong className="text-[var(--color-success,#22c55e)]">{fmtFull(savings)}/month</strong>{" "}
                ({fmtFull(savings * 12)}/year) vs. the best flat-rate option.
                Interchange+ becomes more attractive as volume scales.
              </p>
            </div>
          ) : savings < -50 ? (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-warning,#f59e0b)]/25 bg-[var(--color-warning,#f59e0b)]/5">
              <IconAlertTriangle className="h-5 w-5 text-[var(--color-warning,#f59e0b)] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--text-primary)]">
                At your volume and ticket size, flat-rate is cheaper — per-transaction fixed fees on
                interchange+ compound quickly at lower average ticket sizes.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-secondary)]">
              <IconInfoCircle className="h-5 w-5 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--text-secondary)]">
                Flat-rate and interchange+ are roughly equivalent at your current profile.
                The right choice depends on your growth trajectory and negotiating leverage.
              </p>
            </div>
          )}

          {/* Comparison bars */}
          <WarmCard padding="lg">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] mb-5 flex items-center gap-2">
              <IconBuildingBank className="h-4 w-4 text-[var(--color-primary)]" />
              Monthly Fee Comparison
            </h2>

            <div className="space-y-5">
              {results.map((r, i) => {
                const barPct    = (r.monthlyFee / maxFee) * 100;
                const isBest    = i === 0;
                return (
                  <div key={r.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className={`text-sm font-medium truncate ${isBest ? "text-[var(--color-primary)]" : "text-[var(--text-primary)]"}`}>
                          {r.name}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full border border-[var(--border-primary)] text-[var(--text-tertiary)] whitespace-nowrap flex-shrink-0">
                          {r.model}
                        </span>
                        {isBest && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium whitespace-nowrap flex-shrink-0">
                            Cheapest
                          </span>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-sm font-semibold tabular-nums ${isBest ? "text-[var(--color-primary)]" : "text-[var(--text-primary)]"}`}>
                          {fmtFull(r.monthlyFee)}<span className="font-normal text-[var(--text-tertiary)]">/mo</span>
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)] ml-2 tabular-nums">
                          ({(r.effectiveRate * 100).toFixed(2)}% eff.)
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[var(--surface-secondary)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${barPct}%`,
                          opacity: isBest ? 1 : 0.35 + 0.5 * (1 - i / results.length),
                          backgroundColor: "var(--color-primary)",
                        }}
                      />
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)]">{r.note}</p>
                  </div>
                );
              })}
            </div>
          </WarmCard>

          {/* Annual projection */}
          <WarmCard padding="lg">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <IconArrowRight className="h-4 w-4 text-[var(--color-primary)]" />
              Annual Projection — Top 3
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {results.slice(0, 3).map((r, i) => (
                <div key={r.id} className="text-center p-3 rounded-xl bg-[var(--surface-secondary)]">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">{r.name}</p>
                  <p className={`text-xl font-bold tabular-nums ${i === 0 ? "text-[var(--color-primary)]" : "text-[var(--text-primary)]"}`}>
                    {fmtK(r.monthlyFee * 12)}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">per year</p>
                </div>
              ))}
            </div>
          </WarmCard>

          {/* Breakeven insight */}
          {breakevenTicket !== null && breakevenTicket > 0 && (
            <WarmCard padding="lg" className="border border-[var(--border-accent)]">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                Breakeven: Stripe Flat vs. Stripe IC+
              </h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                With your card mix, Stripe IC+ becomes cheaper than Stripe flat-rate when avg ticket exceeds{" "}
                <strong className="text-[var(--color-primary)] tabular-nums">${breakevenTicket.toFixed(2)}</strong>.
                {avgTicket >= breakevenTicket ? (
                  <span> Your current avg ticket (${avgTicket}) is <strong>above</strong> that — IC+ wins on unit economics.</span>
                ) : (
                  <span> Your current avg ticket (${avgTicket}) is <strong>below</strong> that — flat-rate wins per transaction.</span>
                )}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                Note: Stripe IC+ requires a custom contract and typically $250k+/year in volume.
              </p>
            </WarmCard>
          )}
        </div>
      </div>

      {/* Education */}
      <div className="border-t border-[var(--border-primary)] pt-8 space-y-6">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">How Payment Processing Fees Work</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              title: "What is interchange?",
              body: "Interchange is the fee the card-issuing bank charges every time a card is swiped or typed. It's set by Visa and Mastercard — not your processor. It flows: Issuer ← Acquirer ← Merchant. Your processor doesn't set it; they just pass it through (or bundle it into a flat rate).",
            },
            {
              title: "Flat-rate vs. Interchange+",
              body: "Flat-rate (e.g., 2.9% + $0.30) bundles interchange, network assessments, and processor markup into one predictable number. Interchange+ passes the actual interchange cost through to you and adds a transparent markup — which is cheaper at scale when your card mix is favorable.",
            },
            {
              title: "Caveats & real-world nuance",
              body: "These are representative averages. Real interchange has 300+ rate categories by card type, industry code, and auth method. IC+ is typically available to merchants processing $250k+/yr. Card-present transactions have lower interchange than online. Always get actual quotes — this tool is directional, not definitive.",
            },
          ].map((card) => (
            <WarmCard key={card.title} padding="lg">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{card.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{card.body}</p>
            </WarmCard>
          ))}
        </div>
        <p className="text-xs text-[var(--text-tertiary)] text-center">
          Interchange rates based on published 2024 Visa/Mastercard US schedules and Amex OptBlue program averages.
          Processor fees from public pricing pages. For educational purposes — actual rates vary by industry, card type, and negotiated terms.
        </p>
      </div>
    </div>
  );
}
