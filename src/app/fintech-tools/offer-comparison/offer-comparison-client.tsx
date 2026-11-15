"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { trackToolAction } from "@/lib/analytics";
import { readBrowserStorageString, writeBrowserStorageJson } from "@/lib/browserStorage";
import { useLocalStoragePersistenceStatus, useLocalStorageString } from "@/hooks/useLocalStorageString";
import { formatCurrency } from "@/lib/retirement/format";
import {
  CLOSE_SHARE,
  MAX_OFFERS,
  MIN_OFFERS,
  OFFER_BOUNDS,
  OFFER_NAME_MAX,
  OFFER_YEARS,
  VESTING_SCHEDULES,
  compareOffers,
  createBlankOffer,
  createDefaultOffers,
  decodeOffers,
  type Offer,
  type OfferComparisonResult,
  type OfferYear,
  type VestingSchedule,
} from "@/lib/offerComparison";
import "./offer-comparison.css";

export const OFFER_COMPARISON_STORAGE_KEY = "offer_comparison_v1";

function parse(raw: string): Offer[] {
  if (!raw) return createDefaultOffers();
  try {
    return decodeOffers(JSON.parse(raw) as unknown);
  } catch {
    return createDefaultOffers();
  }
}

function useOffers() {
  const raw = useLocalStorageString(OFFER_COMPARISON_STORAGE_KEY);
  const offers = useMemo(() => parse(raw), [raw]);
  const result = useMemo(() => compareOffers(offers), [offers]);

  // Each edit reads the latest save, so a change in another tab is never overwritten.
  const update = useCallback((action: string, change: (current: Offer[]) => Offer[]) => {
    trackToolAction({ tool_name: "offer_comparison", action });
    const current = parse(readBrowserStorageString(OFFER_COMPARISON_STORAGE_KEY).value ?? "");
    writeBrowserStorageJson(OFFER_COMPARISON_STORAGE_KEY, decodeOffers(change(current)));
  }, []);

  return { offers, result, update };
}

function formatVerdict(result: OfferComparisonResult) {
  const name = (index: number) => result.offers[index].name;
  const overall = result.close
    ? `Over ${OFFER_YEARS} years these offers land within ${CLOSE_SHARE * 100}% of each other, and ${name(result.leader)} is ahead by ${formatCurrency(result.lead)}`
    : `${name(result.leader)} pays the most over ${OFFER_YEARS} years, ${formatCurrency(result.lead)} more than the next offer`;
  if (result.firstYearLeader === result.leader) return `${overall}.`;
  return `${overall}, but ${name(result.firstYearLeader)} pays more in year 1, by ${formatCurrency(result.firstYearLead)}.`;
}

const COMPONENTS: { key: keyof Omit<OfferYear, "year">; label: string }[] = [
  { key: "base", label: "Base salary" },
  { key: "bonus", label: "Target bonus" },
  { key: "equity", label: "Equity that vests" },
  { key: "signing", label: "Signing bonus" },
  { key: "match", label: "Retirement match" },
];

interface FieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  onChange: (value: number) => void;
}

function NumberField({ label, value, min, max, step, prefix, suffix, onChange }: FieldProps) {
  const id = useId();
  // The typed text stays local until it parses, so clearing a field to retype it does not snap to zero.
  const [draft, setDraft] = useState<string | null>(null);
  const typed = draft !== null && draft.trim() !== "" ? Number(draft) : NaN;
  const outOfRange = Number.isFinite(typed) && (typed < min || typed > max);
  return (
    <div className="ofr-row">
      <label htmlFor={id}>{label}</label>
      <span className="ofr-cell">
        {prefix ? <span aria-hidden="true">{prefix}</span> : null}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={draft ?? String(value)}
          aria-invalid={outOfRange || undefined}
          aria-describedby={outOfRange ? `${id}-range` : undefined}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (next.trim() !== "" && Number.isFinite(Number(next))) onChange(Number(next));
          }}
          onBlur={() => setDraft(null)}
        />
        {suffix ? <span aria-hidden="true">{suffix}</span> : null}
      </span>
      {outOfRange ? (
        <span id={`${id}-range`} className="ofr-note">
          Between {min.toLocaleString("en-US")} and {max.toLocaleString("en-US")}
        </span>
      ) : null}
    </div>
  );
}

function OfferInputs({
  offer,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  offer: Offer;
  index: number;
  canRemove: boolean;
  onChange: (next: Partial<Offer>) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const num = (key: keyof typeof OFFER_BOUNDS) => ({
    ...OFFER_BOUNDS[key],
    value: offer[key],
    onChange: (value: number) => onChange({ [key]: value }),
  });
  return (
    <fieldset className="ofr-offer" data-offer={index}>
      <legend className="sr-only">Offer {index + 1}</legend>
      <div className="ofr-offer-head">
        <span className="ofr-swatch" aria-hidden="true" />
        <label htmlFor={`${id}-name`} className="sr-only">
          Offer {index + 1} name
        </label>
        <input
          id={`${id}-name`}
          className="ofr-name"
          type="text"
          maxLength={OFFER_NAME_MAX}
          value={offer.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
        {canRemove ? (
          <button type="button" className="ofr-text-btn" onClick={onRemove}>
            Remove
          </button>
        ) : null}
      </div>
      <NumberField label="Base salary" prefix="$" step={5000} {...num("baseSalary")} />
      <NumberField label="Target bonus" suffix="% of base" step={1} {...num("bonusPercent")} />
      <NumberField label="Signing bonus" prefix="$" step={5000} {...num("signingBonus")} />
      <NumberField label="Equity grant" prefix="$" suffix="total" step={10000} {...num("equityGrant")} />
      <div className="ofr-row">
        <label htmlFor={`${id}-vesting`}>Vesting by year</label>
        <span className="ofr-cell">
          <select
            id={`${id}-vesting`}
            value={offer.vesting}
            onChange={(event) => onChange({ vesting: event.target.value as VestingSchedule })}
          >
            {(Object.keys(VESTING_SCHEDULES) as VestingSchedule[]).map((schedule) => (
              <option key={schedule} value={schedule}>
                {VESTING_SCHEDULES[schedule].label}
              </option>
            ))}
          </select>
        </span>
      </div>
      <NumberField label="Stock price change" suffix="%/yr" step={1} {...num("equityGrowthPercent")} />
      <NumberField label="Retirement match" suffix="% of base" step={0.5} {...num("matchPercent")} />
      <NumberField label="Yearly raise" suffix="%" step={0.5} {...num("raisePercent")} />
    </fieldset>
  );
}

export function OfferComparisonClient() {
  const { offers, result, update } = useOffers();
  const persistenceStatus = useLocalStoragePersistenceStatus(OFFER_COMPARISON_STORAGE_KEY);
  // Fields keep a local draft while typing, so Reset and Remove remount them to drop a stale draft.
  const [resetKey, setResetKey] = useState(0);
  const ids = useId();
  const maxYear = Math.max(...result.offers.flatMap((offer) => offer.years.map((year) => year.total)), 1);

  return (
    <div className="ofr">
      <div className="ofr-page c97-shell c97-frame">
        <header className="ofr-title">
          <h1>Offer Comparison Calculator</h1>
          <p>
            This lines up two or three job offers year by year across the four years an equity grant usually takes to
            vest, so a big signing bonus or a back loaded grant shows up in the year it actually pays.
          </p>
          <a href="#offer-assumptions" className="ofr-link">
            Assumptions and limits
          </a>
        </header>

        <section aria-labelledby={`${ids}-offers`}>
          <div className="ofr-section-head">
            <h2 id={`${ids}-offers`}>Your offers</h2>
            <div className="ofr-actions">
              {offers.length < MAX_OFFERS ? (
                <button
                  type="button"
                  className="ofr-text-btn"
                  onClick={() => update("add_offer", (current) => [...current, createBlankOffer(current.length)])}
                >
                  Add an offer
                </button>
              ) : null}
              <button
                type="button"
                className="ofr-text-btn"
                onClick={() => {
                  update("reset", () => createDefaultOffers());
                  setResetKey((key) => key + 1);
                }}
              >
                Reset
              </button>
            </div>
          </div>
          <div className="ofr-offers" key={resetKey}>
            {offers.map((offer, index) => (
              <OfferInputs
                key={index}
                offer={offer}
                index={index}
                canRemove={offers.length > MIN_OFFERS}
                onChange={(next) =>
                  update("input_edit", (current) => current.map((o, i) => (i === index ? { ...o, ...next } : o)))
                }
                onRemove={() => {
                  update("remove_offer", (current) => current.filter((_, i) => i !== index));
                  setResetKey((key) => key + 1);
                }}
              />
            ))}
          </div>
        </section>

        <section className="ofr-result" aria-labelledby={`${ids}-result`}>
          <h2 id={`${ids}-result`}>What each offer pays</h2>
          <p role="status" aria-live="polite" className="ofr-verdict">
            {formatVerdict(result)}
          </p>

          <div className="ofr-table-wrap">
            <table className="ofr-table">
              <caption className="sr-only">Total pay by year, before tax</caption>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="sr-only">Year</span>
                  </th>
                  {result.offers.map((offer, index) => (
                    <th scope="col" key={index} data-offer={index}>
                      <span className="ofr-swatch" aria-hidden="true" />
                      {offer.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: OFFER_YEARS }, (_, i) => (
                  <tr key={i}>
                    <th scope="row">Year {i + 1}</th>
                    {result.offers.map((offer, index) => (
                      <td key={index} data-offer={index}>
                        {formatCurrency(offer.years[i].total)}
                        <span
                          className="ofr-bar"
                          aria-hidden="true"
                          style={{ inlineSize: `${(Math.max(0, offer.years[i].total) / maxYear) * 100}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="ofr-total">
                  <th scope="row">{OFFER_YEARS} year total</th>
                  {result.offers.map((offer, index) => (
                    <td key={index}>{formatCurrency(offer.sums.total)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="ofr-table-wrap">
            <table className="ofr-table">
              <caption>Where the {OFFER_YEARS} years come from</caption>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="sr-only">Component</span>
                  </th>
                  {result.offers.map((offer, index) => (
                    <th scope="col" key={index}>
                      {offer.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPONENTS.map(({ key, label }) => (
                  <tr key={key}>
                    <th scope="row">{label}</th>
                    {result.offers.map((offer, index) => (
                      <td key={index}>{formatCurrency(offer.sums[key])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p id="offer-assumptions" className="ofr-fine">
            <span className="ofr-fine-label">Assumptions and limits</span> Educational only, not financial or tax
            advice. Every figure is before tax, so a difference in state income tax between two cities is not in it.
            Bonuses count at their target, the signing bonus lands in year 1 with no clawback, and each year&apos;s
            vest is priced at the middle of that year at the stock price change you enter. Refresher grants, a
            vesting cliff inside year 1, benefits beyond the retirement match, and cost of living are left out. The
            two starting offers are example numbers, not real offers.
          </p>
          <p className="ofr-fine">
            {persistenceStatus === "memory-only"
              ? "Browser storage is unavailable, so changes last only while this tab is open."
              : "Saved in your browser. No account, no server."}
          </p>
        </section>
      </div>
    </div>
  );
}
