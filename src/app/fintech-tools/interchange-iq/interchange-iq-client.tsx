"use client";

import { Info, RefreshCw } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import {
  buildCardMix,
  PROCESSOR_RATES_AS_OF,
  type PaymentChannel,
  calcProcessorResults,
  calcStripeBreakevenTicket,
  DEFAULT_INTERCHANGE_AMEX_OF_CREDIT,
  DEFAULT_INTERCHANGE_CREDIT_PCT,
  DEFAULT_INTERCHANGE_TICKET,
  DEFAULT_INTERCHANGE_VOLUME,
} from "@/lib/interchangeIq";
import { breakevenScale, feeStatement } from "./feeStatement";
import "./interchange-iq.css";

const DEFAULT_VOLUME = DEFAULT_INTERCHANGE_VOLUME;
const DEFAULT_TICKET = DEFAULT_INTERCHANGE_TICKET;
const DEFAULT_CREDIT_PCT = DEFAULT_INTERCHANGE_CREDIT_PCT;
const DEFAULT_AMEX_OF_CREDIT = DEFAULT_INTERCHANGE_AMEX_OF_CREDIT;

const fmtFull = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtVolume = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : `$${n}`;

/** A whole-dollar ticket prints as "$25" and a typed one with cents as "$12.50". */
const fmtTicket = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

interface SliderProps {
  label: string;
  /** The typed field's own name. It must not contain `label`, which the e2e spec matches by substring. */
  exactLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Decimal places the typed field keeps. The range keeps its coarser `step`. */
  decimals?: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  hint: string;
}

/** A range for quick comparison, paired with a number field for an exact value. Both drive the same state. */
function Slider({ label, exactLabel, value, min, max, step, decimals = 0, onChange, format, hint }: SliderProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  // The typed text stays local until it lands inside the range, so a value
  // still being typed never drives the model, and the field snaps back on blur.
  const [draft, setDraft] = useState<string | null>(null);
  const typed = draft !== null && draft.trim() !== "" ? Number(draft) : NaN;
  const outOfRange = Number.isFinite(typed) && (typed < min || typed > max);
  return (
    <div className="iq-slider">
      <div className="iq-slider-head">
        <label htmlFor={inputId}>{label}</label>
        <span className="iq-slider-value">{format(value)}</span>
      </div>
      <div className="iq-slider-row">
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
          className="iq-range"
        />
        <input
          type="number"
          inputMode="decimal"
          aria-label={exactLabel}
          aria-invalid={outOfRange || undefined}
          aria-describedby={hintId}
          min={min}
          max={max}
          step={10 ** -decimals}
          value={draft ?? String(value)}
          onChange={(e) => {
            const next = e.target.value;
            setDraft(next);
            const parsed = Number(next);
            if (next.trim() !== "" && parsed >= min && parsed <= max) onChange(Number(parsed.toFixed(decimals)));
          }}
          onBlur={() => setDraft(null)}
          className="iq-exact"
        />
      </div>
      <p id={hintId} className="iq-hint" data-invalid={outOfRange || undefined}>
        {outOfRange ? `Enter a value between ${format(min)} and ${format(max)}.` : hint}
      </p>
    </div>
  );
}

export function InterchangeIQClient() {
  const ids = useId();
  const [monthlyVolume, setMonthlyVolume] = useState(DEFAULT_VOLUME);
  const [avgTicket, setAvgTicket] = useState(DEFAULT_TICKET);
  const [creditPct, setCreditPct] = useState(DEFAULT_CREDIT_PCT);
  const [amexOfCredit, setAmexOfCredit] = useState(DEFAULT_AMEX_OF_CREDIT);
  const [channel, setChannel] = useState<PaymentChannel>("online");
  const [includeContracts, setIncludeContracts] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const contractsShown = includeContracts && channel === "online";

  const cardMix = useMemo(() => buildCardMix(creditPct, amexOfCredit), [creditPct, amexOfCredit]);
  const results = useMemo(
    () =>
      calcProcessorResults(
        monthlyVolume,
        avgTicket,
        cardMix,
        channel,
        includeContracts,
      ),
    [monthlyVolume, avgTicket, cardMix, channel, includeContracts],
  );
  const cheapest = results[0];
  const worst = results[results.length - 1];
  const savingsVsWorst = worst.monthlyFee - cheapest.monthlyFee;
  const annualSavings = savingsVsWorst * 12;

  const statementRows = useMemo(() => feeStatement(results), [results]);
  const cheapestRows = statementRows.filter((row) => row.isCheapest);
  const cheapestNames = cheapestRows.map((row) => row.name).join(" and ");
  const cheapestVerdict = cheapestRows.length > 1 ? `${cheapestNames} tie` : `${cheapestNames} wins`;
  const resultById = new Map(results.map((result) => [result.id, result]));

  const breakevenTicket = calcStripeBreakevenTicket(cardMix);
  const scale = useMemo(() => breakevenScale(avgTicket, breakevenTicket), [avgTicket, breakevenTicket]);
  const hasBreakeven = breakevenTicket !== null && breakevenTicket > 0;

  // A closed row prints its fee and nothing else, so every row opens for the
  // print and the ones opened here close again afterwards, including after a
  // cancelled print.
  useEffect(() => {
    // Accumulated, since a second beforeprint can arrive before the afterprint.
    let opened: HTMLDetailsElement[] = [];
    const openRows = () => {
      document.querySelectorAll<HTMLDetailsElement>(".iq-statement details:not([open])").forEach((row) => {
        row.open = true;
        opened.push(row);
      });
    };
    const restoreRows = () => {
      opened.forEach((row) => {
        row.open = false;
      });
      opened = [];
    };
    window.addEventListener("beforeprint", openRows);
    window.addEventListener("afterprint", restoreRows);
    return () => {
      window.removeEventListener("beforeprint", openRows);
      window.removeEventListener("afterprint", restoreRows);
    };
  }, []);

  function handleReset() {
    setChannel("online");
    setIncludeContracts(false);
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

  return (
    <div className="iq" data-testid="interchange-iq-shell">
      <div className="iq-page c97-shell c97-frame">
        <header className="iq-title">
          <h1>Interchange IQ</h1>
          <p>
            Compare six card processors using the same online or in-person channel. Published flat rates are
            shown first, and you can include assumed custom contracts to explore how a quote would change the costs.
          </p>
        </header>

        <div className="iq-calc">
          {/* The four business inputs come first in the DOM, so the figures and the fee comparison they drive follow them. */}
          <section className="iq-inputs" aria-labelledby={`${ids}-inputs`}>
            <div className="iq-section-head">
              <h2 id={`${ids}-inputs`}>Your business</h2>
              <button type="button" onClick={handleReset} aria-label="Reset all inputs to defaults" className="iq-link">
                <RefreshCw size={14} aria-hidden="true" />
                Reset
              </button>
            </div>

            <label className="iq-channel">
              Payment channel
              <select
                value={channel}
                onChange={(event) =>
                  setChannel(
                    event.target.value === "in-person" ? "in-person" : "online",
                  )
                }
              >
                <option value="online">Online checkout</option>
                <option value="in-person">In person, card present</option>
              </select>
            </label>
            <label className="iq-contracts">
              <input
                type="checkbox"
                checked={includeContracts}
                onChange={(event) => setIncludeContracts(event.target.checked)}
              />{" "}
              Include assumed custom contracts
            </label>
            {includeContracts ? (
              <p className="iq-hint">
                {contractsShown
                  ? "Custom markups are illustrative assumptions. Any apparent saving depends on receiving that quote and excludes network and assessment fees."
                  : "Assumed contracts are priced for online checkout only, because the interchange estimates here are not split by payment channel. Switch to online checkout to include them."}
              </p>
            ) : null}
            <Slider
              label="Monthly volume"
              exactLabel="Volume per month in dollars"
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
              exactLabel="Ticket size in dollars"
              value={avgTicket}
              min={5}
              max={500}
              step={5}
              decimals={2}
              onChange={setAvgTicket}
              format={fmtTicket}
              hint="Per-transaction fixed fees matter more at lower tickets"
            />

            <Slider
              label="% Credit (Visa/MC)"
              exactLabel="Credit share in percent"
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
              exactLabel="Amex share of credit in percent"
              value={amexOfCredit}
              min={0}
              max={50}
              step={1}
              onChange={setAmexOfCredit}
              format={(v) => `${v}%`}
              hint={`Amex = ${((creditPct / 100) * (amexOfCredit / 100) * 100).toFixed(1)}% of total`}
            />

            <div className="iq-mix">
              <div className="iq-mix-head">
                <h3>Card mix</h3>
                <button
                  type="button"
                  onClick={() => setShowInfo(!showInfo)}
                  aria-label="Learn about card mix"
                  aria-expanded={showInfo}
                  aria-controls="card-mix-info"
                  className="iq-info"
                >
                  <Info size={16} aria-hidden="true" />
                </button>
              </div>
              {showInfo ? (
                <p id="card-mix-info" className="iq-hint">
                  Different card types carry different interchange rates. Debit (Reg II) is much lower than consumer
                  credit. Amex runs its own network and typically costs more.
                </p>
              ) : null}
              <dl>
                {cardMixRows.map((row) => (
                  <div key={row.label} className="iq-mix-row">
                    <dt>{row.label}</dt>
                    <dd className="iq-mix-pct">{row.pct.toFixed(1)}%</dd>
                    <dd className="iq-mix-rate">{row.rate}</dd>
                    <dd className="iq-mix-bar" aria-hidden="true">
                      <span style={{ width: `${Math.max(row.pct, 0.5)}%` }} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* On a phone this wrapper becomes display: contents, so the verdict prints above the inputs and the statement after them. */}
          <div className="iq-aside">
            <p role="status" aria-live="polite" className="iq-verdict">
              <span>
                {cheapestVerdict}
                {contractsShown
                  ? " under these assumptions"
                  : " on published rates"}
              </span>
              <span className="iq-verdict-detail">
                {fmtFull(cheapest.monthlyFee)} a month{cheapestRows.length > 1 ? " each" : ""}, which is{" "}
                {fmtFull(savingsVsWorst)} a month and {fmtFull(annualSavings)} a year less than {worst.name}.
              </span>
            </p>

            <section className="iq-statement-section" aria-labelledby={`${ids}-statement`}>
              <h2 id={`${ids}-statement`}>Monthly fee breakdown</h2>
              {/* The transaction count is the same for every processor, so it prints once here rather than on all seven rows. */}
              <p className="iq-meta">
                {`${results.length} options · ${Math.round(cheapest.txCount).toLocaleString("en-US")} transactions a month · sorted cheapest first`}
              </p>
              <ol className="iq-statement">
                {statementRows.map((row) => {
                  const result = resultById.get(row.id)!;
                  return (
                    <li key={row.id} data-cheapest={row.isCheapest || undefined}>
                      <details>
                        <summary>
                          <span className="iq-row-name">
                            {row.name}
                            <span className="iq-tag">{row.model}</span>
                          </span>
                          <span className="iq-bar" aria-hidden="true">
                            <span style={{ width: `${row.fraction * 100}%` }} />
                          </span>
                          <span className="iq-row-fee">{fmtFull(row.fee)}</span>
                          <span className="iq-row-mark">{row.isCheapest ? <span>Cheapest</span> : null}</span>
                        </summary>
                        <dl className="iq-row-detail">
                          <div>
                            <dt>Per transaction</dt>
                            <dd>{fmtFull(result.perTxAvg)}</dd>
                          </div>
                          <div>
                            <dt>Effective rate</dt>
                            <dd>{(result.effectiveRate * 100).toFixed(2)}%</dd>
                          </div>
                          <div>
                            <dt>Pricing</dt>
                            <dd>
                              {result.note}
                              {result.sourceUrl ? (
                                <>
                                  {" "}
                                  ·{" "}
                                  <a
                                    href={result.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Rate source
                                  </a>
                                </>
                              ) : null}
                            </dd>
                          </div>
                        </dl>
                      </details>
                    </li>
                  );
                })}
              </ol>
            </section>

            {contractsShown ? (
              <section className="iq-breakeven" id="breakeven" aria-labelledby={`${ids}-breakeven`}>
                <h2 id={`${ids}-breakeven`}>Stripe flat vs Stripe IC+</h2>
                {hasBreakeven ? (
                  <p>
                    With your card mix, Stripe IC+ becomes cheaper than Stripe
                    flat rate once the average ticket passes{" "}
                    <span className="iq-fig">
                      ${(breakevenTicket ?? 0).toFixed(2)}
                    </span>
                    . Your current average ticket is{" "}
                    <span className="iq-fig">{fmtTicket(avgTicket)}</span>, and{" "}
                    {avgTicket >= (breakevenTicket ?? 0) ? "IC+ wins on unit economics." : "flat rate wins per transaction."}
                  </p>
                ) : (
                  <p>
                    At your current card mix, Stripe IC+ costs less than Stripe
                    flat at every ticket size, so there is no breakeven to find.
                    The IC+ markup is an assumed custom contract, and the IC+
                    totals here leave out card network and assessment fees, so
                    real IC+ costs run higher.
                  </p>
                )}

              <figure className="iq-track-figure">
                <div className="iq-track">
                  <span
                    className="iq-track-mark"
                    data-kind="ticket"
                    style={{ left: `${scale.ticketFraction * 100}%` }}
                    aria-hidden="true"
                  />
                  {hasBreakeven && scale.breakevenFraction !== null ? (
                    <span
                      className="iq-track-mark"
                      data-kind="breakeven"
                      style={{ left: `${scale.breakevenFraction * 100}%` }}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
                <figcaption>
                  <span>$5</span>
                  <span>
                    <span className="iq-key" data-kind="ticket" aria-hidden="true" />
                    Avg ticket {fmtTicket(avgTicket)}
                    {hasBreakeven ? (
                      <>
                        {" · "}
                        <span className="iq-key" data-kind="breakeven" aria-hidden="true" />
                        Breakeven ${(breakevenTicket ?? 0).toFixed(2)}
                      </>
                    ) : null}
                  </span>
                  <span>$500</span>
                </figcaption>
              </figure>

                {hasBreakeven ? (
                  <p className="iq-fine">
                    Stripe IC+ uses an assumed custom contract, and the IC+
                    totals here leave out card network and assessment fees, so
                    real IC+ costs run higher.
                  </p>
                ) : null}
              </section>
            ) : null}
          </div>
        </div>

        <section className="iq-primer" aria-labelledby={`${ids}-primer`}>
          <h2 id={`${ids}-primer`}>How payment processing fees work</h2>
          <p>
            Interchange is the fee the card-issuing bank charges every time a card is swiped or typed in. Visa and
            Mastercard set it, not your processor, and it flows from the merchant to the acquirer to the issuer. Your
            processor either passes it through or bundles it into a flat rate.
          </p>
          <p>
            Flat rate pricing, such as 2.9% + $0.30, bundles interchange, network assessments, and the processor&apos;s
            markup into one predictable number. Interchange plus passes the actual interchange cost through to you and
            adds a visible markup, which is cheaper at scale when your card mix is favorable.
          </p>
          <p>
            These are representative averages. Real interchange has 300+ rate
            categories by card type, industry code, and auth method. IC+
            requires an individual quote, and the IC+ totals here leave out
            network and assessment fees. Card-present transactions have lower
            interchange than online. Always get actual quotes.
          </p>
          <p className="iq-fine">
            Interchange rates based on published 2024 Visa/Mastercard US
            schedules and Amex OptBlue program averages. Processor fees checked{" "}
            {PROCESSOR_RATES_AS_OF} on the linked US pricing pages. Shopify
            includes its $29 monthly equivalent on annual billing. Hardware,
            optional add-ons, international cards, and refunds are excluded. For
            educational purposes only. Actual rates vary by industry, card type,
            and negotiated terms.
          </p>
        </section>
      </div>
    </div>
  );
}
