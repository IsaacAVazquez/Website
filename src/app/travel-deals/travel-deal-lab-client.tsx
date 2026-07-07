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
  Info,
  Plane,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";
import { EditorialPillButton } from "@/components/editorial";
import {
  DEAL_TACTICS,
  DESTINATION_REGIONS,
  RECOMMENDED_TOOLS,
  TRAVEL_DEALS_AS_OF,
} from "@/data/travelDealsSnapshot";
import type {
  DealTactic,
  RecommendedTool,
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
  valuePoints,
  type BookingStatus,
  type FareRating,
  type PointsRating,
} from "@/lib/travelDeals";

const STORAGE_KEY = "travel-deals:v1";

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
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function loadState(): TripState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
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
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: TripState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Local persistence is a convenience, not a requirement — ignore quota errors.
  }
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

// Rating → CSS token, kept in one place so every badge stays consistent.
function bookingTone(status: BookingStatus): string {
  switch (status) {
    case "sweet-spot":
      return "var(--home-positive)";
    case "watching":
      return "var(--home-signal)";
    case "closing":
      return "var(--home-warning)";
    case "last-call":
      return "var(--home-negative)";
    default:
      return "var(--home-ink-muted)";
  }
}

function fareTone(rating: FareRating): string {
  switch (rating) {
    case "steal":
      return "var(--home-positive)";
    case "good":
      return "var(--home-signal)";
    case "fair":
      return "var(--home-ink-muted)";
    case "high":
      return "var(--home-negative)";
  }
}

function pointsTone(rating: PointsRating): string {
  switch (rating) {
    case "excellent":
      return "var(--home-positive)";
    case "good":
      return "var(--home-signal)";
    case "fair":
      return "var(--home-ink-muted)";
    case "poor":
      return "var(--home-negative)";
  }
}

const RATING_TEXT: Record<FareRating | PointsRating | BookingStatus, string> = {
  steal: "Steal",
  good: "Good",
  fair: "Fair",
  high: "High",
  excellent: "Excellent",
  poor: "Poor",
  "sweet-spot": "Sweet spot",
  watching: "Watch",
  closing: "Closing",
  "last-call": "Last call",
  "too-early": "Too early",
  departed: "Past",
};

export function TravelDealLabClient() {
  const [state, setState] = useState<TripState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState<CategoryFilter>("all");

  // Ephemeral calculator inputs — quick checks that don't belong in the saved trip.
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
  const booking = useMemo(
    () => getBookingWindow(region, state.departureDate),
    [region, state.departureDate],
  );
  const budget = useMemo(
    () => planBudget(state.budget, state.nights, state.travelers),
    [state.budget, state.nights, state.travelers],
  );
  const fare = useMemo(
    () => (quotedFare > 0 ? scoreFare(quotedFare, region, state.travelers) : null),
    [quotedFare, region, state.travelers],
  );
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

  const budgetCells: HomeStatsCell[] = [
    { label: "Flights", value: formatUsd(budget.flights), sub: "≈ 35% of budget" },
    {
      label: "Lodging",
      value: formatUsd(budget.lodging),
      sub: `${formatUsd(budget.lodgingPerNight)}/night`,
    },
    {
      label: "Food",
      value: formatUsd(budget.food),
      sub: `${formatUsd(budget.foodPerDayPerPerson)}/day per person`,
    },
    { label: "Activities", value: formatUsd(budget.activities), sub: "≈ 10% of budget" },
    { label: "Buffer", value: formatUsd(budget.buffer), sub: "Fees, tips, surprises" },
    {
      label: "Trip length",
      value: `${budget.nights} night${budget.nights === 1 ? "" : "s"}`,
      sub: `${budget.days} days · ${budget.travelers} traveler${budget.travelers === 1 ? "" : "s"}`,
    },
  ];

  return (
    <section
      className="home-page min-h-screen"
      aria-label="Travel Deal Lab"
      data-testid="travel-deals-shell"
    >
      <div className="home-shell home-section">
        <div className="flex flex-col gap-6">
          <div className="tool-topbar">
            <div>
              <p className="tool-crumbs">
                Travel Deal Lab / <strong>{region.label}</strong>
              </p>
              <h1>Travel Deal Lab</h1>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-[var(--home-ink-muted)]">
            A working tool for spending less on a trip without spending days on it. Set the shape of
            your trip and I will tell you when to book, whether a fare or an award is actually a good
            deal, and where the budget should go, then hand you the playbook and the tools I use to
            find the deals.
          </p>

          <div className="tool-meta-chip" role="note">
            <Info size={14} aria-hidden="true" />
            <span>
              Fare bands and the points baseline are rough editorial estimates as of{" "}
              <strong>{TRAVEL_DEALS_AS_OF}</strong>, not live quotes. Use them to judge a price, not
              to predict one.
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
            <TripForm state={state} onChange={updateTrip} />

            <div className="flex flex-col gap-6">
              <BookingWindowCard
                regionLabel={region.label}
                status={booking.status}
                headline={booking.headline}
                message={booking.message}
                daysUntil={booking.daysUntilDeparture}
                sweetSpotMinDays={booking.sweetSpotMinDays}
                sweetSpotMaxDays={booking.sweetSpotMaxDays}
              />

              <HomeStatsPanel
                id="travel-deals-budget"
                title="Budget, split to spend"
                meta={`${formatUsd(state.budget)} total`}
                hideLiveDot
                cells={budgetCells}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FareChecker
              quoted={quotedFare}
              onQuotedChange={setQuotedFare}
              travelers={state.travelers}
              fare={fare}
              regionLabel={region.label}
            />
            <PointsChecker
              cashPrice={cashPrice}
              taxesFees={taxesFees}
              pointsUsed={pointsUsed}
              onCashChange={setCashPrice}
              onTaxesChange={setTaxesFees}
              onPointsChange={setPointsUsed}
              points={points}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="tool-section-header">
              <div>
                <p className="tool-section-kicker">The playbook</p>
                <h2 className="tool-section-title">How to actually find the deals</h2>
              </div>
              <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                {appliedCount} of {DEAL_TACTICS.length} applied
              </span>
            </div>

            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter tactics">
              {FILTER_OPTIONS.map((option) => (
                <EditorialPillButton
                  key={option.value}
                  active={filter === option.value}
                  onClick={() => setFilter(option.value)}
                  role="tab"
                  ariaSelected={filter === option.value}
                  size="sm"
                >
                  {option.label}
                </EditorialPillButton>
              ))}
            </div>

            <ul className="grid gap-4 md:grid-cols-2">
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

          <ToolsSection tools={visibleTools} filter={filter} />
        </div>
      </div>
    </section>
  );
}

interface TripFormProps {
  state: TripState;
  onChange: (patch: Partial<TripState>) => void;
}

function TripForm({ state, onChange }: TripFormProps) {
  return (
    <aside
      aria-label="Trip setup"
      className="flex flex-col gap-4 rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_74%,var(--home-elev-mix))] p-5 shadow-[var(--shadow-sm)] lg:sticky lg:top-24 lg:self-start"
    >
      <p className="tool-rail-label">
        <Compass size={12} aria-hidden="true" />
        Your trip
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
          Destination region
        </span>
        <select
          value={state.regionId}
          onChange={(event) => onChange({ regionId: event.target.value as RegionId })}
          className="w-full min-h-touch rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-3 py-2 text-sm text-[var(--home-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
        >
          {DESTINATION_REGIONS.map((region) => (
            <option key={region.id} value={region.id}>
              {region.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
          Departure date
        </span>
        <input
          type="date"
          value={state.departureDate}
          onChange={(event) => onChange({ departureDate: event.target.value })}
          className="w-full min-h-touch rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-3 py-2 text-sm text-[var(--home-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Nights"
          value={state.nights}
          min={1}
          max={365}
          onChange={(nights) => onChange({ nights })}
        />
        <NumberField
          label="Travelers"
          value={state.travelers}
          min={1}
          max={12}
          onChange={(travelers) => onChange({ travelers })}
        />
      </div>

      <NumberField
        label="Total budget (USD)"
        value={state.budget}
        min={0}
        max={1_000_000}
        step={100}
        onChange={(budget) => onChange({ budget })}
      />

      <p className="tool-rail-foot">
        <Sparkles size={14} aria-hidden="true" />
        Saved in your browser
      </p>
    </aside>
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
    <label className="flex flex-col gap-1.5">
      <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
        {label}
      </span>
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
        className="w-full min-h-touch rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-3 py-2 text-sm tabular-nums text-[var(--home-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
      />
    </label>
  );
}

interface BookingWindowCardProps {
  regionLabel: string;
  status: BookingStatus;
  headline: string;
  message: string;
  daysUntil: number | null;
  sweetSpotMinDays: number;
  sweetSpotMaxDays: number;
}

function BookingWindowCard({
  regionLabel,
  status,
  headline,
  message,
  daysUntil,
  sweetSpotMinDays,
  sweetSpotMaxDays,
}: BookingWindowCardProps) {
  const noDate = daysUntil === null;
  const tone = noDate ? "var(--home-ink-muted)" : bookingTone(status);
  const badgeLabel = noDate ? "Set date" : RATING_TEXT[status];
  return (
    <div className="tool-card flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tool-section-kicker">When to book</p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--home-ink)]">{headline}</h2>
        </div>
        <RatingBadge tone={tone} label={badgeLabel} />
      </div>

      <p className="text-sm leading-relaxed text-[var(--home-ink-muted)]">{message}</p>

      <div className="grid grid-cols-3 gap-3 border-t border-[var(--home-rule)] pt-4">
        <MiniStat
          label="Days out"
          value={daysUntil === null ? "—" : daysUntil < 0 ? "Past" : String(daysUntil)}
        />
        <MiniStat label="Cheaper window" value={`${sweetSpotMinDays}–${sweetSpotMaxDays}d`} />
        <MiniStat label="Region" value={regionLabel} small />
      </div>
    </div>
  );
}

interface FareCheckerProps {
  quoted: number;
  onQuotedChange: (value: number) => void;
  travelers: number;
  fare: ReturnType<typeof scoreFare> | null;
  regionLabel: string;
}

function FareChecker({ quoted, onQuotedChange, travelers, fare, regionLabel }: FareCheckerProps) {
  return (
    <div className="tool-card flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <TrendingDown size={16} className="text-[var(--home-signal)]" aria-hidden="true" />
        <h2 className="text-base font-semibold text-[var(--home-ink)]">Is this fare a deal?</h2>
      </div>
      <p className="text-xs text-[var(--home-ink-muted)]">
        Enter the total price your search shows for {travelers} traveler{travelers === 1 ? "" : "s"} to{" "}
        {regionLabel}. I compare it to the typical band for that trip.
      </p>

      <NumberField
        label="Quoted fare, whole party (USD)"
        value={quoted}
        min={0}
        max={100_000}
        step={25}
        onChange={onQuotedChange}
      />

      {fare && quoted > 0 ? (
        <div className="flex flex-col gap-3 border-t border-[var(--home-rule)] pt-4">
          <div className="flex items-center justify-between gap-3">
            <RatingBadge tone={fareTone(fare.rating)} label={RATING_TEXT[fare.rating]} />
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: fareTone(fare.rating) }}
            >
              {fare.savings >= 0 ? "Save " : "Over by "}
              {formatUsd(Math.abs(fare.savings))} ({formatSignedPercent(fare.savingsPct)})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Your fare" value={formatUsd(fare.quoted)} />
            <MiniStat label="Typical" value={formatUsd(fare.benchmark)} />
          </div>
          <p className="text-sm leading-relaxed text-[var(--home-ink-muted)]">{fare.message}</p>
        </div>
      ) : (
        <p className="border-t border-[var(--home-rule)] pt-4 text-xs text-[var(--home-ink-muted)]">
          Add a quoted total fare to score it against the typical band for this trip.
        </p>
      )}
    </div>
  );
}

interface PointsCheckerProps {
  cashPrice: number;
  taxesFees: number;
  pointsUsed: number;
  onCashChange: (value: number) => void;
  onTaxesChange: (value: number) => void;
  onPointsChange: (value: number) => void;
  points: ReturnType<typeof valuePoints> | null;
}

function PointsChecker({
  cashPrice,
  taxesFees,
  pointsUsed,
  onCashChange,
  onTaxesChange,
  onPointsChange,
  points,
}: PointsCheckerProps) {
  return (
    <div className="tool-card flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Coins size={16} className="text-[var(--home-signal)]" aria-hidden="true" />
        <h2 className="text-base font-semibold text-[var(--home-ink)]">Cash or points?</h2>
      </div>
      <p className="text-xs text-[var(--home-ink-muted)]">
        Compare an award booking to paying cash. I net out the taxes and fees you still pay and value
        the points per point.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Cash price (USD)"
          value={cashPrice}
          min={0}
          max={100_000}
          step={25}
          onChange={onCashChange}
        />
        <NumberField
          label="Taxes & fees (USD)"
          value={taxesFees}
          min={0}
          max={10_000}
          step={5}
          onChange={onTaxesChange}
        />
      </div>
      <NumberField
        label="Points required"
        value={pointsUsed}
        min={0}
        max={5_000_000}
        step={1000}
        onChange={onPointsChange}
      />

      {points && pointsUsed > 0 ? (
        <div className="flex flex-col gap-3 border-t border-[var(--home-rule)] pt-4">
          <div className="flex items-center justify-between gap-3">
            <RatingBadge tone={pointsTone(points.rating)} label={RATING_TEXT[points.rating]} />
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: pointsTone(points.rating) }}
            >
              {points.centsPerPoint.toFixed(2)}¢ / point
            </span>
          </div>
          <p className="text-sm leading-relaxed text-[var(--home-ink-muted)]">{points.message}</p>
        </div>
      ) : (
        <p className="border-t border-[var(--home-rule)] pt-4 text-xs text-[var(--home-ink-muted)]">
          Enter the points an award costs to see the value.
        </p>
      )}
    </div>
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
    <article
      className="flex h-full flex-col gap-3 rounded-[var(--radius-3xl)] border bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] p-5 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
      style={{
        borderColor: checked
          ? "color-mix(in srgb, var(--home-positive) 45%, var(--home-rule))"
          : "var(--home-rule)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-3xs font-mono font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-muted)]">
          <Icon size={13} aria-hidden="true" />
          {CATEGORY_LABELS[tactic.category]}
        </span>
        <span
          className="rounded-full border px-2 py-0.5 text-3xs font-semibold uppercase tracking-[0.14em]"
          style={{
            borderColor:
              tactic.impact === "high"
                ? "color-mix(in srgb, var(--home-signal) 45%, var(--home-rule))"
                : "var(--home-rule)",
            color:
              tactic.impact === "high" ? "var(--home-signal)" : "var(--home-ink-muted)",
          }}
        >
          {IMPACT_LABEL[tactic.impact]}
        </span>
      </div>

      <h3 className="text-base font-semibold text-[var(--home-ink)]">{tactic.title}</h3>
      <p className="flex-1 text-sm leading-relaxed text-[var(--home-ink-muted)]">{tactic.body}</p>

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        className="inline-flex min-h-touch items-center justify-center gap-2 self-start rounded-full border px-4 py-1.5 text-2xs font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
        style={{
          borderColor: checked
            ? "color-mix(in srgb, var(--home-positive) 45%, var(--home-rule))"
            : "var(--home-rule)",
          background: checked
            ? "color-mix(in srgb, var(--home-positive) 14%, transparent)"
            : "transparent",
          color: checked ? "var(--home-positive)" : "var(--home-ink-muted)",
        }}
      >
        <Check size={14} aria-hidden="true" />
        {checked ? "Applied" : "Mark applied"}
      </button>
    </article>
  );
}

interface ToolsSectionProps {
  tools: RecommendedTool[];
  filter: CategoryFilter;
}

function ToolsSection({ tools, filter }: ToolsSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="tool-section-header">
        <div>
          <p className="tool-section-kicker">The toolkit</p>
          <h2 className="tool-section-title">Where I actually search</h2>
        </div>
      </div>

      {tools.length === 0 ? (
        <div className="tool-empty">
          <p>No tools tagged for this category.</p>
          <p>The tactics above still apply. Switch to Everything for the full toolkit →</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <li key={tool.id}>
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col gap-2 rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] p-4 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[var(--home-ink)]">{tool.name}</span>
                  <ExternalLink
                    size={14}
                    className="text-[var(--home-ink-muted)] transition-colors group-hover:text-[var(--home-signal)]"
                    aria-hidden="true"
                  />
                </div>
                <span className="text-3xs font-mono font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                  {tool.bestFor}
                </span>
                <span className="text-sm leading-relaxed text-[var(--home-ink-muted)]">
                  {tool.note}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="text-2xs text-[var(--home-ink-muted)]">
        {filter === "all"
          ? "Links open the tool's own site. I have no affiliate relationship with any of them."
          : "Showing tools for this category. Links open the tool's own site."}
      </p>
    </div>
  );
}

function RatingBadge({ tone, label }: { tone: string; label: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-2xs font-bold uppercase tracking-[0.14em]"
      style={{
        background: `color-mix(in srgb, ${tone} 14%, var(--home-paper))`,
        color: tone,
        border: `1px solid color-mix(in srgb, ${tone} 32%, var(--home-rule))`,
      }}
    >
      {label}
    </span>
  );
}

function MiniStat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-3xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
        {label}
      </p>
      <p
        className={`mt-1 font-semibold text-[var(--home-ink)] ${small ? "text-xs leading-snug" : "text-base tabular-nums"}`}
      >
        {value}
      </p>
    </div>
  );
}
