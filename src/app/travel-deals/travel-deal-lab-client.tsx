"use client";

import { useId, useMemo, useState } from "react";
import {
  BedDouble,
  Bus,
  CalendarClock,
  Check,
  Coins,
  Compass,
  ExternalLink,
  Plane,
} from "lucide-react";
import { useClientNow } from "@/hooks/useClientNow";
import { useLocalStorageString } from "@/hooks/useLocalStorageString";
import {
  DEAL_TACTICS,
  DESTINATION_REGIONS,
  POINTS_BASELINE_CENTS,
  RECOMMENDED_TOOLS,
  TRAVEL_DEALS_AS_OF,
} from "@/data/travelDealsSnapshot";
import type {
  DealTactic,
  RegionId,
  TacticCategory,
} from "@/types/travelDeals";
import {
  formatSignedPercent,
  formatUsd,
  getBookingWindow,
  getRegion,
  isIsoDate,
  planBudget,
  scoreFare,
  todayKey,
  valuePoints,
  type FareRating,
  type PointsRating,
} from "@/lib/travelDeals";
import { clamp } from "@/lib/utils";
import { readValidatedBrowserStorage, writeBrowserStorageJson } from "@/lib/browserStorage";
import { FareGaugeSignature } from "./FareGaugeSignature";
import "./travel-deals.css";

/** The whole-party quote cap, as the fare checker had it, so a 12-seat long-haul quote still fits. */
const MAX_PARTY_FARE = 100_000;

/** The playbook opens on its first few tactics, and the rest are one press away. */
const TACTIC_PREVIEW = 6;

const STORAGE_KEY = "travel-deals:v1";

const REGION_IDS = new Set<string>(DESTINATION_REGIONS.map((region) => region.id));
const TACTIC_IDS = new Set<string>(DEAL_TACTICS.map((tactic) => tactic.id));

interface TripState {
  regionId: RegionId;
  departureDate: string;
  nights: number;
  travelers: number;
  budget: number;
  /** The quote for the whole party, in dollars. Zero means no fare entered yet. */
  quotedFare: number;
  checkedTactics: string[];
}

const DEFAULT_STATE: TripState = {
  regionId: "western-europe",
  departureDate: "",
  nights: 5,
  travelers: 2,
  budget: 3000,
  quotedFare: 0,
  checkedTactics: [],
};

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? clamp(Math.round(numeric), min, max) : fallback;
}

function decodeState(value: unknown): TripState {
  const parsed = value as Record<string, unknown>;
  const regionId =
    typeof parsed.regionId === "string" && REGION_IDS.has(parsed.regionId)
      ? (parsed.regionId as RegionId)
      : DEFAULT_STATE.regionId;
  const departureDate = isIsoDate(parsed.departureDate) ? parsed.departureDate : "";
  const checkedTactics = Array.isArray(parsed.checkedTactics)
    ? parsed.checkedTactics.filter(
        (id): id is string => typeof id === "string" && TACTIC_IDS.has(id),
      )
    : [];
  return {
    regionId,
    departureDate,
    nights: clampNumber(parsed.nights, 1, 365, DEFAULT_STATE.nights),
    travelers: clampNumber(parsed.travelers, 1, 12, DEFAULT_STATE.travelers),
    budget: clampNumber(parsed.budget, 0, 1_000_000, DEFAULT_STATE.budget),
    quotedFare: clampNumber(parsed.quotedFare, 0, MAX_PARTY_FARE, DEFAULT_STATE.quotedFare),
    checkedTactics,
  };
}

function loadState(): TripState {
  return readValidatedBrowserStorage(STORAGE_KEY, decodeState, () => DEFAULT_STATE).value;
}

function parseState(raw: string): TripState {
  if (!raw) return DEFAULT_STATE;
  try {
    return decodeState(JSON.parse(raw));
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: TripState) {
  writeBrowserStorageJson(STORAGE_KEY, state);
}

const CATEGORY_LABELS: Record<TacticCategory, string> = {
  flights: "Flights",
  hotels: "Hotels",
  points: "Points & miles",
  timing: "Timing",
  ground: "On the ground",
};

const CATEGORY_ICON: Record<TacticCategory, typeof Plane> = {
  flights: Plane,
  hotels: BedDouble,
  points: Coins,
  timing: CalendarClock,
  ground: Bus,
};

const IMPACT_LABEL: Record<DealTactic["impact"], string> = {
  high: "High impact",
  medium: "Medium impact",
  low: "Low impact",
};

const FARE_CHIP_TONE: Record<FareRating, "positive" | "negative" | null> = {
  steal: "positive",
  good: "positive",
  fair: null,
  high: "negative",
};

const FARE_RATING_LABEL: Record<FareRating, string> = {
  steal: "Steal",
  good: "Good",
  fair: "Fair",
  high: "High",
};

const POINTS_CHIP_TONE: Record<PointsRating, "positive" | "negative" | null> = {
  excellent: "positive",
  good: "positive",
  fair: null,
  poor: "negative",
};

const POINTS_RATING_LABEL: Record<PointsRating, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

function RatingChip({ tone, label }: { tone: "positive" | "negative" | null; label: string }) {
  return (
    <span className={`c97-chip${tone ? ` c97-chip-${tone}` : ""}`}>{label}</span>
  );
}

export function TravelDealLabClient() {
  const rawState = useLocalStorageString(STORAGE_KEY);
  const state = useMemo(() => parseState(rawState), [rawState]);

  const [showAllTactics, setShowAllTactics] = useState(false);
  const quotedFare = state.quotedFare;

  // The points check is a quick calculation, so its inputs are not saved with the trip.
  const [cashPrice, setCashPrice] = useState(1200);
  const [taxesFees, setTaxesFees] = useState(80);
  const [pointsUsed, setPointsUsed] = useState(60000);

  const region = getRegion(state.regionId) ?? DESTINATION_REGIONS[0];
  // "Today" depends on the visitor's own clock and zone, so it can only be
  // known on the client; null here means the server render and the first
  // hydration pass agree on "not yet known" instead of disagreeing on "now".
  const nowMs = useClientNow();
  const today = useMemo(() => (nowMs === null ? null : todayKey(new Date(nowMs))), [nowMs]);
  const booking = useMemo(
    () => getBookingWindow(region, state.departureDate, today),
    [region, state.departureDate, today],
  );
  const budget = useMemo(
    () => planBudget(state.budget, state.nights, state.travelers),
    [state.budget, state.nights, state.travelers],
  );
  const fare = useMemo(
    () => (quotedFare > 0 ? scoreFare(quotedFare, region, state.travelers) : null),
    [quotedFare, region, state.travelers],
  );
  // The quote is for the whole party and the region's band is per seat, so the gauge reads the per-seat fare.
  const perTravelerFare = quotedFare / Math.max(1, state.travelers);
  const points = useMemo(
    () => (pointsUsed > 0 ? valuePoints(cashPrice, taxesFees, pointsUsed) : null),
    [cashPrice, taxesFees, pointsUsed],
  );

  const appliedCount = state.checkedTactics.length;

  function updateTrip(patch: Partial<TripState>) {
    saveState({ ...loadState(), ...patch });
  }

  function toggleTactic(id: string) {
    const current = loadState();
    const has = current.checkedTactics.includes(id);
    saveState({
      ...current,
      checkedTactics: has
        ? current.checkedTactics.filter((tacticId) => tacticId !== id)
        : [...current.checkedTactics, id],
    });
  }

  const disclosure = `Fare bands and the points baseline are curated, unverified estimates as of ${TRAVEL_DEALS_AS_OF}, and none of them is a live quote, so I'd use them to judge a price you've already found.`;
  const shownTactics = showAllTactics ? DEAL_TACTICS : DEAL_TACTICS.slice(0, TACTIC_PREVIEW);

  return (
    <div className="td-root">
      <div className="c97-shell c97-frame td-page">
        <header className="td-head">
          <h1>Travel Deal Lab</h1>
          <p className="td-lede">
            Enter a trip and the fare you were quoted, and I place that fare against the region&rsquo;s typical band and
            mark where today sits in the booking window.
          </p>
        </header>

        <div className="td-calc" data-testid="travel-deals-shell">
          <div className="td-inputs" role="group" aria-label="Your trip and fare">
            <label className="td-field">
              <span className="c97-kicker">Destination region</span>
              <select
                value={state.regionId}
                onChange={(event) => updateTrip({ regionId: event.target.value as RegionId })}
                className="c97-field"
              >
                {DESTINATION_REGIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="td-field">
              <span className="c97-kicker">Departure date</span>
              <input
                type="date"
                value={state.departureDate}
                onChange={(event) => updateTrip({ departureDate: event.target.value })}
                className="c97-field"
              />
            </label>

            <NumberField
              label="Quoted fare, whole party (USD)"
              value={quotedFare}
              min={0}
              max={MAX_PARTY_FARE}
              step={25}
              onChange={(next) => updateTrip({ quotedFare: next })}
            />

            <NumberField
              label="Travelers"
              value={state.travelers}
              min={1}
              max={12}
              onChange={(travelers) => updateTrip({ travelers })}
            />

            <p className="td-note">Your trip, fare, and budget are saved in this browser.</p>
          </div>

          <section className="td-result" aria-label="Fare check">
            <div className="td-verdict">
              <h2 className="c97-kicker">Your fare · {region.label}</h2>
              {fare ? (
                <>
                  <p className="td-verdict-line">
                    <span className="td-verdict-fare">{formatUsd(Math.round(perTravelerFare))}</span>
                    <span className="td-verdict-unit">a seat, against {formatUsd(region.typicalFare)} typical</span>
                    <RatingChip tone={FARE_CHIP_TONE[fare.rating]} label={FARE_RATING_LABEL[fare.rating]} />
                  </p>
                  <p className="td-savings">
                    {fare.savings >= 0 ? "Save " : "Over by "}
                    {formatUsd(Math.abs(fare.savings))}
                    {state.travelers > 1 ? " for the party" : ""} ({formatSignedPercent(fare.savingsPct)})
                  </p>
                  <p>{fare.message}</p>
                </>
              ) : (
                <p className="td-prompt">Add a quoted fare to score it against the typical price for {region.label}.</p>
              )}
            </div>

            <FareGaugeSignature
              quoted={perTravelerFare}
              rating={fare?.rating ?? null}
              region={region}
              departureDate={state.departureDate}
              today={today}
            />

            <div className="td-row">
              <h3>
                <CalendarClock size={16} aria-hidden="true" />
                Booking window
              </h3>
              <div>
                <p className="td-row-lead">{booking.headline}</p>
                <p>{booking.message}</p>
              </div>
            </div>

            <div className="td-row">
              <h3>
                <Compass size={16} aria-hidden="true" />
                Budget split
              </h3>
              <div>
                <table className="c97-table td-table">
                  <caption className="sr-only">Budget split</caption>
                  <tbody>
                    <tr>
                      <th scope="row">Flights</th>
                      <td data-align="end">{formatUsd(budget.flights)}</td>
                      <td>≈35% of budget</td>
                    </tr>
                    <tr>
                      <th scope="row">Lodging</th>
                      <td data-align="end">{formatUsd(budget.lodging)}</td>
                      <td>{formatUsd(budget.lodgingPerNight)} a night</td>
                    </tr>
                    <tr>
                      <th scope="row">Food</th>
                      <td data-align="end">{formatUsd(budget.food)}</td>
                      <td>{formatUsd(budget.foodPerDayPerPerson)} a day per traveler</td>
                    </tr>
                    <tr>
                      <th scope="row">Activities</th>
                      <td data-align="end">{formatUsd(budget.activities)}</td>
                      <td>≈10% of budget</td>
                    </tr>
                    <tr>
                      <th scope="row">Buffer</th>
                      <td data-align="end">{formatUsd(budget.buffer)}</td>
                      <td>Fees, tips, surprises</td>
                    </tr>
                  </tbody>
                </table>
                <p className="td-note">
                  {formatUsd(state.budget)} over {budget.days} days for {budget.travelers} traveler
                  {budget.travelers === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="td-row">
              <h3>
                <Coins size={16} aria-hidden="true" />
                Points value
              </h3>
              <div>
                {points ? (
                  <>
                    <p className="td-row-lead">
                      {points.centsPerPoint.toFixed(2)}¢ per point, against a {points.baseline.toFixed(1)}¢ baseline{" "}
                      <RatingChip tone={POINTS_CHIP_TONE[points.rating]} label={POINTS_RATING_LABEL[points.rating]} />
                    </p>
                    <p>{points.message}</p>
                  </>
                ) : (
                  <p>Enter how many points the award costs to see the value.</p>
                )}
              </div>
            </div>

            <p className="td-note td-disclosure">{disclosure}</p>
          </section>

          <div className="td-more">
            <details className="td-disclose" open>
              <summary>Budget</summary>
              <div className="td-disclose-body">
                <NumberField
                  label="Nights"
                  value={state.nights}
                  min={1}
                  max={365}
                  onChange={(nights) => updateTrip({ nights })}
                />
                <NumberField
                  label="Total budget (USD)"
                  value={state.budget}
                  min={0}
                  max={1_000_000}
                  step={100}
                  onChange={(nextBudget) => updateTrip({ budget: nextBudget })}
                />
              </div>
            </details>

            <details className="td-disclose" open>
              <summary>Cash or points</summary>
              <div className="td-disclose-body">
                <p className="td-note">
                  I net out the taxes and fees an award still charges in cash, then value the rest per point against a{" "}
                  {POINTS_BASELINE_CENTS.toFixed(1)}¢ baseline for a transferable point. These three numbers are a quick
                  check and are not saved.
                </p>
                <NumberField
                  label="Cash price (USD)"
                  value={cashPrice}
                  min={0}
                  max={100_000}
                  step={25}
                  onChange={setCashPrice}
                />
                <NumberField
                  label="Taxes & fees (USD)"
                  value={taxesFees}
                  min={0}
                  max={10_000}
                  step={5}
                  onChange={setTaxesFees}
                />
                <NumberField
                  label="Points required"
                  value={pointsUsed}
                  min={0}
                  max={5_000_000}
                  step={1000}
                  onChange={setPointsUsed}
                />
              </div>
            </details>
          </div>
        </div>

        <section className="td-playbook" aria-labelledby="td-playbook-title">
          <div className="td-section-head">
            <h2 id="td-playbook-title">How I find a better fare</h2>
            <p className="td-count">
              {appliedCount} of {DEAL_TACTICS.length} applied
            </p>
          </div>
          <ol className="td-tactics">
            {shownTactics.map((tactic) => (
              <TacticRow
                key={tactic.id}
                tactic={tactic}
                checked={state.checkedTactics.includes(tactic.id)}
                onToggle={() => toggleTactic(tactic.id)}
              />
            ))}
          </ol>
          <button
            type="button"
            className="c97-btn-ghost td-more-tactics"
            aria-expanded={showAllTactics}
            onClick={() => setShowAllTactics((current) => !current)}
          >
            {showAllTactics ? "Show fewer tactics" : `Show all ${DEAL_TACTICS.length} tactics`}
          </button>

          <h3 className="td-tools-title">Where I actually search</h3>
          <ul className="td-tools">
            {RECOMMENDED_TOOLS.map((tool) => (
              <li key={tool.id}>
                <a href={tool.url} target="_blank" rel="noopener noreferrer">
                  {tool.name}
                  <ExternalLink size={13} aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                <span className="td-tool-for">{tool.bestFor}</span>
              </li>
            ))}
          </ul>
          <p className="td-note">Links open the tool&rsquo;s own site. I have no affiliate relationship with any of them.</p>
        </section>
      </div>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

/**
 * A number input that lets the field go blank while someone retypes it. The
 * text they type stays as typed, the value it commits is a whole number
 * clamped to the range, and a note under the field says when that changed
 * what they typed. Leaving the field puts the committed value back in it.
 */
function NumberField({ label, value, min, max, step = 1, onChange }: NumberFieldProps) {
  const [draft, setDraft] = useState(String(value));
  const [committed, setCommitted] = useState(value);
  if (committed !== value) {
    // The value changed from outside (a saved trip loading), so show it.
    setCommitted(value);
    setDraft(String(value));
  }
  const typed = draft.trim() === "" ? null : Number(draft);
  const clamped = typed !== null && Number.isFinite(typed) && typed !== value;
  // The note names what moved the number, the range for a value outside it and rounding otherwise.
  const outOfRange = typed !== null && (typed < min || typed > max);
  const noteId = useId();

  return (
    <div className="td-field">
      <label className="td-field">
        <span className="c97-kicker">{label}</span>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={draft}
          aria-describedby={clamped ? noteId : undefined}
          onChange={(event) => {
            const raw = event.target.value;
            setDraft(raw);
            const next = Number(raw);
            if (raw.trim() === "" || !Number.isFinite(next)) return;
            // Rounded here because the saved trip keeps whole numbers. An unrounded commit
            // comes back different, which reads as an outside change and rewrites the text mid-typing.
            const bounded = Math.round(Math.min(max, Math.max(min, next)));
            setCommitted(bounded);
            onChange(bounded);
          }}
          onBlur={() => setDraft(String(value))}
          className="c97-field c97-mono"
        />
      </label>
      {clamped ? (
        <p id={noteId} className="td-note">
          {outOfRange
            ? `This runs from ${min.toLocaleString("en-US")} to ${max.toLocaleString("en-US")}`
            : "This takes whole numbers"}
          , so I&rsquo;m using {value.toLocaleString("en-US")}.
        </p>
      ) : null}
    </div>
  );
}

interface TacticRowProps {
  tactic: DealTactic;
  checked: boolean;
  onToggle: () => void;
}

function TacticRow({ tactic, checked, onToggle }: TacticRowProps) {
  const Icon = CATEGORY_ICON[tactic.category];
  return (
    <li className="td-tactic" data-applied={checked || undefined}>
      <div className="td-tactic-body">
        <h3>{tactic.title}</h3>
        <p>{tactic.body}</p>
        <p className="td-tactic-meta">
          <Icon size={13} aria-hidden="true" />
          {CATEGORY_LABELS[tactic.category]} · {IMPACT_LABEL[tactic.impact]}
        </p>
      </div>
      <button type="button" onClick={onToggle} aria-pressed={checked} className="c97-btn-ghost td-apply">
        <Check size={14} aria-hidden="true" />
        {checked ? "Applied" : "Mark applied"}
      </button>
    </li>
  );
}
