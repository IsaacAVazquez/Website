"use client";

import { useId, useState, useMemo } from "react";
import {
  IconCreditCard,
  IconInfoCircle,
  IconLayoutGrid,
  IconScale,
  IconCalculator,
  IconRefresh,
  IconCirclePercentage,
} from "@tabler/icons-react";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";
import {
  buildCardMix,
  calcProcessorResults,
  calcStripeBreakevenTicket,
  DEFAULT_INTERCHANGE_AMEX_OF_CREDIT,
  DEFAULT_INTERCHANGE_CREDIT_PCT,
  DEFAULT_INTERCHANGE_TICKET,
  DEFAULT_INTERCHANGE_VOLUME,
} from "@/lib/interchangeIq";

// ─── Defaults + types ────────────────────────────────────────────────────────
const DEFAULT_VOLUME = DEFAULT_INTERCHANGE_VOLUME;
const DEFAULT_TICKET = DEFAULT_INTERCHANGE_TICKET;
const DEFAULT_CREDIT_PCT = DEFAULT_INTERCHANGE_CREDIT_PCT;
const DEFAULT_AMEX_OF_CREDIT = DEFAULT_INTERCHANGE_AMEX_OF_CREDIT;

// ─── Formatting ───────────────────────────────────────────────────────────────
const fmtFull = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtVolume = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : `$${n}`;

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
  const inputId = useId();
  const hintId = hint ? `${inputId}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline gap-2">
        <label
          htmlFor={inputId}
          style={{
            fontFamily: "var(--font-home-sans)",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--home-ink)",
            letterSpacing: "-0.01em",
          }}
        >
          {label}
        </label>
        <span
          className="tabular-nums flex-shrink-0"
          style={{
            fontFamily: "var(--font-home-sans)",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--home-signal)",
          }}
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
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
        style={{
          background: `linear-gradient(to right, var(--home-signal) ${pct}%, var(--home-rule) ${pct}%)`,
        }}
      />
      {hint && (
        <p
          id={hintId}
          className="mb-0"
          style={{
            fontFamily: "var(--font-home-sans)",
            fontSize: "11.5px",
            color: "var(--home-ink-muted)",
            lineHeight: 1.4,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const VIEW_LABELS = {
  "all-processors": "All processors",
  "flat-rate": "Flat-rate",
  "interchange-plus": "Interchange-plus",
  "breakeven": "Breakeven",
} as const;
type ViewKey = keyof typeof VIEW_LABELS;

export function InterchangeIQClient() {
  const [monthlyVolume, setMonthlyVolume] = useState(DEFAULT_VOLUME);
  const [avgTicket,     setAvgTicket]     = useState(DEFAULT_TICKET);
  const [creditPct,     setCreditPct]     = useState(DEFAULT_CREDIT_PCT);
  const [amexOfCredit,  setAmexOfCredit]  = useState(DEFAULT_AMEX_OF_CREDIT);
  const [showInfo,      setShowInfo]      = useState(false);
  const [activeView,    setActiveView]    = useState<ViewKey>("all-processors");

  const cardMix = useMemo(
    () => buildCardMix(creditPct, amexOfCredit),
    [creditPct, amexOfCredit]
  );

  const results  = useMemo(() => calcProcessorResults(monthlyVolume, avgTicket, cardMix), [monthlyVolume, avgTicket, cardMix]);
  const cheapest = results[0];
  const worst    = results[results.length - 1];
  const bestFlat = results.find((r) => r.model === "Flat Rate")!;
  const bestIC   = results.find((r) => r.model === "Interchange+")!;
  const savings  = bestFlat.monthlyFee - bestIC.monthlyFee;
  const savingsVsWorst = worst.monthlyFee - cheapest.monthlyFee;

  const breakevenTicket = calcStripeBreakevenTicket(cardMix);

  const cardMixLabel =
    cardMix.creditFraction > cardMix.debitFraction && cardMix.creditFraction > cardMix.amexFraction
      ? "credit-heavy"
      : cardMix.debitFraction > cardMix.creditFraction
      ? "debit-heavy"
      : "amex-heavy";

  const navItems: { id: ViewKey; label: string; href: string }[] = [
    { id: "all-processors",   label: "All processors",   href: "#all-processors" },
    { id: "flat-rate",        label: "Flat-rate",        href: "#all-processors" },
    { id: "interchange-plus", label: "Interchange-plus", href: "#all-processors" },
    { id: "breakeven",        label: "Breakeven",        href: "#breakeven" },
  ];

  function handleReset() {
    setMonthlyVolume(DEFAULT_VOLUME);
    setAvgTicket(DEFAULT_TICKET);
    setCreditPct(DEFAULT_CREDIT_PCT);
    setAmexOfCredit(DEFAULT_AMEX_OF_CREDIT);
  }

  const cardMixRows = [
    { label: "Visa/MC Credit", pct: cardMix.creditFraction * 100, rate: "~1.65% + $0.10" },
    { label: "Debit (Reg E)",  pct: cardMix.debitFraction  * 100, rate: "~0.05% + $0.22" },
    { label: "Amex",           pct: cardMix.amexFraction   * 100, rate: "~2.30%" },
  ];

  const monthlyTxCount = avgTicket > 0 ? monthlyVolume / avgTicket : 0;
  const annualSavings = savingsVsWorst * 12;

  const interchangeStatsCells: HomeStatsCell[] = [
    {
      label: "Best processor",
      value: cheapest.name,
      sub: cheapest.model,
    },
    {
      label: "Best fee",
      value: fmtFull(cheapest.monthlyFee),
      sub: "per month",
    },
    {
      label: "Effective rate",
      value: `${(cheapest.effectiveRate * 100).toFixed(2)}%`,
    },
    {
      label: "Savings vs worst",
      value: fmtFull(savingsVsWorst),
      sub: `vs ${worst.name}`,
    },
    {
      label: "Savings vs flat",
      value: savings > 0 ? fmtFull(savings) : "—",
      sub: savings > 0 ? `vs ${bestFlat.name}` : "Flat-rate wins",
    },
    {
      label: "Annual savings",
      value: fmtFull(annualSavings),
      tone: annualSavings > 0 ? "good" : "default",
    },
    {
      label: "Monthly tx",
      value: Math.round(monthlyTxCount).toLocaleString(),
    },
    {
      label: "Avg per-tx fee",
      value: fmtFull(cheapest.perTxAvg),
    },
  ];

  return (
    <section
      className="home-page min-h-screen"
      aria-label="Interchange IQ"
      data-testid="interchange-iq-shell"
    >
      <div className="home-shell home-section">
        <div className="flex flex-col gap-6">
          {/* In-page section nav (replaces sidebar) */}
          <nav
            className="flex flex-wrap gap-2"
            aria-label="In-page sections"
          >
            {navItems.map((item) => {
              const isActive = item.id === activeView;
              const Icon =
                item.id === "all-processors"   ? IconLayoutGrid :
                item.id === "flat-rate"        ? IconCirclePercentage :
                item.id === "interchange-plus" ? IconCalculator :
                                                 IconScale;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => setActiveView(item.id)}
                  className="inline-flex min-h-touch items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-[transform,border-color,background-color,color] duration-200 ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
                  style={{
                    borderColor: isActive ? "var(--home-ink)" : "var(--home-rule)",
                    background: isActive
                      ? "var(--home-ink)"
                      : "var(--home-paper-raised)",
                    color: isActive ? "var(--home-paper)" : "var(--home-ink-muted)",
                    fontFamily: "var(--font-home-sans)",
                  }}
                >
                  <Icon size={16} aria-hidden="true" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="tool-topbar" id="hero">
            <div>
              <p className="tool-crumbs">
                Interchange IQ / <strong>{VIEW_LABELS[activeView]}</strong>
              </p>
              <h1>Interchange IQ</h1>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-1xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
              style={{
                fontFamily: "var(--font-home-sans)",
                color: "var(--home-ink)",
                borderColor: "var(--home-rule)",
                background: "var(--home-paper-raised)",
                minHeight: 32,
              }}
              aria-label="Reset all inputs to defaults"
            >
              <IconRefresh size={14} aria-hidden="true" />
              Reset
            </button>
          </div>

          {/* Live input summary chip */}
          <div className="tool-meta-chip" role="status" aria-live="polite">
            <span className="tool-meta-chip-dot" aria-hidden="true" />
            <span>
              <strong>{fmtVolume(monthlyVolume)}</strong> monthly volume
            </span>
            <span className="tool-meta-chip-divider" aria-hidden="true">·</span>
            <span>
              <strong>{fmtVolume(avgTicket)}</strong> avg ticket
            </span>
            <span className="tool-meta-chip-divider" aria-hidden="true">·</span>
            <span>
              <strong>{cardMixLabel}</strong> card mix
            </span>
            <span className="tool-meta-chip-spacer" />
            <span className="tool-meta-chip-meta">
              {Math.round(monthlyVolume / avgTicket).toLocaleString()} tx/mo
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
            <div className="space-y-5">
            <HomeStatsPanel
              id="result-hero"
              title="Verdict at a glance"
              meta={`${cheapest.name} wins`}
              hideLiveDot
              cells={interchangeStatsCells}
              pills={[
                { label: "Sliders", href: "#hero" },
                { label: "Card mix", href: "#hero" },
                { label: "Breakeven", href: "#breakeven" },
                { label: "Reference", href: "#all-processors" },
              ]}
            />

            {/* Processor comparison — table-style rows */}
            <article className="tool-card" id="all-processors">
              <header className="tool-section-header" style={{ marginBottom: 16 }}>
                <div>
                  <p className="tool-section-kicker">Processors</p>
                  <h2 className="tool-section-title" style={{ fontSize: "1.1rem" }}>
                    Monthly fee breakdown
                  </h2>
                </div>
                <p
                  className="mb-0"
                  style={{
                    fontFamily: "var(--font-home-sans)",
                    fontSize: "11.5px",
                    color: "var(--home-ink-muted)",
                  }}
                >
                  {results.length} options · sorted cheapest first
                </p>
              </header>

              <ul className="m-0 list-none p-0">
                {results.map((r, i) => {
                  const isBest = i === 0;
                  return (
                    <li
                      key={r.id}
                      className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 py-3"
                      style={{
                        borderTop: i === 0 ? "none" : "1px solid var(--home-rule)",
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span
                          className="truncate"
                          style={{
                            fontFamily: "var(--font-home-sans)",
                            fontSize: "13.5px",
                            fontWeight: 600,
                            color: isBest ? "var(--home-signal)" : "var(--home-ink)",
                          }}
                        >
                          {r.name}
                        </span>
                        <span
                          className="whitespace-nowrap"
                          style={{
                            fontFamily: "var(--font-home-sans)",
                            fontSize: "10.5px",
                            fontWeight: 600,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "var(--home-ink-muted)",
                            border: "1px solid var(--home-rule)",
                            borderRadius: 999,
                            padding: "1px 8px",
                          }}
                        >
                          {r.model}
                        </span>
                        {isBest && (
                          <span
                            className="whitespace-nowrap"
                            style={{
                              fontFamily: "var(--font-home-sans)",
                              fontSize: "10.5px",
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              background: "var(--home-signal)",
                              color: "var(--home-paper)",
                              borderRadius: 999,
                              padding: "1px 8px",
                            }}
                          >
                            Cheapest
                          </span>
                        )}
                      </div>
                      <div
                        className="text-right tabular-nums"
                        style={{
                          fontFamily: "var(--font-home-sans)",
                          fontSize: "13.5px",
                          fontWeight: 600,
                          color: isBest ? "var(--home-signal)" : "var(--home-ink)",
                        }}
                      >
                        {fmtFull(r.monthlyFee)}
                        <span
                          className="ml-1"
                          style={{
                            fontWeight: 400,
                            color: "var(--home-ink-muted)",
                          }}
                        >
                          /mo
                        </span>
                      </div>
                      <div
                        className="col-span-2 grid grid-cols-3 gap-3 tabular-nums"
                        style={{
                          fontFamily: "var(--font-home-sans)",
                          fontSize: "11.5px",
                          color: "var(--home-ink-muted)",
                        }}
                      >
                        <span>
                          {Math.round(r.txCount).toLocaleString()} tx/mo
                        </span>
                        <span>
                          {fmtFull(r.perTxAvg)}/tx avg
                        </span>
                        <span>
                          {(r.effectiveRate * 100).toFixed(2)}% eff.
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </article>

            {/* Breakeven analysis */}
            <article className="tool-card" id="breakeven">
              <header className="tool-section-header" style={{ marginBottom: 14 }}>
                <div>
                  <p className="tool-section-kicker">Breakeven</p>
                  <h2 className="tool-section-title" style={{ fontSize: "1.1rem" }}>
                    Stripe Flat vs. Stripe IC+
                  </h2>
                </div>
              </header>

              {breakevenTicket !== null && breakevenTicket > 0 ? (
                <>
                  <p
                    className="mb-3"
                    style={{
                      fontFamily: "var(--font-home-sans)",
                      fontSize: "13.5px",
                      lineHeight: 1.55,
                      color: "var(--home-ink-muted)",
                    }}
                  >
                    With your card mix, Stripe IC+ becomes cheaper than Stripe flat-rate when avg
                    ticket exceeds{" "}
                    <strong
                      className="tabular-nums"
                      style={{ color: "var(--home-signal)", fontWeight: 700 }}
                    >
                      ${breakevenTicket.toFixed(2)}
                    </strong>
                    . Your current avg ticket is{" "}
                    <strong style={{ color: "var(--home-ink)" }}>${avgTicket}</strong> —{" "}
                    {avgTicket >= breakevenTicket ? (
                      <span style={{ color: "var(--home-positive)" }}>
                        IC+ wins on unit economics.
                      </span>
                    ) : (
                      <span style={{ color: "var(--home-ink)" }}>
                        flat-rate wins per transaction.
                      </span>
                    )}
                  </p>

                  {/* Breakeven visual */}
                  <div
                    className="relative h-2 rounded-full overflow-hidden"
                    style={{ background: "var(--home-rule)" }}
                  >
                    <div
                      className="absolute top-0 bottom-0 left-0"
                      style={{
                        width: `${Math.min(100, (breakevenTicket / 500) * 100)}%`,
                        background:
                          "linear-gradient(90deg, color-mix(in srgb, var(--home-signal) 40%, transparent), var(--home-signal))",
                      }}
                    />
                    <div
                      className="absolute top-[-4px] bottom-[-4px] w-0.5"
                      style={{
                        left: `${Math.min(100, (avgTicket / 500) * 100)}%`,
                        background: "var(--home-ink)",
                      }}
                      aria-hidden="true"
                    />
                  </div>
                  <div
                    className="flex justify-between mt-1 tabular-nums"
                    style={{
                      fontFamily: "var(--font-home-sans)",
                      fontSize: "11px",
                      color: "var(--home-ink-muted)",
                    }}
                  >
                    <span>$5</span>
                    <span>Breakeven ${breakevenTicket.toFixed(0)}</span>
                    <span>$500</span>
                  </div>
                  <p
                    className="mb-0 mt-3"
                    style={{
                      fontFamily: "var(--font-home-sans)",
                      fontSize: "11.5px",
                      color: "var(--home-ink-muted)",
                      lineHeight: 1.45,
                    }}
                  >
                    Note: Stripe IC+ requires a custom contract and typically $250k+/year in volume.
                  </p>
                </>
              ) : (
                <p
                  className="mb-0"
                  style={{
                    fontFamily: "var(--font-home-sans)",
                    fontSize: "13.5px",
                    color: "var(--home-ink-muted)",
                    lineHeight: 1.55,
                  }}
                >
                  At your current card mix, Stripe IC+ never beats Stripe flat. The markup plus
                  blended interchange exceeds the flat rate at every ticket size.
                </p>
              )}
            </article>
          </div>

        {/* ── Rail ── */}
        <aside
          aria-label="Inputs side panel"
          className="flex flex-col gap-4 rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_74%,var(--home-elev-mix))] p-5 shadow-[var(--shadow-sm)] lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
        >
          <section>
            <p className="tool-rail-label">
              <IconCreditCard size={12} aria-hidden="true" />
              Inputs
            </p>
            <div className="space-y-4">
              <Slider
                label="Monthly volume"
                value={monthlyVolume}
                min={1_000}
                max={500_000}
                step={1_000}
                onChange={setMonthlyVolume}
                format={(v) => `$${v.toLocaleString()}`}
                hint="Total card revenue per month"
              />

              <Slider
                label="Avg ticket"
                value={avgTicket}
                min={5}
                max={500}
                step={5}
                onChange={setAvgTicket}
                format={(v) => `$${v}`}
                hint="Per-transaction fixed fees matter more at lower tickets"
              />

              <Slider
                label="% Credit (Visa/MC)"
                value={creditPct}
                min={0}
                max={100}
                step={5}
                onChange={setCreditPct}
                format={(v) => `${v}%`}
                hint={`Debit: ${100 - creditPct}% of all transactions`}
              />

              <Slider
                label="% of credit that's Amex"
                value={amexOfCredit}
                min={0}
                max={50}
                step={1}
                onChange={setAmexOfCredit}
                format={(v) => `${v}%`}
                hint={`Amex = ${((creditPct / 100) * (amexOfCredit / 100) * 100).toFixed(1)}% of total`}
              />
            </div>
          </section>

          <section>
            <p className="tool-rail-label">
              <IconLayoutGrid size={12} aria-hidden="true" />
              Card mix preview
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                aria-label="Learn about card mix"
                aria-expanded={showInfo}
                aria-controls="card-mix-info"
                className="ml-auto rounded-md p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
                style={{ color: "var(--home-ink-muted)" }}
              >
                <IconInfoCircle className="h-3.5 w-3.5" />
              </button>
            </p>

            {showInfo && (
              <p
                id="card-mix-info"
                role="region"
                className="mb-3 rounded-lg p-3 leading-relaxed"
                style={{
                  fontFamily: "var(--font-home-sans)",
                  fontSize: "11.5px",
                  color: "var(--home-ink-muted)",
                  background: "color-mix(in srgb, var(--home-paper-alt) 78%, var(--home-elev-mix))",
                  border: "1px solid var(--home-rule)",
                }}
              >
                Different card types carry different interchange rates. Debit (Reg E) is much
                lower than consumer credit. Amex runs its own network and typically costs more.
              </p>
            )}

            <div className="space-y-2">
              {cardMixRows.map((row) => (
                <div key={row.label}>
                  <div
                    className="flex items-baseline justify-between gap-2"
                    style={{
                      fontFamily: "var(--font-home-sans)",
                      fontSize: "12px",
                    }}
                  >
                    <span style={{ color: "var(--home-ink)", fontWeight: 600 }}>
                      {row.label}
                    </span>
                    <span
                      className="tabular-nums"
                      style={{ color: "var(--home-ink)", fontWeight: 600 }}
                    >
                      {row.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className="h-1 rounded-full mt-1 overflow-hidden"
                    style={{ background: "var(--home-rule)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(row.pct, 0.5)}%`,
                        background: "var(--home-signal)",
                        opacity: 0.5 + row.pct / 200,
                      }}
                    />
                  </div>
                  <p
                    className="mb-0 mt-0.5"
                    style={{
                      fontFamily: "var(--font-home-sans)",
                      fontSize: "10.5px",
                      color: "var(--home-ink-muted)",
                    }}
                  >
                    {row.rate}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <p className="tool-rail-foot">
            <IconInfoCircle size={14} aria-hidden="true" />
            Based on published 2024 interchange rates
          </p>
        </aside>
      </div>

      {/* Education band — full width below the shell */}
      <section className="tool-band" aria-label="How payment processing fees work">
        <div className="tool-section-header">
          <div>
            <p className="tool-section-kicker">Reference</p>
            <h2 className="tool-section-title">How payment processing fees work</h2>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
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
              body: "These are representative averages. Real interchange has 300+ rate categories by card type, industry code, and auth method. IC+ is typically available to merchants processing $250k+/yr. Card-present transactions have lower interchange than online. Always get actual quotes.",
            },
          ].map((card) => (
            <article
              key={card.title}
              className="tool-card"
              style={{ background: "color-mix(in srgb, var(--home-paper) 96%, var(--home-elev-mix))" }}
            >
              <h3
                className="mb-2"
                style={{
                  fontFamily: "var(--font-home-sans)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--home-ink)",
                  letterSpacing: "-0.01em",
                }}
              >
                {card.title}
              </h3>
              <p
                className="mb-0"
                style={{
                  fontFamily: "var(--font-home-sans)",
                  fontSize: "12.5px",
                  lineHeight: 1.55,
                  color: "var(--home-ink-muted)",
                }}
              >
                {card.body}
              </p>
            </article>
          ))}
        </div>
        <p
          className="mb-0 text-center"
          style={{
            fontFamily: "var(--font-home-sans)",
            fontSize: "11px",
            color: "var(--home-ink-muted)",
          }}
        >
          Interchange rates based on published 2024 Visa/Mastercard US schedules and Amex OptBlue
          program averages. Processor fees from public pricing pages. For educational purposes
          only. Actual rates vary by industry, card type, and negotiated terms.
        </p>
      </section>
        </div>
      </div>
    </section>
  );
}
