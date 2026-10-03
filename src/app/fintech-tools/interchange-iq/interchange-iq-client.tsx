"use client";

import { Info, RefreshCw } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import {
  buildCardMix,
  calcProcessorResults,
  calcStripeBreakevenTicket,
  DEFAULT_INTERCHANGE_AMEX_OF_CREDIT,
  DEFAULT_INTERCHANGE_CREDIT_PCT,
  DEFAULT_INTERCHANGE_TICKET,
  DEFAULT_INTERCHANGE_VOLUME,
} from "@/lib/interchangeIq";
import { breakevenScale, feeStatement, type FeeStatementRow } from "./feeStatement";
import "./interchange-iq.css";

const ROUTE = "/fintech-tools/interchange-iq";

const DEFAULT_VOLUME = DEFAULT_INTERCHANGE_VOLUME;
const DEFAULT_TICKET = DEFAULT_INTERCHANGE_TICKET;
const DEFAULT_CREDIT_PCT = DEFAULT_INTERCHANGE_CREDIT_PCT;
const DEFAULT_AMEX_OF_CREDIT = DEFAULT_INTERCHANGE_AMEX_OF_CREDIT;

const fmtFull = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtVolume = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : `$${n}`;

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  hint?: string;
}

function Slider({ label, value, min, max, step, onChange, format, hint }: SliderProps) {
  const inputId = useId();
  const hintId = hint ? `${inputId}-hint` : undefined;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-1)" }}>
      <div className="flex justify-between items-baseline" style={{ gap: "var(--c97-sp-1)" }}>
        <label htmlFor={inputId} className="c97-kicker">
          {label}
        </label>
        <span className="c97-mono" style={{ fontWeight: 600 }}>
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
        className="c97-range"
      />
      {hint ? (
        <p id={hintId} className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** The signature: every processor's fee on one scale, cheapest marked. Pointer-only, since the processor list below it is the keyboard and detail path. */
function FeeStatementSignature({ rows, verdict }: { rows: FeeStatementRow[]; verdict: string }) {
  return (
    <div>
      <p className="c97-serif c97-h3">{verdict}</p>
      <div
        className="c97-iq-statement"
        role="img"
        aria-label={`Monthly fee by processor on one scale: ${rows.map((row) => `${row.name} ${fmtFull(row.fee)}${row.isCheapest ? " (cheapest)" : ""}`).join(", ")}.`}
        style={{ marginTop: "var(--c97-sp-3)" }}
      >
        {rows.map((row) => (
          <div key={row.id} className="c97-iq-row">
            <div className="c97-iq-row-label">
              <span className="c97-serif">{row.name}</span>
              <span className="c97-iq-tag">{row.model}</span>
            </div>
            <span className="c97-meter" style={{ height: 10 }}>
              <span style={{ width: `${row.fraction * 100}%` }} />
            </span>
            <span className="c97-iq-row-value">
              <span className="c97-mono">{fmtFull(row.fee)}</span>
              {row.isCheapest ? <span className="c97-iq-row-mark">Cheapest</span> : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const VIEW_LABELS = {
  "all-processors": "All processors",
  "flat-rate": "Flat-rate",
  "interchange-plus": "Interchange-plus",
  breakeven: "Breakeven",
} as const;
type ViewKey = keyof typeof VIEW_LABELS;

const NAV_ITEMS: { id: ViewKey; label: string; href: string }[] = [
  { id: "all-processors", label: "All processors", href: "#all-processors" },
  { id: "flat-rate", label: "Flat-rate", href: "#all-processors" },
  { id: "interchange-plus", label: "Interchange-plus", href: "#all-processors" },
  { id: "breakeven", label: "Breakeven", href: "#breakeven" },
];

const REFERENCE_CARDS = [
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
    body: "These are representative averages. Real interchange has 300+ rate categories by card type, industry code, and auth method. IC+ is typically available to merchants processing $250k+/yr, and the IC+ totals here leave out network and assessment fees. Card-present transactions have lower interchange than online. Always get actual quotes.",
  },
];

export function InterchangeIQClient() {
  const [monthlyVolume, setMonthlyVolume] = useState(DEFAULT_VOLUME);
  const [avgTicket, setAvgTicket] = useState(DEFAULT_TICKET);
  const [creditPct, setCreditPct] = useState(DEFAULT_CREDIT_PCT);
  const [amexOfCredit, setAmexOfCredit] = useState(DEFAULT_AMEX_OF_CREDIT);
  const [showInfo, setShowInfo] = useState(false);
  const [activeView, setActiveView] = useState<ViewKey>("all-processors");

  const cardMix = useMemo(() => buildCardMix(creditPct, amexOfCredit), [creditPct, amexOfCredit]);
  const results = useMemo(() => calcProcessorResults(monthlyVolume, avgTicket, cardMix), [monthlyVolume, avgTicket, cardMix]);
  const cheapest = results[0];
  const worst = results[results.length - 1];
  const savingsVsWorst = worst.monthlyFee - cheapest.monthlyFee;
  const annualSavings = savingsVsWorst * 12;

  const statementRows = useMemo(() => feeStatement(results), [results]);
  const cheapestRows = useMemo(() => statementRows.filter((row) => row.isCheapest), [statementRows]);
  const cheapestIds = useMemo(() => new Set(cheapestRows.map((row) => row.id)), [cheapestRows]);
  const cheapestNames = cheapestRows.map((row) => row.name).join(" and ");
  const cheapestModels = new Set(cheapestRows.map((row) => row.model));
  const cheapestDetail =
    cheapestModels.size === 1 ? `${cheapestNames} · ${cheapest.model}` : cheapestNames;
  const cheapestVerdict = cheapestRows.length > 1 ? `${cheapestNames} tie` : `${cheapestNames} wins`;

  // The Flat-rate / Interchange-plus nav tabs narrow the processor list to that
  // pricing model; the hero verdict and signature stay computed from the full set.
  const visibleResults = useMemo(() => {
    if (activeView === "flat-rate") return results.filter((r) => r.model === "Flat Rate");
    if (activeView === "interchange-plus") return results.filter((r) => r.model === "Interchange+");
    return results;
  }, [results, activeView]);

  const breakevenTicket = calcStripeBreakevenTicket(cardMix);
  const scale = useMemo(() => breakevenScale(avgTicket, breakevenTicket), [avgTicket, breakevenTicket]);

  function handleReset() {
    setMonthlyVolume(DEFAULT_VOLUME);
    setAvgTicket(DEFAULT_TICKET);
    setCreditPct(DEFAULT_CREDIT_PCT);
    setAmexOfCredit(DEFAULT_AMEX_OF_CREDIT);
  }

  const cardMixRows = [
    { label: "Visa/MC Credit", pct: cardMix.creditFraction * 100, rate: "~1.65% + $0.10" },
    { label: "Debit (Reg II)", pct: cardMix.debitFraction * 100, rate: "~0.25% + $0.22" },
    { label: "Amex", pct: cardMix.amexFraction * 100, rate: "~2.30%" },
  ];

  const lead = PROJECT_PRESS[ROUTE].lead;
  const standfirst =
    "I built this to estimate what seven payment processors would charge each month from their public pricing, on both flat rate and interchange-plus, so you can see where flat rate costs more before you commit to either pricing model. Set your monthly volume, average ticket, and card mix below, and I will put each processor's fee on one shared scale and mark whichever one wins.";

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="Interchange IQ"
        standfirst={standfirst}
        readouts={[
          {
            label: "Cheapest monthly fee",
            value: fmtFull(cheapest.monthlyFee),
            detail: cheapestDetail,
          },
          {
            label: "Savings vs priciest",
            value: `${fmtFull(savingsVsWorst)}/mo`,
            detail: `${fmtFull(annualSavings)} a year`,
          },
          {
            label: "Cheapest effective rate",
            value: `${(cheapest.effectiveRate * 100).toFixed(2)}%`,
          },
        ]}
      >
        <div data-c97-surface="paper" className="c97-offset" style={{ padding: "var(--c97-sp-3)" }}>
          <FeeStatementSignature rows={statementRows} verdict={cheapestVerdict} />
        </div>
      </Catalog97ProjectHero>

      <section
        className="c97-band c97-sheet"
        data-c97-surface="paper"
        data-seam="torn"
        data-testid="interchange-iq-shell"
      >
        <div className="flex flex-col c97-shell" style={{ rowGap: "var(--c97-sp-3)" }}>
          <div className="flex flex-wrap items-end justify-between" style={{ gap: "var(--c97-sp-1)" }}>
            <p className="c97-kicker">
              Interchange IQ / <strong>{VIEW_LABELS[activeView]}</strong>
            </p>
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset all inputs to defaults"
              className="c97-btn-ghost"
              style={{ gap: "var(--c97-sp-1)" }}
            >
              <RefreshCw size={14} aria-hidden="true" />
              Reset
            </button>
          </div>

          <nav aria-label="In-page sections" className="c97-iq-nav">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === activeView;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => setActiveView(item.id)}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]" style={{ gap: "var(--c97-sp-3)" }}>
            <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-2)" }}>
              <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>Inputs</p>

              <Slider
                label="Monthly volume"
                value={monthlyVolume}
                min={1_000}
                max={500_000}
                step={1_000}
                onChange={setMonthlyVolume}
                format={fmtVolume}
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

              <div style={{ marginTop: "var(--c97-sp-3)" }}>
                <p className="c97-kicker" style={{ display: "flex", alignItems: "center", gap: "var(--c97-sp-1)" }}>
                  Card mix preview
                  <button
                    type="button"
                    onClick={() => setShowInfo(!showInfo)}
                    aria-label="Learn about card mix"
                    aria-expanded={showInfo}
                    aria-controls="card-mix-info"
                    style={{ color: "var(--c97-label)", display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 44, minHeight: 44 }}
                  >
                    <Info size={14} aria-hidden="true" />
                  </button>
                </p>

                {showInfo ? (
                  <p
                    id="card-mix-info"
                    className="c97-panel c97-prose"
                    style={{ fontSize: "var(--c97-fs-small)", marginTop: "var(--c97-sp-2)" }}
                  >
                    Different card types carry different interchange rates. Debit (Reg II) is much
                    lower than consumer credit. Amex runs its own network and typically costs more.
                  </p>
                ) : null}

                <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-2)" }}>
                  {cardMixRows.map((row) => (
                    <div key={row.label}>
                      <div className="flex items-baseline justify-between" style={{ gap: "var(--c97-sp-1)" }}>
                        <span className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", fontWeight: 600 }}>
                          {row.label}
                        </span>
                        <span className="c97-mono" style={{ fontSize: "var(--c97-fs-small)" }}>
                          {row.pct.toFixed(1)}%
                        </span>
                      </div>
                      <span className="c97-meter" style={{ marginTop: "var(--c97-sp-1)" }}>
                        <span style={{ width: `${Math.max(row.pct, 0.5)}%` }} />
                      </span>
                      <p className="c97-iq-tag" style={{ marginTop: "var(--c97-sp-1)" }}>
                        {row.rate}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div id="all-processors">
              <p className="c97-kicker">Processors</p>
              <h2 className="c97-poster-sm">Monthly fee breakdown</h2>
              <p className="c97-meta" style={{ marginTop: "var(--c97-sp-1)" }}>
                {visibleResults.length} options · sorted cheapest first
              </p>

              <ul style={{ listStyle: "none", margin: 0, padding: 0, marginTop: "var(--c97-sp-3)" }}>
                {visibleResults.map((r, i) => (
                  <li
                    key={r.id}
                    className="c97-row"
                    style={{
                      padding: "var(--c97-sp-2) 0",
                      borderTop: i === 0 ? "none" : "1px solid var(--c97-rule)",
                    }}
                  >
                    <div>
                      <span className="c97-serif" style={{ fontWeight: cheapestIds.has(r.id) ? 700 : 400 }}>
                        {r.name}
                      </span>{" "}
                      <span className="c97-iq-tag">{r.model}</span>
                      <div className="c97-meta" style={{ marginTop: "var(--c97-sp-1)" }}>
                        <span>{Math.round(r.txCount).toLocaleString("en-US")} tx/mo</span>
                        <span>{fmtFull(r.perTxAvg)}/tx avg</span>
                        <span>{(r.effectiveRate * 100).toFixed(2)}% eff.</span>
                      </div>
                    </div>
                    <span className="c97-mono">{fmtFull(r.monthlyFee)}/mo</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle" id="breakeven">
        <div className="flex flex-col c97-shell" style={{ rowGap: "var(--c97-sp-2)" }}>
          <div>
            <p className="c97-kicker">Breakeven</p>
            <h2 className="c97-poster-sm">Stripe flat vs Stripe IC+</h2>
          </div>

          {breakevenTicket !== null && breakevenTicket > 0 ? (
            <>
              <p className="c97-prose" style={{ marginBottom: "var(--c97-sp-2)" }}>
                With your card mix, Stripe IC+ becomes cheaper than Stripe flat rate once the average
                ticket passes <span className="c97-mono">${breakevenTicket.toFixed(2)}</span>. Your
                current average ticket is <span className="c97-mono">${avgTicket}</span>, and{" "}
                {avgTicket >= breakevenTicket ? "IC+ wins on unit economics." : "flat rate wins per transaction."}
              </p>

              <figure style={{ margin: 0 }}>
                <div className="c97-iq-breakeven-track">
                  <div
                    className="c97-iq-breakeven-mark"
                    data-kind="ticket"
                    style={{ left: `${scale.ticketFraction * 100}%` }}
                    aria-hidden="true"
                  />
                  {scale.breakevenFraction !== null ? (
                    <div
                      className="c97-iq-breakeven-mark"
                      data-kind="breakeven"
                      style={{ left: `${scale.breakevenFraction * 100}%` }}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
                <figcaption
                  className="c97-mono"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "var(--c97-sp-2)",
                    fontSize: "var(--c97-fs-small)",
                  }}
                >
                  <span>$5</span>
                  <span>
                    Avg ticket ${avgTicket} · Breakeven ${breakevenTicket.toFixed(0)}
                  </span>
                  <span>$500</span>
                </figcaption>
              </figure>

              <p className="c97-prose" style={{ marginBottom: "var(--c97-sp-2)", fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
                Note: Stripe IC+ requires a custom contract and typically $250k+/year in volume, and
                the IC+ totals here leave out card network and assessment fees, so real IC+ costs run
                higher.
              </p>
            </>
          ) : (
            <>
              <p className="c97-prose" style={{ marginBottom: "var(--c97-sp-2)" }}>
                At your current card mix, Stripe IC+ costs less than Stripe flat at every ticket size,
                so there is no breakeven to find. IC+ usually needs a custom contract and about $250k a
                year in volume, and the IC+ totals here leave out card network and assessment fees, so
                real IC+ costs run higher.
              </p>

              <figure style={{ margin: 0 }}>
                <div className="c97-iq-breakeven-track">
                  <div
                    className="c97-iq-breakeven-mark"
                    data-kind="ticket"
                    style={{ left: `${scale.ticketFraction * 100}%` }}
                    aria-hidden="true"
                  />
                </div>
                <figcaption
                  className="c97-mono"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "var(--c97-sp-2)",
                    fontSize: "var(--c97-fs-small)",
                  }}
                >
                  <span>$5</span>
                  <span>Avg ticket ${avgTicket}</span>
                  <span>$500</span>
                </figcaption>
              </figure>
            </>
          )}
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn" aria-label="How payment processing fees work">
        <div className="flex flex-col c97-shell" style={{ rowGap: "var(--c97-sp-3)" }}>
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-3)" }}>Reference</p>
          <h2 className="c97-poster-sm">How payment processing fees work</h2>

          <div className="c97-columns">
            {REFERENCE_CARDS.map((card) => (
              <article key={card.title} className="c97-panel">
                <h3 className="c97-serif c97-h3" style={{ marginBottom: "var(--c97-sp-2)" }}>
                  {card.title}
                </h3>
                <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
                  {card.body}
                </p>
              </article>
            ))}
          </div>

          <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
            Interchange rates based on published 2024 Visa/Mastercard US schedules and Amex OptBlue
            program averages. Processor fees from public pricing pages. For educational purposes
            only. Actual rates vary by industry, card type, and negotiated terms.
          </p>
        </div>
      </section>
    </>
  );
}
