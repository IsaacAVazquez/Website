"use client";

import { startTransition, useEffect, useMemo, type CSSProperties, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, TrendingUp, TrendingDown, Minus, Users, MapPin, Award } from "lucide-react";
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
} from "./polling-aggregator-helpers";

interface Props {
  initialState: PollingRouteState;
  snapshot: PollingSnapshot;
}

// ─── Local stat/metric cards (home-token equivalents) ──────────────────────────

function PollingStatCard({ eyebrow, metric, detail, icon }: {
  eyebrow: string; metric: string; detail: string; icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-muted)]">{eyebrow}</p>
        <span className="text-[var(--home-ink-muted)]">{icon}</span>
      </div>
      <p className="mt-3 text-lg font-semibold text-[var(--home-ink)]">{metric}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--home-ink-muted)]">{detail}</p>
    </div>
  );
}

function PollingMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">{label}</p>
      <p className="mt-2 text-xl font-bold text-[var(--home-ink)]">{value}</p>
    </div>
  );
}

// ─── Trend chart (SVG) ─────────────────────────────────────────────────────────

function TrendChart({ snapshot }: { snapshot: PollingSnapshot }) {
  const W = 560;
  const H = 140;
  const PAD = 12;
  const trend = snapshot.approvalTrend;

  const approvePoints = buildPolyline(trend.map((d) => d.approve), W, H, PAD);
  const disapprovePoints = buildPolyline(trend.map((d) => d.disapprove), W, H, PAD);

  const allVals = trend.flatMap((d) => [d.approve, d.disapprove]);
  const minVal = Math.floor(Math.min(...allVals) - 2);
  const maxVal = Math.ceil(Math.max(...allVals) + 2);
  const first = trend[0];
  const last = trend[trend.length - 1];
  const chartSummary = first && last
    ? `Presidential approval trend from ${formatShortDate(first.date)} to ${formatShortDate(last.date)}. Approve: ${first.approve.toFixed(1)}% to ${last.approve.toFixed(1)}%. Disapprove: ${first.disapprove.toFixed(1)}% to ${last.disapprove.toFixed(1)}%.`
    : "Presidential approval trend chart";

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H + 32}`}
        className="w-full min-w-[300px]"
        aria-label={chartSummary}
        role="img"
      >
        {/* Y-axis gridlines */}
        {[minVal, Math.round((minVal + maxVal) / 2), maxVal].map((val) => {
          const y = PAD + ((maxVal - val) / (maxVal - minVal)) * (H - PAD * 2);
          return (
            <g key={val}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="var(--home-rule)" strokeWidth={1} strokeDasharray="3 3" />
              <text x={PAD - 4} y={y + 4} textAnchor="end" fontSize={10} fill="var(--home-ink-muted)">{val}%</text>
            </g>
          );
        })}

        {/* Disapprove line */}
        <polyline points={disapprovePoints} fill="none" stroke={REP_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Approve line */}
        <polyline points={approvePoints} fill="none" stroke={DEM_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots + labels — last point only */}
        {(() => {
          const last = trend[trend.length - 1];
          const lastIdx = trend.length - 1;
          const allValsLocal = trend.flatMap((d) => [d.approve, d.disapprove]);
          const minV = Math.min(...allValsLocal);
          const maxV = Math.max(...allValsLocal);
          const range = maxV - minV || 1;
          const ax = PAD + (lastIdx / (trend.length - 1)) * (W - PAD * 2);
          const ay = H - PAD - ((last.approve - minV) / range) * (H - PAD * 2);
          const dy = H - PAD - ((last.disapprove - minV) / range) * (H - PAD * 2);
          return (
            <>
              <circle cx={ax} cy={ay} r={4} fill={DEM_COLOR} />
              <circle cx={ax} cy={dy} r={4} fill={REP_COLOR} />
              <text x={ax + 6} y={ay + 4} fontSize={10} fill={DEM_COLOR} fontWeight="600">{last.approve.toFixed(1)}%</text>
              <text x={ax + 6} y={dy + 4} fontSize={10} fill={REP_COLOR} fontWeight="600">{last.disapprove.toFixed(1)}%</text>
            </>
          );
        })()}

        {/* X-axis labels */}
        {trend.map((d, i) => {
          const x = PAD + (i / (trend.length - 1)) * (W - PAD * 2);
          return (
            <text key={d.date} x={x} y={H + 20} textAnchor="middle" fontSize={10} fill="var(--home-ink-muted)">
              {formatShortDate(d.date)}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-6 text-xs text-[var(--home-ink-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-6 rounded-full" style={{ background: DEM_COLOR }} />
          Approve
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-6 rounded-full" style={{ background: REP_COLOR }} />
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
      <div className="flex h-6 w-full overflow-hidden rounded-full">
        <div style={{ width: `${demPct}%`, background: DEM_COLOR }} className="transition-[width] duration-500" />
        <div style={{ width: `${100 - demPct}%`, background: REP_COLOR }} className="transition-[width] duration-500" />
      </div>
      <div className="flex justify-between text-xs font-semibold">
        <span style={{ color: DEM_COLOR }}>Dem. {dem.toFixed(1)}%</span>
        <span style={{ color: REP_COLOR }}>Rep. {rep.toFixed(1)}%</span>
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
      className="cursor-pointer border border-[var(--home-rule)] transition-colors"
      style={getRowStyle(isSelected)}
      onClick={onClick}
      aria-selected={isSelected}
    >
      <td className="rounded-l-2xl px-3 py-3 align-middle">
        <button
          type="button"
          className="flex min-h-[44px] w-full items-center gap-2 text-left"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          aria-label={`Show ${race.state} ${race.office} race`}
        >
          <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--home-paper)] text-xs font-bold border border-[var(--home-rule)] text-[var(--home-ink-muted)]">
            {race.stateAbbr}
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--home-ink)] leading-tight">{race.state}</p>
            <p className="text-xs text-[var(--home-ink-muted)]">{race.office}{race.openSeat ? " · Open" : ""}</p>
          </div>
        </button>
      </td>
      <td className="px-3 py-3 align-middle">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
          style={getRatingPillStyle(race.rating)}
        >
          {race.rating}
        </span>
      </td>
      <td className="hidden px-3 py-3 align-middle sm:table-cell">
        <div className="flex h-2.5 w-24 overflow-hidden rounded-full bg-[var(--home-paper)]">
          <div style={{ width: `${race.demAvg}%`, background: DEM_COLOR }} className="h-full" />
        </div>
      </td>
      <td className="px-3 py-3 align-middle text-sm font-semibold" style={{ color: leadColor }}>
        {race.marginLabel}
      </td>
      <td className="hidden rounded-r-2xl px-3 py-3 align-middle text-xs text-[var(--home-ink-muted)] md:table-cell">
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
    <section className="home-card space-y-5" style={{ padding: "1.25rem 1.5rem" }}>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
            {race.office} race
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--home-ink)]">{race.state}</h2>
        </div>
        <span
          className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold flex-shrink-0 mt-1"
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
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
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
                className="rounded-xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-[var(--home-ink)] leading-tight">{poll.pollster}</p>
                  <span
                    className="text-xs font-bold flex-shrink-0"
                    style={{ color: margin === 0 ? "#D97706" : margin > 0 ? DEM_COLOR : REP_COLOR }}
                  >
                    {formatMargin(margin)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--home-ink-muted)]">
                  {formatDate(poll.endDate)} · {poll.sampleSize.toLocaleString()} {poll.sampleType} · ±{poll.moe}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {poll.candidates.map((c) => (
                    <span
                      key={c.name}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border"
                      style={{
                        color: partyColor(c.party),
                        borderColor: `color-mix(in srgb, ${partyColor(c.party)} 30%, var(--home-rule))`,
                        background: `color-mix(in srgb, ${partyColor(c.party)} 8%, color-mix(in srgb, var(--home-paper-alt) 80%, var(--home-elev-mix)))`,
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
          <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
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
                className="border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)]"
              >
                <td className="rounded-l-2xl px-3 py-3 align-middle">
                  <p className="text-sm font-semibold text-[var(--home-ink)]">{poll.pollster}</p>
                  {config.showSponsor && poll.sponsor ? (
                    <p className="text-xs text-[var(--home-ink-muted)]">{poll.sponsor}</p>
                  ) : null}
                </td>
                <td className="px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)]">
                  {formatDate(poll.endDate)}
                </td>
                <td className="hidden px-3 py-3 align-middle text-xs text-[var(--home-ink-muted)] sm:table-cell">
                  {poll.sampleSize.toLocaleString()} {poll.sampleType}
                </td>
                <td className="px-3 py-3 align-middle text-sm font-semibold" style={{ color: DEM_COLOR }}>
                  {left}%
                </td>
                <td className="px-3 py-3 align-middle text-sm font-semibold" style={{ color: REP_COLOR }}>
                  {right}%
                </td>
                <td
                  className="rounded-r-2xl px-3 py-3 align-middle text-sm font-bold"
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
        deltaColor: (d) => (d === 0 ? "#D97706" : d > 0 ? DEM_COLOR : REP_COLOR),
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
      <section className="home-card" style={{ padding: "1.25rem 1.5rem" }}>
        <div className="flex items-center justify-between border-b border-[var(--home-rule)] pb-4">
          <h2 className="text-lg font-bold text-[var(--home-ink)]">{label} Races</h2>
          <span className="text-sm text-[var(--home-ink-muted)]">{races.length} tracked</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-medium" style={{ color: DEM_COLOR }}>
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: DEM_COLOR }} />
            Dem. leading: {counts.demLeading}
          </span>
          <span className="flex items-center gap-1.5 font-medium" style={{ color: "#D97706" }}>
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
            Toss-up: {counts.tossup}
          </span>
          <span className="flex items-center gap-1.5 font-medium" style={{ color: REP_COLOR }}>
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: REP_COLOR }} />
            Rep. leading: {counts.repLeading}
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2" aria-label={`${label} race ratings`}>
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
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
  );
}

// ─── Overview panel ────────────────────────────────────────────────────────────

function OverviewPanel({ snapshot }: { snapshot: PollingSnapshot }) {
  const approvalNet = snapshot.approvalAvg.net;
  const ballotMargin = snapshot.genericBallotAvg.margin;
  const senateCounts = countSeatsByParty(snapshot.senateRaces);
  const govCounts = countSeatsByParty(snapshot.governorRaces);
  const daysToElection = Math.round(
    (new Date("2026-11-03").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const NetIcon = approvalNet > 0 ? TrendingUp : approvalNet < 0 ? TrendingDown : Minus;
  const netColor: CSSProperties = { color: approvalNet > 0 ? DEM_COLOR : approvalNet < 0 ? REP_COLOR : "#D97706" };

  return (
    <div className="space-y-8">
      {/* Summary stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PollingStatCard
          eyebrow="Approval net"
          metric={formatNet(approvalNet)}
          detail={`${snapshot.approvalAvg.approve.toFixed(1)}% approve · ${snapshot.approvalAvg.disapprove.toFixed(1)}% disapprove`}
          icon={<NetIcon className="h-4 w-4" style={netColor} />}
        />
        <PollingStatCard
          eyebrow="Generic ballot"
          metric={formatMargin(ballotMargin)}
          detail={`Dem. ${snapshot.genericBallotAvg.dem.toFixed(1)}% vs Rep. ${snapshot.genericBallotAvg.rep.toFixed(1)}%`}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <PollingStatCard
          eyebrow="Senate toss-ups"
          metric={String(senateCounts.tossup)}
          detail={`D+${senateCounts.demLeading} leading · R+${senateCounts.repLeading} leading`}
          icon={<Users className="h-4 w-4" />}
        />
        <PollingStatCard
          eyebrow="Days to election"
          metric={daysToElection > 0 ? String(daysToElection) : "Election day"}
          detail="Nov 3, 2026 midterms"
          icon={<Award className="h-4 w-4" />}
        />
      </div>

      {/* Approval trend mini */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="home-card" style={{ padding: "1.25rem 1.5rem" }}>
          <div className="border-b border-[var(--home-rule)] pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">Approval trend</p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">Presidential approval</h3>
          </div>
          <div className="mt-4">
            <TrendChart snapshot={snapshot} />
          </div>
        </div>

        <div className="home-card" style={{ padding: "1.25rem 1.5rem" }}>
          <div className="border-b border-[var(--home-rule)] pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">2026 generic ballot</p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">Congressional preference</h3>
          </div>
          <div className="mt-6 space-y-4">
            <GenericBallotBar dem={snapshot.genericBallotAvg.dem} rep={snapshot.genericBallotAvg.rep} />
            <p className="text-xs text-[var(--home-ink-muted)]">
              Average of {snapshot.genericBallotPolls.length} polls. Voters asked which party they prefer for Congress.
            </p>
          </div>

          <div className="mt-6 border-t border-[var(--home-rule)] pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">Senate race map</p>
            <div className="flex flex-wrap gap-2">
              {sortRacesByCompetitiveness(snapshot.senateRaces).map((race) => (
                <span
                  key={race.id}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={getRatingPillStyle(race.rating)}
                  title={`${race.state}: ${race.rating}`}
                >
                  <MapPin className="h-3 w-3" />
                  {race.stateAbbr}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Governor overview */}
      <div className="home-card" style={{ padding: "1.25rem 1.5rem" }}>
        <div className="border-b border-[var(--home-rule)] pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">Governor races</p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">Key 2026 governor contests</h3>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {sortRacesByCompetitiveness(snapshot.governorRaces).map((race) => (
            <div
              key={race.id}
              className="flex items-center gap-2 rounded-xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] px-3 py-2"
            >
              <span className="text-sm font-semibold text-[var(--home-ink)]">{race.state}</span>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                style={getRatingPillStyle(race.rating)}
              >
                {race.rating}
              </span>
              <span
                className="text-xs font-bold"
                style={{ color: race.demAvg >= race.repAvg ? DEM_COLOR : REP_COLOR }}
              >
                {race.marginLabel}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-[var(--home-ink-muted)]">
          <span>D leading: {govCounts.demLeading}</span>
          <span>Toss-up: {govCounts.tossup}</span>
          <span>R leading: {govCounts.repLeading}</span>
        </div>
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

  const lastUpdated = useMemo(() => formatUpdated(snapshot.generatedAt), [snapshot.generatedAt]);

  return (
    <section className="home-page min-h-screen">
      <div className="home-shell home-section space-y-8">
        {/* Page heading */}
        <div className="space-y-3 pt-4">
          <p className="home-kicker">Political Data Tool</p>
          <h1
            style={{
              fontFamily: "var(--font-home-sans)",
              fontSize: "clamp(2.6rem, 6vw, 5rem)",
              fontWeight: 600,
              lineHeight: 0.94,
              letterSpacing: "-0.07em",
              color: "var(--home-ink)",
            }}
          >
            Polling Aggregator
          </h1>
          <p className="home-body max-w-none">
            Presidential approval, generic ballot averages, and key 2026 Senate and governor race polls aggregated from public pollsters.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {["2026 Midterms", `Updated ${lastUpdated}`, snapshot.sourceLabel, `${snapshot.approvalPolls.length + snapshot.genericBallotPolls.length} polls tracked`].map((label) => (
              <span key={label} className="resume-chip">{label}</span>
            ))}
          </div>
        </div>

        {/* View tabs */}
        <div
          className="flex flex-wrap gap-2 rounded-[1.5rem] p-2"
          style={{
            border: "1px solid var(--home-rule)",
            background: "color-mix(in srgb, var(--home-paper-alt) 90%, var(--home-elev-mix))",
            width: "fit-content",
          }}
        >
          {POLLING_VIEW_OPTIONS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleViewChange(key)}
              aria-pressed={key === routeState.view}
              className="inline-flex min-h-[44px] items-center rounded-xl px-5 py-2 text-sm font-semibold transition-colors"
              style={{
                fontFamily: "var(--font-home-sans)",
                fontSize: "0.88rem",
                letterSpacing: "0.02em",
                ...(key === routeState.view
                  ? { background: "var(--home-ink)", color: "var(--home-paper)" }
                  : { color: "var(--home-ink-muted)" }),
              }}
            >
              {POLLING_VIEW_LABELS[key]}
            </button>
          ))}
        </div>

        {/* View panels */}
        {routeState.view === "overview" && <OverviewPanel snapshot={snapshot} />}

        {routeState.view === "approval" && (
          <div className="space-y-6">
            <div className="home-card" style={{ padding: "1.25rem 1.5rem" }}>
              <div className="border-b border-[var(--home-rule)] pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">Monthly averages</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">Approval trend</h2>
              </div>
              <div className="mt-4">
                <TrendChart snapshot={snapshot} />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
              <div className="home-card" style={{ padding: "1.25rem 1.5rem" }}>
                <div className="border-b border-[var(--home-rule)] pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">Recent polls</p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">
                    Presidential approval · {snapshot.approvalAvg.approve.toFixed(1)}% avg
                  </h2>
                </div>
                <div className="mt-4">
                  <ApprovalPollsTable snapshot={snapshot} />
                </div>
              </div>

              <div className="home-card" style={{ padding: "1.25rem 1.5rem" }}>
                <div className="border-b border-[var(--home-rule)] pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">Congressional preference</p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">
                    Generic ballot · {formatMargin(snapshot.genericBallotAvg.margin)}
                  </h2>
                </div>
                <div className="mt-6 mb-4">
                  <GenericBallotBar dem={snapshot.genericBallotAvg.dem} rep={snapshot.genericBallotAvg.rep} />
                </div>
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
  );
}
