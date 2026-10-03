"use client";

import { useSearchParams } from "next/navigation";
import { useClientNow } from "@/hooks/useClientNow";
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
  formatMargin,
  formatNet,
  newestPollDate,
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
import { useRouteSync } from "@/hooks/useRouteSync";

interface Props {
  initialState: PollingRouteState;
  snapshot: PollingSnapshot;
  /** Written on the server, so the browser's clock cannot change the markup. */
  staleSourceNote?: string | null;
}

function PollingMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ padding: "var(--c97-sp-2)" }}>
      <p className="c97-kicker">{label}</p>
      <p className="c97-tabular text-xl font-bold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-1)" }}>{value}</p>
    </div>
  );
}

// Party colour as small text measured under 4.5:1, so the colour rides on a
// swatch beside the text and the text itself stays in ink.
function PartySwatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: 10, height: 10, background: color, display: "inline-block", flexShrink: 0 }}
    />
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
        // point, so the box widens on both sides instead of clipping them. The
        // margins fit the larger phone type (25 units, polling-aggregator.css),
        // where a y label measured 53 units and an end label 73; sized for the
        // 10-unit desktop type they clipped "37%" to "7%" on phones. The
        // extra 8px of bottom margin (beyond the x-axis label row) keeps the
        // minVal gridline label clear of the x-axis row at the larger phone
        // font size, where the two used to touch by under a pixel.
        viewBox={`-48 0 ${W + 118} ${H + 40}`}
        className="w-full min-w-[300px]"
        aria-label={chartSummary}
        role="img"
      >
        {/* Y-axis gridlines */}
        {[minVal, Math.round((minVal + maxVal) / 2), maxVal].map((val) => {
          const y = scaleY(val);
          return (
            <g key={val}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} style={{ stroke: "var(--c97-rule)" }} strokeWidth={1} strokeDasharray="3 3" />
              <text x={PAD - 4} y={y + 4} textAnchor="end" fontSize={10} className="c97-polling-chart-text" style={{ fill: "var(--c97-ink-2)" }}>{val}%</text>
            </g>
          );
        })}

        {/* Disapprove line */}
        <polyline points={disapprovePoints} fill="none" style={{ stroke: REP_COLOR }} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Approve line */}
        <polyline points={approvePoints} fill="none" style={{ stroke: DEM_COLOR }} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots + labels — last point only */}
        {(() => {
          const lastIdx = trend.length - 1;
          const ax = scaleX(lastIdx);
          const ay = scaleY(last.approve);
          const dy = scaleY(last.disapprove);
          return (
            <>
              <circle cx={ax} cy={ay} r={4} style={{ fill: DEM_COLOR }} />
              <circle cx={ax} cy={dy} r={4} style={{ fill: REP_COLOR }} />
              <text x={ax + 6} y={ay + 4} fontSize={10} className="c97-polling-chart-text" style={{ fill: "var(--c97-ink)" }} fontWeight="600">{last.approve.toFixed(1)}%</text>
              <text x={ax + 6} y={dy + 4} fontSize={10} className="c97-polling-chart-text" style={{ fill: "var(--c97-ink)" }} fontWeight="600">{last.disapprove.toFixed(1)}%</text>
            </>
          );
        })()}

        {/* X-axis labels. At phone width the larger type (below) needed to
            clear the 11px floor makes every label collide with its
            neighbour, so every other one is hidden there via CSS. */}
        {trend.map((d, i) => {
          const x = scaleX(i);
          return (
            <text
              key={d.date}
              x={x}
              y={H + 28}
              textAnchor="middle"
              fontSize={10}
              className="c97-polling-chart-text"
              style={{ fill: "var(--c97-ink-2)" }}
              data-tick-parity={i % 2 === 0 ? "even" : "odd"}
            >
              {formatShortDate(d.date)}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center text-xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-3)" }}>
        <span className="flex items-center" style={{ gap: "var(--c97-sp-0)" }}>
          <span className="inline-block h-2 w-6" style={{ background: DEM_COLOR }} />
          Approve
        </span>
        <span className="flex items-center" style={{ gap: "var(--c97-sp-0)" }}>
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
    <div className="flex flex-col" style={{ gap: "var(--c97-sp-1)" }}>
      <div
        className="flex h-6 w-full overflow-hidden"
        role="img"
        aria-label={`Generic ballot: Democrats ${dem.toFixed(1)} percent, Republicans ${rep.toFixed(1)} percent`}
      >
        <div style={{ width: `${demPct}%`, background: DEM_COLOR }} />
        <div style={{ width: `${100 - demPct}%`, background: REP_COLOR }} />
      </div>
      <div className="flex justify-between text-xs font-semibold">
        {/* Party colour as small text measured under 4.5:1, so the colour moves to a swatch and the number stays in ink. */}
        <span className="inline-flex items-center" style={{ color: "var(--c97-ink)", gap: "var(--c97-sp-0)" }}>
          <span aria-hidden="true" style={{ width: 10, height: 10, background: DEM_COLOR, display: "inline-block" }} />
          Dem. {dem.toFixed(1)}%
        </span>
        <span className="inline-flex items-center" style={{ color: "var(--c97-ink)", gap: "var(--c97-sp-0)" }}>
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
    // The row stays clickable for pointer users, but the keyboard and screen
    // reader control is the button in the first cell. role="button" on a <tr>
    // broke table semantics and nested that button inside another one.
    <tr
      className="cursor-pointer"
      style={isSelected ? getRowStyle(true) : undefined}
      onClick={onClick}
    >
      <td className="align-middle">
        <button
          type="button"
          className="flex min-h-[44px] w-full items-center text-left" style={{ gap: "var(--c97-sp-1)" }}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          aria-label={`Show ${race.state} ${race.office} race`}
          aria-pressed={isSelected}
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
      <td className="align-middle">
        <span
          className="inline-flex items-center text-xs font-semibold"
          style={{ paddingInline: "var(--c97-sp-1)", ...getRatingPillStyle(race.rating), paddingBlock: "var(--c97-sp-0)" }}
        >
          {race.rating}
        </span>
      </td>
      <td className="hidden align-middle sm:table-cell">
        <div className="flex h-2.5 w-24 overflow-hidden bg-[var(--c97-surface)]">
          <div style={{ width: `${race.demAvg}%`, background: DEM_COLOR }} className="h-full" />
        </div>
      </td>
      <td data-align="end" className="align-middle font-semibold" style={{ color: "var(--c97-ink)" }}>
        <span className="inline-flex items-center" style={{ gap: "var(--c97-sp-0)" }}>
          <PartySwatch color={leadColor} />
          {race.marginLabel}
        </span>
      </td>
      <td className="hidden align-middle text-[var(--c97-ink-2)] md:table-cell">
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
    <section className="flex flex-col c97-panel" style={{ padding: "var(--c97-sp-2) var(--c97-sp-3)", gap: "var(--c97-sp-2)" }}>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
      <div className="flex items-start justify-between" style={{ gap: "var(--c97-sp-1)" }}>
        <div>
          <p className="c97-kicker">{race.office} race</p>
          <h3 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-1)" }}>{race.state}</h3>
        </div>
        <span
          className="inline-flex items-center text-xs font-semibold flex-shrink-0"
          style={{ paddingInline: "var(--c97-sp-1)", ...getRatingPillStyle(race.rating), paddingBlock: "var(--c97-sp-0)", marginTop: "var(--c97-sp-0)" }}
        >
          {race.rating}
        </span>
      </div>

      <div className="grid grid-cols-2" style={{ gap: "var(--c97-sp-1)" }}>
        <PollingMetricCard label="Dem. avg" value={`${race.demAvg.toFixed(1)}%`} />
        <PollingMetricCard label="Rep. avg" value={`${race.repAvg.toFixed(1)}%`} />
        <PollingMetricCard label="Margin" value={race.marginLabel} />
        <PollingMetricCard label="Polls" value={String(race.pollCount)} />
      </div>

      <GenericBallotBar dem={race.demAvg} rep={race.repAvg} />

      <div>
        <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
          Recent polls
        </p>
        <div className="flex flex-col" style={{ gap: "var(--c97-sp-1)" }}>
          {sortedPolls.map((poll: RacePoll) => {
            const dem = poll.candidates.find((c) => c.party === "D");
            const rep = poll.candidates.find((c) => c.party === "R");
            const margin = (dem?.support ?? 0) - (rep?.support ?? 0);
            return (
              <div
                key={poll.id}
                className="border border-[var(--c97-rule)] bg-[var(--c97-surface)] text-sm" style={{ padding: "var(--c97-sp-1)" }}
              >
                <div className="flex items-start justify-between" style={{ gap: "var(--c97-sp-1)" }}>
                  <p className="font-semibold text-[var(--c97-ink)] leading-tight">{poll.pollster}</p>
                  <span
                    className="c97-tabular inline-flex items-center text-xs font-bold flex-shrink-0"
                    style={{ color: "var(--c97-ink)", gap: "var(--c97-sp-0)" }}
                  >
                    <PartySwatch color={margin === 0 ? "var(--c97-warning)" : margin > 0 ? DEM_COLOR : REP_COLOR} />
                    {formatMargin(margin)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--c97-ink-2)]">
                  {formatDate(poll.endDate)} · {poll.sampleSize.toLocaleString("en-US")} {poll.sampleType}
                  {poll.moe === null ? "" : ` · ±${poll.moe}`}
                </p>
                <div className="flex flex-wrap" style={{ marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
                  {poll.candidates.map((c) => (
                    <span key={c.name} className="c97-chip c97-tabular">
                      <PartySwatch color={partyColor(c.party)} />
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
    <div className="overflow-x-auto" role="region" aria-label={`${config.ariaLabel} (scrolls sideways)`} tabIndex={0}>
      <table className="c97-table c97-polling-table" aria-label={config.ariaLabel}>
        <thead>
          <tr>
            <th scope="col">Pollster</th>
            <th scope="col">Date</th>
            <th scope="col" className="hidden sm:table-cell">Sample</th>
            <th scope="col" data-align="end">
              <span className="inline-flex items-center" style={{ gap: "var(--c97-sp-0)" }}>
                <PartySwatch color={DEM_COLOR} />
                {config.leftHeading}
              </span>
            </th>
            <th scope="col" data-align="end">
              <span className="inline-flex items-center" style={{ gap: "var(--c97-sp-0)" }}>
                <PartySwatch color={REP_COLOR} />
                {config.rightHeading}
              </span>
            </th>
            <th scope="col" data-align="end">{config.deltaHeading}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((poll) => {
            const left = config.leftValue(poll);
            const right = config.rightValue(poll);
            const delta = left - right;
            return (
              <tr key={poll.id}>
                <td className="align-middle">
                  <p className="text-sm font-semibold text-[var(--c97-ink)]">{poll.pollster}</p>
                  {config.showSponsor && poll.sponsor ? (
                    <p className="text-xs text-[var(--c97-ink-2)]">{poll.sponsor}</p>
                  ) : null}
                </td>
                <td className="align-middle text-[var(--c97-ink-2)]">
                  {formatDate(poll.endDate)}
                </td>
                <td className="hidden align-middle text-[var(--c97-ink-2)] sm:table-cell">
                  {poll.sampleSize.toLocaleString("en-US")} {poll.sampleType}
                </td>
                <td data-align="end" className="align-middle font-semibold" style={{ color: "var(--c97-ink)" }}>
                  {left}%
                </td>
                <td data-align="end" className="align-middle font-semibold" style={{ color: "var(--c97-ink)" }}>
                  {right}%
                </td>
                <td data-align="end" className="align-middle font-bold" style={{ color: "var(--c97-ink)" }}>
                  <span className="inline-flex items-center" style={{ gap: "var(--c97-sp-0)" }}>
                    <PartySwatch color={config.deltaColor(delta)} />
                    {config.formatDelta(delta)}
                  </span>
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
    <div className="flex flex-col" style={{ gap: "var(--c97-sp-3)" }}>
      <StateTileGrid races={races} />

      <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]" style={{ gap: "var(--c97-sp-3)" }}>
      <section className="c97-panel" style={{ padding: "var(--c97-sp-2) var(--c97-sp-3)" }}>
        <div className="flex items-center justify-between border-b border-[var(--c97-rule)]" style={{ paddingBottom: "var(--c97-sp-2)" }}>
          <h3 className="c97-serif c97-h3">{label} races</h3>
          <span className="text-sm text-[var(--c97-ink-2)]">{races.length} tracked</span>
        </div>

        <div className="flex flex-wrap text-xs" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
          <span className="flex items-center font-medium" style={{ color: "var(--c97-ink)", gap: "var(--c97-sp-0)" }}>
            <span className="inline-block h-2.5 w-2.5" style={{ background: DEM_COLOR }} />
            Dem. leading: {counts.demLeading}
          </span>
          <span className="flex items-center font-medium" style={{ color: "var(--c97-ink)", gap: "var(--c97-sp-0)" }}>
            <span className="inline-block h-2.5 w-2.5" style={{ background: TUP_COLOR }} />
            Toss-up: {counts.tossup}
          </span>
          <span className="flex items-center font-medium" style={{ color: "var(--c97-ink)", gap: "var(--c97-sp-0)" }}>
            <span className="inline-block h-2.5 w-2.5" style={{ background: REP_COLOR }} />
            Rep. leading: {counts.repLeading}
          </span>
        </div>

        <div
          className="overflow-x-auto"
          role="region"
          aria-label={`${label} race ratings (scrolls sideways)`}
          tabIndex={0}
          style={{ marginTop: "var(--c97-sp-3)" }}
          >
          <table className="c97-table c97-polling-table" aria-label={`${label} race ratings`}>
            <thead>
              <tr>
                <th scope="col">State</th>
                <th scope="col">Rating</th>
                <th scope="col" className="hidden sm:table-cell">Avg. lead</th>
                <th scope="col" data-align="end">Margin</th>
                <th scope="col" className="hidden md:table-cell">Last polled</th>
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

      <aside className="lg:sticky lg:top-6 lg:self-start">
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
      <p className="c97-kicker">Where the midterms stand</p>
      {hasRaceData ? (
        <div className="grid sm:grid-cols-2" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-2)" }}>
          <SeatCountRow label="Senate" counts={senateCounts} />
          <SeatCountRow label="Governors" counts={govCounts} />
        </div>
      ) : (
        <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)" }}>
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
      <p className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginBottom: "var(--c97-sp-1)" }}>{label}</p>
      <div className="flex flex-wrap text-sm" style={{ gap: "var(--c97-sp-2)" }}>
        <span className="c97-tabular inline-flex items-center" style={{ color: "var(--c97-ink)", gap: "var(--c97-sp-0)" }}>
          <PartySwatch color={DEM_COLOR} />D leading {counts.demLeading}
        </span>
        <span className="c97-tabular inline-flex items-center" style={{ color: "var(--c97-ink)", gap: "var(--c97-sp-0)" }}>
          <PartySwatch color={TUP_COLOR} />Toss-up {counts.tossup}
        </span>
        <span className="c97-tabular inline-flex items-center" style={{ color: "var(--c97-ink)", gap: "var(--c97-sp-0)" }}>
          <PartySwatch color={REP_COLOR} />R leading {counts.repLeading}
        </span>
      </div>
    </div>
  );
}

// ─── Main client component ─────────────────────────────────────────────────────

export function PollingAggregatorClient({ initialState, snapshot, staleSourceNote }: Props) {
  const searchParams = useSearchParams();

  const hasManagedParams = searchParams.get("view") !== null || searchParams.get("race") !== null;
  const routeState = hasManagedParams ? normalizePollingState(searchParams) : initialState;

  const desiredHref = buildPollingHref(
    { view: routeState.view, race: routeState.race },
    searchParams
  );

  const pushHref = useRouteSync("/polling-aggregator", desiredHref);

  function navigate(nextState: PollingRouteState) {
    const href = buildPollingHref(nextState, searchParams);
    pushHref(href);
  }

  function handleViewChange(view: PollingView) {
    navigate({ view, race: routeState.race });
  }

  function handleRaceSelect(raceId: string) {
    navigate({ view: routeState.view, race: raceId });
  }

  // sourceAsOf is the newer of the two series, so it hides an older one.
  const approvalDate = newestPollDate(snapshot.approvalPolls);
  const genericBallotDate = newestPollDate(snapshot.genericBallotPolls);

  const lead = PROJECT_PRESS["/polling-aggregator"].lead;
  const approvalNet = snapshot.approvalAvg.net;
  const ballotMargin = snapshot.genericBallotAvg.margin;
  const now = useClientNow();
  const daysToElection =
    now === null
      ? null
      : Math.round((new Date("2026-11-03T00:00:00Z").getTime() - now) / (1000 * 60 * 60 * 24));
  const totalPolls = snapshot.approvalPolls.length + snapshot.genericBallotPolls.length;
  const standfirst =
    "I built this to track presidential approval and the 2026 generic ballot in one place, built only from polls with a named source. VoteHub feeds it, and the averages and the trend update as new polls come in.";

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="Polling Aggregator"
        standfirst={standfirst}
        meta={[
          snapshot.sourceLabel,
          approvalDate && `newest approval poll ${formatDate(approvalDate)}`,
          genericBallotDate && `newest generic ballot poll ${formatDate(genericBallotDate)}`,
          `${totalPolls} polls tracked`,
        ]
          .filter(Boolean)
          .join(" · ")}
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
            value: daysToElection === null ? "Nov 3" : daysToElection > 0 ? `${daysToElection}` : "Election day",
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
        <div className="flex flex-col c97-shell" style={{ gap: "var(--c97-sp-3)" }}>
          <h2 className="c97-poster-sm">The numbers</h2>

          {/* Source disclosure and attribution for the CC BY 4.0 polling feed. */}
          <div
            role="note"
            style={{
              padding: "var(--c97-sp-2)",
              border: "1px solid var(--c97-warning)",
              background: "color-mix(in srgb, var(--c97-warning) 8%, var(--c97-surface))",
            }}
          >
            <p className="c97-prose">
              Approval and generic ballot polls come from the{" "}
              <a
                href="https://votehub.com/polls/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                VoteHub Polling API
              </a>{" "}
              under CC BY 4.0.{staleSourceNote ? ` ${staleSourceNote}` : ""} I
              leave statewide race averages empty until the source includes
              candidate-party metadata I can verify.
            </p>
          </div>

          {/* View tabs */}
          <div role="group" className="c97-segmented" aria-label="Polling view switcher">
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
            <div className="grid lg:grid-cols-[3fr_2fr]" style={{ gap: "var(--c97-sp-3)" }}>
              <div className="c97-panel" style={{ padding: "var(--c97-sp-2) var(--c97-sp-3)" }}>
                <div className="border-b border-[var(--c97-rule)]" style={{ paddingBottom: "var(--c97-sp-2)" }}>
                  <p className="c97-kicker">Recent polls</p>
                  <h3 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-1)" }}>
                    Presidential approval · {snapshot.approvalAvg.approve.toFixed(1)}% avg
                  </h3>
                </div>
                <div style={{ marginTop: "var(--c97-sp-2)" }}>
                  <ApprovalPollsTable snapshot={snapshot} />
                </div>
              </div>

              <div className="c97-panel" style={{ padding: "var(--c97-sp-2) var(--c97-sp-3)" }}>
                <div className="border-b border-[var(--c97-rule)]" style={{ paddingBottom: "var(--c97-sp-2)" }}>
                  <p className="c97-kicker">Congressional preference</p>
                  <h3 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-1)" }}>
                    Generic ballot · {formatMargin(snapshot.genericBallotAvg.margin)}
                  </h3>
                </div>
                <div style={{ marginTop: "var(--c97-sp-2)" }}>
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
