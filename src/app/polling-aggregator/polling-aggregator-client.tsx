"use client";

import { startTransition, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import type { PollingRouteState, PollingSnapshot, PollingView, Race, RacePoll } from "@/types/polling";
import {
  buildPollingHref,
  normalizePollingState,
  POLLING_VIEW_LABELS,
  POLLING_VIEW_OPTIONS,
  sortRacesByCompetitiveness,
  countSeatsByParty,
} from "./polling-aggregator-state";
import {
  formatDate,
  formatShortDate,
  formatUpdated,
  formatMargin,
  formatNet,
  partyColor,
  getRatingPillStyle,
  getRowStyle,
  buildPolyline,
  DEM_COLOR,
  REP_COLOR,
  TUP_COLOR,
} from "./polling-aggregator-helpers";
import { StateTileGrid } from "./StateTileGrid";
import "./polling-aggregator.css";

interface Props {
  initialState: PollingRouteState;
  snapshot: PollingSnapshot;
}

// ─── Local metric card (home-token equivalent) ─────────────────────────────────

function PollingMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--c97-rule)] bg-[var(--c97-surface)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--c97-ink-2)]">{label}</p>
      <p className="mt-2 text-xl font-bold text-[var(--c97-ink)]">{value}</p>
    </div>
  );
}

// ─── Trend chart (SVG) ─────────────────────────────────────────────────────────

function TrendChart({ snapshot }: { snapshot: PollingSnapshot }) {
  const W = 560;
  const H = 140;
  const PAD = 12;
  const trend = snapshot.approvalTrend;

  if (trend.length < 2) {
    return (
      <p className="text-sm text-[var(--c97-ink-2)]">
        Not enough data to chart the approval trend yet.
      </p>
    );
  }

  // One shared, padded Y-domain across both series so the polylines,
  // gridlines, and end-dots/labels all sit on the same scale.
  const allVals = trend.flatMap((d) => [d.approve, d.disapprove]);
  const minVal = Math.floor(Math.min(...allVals) - 2);
  const maxVal = Math.ceil(Math.max(...allVals) + 2);
  const scaleY = (v: number) =>
    H - PAD - ((v - minVal) / (maxVal - minVal || 1)) * (H - PAD * 2);
  const scaleX = (i: number) =>
    PAD + (trend.length === 1 ? 0 : i / (trend.length - 1)) * (W - PAD * 2);

  const approvePoints = buildPolyline(trend.map((d) => d.approve), W, H, PAD, minVal, maxVal);
  const disapprovePoints = buildPolyline(trend.map((d) => d.disapprove), W, H, PAD, minVal, maxVal);

  const first = trend[0];
  const last = trend[trend.length - 1];
  const chartSummary = `Presidential approval trend from ${formatShortDate(first.date)} to ${formatShortDate(last.date)}. Approve: ${first.approve.toFixed(1)}% to ${last.approve.toFixed(1)}%. Disapprove: ${first.disapprove.toFixed(1)}% to ${last.disapprove.toFixed(1)}%.`;

  return (
    <div className="overflow-x-auto">
      <svg
        // The y labels sit left of the plot and the end labels right of the last
        // point, so the box widens on both sides instead of clipping them.
        viewBox={`-32 0 ${W + 76} ${H + 32}`}
        className="w-full min-w-[300px]"
        aria-label={chartSummary}
        role="img"
      >
        {/* Y-axis gridlines */}
        {[minVal, Math.round((minVal + maxVal) / 2), maxVal].map((val) => {
          const y = scaleY(val);
          return (
            <g key={val}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="var(--c97-rule)" strokeWidth={1} strokeDasharray="3 3" />
              <text x={PAD - 4} y={y + 4} textAnchor="end" fontSize={10} className="c97-polling-chart-text" fill="var(--c97-ink-2)">{val}%</text>
            </g>
          );
        })}

        {/* Disapprove line */}
        <polyline points={disapprovePoints} fill="none" stroke={REP_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Approve line */}
        <polyline points={approvePoints} fill="none" stroke={DEM_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots + labels — last point only */}
        {(() => {
          const lastIdx = trend.length - 1;
          const ax = scaleX(lastIdx);
          const ay = scaleY(last.approve);
          const dy = scaleY(last.disapprove);
          return (
            <>
              <circle cx={ax} cy={ay} r={4} fill={DEM_COLOR} />
              <circle cx={ax} cy={dy} r={4} fill={REP_COLOR} />
              <text x={ax + 6} y={ay + 4} fontSize={10} className="c97-polling-chart-text" fill={DEM_COLOR} fontWeight="600">{last.approve.toFixed(1)}%</text>
              <text x={ax + 6} y={dy + 4} fontSize={10} className="c97-polling-chart-text" fill={REP_COLOR} fontWeight="600">{last.disapprove.toFixed(1)}%</text>
            </>
          );
        })()}

        {/* X-axis labels */}
        {trend.map((d, i) => {
          const x = scaleX(i);
          return (
            <text key={d.date} x={x} y={H + 20} textAnchor="middle" fontSize={10} className="c97-polling-chart-text" fill="var(--c97-ink-2)">
              {formatShortDate(d.date)}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-6 text-xs text-[var(--c97-ink-2)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-6" style={{ background: DEM_COLOR }} />
          Approve
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-6" style={{ background: REP_COLOR }} />
          Disapprove
        </span>
      </div>

      <table className="sr-only">
        <caption>Approval trend data points</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Approve</th>
            <th scope="col">Disapprove</th>
          </tr>
        </thead>
        <tbody>
          {trend.map((d) => (
            <tr key={d.date}>
              <th scope="row">{formatShortDate(d.date)}</th>
              <td>{d.approve.toFixed(1)}%</td>
              <td>{d.disapprove.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Generic ballot bar ────────────────────────────────────────────────────────

function GenericBallotBar({ dem, rep }: { dem: number; rep: number }) {
  const total = dem + rep;
  const demPct = total > 0 ? (dem / total) * 100 : 50;
  return (
    <div className="space-y-2">
      <div
        className="flex h-6 w-full overflow-hidden"
        role="img"
        aria-label={`Generic ballot: Democrats ${dem.toFixed(1)} percent, Republicans ${rep.toFixed(1)} percent`}
      >
        <div style={{ width: `${demPct}%`, background: DEM_COLOR }} className="motion-safe:transition-[width] motion-safe:duration-500" />
        <div style={{ width: `${100 - demPct}%`, background: REP_COLOR }} className="motion-safe:transition-[width] motion-safe:duration-500" />
      </div>
      <div className="flex justify-between text-xs font-semibold">
        {/* Party colour as small text measured under 4.5:1, so the colour moves to a swatch and the number stays in ink. */}
        <span className="inline-flex items-center gap-1" style={{ color: "var(--c97-ink)" }}>
          <span aria-hidden="true" style={{ width: 10, height: 10, background: DEM_COLOR, display: "inline-block" }} />
          Dem. {dem.toFixed(1)}%
        </span>
        <span className="inline-flex items-center gap-1" style={{ color: "var(--c97-ink)" }}>
          <span aria-hidden="true" style={{ width: 10, height: 10, background: REP_COLOR, display: "inline-block" }} />
          Rep. {rep.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// ─── Race row ──────────────────────────────────────────────────────────────────

function RaceRow({
  race,
  isSelected,
  onClick,
}: {
  race: Race;
  isSelected: boolean;
  onClick: () => void;
}) {
  const leading = race.demAvg >= race.repAvg ? "D" : "R";
  const leadColor = leading === "D" ? DEM_COLOR : REP_COLOR;

  return (
    <tr
      className="cursor-pointer border border-[var(--c97-rule)] transition-colors"
      style={getRowStyle(isSelected)}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
    >
      <td className="px-3 py-3 align-middle">
        <button
          type="button"
          className="flex min-h-[44px] w-full items-center gap-2 text-left"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          aria-label={`Show ${race.state} ${race.office} race`}
        >
          <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center bg-[var(--c97-surface)] text-xs font-bold border border-[var(--c97-rule)] text-[var(--c97-ink-2)]">
            {race.stateAbbr}
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--c97-ink)] leading-tight">{race.state}</p>
            <p className="text-xs text-[var(--c97-ink-2)]">{race.office}{race.openSeat ? " · Open" : ""}</p>
          </div>
        </button>
      </td>
      <td className="px-3 py-3 align-middle">
        <span
          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold"
          style={getRatingPillStyle(race.rating)}
        >
          {race.rating}
        </span>
      </td>
      <td className="hidden px-3 py-3 align-middle sm:table-cell">
        <div className="flex h-2.5 w-24 overflow-hidden bg-[var(--c97-surface)]">
          <div style={{ width: `${race.demAvg}%`, background: DEM_COLOR }} className="h-full" />
        </div>
      </td>
      <td className="px-3 py-3 align-middle text-sm font-semibold" style={{ color: leadColor }}>
        {race.marginLabel}
      </td>
      <td className="hidden px-3 py-3 align-middle text-xs text-[var(--c97-ink-2)] md:table-cell">
        {formatDate(race.lastPolled)}
      </td>
    </tr>
  );
}

// ─── Race sidebar ──────────────────────────────────────────────────────────────

function RaceSidebar({ race }: { race: Race }) {
  const sortedPolls = [...race.polls].sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );

  // Concise SR-only summary that re-announces whenever the selected race
  // changes. Wrapping the whole section in aria-live didn't reliably trigger
  // announcements on full DOM swaps; a focused text node does.
  const announcement = `${race.state} ${race.office} race selected. Dem. ${race.demAvg.toFixed(1)} percent, Rep. ${race.repAvg.toFixed(1)} percent, margin ${race.marginLabel}, rating ${race.rating}.`;

  return (
    <section className="c97-panel space-y-5" style={{ padding: "1.25rem 1.5rem" }}>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--c97-ink-2)]">
            {race.office} race
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--c97-ink)]">{race.state}</h2>
        </div>
        <span
          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold flex-shrink-0 mt-1"
          style={getRatingPillStyle(race.rating)}
        >
          {race.rating}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PollingMetricCard label="Dem. avg" value={`${race.demAvg.toFixed(1)}%`} />
        <PollingMetricCard label="Rep. avg" value={`${race.repAvg.toFixed(1)}%`} />
        <PollingMetricCard label="Margin" value={race.marginLabel} />
        <PollingMetricCard label="Polls" value={String(race.pollCount)} />
      </div>

      <GenericBallotBar dem={race.demAvg} rep={race.repAvg} />

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--c97-ink-2)]">
          Recent polls
        </p>
        <div className="space-y-3">
          {sortedPolls.map((poll: RacePoll) => {
            const dem = poll.candidates.find((c) => c.party === "D");
            const rep = poll.candidates.find((c) => c.party === "R");
            const margin = (dem?.support ?? 0) - (rep?.support ?? 0);
            return (
              <div
                key={poll.id}
                className="border border-[var(--c97-rule)] bg-[var(--c97-surface)] p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-[var(--c97-ink)] leading-tight">{poll.pollster}</p>
                  <span
                    className="text-xs font-bold flex-shrink-0"
                    style={{ color: margin === 0 ? "var(--c97-warning)" : margin > 0 ? DEM_COLOR : REP_COLOR }}
                  >
                    {formatMargin(margin)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--c97-ink-2)]">
                  {formatDate(poll.endDate)} · {poll.sampleSize.toLocaleString()} {poll.sampleType}
                  {poll.moe === null ? "" : ` · ±${poll.moe}`}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {poll.candidates.map((c) => (
                    <span
                      key={c.name}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border"
                      style={{
                        color: partyColor(c.party),
                        borderColor: `color-mix(in srgb, ${partyColor(c.party)} 30%, var(--c97-rule))`,
                        background: `color-mix(in srgb, ${partyColor(c.party)} 8%, var(--c97-surface))`,
                      }}
                    >
                      {c.name.split(" ").pop()} {c.support}%{c.incumbent ? " ★" : ""}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Approval polls table ──────────────────────────────────────────────────────

/**
 * Shared poll table used for both presidential approval and generic ballot
 * polls. The shape of each kind is the same — pollster, date, sample, two
 * pct columns, and a delta — so we drive the differences via column config.
 */
interface PollRowConfig<T> {
  ariaLabel: string;
  showSponsor?: boolean;
  leftHeading: string; // "Approve" | "Dem."
  rightHeading: string; // "Disapprove" | "Rep."
  deltaHeading: string; // "Net" | "Margin"
  leftValue: (poll: T) => number;
  rightValue: (poll: T) => number;
  formatDelta: (delta: number) => string;
  deltaColor: (delta: number) => string;
}

interface PollLike {
  id: string;
  pollster: string;
  sponsor?: string;
  endDate: string;
  sampleSize: number;
  sampleType: string;
}

function PollsTable<T extends PollLike>({
  polls,
  config,
}: {
  polls: T[];
  config: PollRowConfig<T>;
}) {
  const sorted = [...polls].sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
  );
  return (
    <div className="overflow-x-auto">
      <table
        className="min-w-full border-separate border-spacing-y-2"
        aria-label={config.ariaLabel}
      >
        <thead>
          <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--c97-ink-2)]">
            <th className="px-3 py-2 font-semibold">Pollster</th>
            <th className="px-3 py-2 font-semibold">Date</th>
            <th className="hidden px-3 py-2 font-semibold sm:table-cell">Sample</th>
            <th className="px-3 py-2 font-semibold">{config.leftHeading}</th>
            <th className="px-3 py-2 font-semibold">{config.rightHeading}</th>
            <th className="px-3 py-2 font-semibold">{config.deltaHeading}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((poll) => {
            const left = config.leftValue(poll);
            const right = config.rightValue(poll);
            const delta = left - right;
            return (
              <tr
                key={poll.id}
                className="border border-[var(--c97-rule)] bg-[color-mix(in_srgb,var(--c97-field)_80%,var(--c97-field))]"
              >
                <td className="px-3 py-3 align-middle">
                  <p className="text-sm font-semibold text-[var(--c97-ink)]">{poll.pollster}</p>
                  {config.showSponsor && poll.sponsor ? (
                    <p className="text-xs text-[var(--c97-ink-2)]">{poll.sponsor}</p>
                  ) : null}
                </td>
                <td className="px-3 py-3 align-middle text-sm text-[var(--c97-ink-2)]">
                  {formatDate(poll.endDate)}
                </td>
                <td className="hidden px-3 py-3 align-middle text-xs text-[var(--c97-ink-2)] sm:table-cell">
                  {poll.sampleSize.toLocaleString()} {poll.sampleType}
                </td>
                <td className="px-3 py-3 align-middle text-sm font-semibold" style={{ color: DEM_COLOR }}>
                  {left}%
                </td>
                <td className="px-3 py-3 align-middle text-sm font-semibold" style={{ color: REP_COLOR }}>
                  {right}%
                </td>
                <td
                  className="px-3 py-3 align-middle text-sm font-bold"
                  style={{ color: config.deltaColor(delta) }}
                >
                  {config.formatDelta(delta)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ApprovalPollsTable({ snapshot }: { snapshot: PollingSnapshot }) {
  return (
    <PollsTable
      polls={snapshot.approvalPolls}
      config={{
        ariaLabel: "Presidential approval polls",
        showSponsor: true,
        leftHeading: "Approve",
        rightHeading: "Disapprove",
        deltaHeading: "Net",
        leftValue: (p) => p.approve,
        rightValue: (p) => p.disapprove,
        formatDelta: formatNet,
        deltaColor: (d) => (d >= 0 ? DEM_COLOR : REP_COLOR),
      }}
    />
  );
}

function GenericBallotPollsTable({ snapshot }: { snapshot: PollingSnapshot }) {
  return (
    <PollsTable
      polls={snapshot.genericBallotPolls}
      config={{
        ariaLabel: "Generic ballot polls",
        leftHeading: "Dem.",
        rightHeading: "Rep.",
        deltaHeading: "Margin",
        leftValue: (p) => p.dem,
        rightValue: (p) => p.rep,
        formatDelta: formatMargin,
        deltaColor: (d) => (d === 0 ? "var(--c97-warning)" : d > 0 ? DEM_COLOR : REP_COLOR),
      }}
    />
  );
}

// ─── Races panel (senate or governors) ────────────────────────────────────────

function RacesPanel({
  races,
  selectedRaceId,
  onSelectRace,
  label,
}: {
  races: Race[];
  selectedRaceId: string | null;
  onSelectRace: (id: string) => void;
  label: string;
}) {
  const sorted = sortRacesByCompetitiveness(races);
  const selectedRace = races.find((r) => r.id === selectedRaceId) ?? sorted[0] ?? null;
  const counts = countSeatsByParty(races);

  return (
    <div className="space-y-6">
      <StateTileGrid races={races} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
      <section className="c97-panel" style={{ padding: "1.25rem 1.5rem" }}>
        <div className="flex items-center justify-between border-b border-[var(--c97-rule)] pb-4">
          <h2 className="text-lg font-bold text-[var(--c97-ink)]">{label} Races</h2>
          <span className="text-sm text-[var(--c97-ink-2)]">{races.length} tracked</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-medium" style={{ color: DEM_COLOR }}>
            <span className="inline-block h-2.5 w-2.5" style={{ background: DEM_COLOR }} />
            Dem. leading: {counts.demLeading}
          </span>
          <span className="flex items-center gap-1.5 font-medium" style={{ color: TUP_COLOR }}>
            <span className="inline-block h-2.5 w-2.5" style={{ background: TUP_COLOR }} />
            Toss-up: {counts.tossup}
          </span>
          <span className="flex items-center gap-1.5 font-medium" style={{ color: REP_COLOR }}>
            <span className="inline-block h-2.5 w-2.5" style={{ background: REP_COLOR }} />
            Rep. leading: {counts.repLeading}
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2" aria-label={`${label} race ratings`}>
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--c97-ink-2)]">
                <th className="px-3 py-2 font-semibold">State</th>
                <th className="px-3 py-2 font-semibold">Rating</th>
                <th className="hidden px-3 py-2 font-semibold sm:table-cell">Avg. lead</th>
                <th className="px-3 py-2 font-semibold">Margin</th>
                <th className="hidden px-3 py-2 font-semibold md:table-cell">Last polled</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((race) => (
                <RaceRow
                  key={race.id}
                  race={race}
                  isSelected={race.id === selectedRace?.id}
                  onClick={() => onSelectRace(race.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        {selectedRace && <RaceSidebar race={selectedRace} />}
      </aside>
      </div>
    </div>
  );
}

// ─── Overview panel ────────────────────────────────────────────────────────────

// The approval trend, the generic ballot bar, net approval, the ballot
// margin, and days to the election all moved into the hero, since every
// view shares that hero. This panel is what's left over that's unique to
// Overview: where the Senate and governor race counts stand, before a
// reader picks a tab for the rated table and the state grid.
function OverviewPanel({ snapshot }: { snapshot: PollingSnapshot }) {
  const senateCounts = countSeatsByParty(snapshot.senateRaces);
  const govCounts = countSeatsByParty(snapshot.governorRaces);
  const hasRaceData = snapshot.senateRaces.length + snapshot.governorRaces.length > 0;

  return (
    <div className="c97-panel">
      <p className="c97-kicker mb-0">Where the midterms stand</p>
      {hasRaceData ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <SeatCountRow label="Senate" counts={senateCounts} />
          <SeatCountRow label="Governors" counts={govCounts} />
        </div>
      ) : (
        <p className="c97-prose mt-2 mb-0">
          The Senate and Governors tabs open a rated table and a state grid once I can
          verify who each race's candidates actually are, which the source doesn't
          expose yet. Until then, the approval trend and the generic ballot above are
          the read.
        </p>
      )}
    </div>
  );
}

function SeatCountRow({
  label,
  counts,
}: {
  label: string;
  counts: { demLeading: number; tossup: number; repLeading: number };
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-[var(--c97-ink)]">{label}</p>
      <div className="flex flex-wrap gap-4 text-sm">
        <span style={{ color: DEM_COLOR }}>D leading {counts.demLeading}</span>
        <span style={{ color: TUP_COLOR }}>Toss-up {counts.tossup}</span>
        <span style={{ color: REP_COLOR }}>R leading {counts.repLeading}</span>
      </div>
    </div>
  );
}

// ─── Main client component ─────────────────────────────────────────────────────

export function PollingAggregatorClient({ initialState, snapshot }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const currentHref = `/polling-aggregator${currentQuery ? `?${currentQuery}` : ""}`;

  const hasManagedParams = searchParams.get("view") !== null || searchParams.get("race") !== null;
  const routeState = hasManagedParams ? normalizePollingState(searchParams) : initialState;

  const desiredHref = buildPollingHref(
    { view: routeState.view, race: routeState.race },
    searchParams
  );

  useEffect(() => {
    if (currentHref === desiredHref) return;
    startTransition(() => { router.replace(desiredHref, { scroll: false }); });
  }, [currentHref, desiredHref, router]);

  function navigate(nextState: PollingRouteState) {
    const href = buildPollingHref(nextState, searchParams);
    if (href === currentHref) return;
    startTransition(() => { router.push(href, { scroll: false }); });
  }

  function handleViewChange(view: PollingView) {
    navigate({ view, race: routeState.race });
  }

  function handleRaceSelect(raceId: string) {
    navigate({ view: routeState.view, race: raceId });
  }

  const lastUpdated = useMemo(
    () => formatUpdated(snapshot.sourceAsOf ?? snapshot.generatedAt),
    [snapshot.generatedAt, snapshot.sourceAsOf]
  );

  const lead = PROJECT_PRESS["/polling-aggregator"].lead;
  const approvalNet = snapshot.approvalAvg.net;
  const ballotMargin = snapshot.genericBallotAvg.margin;
  const daysToElection = Math.round(
    (new Date("2026-11-03").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalPolls = snapshot.approvalPolls.length + snapshot.genericBallotPolls.length;
  const standfirst =
    "I built this to track presidential approval and the 2026 generic ballot in one place, from polls that are actually attributed instead of placeholder races. VoteHub feeds it, and the trend and the race ratings below update as new polls come in.";

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="Polling Aggregator"
        standfirst={standfirst}
        meta={`${snapshot.sourceLabel} · updated ${lastUpdated} · ${totalPolls} polls tracked`}
        readouts={[
          {
            label: "Approval net",
            value: formatNet(approvalNet),
            detail: `${snapshot.approvalAvg.approve.toFixed(1)}% approve, ${snapshot.approvalAvg.disapprove.toFixed(1)}% disapprove`,
          },
          {
            label: "Generic ballot margin",
            value: formatMargin(ballotMargin),
            detail: `D ${snapshot.genericBallotAvg.dem.toFixed(1)}% vs R ${snapshot.genericBallotAvg.rep.toFixed(1)}%`,
          },
          {
            label: "Days to election",
            value: daysToElection > 0 ? `${daysToElection}` : "Election day",
            detail: "Nov 3, 2026 midterms",
          },
        ]}
      >
        {/*
         * Party blue and red only clear contrast against paper, not against
         * every ink's own (sometimes inverted) ink colour, so the trend and
         * the ballot bar print on their own paper plate inset into the hero
         * rather than straight onto the saffron ink.
         */}
        <div data-c97-surface="paper" className="c97-offset c97-polling-hero-chart">
          <TrendChart snapshot={snapshot} />
          <div style={{ marginTop: "var(--c97-sp-4)" }}>
            <GenericBallotBar dem={snapshot.genericBallotAvg.dem} rep={snapshot.genericBallotAvg.rep} />
          </div>
        </div>
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell space-y-6">
          <h2 className="c97-poster-sm">The numbers</h2>

          {/* Source disclosure and attribution for the CC BY 4.0 polling feed. */}
          <div
            role="note"
            className="p-4"
            style={{
              border: "1px solid var(--c97-warning)",
              background: "color-mix(in srgb, var(--c97-warning) 8%, var(--c97-surface))",
            }}
          >
            <p className="c97-prose mb-0">
              Approval and generic ballot polls come from the{" "}
              <a
                href="https://votehub.com/polls/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                VoteHub Polling API
              </a>{" "}
              under CC BY 4.0. I leave statewide race averages empty until the
              source includes candidate-party metadata I can verify.
            </p>
          </div>

          {/* View tabs */}
          <div className="c97-segmented" aria-label="Polling view switcher">
            {POLLING_VIEW_OPTIONS.filter(
              (key) =>
                (key !== "senate" || snapshot.senateRaces.length > 0) &&
                (key !== "governors" || snapshot.governorRaces.length > 0)
            ).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleViewChange(key)}
                aria-pressed={key === routeState.view}
                className="min-h-[44px] text-sm font-semibold"
              >
                {POLLING_VIEW_LABELS[key]}
              </button>
            ))}
          </div>

          {/* View panels */}
          {routeState.view === "overview" && <OverviewPanel snapshot={snapshot} />}

          {routeState.view === "approval" && (
            <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
              <div className="c97-panel" style={{ padding: "1.25rem 1.5rem" }}>
                <div className="border-b border-[var(--c97-rule)] pb-4">
                  <p className="c97-kicker mb-0">Recent polls</p>
                  <h3 className="c97-serif c97-h3 mt-2">
                    Presidential approval · {snapshot.approvalAvg.approve.toFixed(1)}% avg
                  </h3>
                </div>
                <div className="mt-4">
                  <ApprovalPollsTable snapshot={snapshot} />
                </div>
              </div>

              <div className="c97-panel" style={{ padding: "1.25rem 1.5rem" }}>
                <div className="border-b border-[var(--c97-rule)] pb-4">
                  <p className="c97-kicker mb-0">Congressional preference</p>
                  <h3 className="c97-serif c97-h3 mt-2">
                    Generic ballot · {formatMargin(snapshot.genericBallotAvg.margin)}
                  </h3>
                </div>
                <div className="mt-4">
                  <GenericBallotPollsTable snapshot={snapshot} />
                </div>
              </div>
            </div>
          )}

          {routeState.view === "senate" && (
            <RacesPanel
              races={snapshot.senateRaces}
              selectedRaceId={routeState.race}
              onSelectRace={handleRaceSelect}
              label="Senate"
            />
          )}

          {routeState.view === "governors" && (
            <RacesPanel
              races={snapshot.governorRaces}
              selectedRaceId={routeState.race}
              onSelectRace={handleRaceSelect}
              label="Governor"
            />
          )}
        </div>
      </section>
    </>
  );
}
