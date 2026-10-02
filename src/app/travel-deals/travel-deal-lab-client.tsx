"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Bus,
  CalendarClock,
  Check,
  Coins,
  Compass,
  ExternalLink,
  Plane,
  Sparkles,
} from "lucide-react";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { useClientNow } from "@/hooks/useClientNow";
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
import { fareGauge } from "./fareGauge";
import { FareGaugeSignature } from "./FareGaugeSignature";
import "./travel-deals.css";

/** The whole-party quote cap, as the fare checker had it, so a 12-seat long-haul quote still fits. */
const MAX_PARTY_FARE = 100_000;

const STORAGE_KEY = "travel-deals:v1";
const ROUTE = "/travel-deals";

const REGION_IDS = new Set<string>(DESTINATION_REGIONS.map((region) => region.id));
const TACTIC_IDS = new Set<string>(DEAL_TACTICS.map((tactic) => tactic.id));

interface TripState {
  regionId: RegionId;
  departureDate: string;
  nights: number;
  travelers: number;
  budget: number;
  checkedTactics: string[];
}

const DEFAULT_STATE: TripState = {
  regionId: "western-europe",
  departureDate: "",
  nights: 5,
  travelers: 2,
  budget: 3000,
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
    checkedTactics,
  };
}

function loadState(): TripState {
  return readValidatedBrowserStorage(STORAGE_KEY, decodeState, () => DEFAULT_STATE).value;
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

type CategoryFilter = TacticCategory | "all";

const FILTER_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "flights", label: "Flights" },
  { value: "hotels", label: "Hotels" },
  { value: "points", label: "Points & miles" },
  { value: "timing", label: "Timing" },
  { value: "ground", label: "On the ground" },
];

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
  const [state, setState] = useState<TripState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState<CategoryFilter>("all");

  // Ephemeral calculator inputs, quick checks that don't belong in the saved trip.
  const [quotedFare, setQuotedFare] = useState(0);
  const [cashPrice, setCashPrice] = useState(1200);
  const [taxesFees, setTaxesFees] = useState(80);
  const [pointsUsed, setPointsUsed] = useState(60000);

  // Load the saved trip after mount so SSR and the first client render match.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time hydration from localStorage
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [state, hydrated]);

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
  const gauge = useMemo(() => fareGauge(perTravelerFare, region), [perTravelerFare, region]);
  const points = useMemo(
    () => (pointsUsed > 0 ? valuePoints(cashPrice, taxesFees, pointsUsed) : null),
    [cashPrice, taxesFees, pointsUsed],
  );

  const visibleTactics = useMemo(
    () =>
      filter === "all"
        ? DEAL_TACTICS
        : DEAL_TACTICS.filter((tactic) => tactic.category === filter),
    [filter],
  );
  const visibleTools = useMemo(
    () =>
      filter === "all"
        ? RECOMMENDED_TOOLS
        : RECOMMENDED_TOOLS.filter((tool) => tool.category === filter),
    [filter],
  );

  const appliedCount = state.checkedTactics.length;

  function updateTrip(patch: Partial<TripState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  function toggleTactic(id: string) {
    setState((current) => {
      const has = current.checkedTactics.includes(id);
      return {
        ...current,
        checkedTactics: has
          ? current.checkedTactics.filter((tacticId) => tacticId !== id)
          : [...current.checkedTactics, id],
      };
    });
  }

  const lead = PROJECT_PRESS[ROUTE].lead;
  const standfirst =
    "A working tool for spending less on a trip without spending days on it. Set the shape of your trip below and I will place your fare on the gauge, mark where you sit in the booking window, tell you whether an award beats paying cash, and hand you the playbook and tools I actually use to find the deals.";
  const disclosure = `Fare bands and the points baseline are curated, unverified estimates as of ${TRAVEL_DEALS_AS_OF}, and none of them is a live quote, so I'd use them to judge a price you've already found.`;

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="Travel Deal Lab"
        standfirst={standfirst}
        readouts={[
          {
            label: "Your fare per seat",
            value: quotedFare > 0 ? formatUsd(Math.round(perTravelerFare)) : "—",
            detail:
              quotedFare > 0
                ? `${FARE_RATING_LABEL[gauge.rating]} vs ${formatUsd(region.typicalFare)} typical`
                : "Add a fare below",
          },
          {
            label: "Booking window",
            value:
              booking.daysUntilDeparture === null
                ? "—"
                : booking.daysUntilDeparture < 0
                ? "Past"
                : `${booking.daysUntilDeparture}d out`,
            detail: booking.headline,
          },
          {
            label: "Points value",
            value: points ? `${points.centsPerPoint.toFixed(2)}¢/pt` : `${POINTS_BASELINE_CENTS.toFixed(1)}¢ baseline`,
            detail: points ? POINTS_RATING_LABEL[points.rating] : "Add points below",
          },
        ]}
      >
        <div data-c97-surface="paper" className="c97-offset" style={{ padding: "var(--c97-sp-3)" }}>
          <FareGaugeSignature
            quoted={perTravelerFare}
            region={region}
            departureDate={state.departureDate}
            today={today}
          />
          <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)", marginTop: "var(--c97-sp-3)" }}>
            {disclosure}
          </p>
        </div>
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn" data-testid="travel-deals-shell">
        <div className="c97-shell">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
            <div className="space-y-4">
              <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)", display: "flex", alignItems: "center", gap: "var(--c97-sp-1)" }}>
                <Compass size={14} aria-hidden="true" />
                Your trip
              </p>

              <label className="grid gap-1.5">
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

              <label className="grid gap-1.5">
                <span className="c97-kicker">Departure date</span>
                <input
                  type="date"
                  value={state.departureDate}
                  onChange={(event) => updateTrip({ departureDate: event.target.value })}
                  className="c97-field"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="c97-kicker">Quoted fare, whole party (USD)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={MAX_PARTY_FARE}
                  step={25}
                  value={quotedFare}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (!Number.isFinite(next)) return;
                    setQuotedFare(Math.min(MAX_PARTY_FARE, Math.max(0, next)));
                  }}
                  className="c97-field"
                />
              </label>

              <div className="grid grid-cols-2" style={{ gap: "var(--c97-sp-3)" }}>
                <NumberField
                  label="Nights"
                  value={state.nights}
                  min={1}
                  max={365}
                  onChange={(nights) => updateTrip({ nights })}
                />
                <NumberField
                  label="Travelers"
                  value={state.travelers}
                  min={1}
                  max={12}
                  onChange={(travelers) => updateTrip({ travelers })}
                />
              </div>

              <NumberField
                label="Total budget (USD)"
                value={state.budget}
                min={0}
                max={1_000_000}
                step={100}
                onChange={(budget) => updateTrip({ budget })}
              />

              <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)", display: "flex", alignItems: "center", gap: "var(--c97-sp-1)" }}>
                <Sparkles size={14} aria-hidden="true" />
                Saved in your browser
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="c97-serif c97-h3">{booking.headline}</h2>
                <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)" }}>
                  {booking.message}
                </p>
              </div>

              {fare ? (
                <div className="c97-fare-row" style={{ alignItems: "start" }}>
                  <p className="c97-prose" style={{ margin: 0 }}>
                    {fare.message}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--c97-sp-1)" }}>
                    <RatingChip tone={FARE_CHIP_TONE[fare.rating]} label={FARE_RATING_LABEL[fare.rating]} />
                    <span className="c97-mono" style={{ fontSize: "var(--c97-fs-small)" }}>
                      {fare.savings >= 0 ? "Save " : "Over by "}
                      {formatUsd(Math.abs(fare.savings))} ({formatSignedPercent(fare.savingsPct)})
                    </span>
                  </div>
                </div>
              ) : (
                <p className="c97-prose" style={{ marginBottom: "var(--c97-sp-3)", color: "var(--c97-ink-2)" }}>
                  Add a quoted fare to score it against the typical band for {region.label}.
                </p>
              )}

              <div>
                <h3 className="c97-serif c97-h3">The budget, split to spend</h3>
                <table className="c97-table" style={{ marginTop: "var(--c97-sp-2)" }}>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th data-align="end">Amount</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Flights</td>
                      <td data-align="end">{formatUsd(budget.flights)}</td>
                      <td>≈35% of budget</td>
                    </tr>
                    <tr>
                      <td>Lodging</td>
                      <td data-align="end">{formatUsd(budget.lodging)}</td>
                      <td>{formatUsd(budget.lodgingPerNight)} a night</td>
                    </tr>
                    <tr>
                      <td>Food</td>
                      <td data-align="end">{formatUsd(budget.food)}</td>
                      <td>{formatUsd(budget.foodPerDayPerPerson)} a day per traveler</td>
                    </tr>
                    <tr>
                      <td>Activities</td>
                      <td data-align="end">{formatUsd(budget.activities)}</td>
                      <td>≈10% of budget</td>
                    </tr>
                    <tr>
                      <td>Buffer</td>
                      <td data-align="end">{formatUsd(budget.buffer)}</td>
                      <td>Fees, tips, surprises</td>
                    </tr>
                  </tbody>
                </table>
                <p className="c97-meta" style={{ marginTop: "var(--c97-sp-2)" }}>
                  {budget.days} days · {budget.travelers} traveler{budget.travelers === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="c97-shell">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)", display: "flex", alignItems: "center", gap: "var(--c97-sp-1)" }}>
                <Coins size={14} aria-hidden="true" />
                Cash or points
              </p>
              <p className="c97-prose" style={{ marginBottom: "var(--c97-sp-2)" }}>
                I net out the taxes and fees an award still charges in cash, then value the rest per
                point against a {POINTS_BASELINE_CENTS.toFixed(1)}¢ baseline for a transferable point.
              </p>

              <div className="grid grid-cols-2" style={{ gap: "var(--c97-sp-3)" }}>
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
              </div>
              <NumberField
                label="Points required"
                value={pointsUsed}
                min={0}
                max={5_000_000}
                step={1000}
                onChange={setPointsUsed}
              />
            </div>

            <div className="space-y-4">
              {points && pointsUsed > 0 ? (
                <>
                  <dl className="c97-stat">
                    <dt className="c97-stat-label">Redemption value</dt>
                    <dd className="c97-stat-value">{points.centsPerPoint.toFixed(2)}¢ per point</dd>
                    <dd className="c97-stat-delta" data-tone={POINTS_CHIP_TONE[points.rating] ?? undefined}>
                      vs {points.baseline.toFixed(1)}¢ baseline
                    </dd>
                  </dl>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--c97-sp-2)" }}>
                    <RatingChip tone={POINTS_CHIP_TONE[points.rating]} label={POINTS_RATING_LABEL[points.rating]} />
                  </div>
                  <p className="c97-prose" style={{ marginBottom: "var(--c97-sp-2)" }}>{points.message}</p>
                </>
              ) : (
                <p className="c97-prose" style={{ color: "var(--c97-ink-2)" }}>
                  Enter how many points the award costs to see the value.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="c97-kicker">The playbook</p>
              <h2 className="c97-poster-sm">How to actually find the deals</h2>
            </div>
            <span className="c97-meta">
              {appliedCount} of {DEAL_TACTICS.length} applied
            </span>
          </div>

          <div className="c97-segmented" style={{ marginBottom: "var(--c97-sp-3)" }} role="group" aria-label="Filter tactics and tools">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
                className="min-h-[44px]"
              >
                {option.label}
              </button>
            ))}
          </div>

          <ul className="c97-columns" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {visibleTactics.map((tactic) => (
              <li key={tactic.id}>
                <TacticCard
                  tactic={tactic}
                  checked={state.checkedTactics.includes(tactic.id)}
                  onToggle={() => toggleTactic(tactic.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="c97-shell space-y-4">
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>The toolkit</p>
          <h2 className="c97-poster-sm">Where I actually search</h2>

          {visibleTools.length === 0 ? (
            <p className="c97-prose" style={{ marginBottom: "var(--c97-sp-2)" }}>
              No tools tagged for this category. The tactics above still apply, and switching the
              filter back to Everything brings back the full toolkit.
            </p>
          ) : (
            <ul style={{ display: "grid", gap: "var(--c97-sp-1)", padding: 0, margin: "0 0 var(--c97-sp-2)", listStyle: "none" }}>
              {visibleTools.map((tool) => (
                <li key={tool.id}>
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="c97-fare-row"
                    style={{ textDecoration: "none", color: "var(--c97-ink)" }}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span className="c97-serif" style={{ display: "block" }}>
                        {tool.name}
                      </span>
                      <span className="c97-meta" style={{ marginTop: "var(--c97-sp-1)" }}>
                        {tool.bestFor}
                      </span>
                      <span className="c97-prose" style={{ display: "block", fontSize: "var(--c97-fs-small)", marginTop: "var(--c97-sp-1)" }}>
                        {tool.note}
                      </span>
                    </span>
                    <ExternalLink size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
                  </a>
                </li>
              ))}
            </ul>
          )}

          <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
            {filter === "all"
              ? "Links open the tool's own site. I have no affiliate relationship with any of them."
              : "Showing tools for this category. Links open the tool's own site."}
          </p>
        </div>
      </section>
    </>
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

function NumberField({ label, value, min, max, step = 1, onChange }: NumberFieldProps) {
  return (
    <label className="grid gap-1.5">
      <span className="c97-kicker">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (!Number.isFinite(next)) return;
          onChange(Math.min(max, Math.max(min, next)));
        }}
        className="c97-field c97-mono"
      />
    </label>
  );
}

interface TacticCardProps {
  tactic: DealTactic;
  checked: boolean;
  onToggle: () => void;
}

function TacticCard({ tactic, checked, onToggle }: TacticCardProps) {
  const Icon = CATEGORY_ICON[tactic.category];
  return (
    <article className="c97-panel" style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-3)", height: "100%" }}>
      <div className="flex items-center justify-between gap-2">
        <span className="c97-meta" style={{ display: "flex", alignItems: "center", gap: "var(--c97-sp-1)" }}>
          <Icon size={14} aria-hidden="true" />
          {CATEGORY_LABELS[tactic.category]}
        </span>
        <span className="c97-chip">{IMPACT_LABEL[tactic.impact]}</span>
      </div>

      <h3 className="c97-serif c97-h3">{tactic.title}</h3>
      <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", flex: 1 }}>
        {tactic.body}
      </p>

      <button type="button" onClick={onToggle} aria-pressed={checked} className="c97-btn-ghost" style={{ alignSelf: "flex-start" }}>
        <Check size={14} aria-hidden="true" style={{ marginRight: "var(--c97-sp-1)" }} />
        {checked ? "Applied" : "Mark applied"}
      </button>
    </article>
  );
}
