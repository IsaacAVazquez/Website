"use client";

import { useSearchParams } from "next/navigation";
import { useClientNow } from "@/hooks/useClientNow";
import type { PollingRouteState, PollingSnapshot, PollingView, Race } from "@/types/polling";
import {
  buildPollingHref,
  normalizePollingState,
  POLLING_VIEW_LABELS,
  POLLING_VIEW_OPTIONS,
  sortRacesByMargin,
} from "./polling-aggregator-state";
import {
  formatDate,
  formatShortDate,
  formatMargin,
  formatNet,
  newestPollDate,
  buildPolyline,
  DEM_COLOR,
  REP_COLOR,
} from "./polling-aggregator-helpers";
import "./polling-aggregator.css";
import { useRouteSync } from "@/hooks/useRouteSync";

interface Props {
  initialState: PollingRouteState;
  snapshot: PollingSnapshot;
  /** Written on the server, so the browser's clock cannot change the markup. */
  staleSourceNote?: string | null;
}

// Party colour as small text measured under 4.5:1, so the colour rides on a
// swatch beside the text and the text itself stays in ink.
function PartySwatch({ color }: { color: string }) {
  return <span aria-hidden="true" className="pa-swatch" style={{ background: color }} />;
}

const pollsWord = (count: number) => (count === 1 ? "poll" : "polls");

// ─── Trend chart (SVG) ─────────────────────────────────────────────────────────

function TrendChart({ snapshot }: { snapshot: PollingSnapshot }) {
  const W = 560;
  const H = 140;
  const PAD = 12;
  const trend = snapshot.approvalTrend;

  if (trend.length < 2) {
    return <p className="pa-muted">Not enough data to chart the approval trend yet.</p>;
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
  const ax = scaleX(trend.length - 1);

  return (
    <figure className="pa-chart">
      <svg
        // The y labels sit left of the plot and the end labels right of the last
        // point, so the box widens on both sides instead of clipping them. The
        // margins fit the larger phone type (25 units, polling-aggregator.css),
        // where a y label measured 53 units and an end label 73. The extra 8px
        // of bottom margin keeps the minVal gridline label clear of the x-axis
        // row at the larger phone font size.
        viewBox={`-48 0 ${W + 118} ${H + 40}`}
        className="pa-chart-svg"
        aria-label={chartSummary}
        role="img"
      >
        {[minVal, Math.round((minVal + maxVal) / 2), maxVal].map((val) => {
          const y = scaleY(val);
          return (
            <g key={val}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} style={{ stroke: "var(--pa-rule-strong)" }} strokeWidth={1} strokeDasharray="3 3" />
              <text x={PAD - 4} y={y + 4} textAnchor="end" fontSize={10} className="pa-chart-text" style={{ fill: "var(--pa-ink-2)" }}>{val}%</text>
            </g>
          );
        })}

        <polyline points={disapprovePoints} fill="none" style={{ stroke: REP_COLOR }} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={approvePoints} fill="none" style={{ stroke: DEM_COLOR }} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        <circle cx={ax} cy={scaleY(last.approve)} r={4} style={{ fill: DEM_COLOR }} />
        <circle cx={ax} cy={scaleY(last.disapprove)} r={4} style={{ fill: REP_COLOR }} />
        <text x={ax + 6} y={scaleY(last.approve) + 4} fontSize={10} className="pa-chart-text" style={{ fill: "var(--pa-ink)" }} fontWeight="600">{last.approve.toFixed(1)}%</text>
        <text x={ax + 6} y={scaleY(last.disapprove) + 4} fontSize={10} className="pa-chart-text" style={{ fill: "var(--pa-ink)" }} fontWeight="600">{last.disapprove.toFixed(1)}%</text>

        {/* At phone width the larger type needed to clear the 11px floor makes
            every label collide with its neighbour, so every other one is
            hidden there via CSS. */}
        {trend.map((d, i) => (
          <text
            key={d.date}
            x={scaleX(i)}
            y={H + 28}
            textAnchor="middle"
            fontSize={10}
            className="pa-chart-text"
            style={{ fill: "var(--pa-ink-2)" }}
            data-tick-parity={i % 2 === 0 ? "even" : "odd"}
          >
            {formatShortDate(d.date)}
          </text>
        ))}
      </svg>

      <figcaption className="pa-legend">
        <span><span className="pa-legend-line" style={{ background: DEM_COLOR }} aria-hidden="true" />Approve</span>
        <span><span className="pa-legend-line" style={{ background: REP_COLOR }} aria-hidden="true" />Disapprove</span>
        <span>Monthly averages, {formatShortDate(first.date)} to {formatShortDate(last.date)}</span>
      </figcaption>

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
    </figure>
  );
}

// ─── Generic ballot bar ────────────────────────────────────────────────────────

function GenericBallotBar({ dem, rep }: { dem: number; rep: number }) {
  const total = dem + rep;
  const demPct = total > 0 ? (dem / total) * 100 : 50;
  return (
    <div className="pa-ballot">
      <div
        className="pa-ballot-bar"
        role="img"
        aria-label={`Generic ballot: Democrats ${dem.toFixed(1)} percent, Republicans ${rep.toFixed(1)} percent`}
      >
        <span style={{ width: `${demPct}%`, background: DEM_COLOR }} />
        <span style={{ width: `${100 - demPct}%`, background: REP_COLOR }} />
      </div>
      <div className="pa-ballot-legend">
        <span><PartySwatch color={DEM_COLOR} />Dem. {dem.toFixed(1)}%</span>
        <span><PartySwatch color={REP_COLOR} />Rep. {rep.toFixed(1)}%</span>
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
  const [leader, runnerUp] = race.candidates;

  return (
    // The row stays clickable for pointer users, but the keyboard and screen
    // reader control is the button in the first cell. role="button" on a <tr>
    // broke table semantics and nested that button inside another one.
    <tr className="pa-race-row" data-selected={isSelected || undefined} onClick={onClick}>
      <td>
        <button
          type="button"
          className="pa-race-button"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          aria-label={`Show the ${race.state} ${race.office} race`}
          aria-pressed={isSelected}
        >
          <span className="pa-state-abbr">{race.stateAbbr}</span>
          <span className="pa-strong">{race.state}</span>
        </button>
      </td>
      <td>
        <span className="pa-strong pa-block">{leader.name}</span>
        <span className="pa-muted pa-small pa-block">over {runnerUp.name}</span>
      </td>
      <td data-align="end" className="pa-figure">{formatNet(race.margin)}</td>
      <td data-align="end" className="pa-muted pa-hide-sm">{race.pollCount}</td>
      <td className="pa-muted pa-hide-md">{formatDate(race.lastPolled)}</td>
    </tr>
  );
}

// ─── Race sidebar ──────────────────────────────────────────────────────────────

function RaceSidebar({ race }: { race: Race }) {
  const [leader, runnerUp] = race.candidates;
  const sortedPolls = [...race.polls].sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );
  const oldest = sortedPolls.at(-1) ?? null;

  // Concise SR-only summary that re-announces whenever the selected race
  // changes. Wrapping the whole section in aria-live didn't reliably trigger
  // announcements on full DOM swaps; a focused text node does.
  const announcement = `${race.state} ${race.office} race selected. ${leader.name} ${leader.support.toFixed(1)} percent, ${runnerUp.name} ${runnerUp.support.toFixed(1)} percent, margin ${formatNet(race.margin)} over ${race.pollCount} ${pollsWord(race.pollCount)}.`;

  return (
    <section className="pa-race-detail" aria-label={`${race.state} ${race.office} race`}>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
      <p className="pa-kicker">{race.office} race</p>
      <h3 className="pa-race-title">{race.state}</h3>

      <dl className="pa-race-figures">
        <div><dt>{leader.name}</dt><dd>{leader.support.toFixed(1)}%</dd></div>
        <div><dt>{runnerUp.name}</dt><dd>{runnerUp.support.toFixed(1)}%</dd></div>
        <div><dt>Margin</dt><dd>{formatNet(race.margin)}</dd></div>
        <div><dt>Polls</dt><dd>{race.pollCount}</dd></div>
      </dl>

      <p className="pa-muted pa-small">
        {oldest && oldest.endDate !== race.lastPolled
          ? `Average of the ${race.pollCount} ${pollsWord(race.pollCount)} from ${formatDate(oldest.endDate)} to ${formatDate(race.lastPolled)} that asked about both names.`
          : `Average of the ${race.pollCount} ${pollsWord(race.pollCount)} ending ${formatDate(race.lastPolled)} that asked about both names.`}
      </p>

      <h4 className="pa-kicker">Recent polls</h4>
      <ul className="pa-poll-list">
        {sortedPolls.map((poll) => (
          <li key={poll.id}>
            <span className="pa-strong pa-block">{poll.pollster}</span>
            {poll.sponsor ? <span className="pa-muted pa-small pa-block">for {poll.sponsor}</span> : null}
            <span className="pa-muted pa-small pa-block">
              {formatDate(poll.endDate)} · {poll.sampleSize.toLocaleString("en-US")} {poll.sampleType}
            </span>
            <span className="pa-poll-answers">
              {poll.candidates.map((candidate) => (
                <span key={candidate.name} className="pa-answer">
                  {candidate.name} {candidate.support}%
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Poll tables ───────────────────────────────────────────────────────────────

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
    <div className="pa-scroll" role="region" aria-label={`${config.ariaLabel} (scrolls sideways)`} tabIndex={0}>
      <table className="pa-table" aria-label={config.ariaLabel}>
        <thead>
          <tr>
            <th scope="col">Pollster</th>
            <th scope="col">Date</th>
            <th scope="col" className="pa-hide-sm">Sample</th>
            <th scope="col" data-align="end"><PartySwatch color={DEM_COLOR} /> {config.leftHeading}</th>
            <th scope="col" data-align="end"><PartySwatch color={REP_COLOR} /> {config.rightHeading}</th>
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
                <td>
                  <span className="pa-strong pa-block">{poll.pollster}</span>
                  {config.showSponsor && poll.sponsor ? (
                    <span className="pa-muted pa-small pa-block">{poll.sponsor}</span>
                  ) : null}
                </td>
                <td className="pa-muted">{formatDate(poll.endDate)}</td>
                <td className="pa-muted pa-hide-sm">
                  {poll.sampleSize.toLocaleString("en-US")} {poll.sampleType}
                </td>
                <td data-align="end" className="pa-figure">{left}%</td>
                <td data-align="end" className="pa-figure">{right}%</td>
                <td data-align="end" className="pa-figure">
                  <PartySwatch color={config.deltaColor(delta)} /> {config.formatDelta(delta)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ApprovalPollsView({ snapshot }: { snapshot: PollingSnapshot }) {
  return (
    <div className="pa-poll-tables">
      <section aria-labelledby="pa-approval-polls">
        <h3 id="pa-approval-polls" className="pa-board-title">Approval polls</h3>
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
      </section>
      <section aria-labelledby="pa-ballot-polls">
        <h3 id="pa-ballot-polls" className="pa-board-title">Generic ballot polls</h3>
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
            deltaColor: (d) => (d === 0 ? "var(--c97-party-tossup-mark)" : d > 0 ? DEM_COLOR : REP_COLOR),
          }}
        />
      </section>
    </div>
  );
}

// ─── Races board (senate or governors) ────────────────────────────────────────

function RacesBoard({
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
  if (races.length === 0) {
    return (
      <p className="pa-muted">
        VoteHub has published no {label.toLowerCase()} poll from the last four months, so there
        is nothing to average here yet.
      </p>
    );
  }

  const sorted = sortRacesByMargin(races);
  const selectedRace = races.find((r) => r.id === selectedRaceId) ?? sorted[0];
  const close = races.filter((race) => race.margin < 3).length;

  return (
    <div className="pa-races">
      <section className="pa-races-table" aria-labelledby="pa-races-title">
        <div className="pa-board-head">
          <h3 id="pa-races-title" className="pa-board-title">{label} races</h3>
          <p className="pa-muted pa-small">
            {races.length} polled, closest first. {close} of {races.length} within 3 points.
          </p>
        </div>
        <div className="pa-scroll" role="region" aria-label={`${label} race averages (scrolls sideways)`} tabIndex={0}>
          <table className="pa-table" aria-label={`${label} race averages`}>
            <thead>
              <tr>
                <th scope="col">State</th>
                <th scope="col">Leading</th>
                <th scope="col" data-align="end">Margin</th>
                <th scope="col" data-align="end" className="pa-hide-sm">Polls</th>
                <th scope="col" className="pa-hide-md">Last polled</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((race) => (
                <RaceRow
                  key={race.id}
                  race={race}
                  isSelected={race.id === selectedRace.id}
                  onClick={() => onSelectRace(race.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <p className="pa-muted pa-small pa-method">
          A row averages the two leading names from that race&apos;s newest poll over the recent
          polls that asked about both of them, and the panel beside it lists those polls. VoteHub
          publishes candidate names without a party or an incumbency flag, so I print the names as
          the pollsters gave them and do not colour the race rows by party.
        </p>
      </section>

      <RaceSidebar race={selectedRace} />
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
    pushHref(buildPollingHref(nextState, searchParams));
  }

  const hasRaces = (key: PollingView) =>
    key === "senate"
      ? snapshot.senateRaces.length > 0
      : key === "governors"
        ? snapshot.governorRaces.length > 0
        : true;
  const tabs = POLLING_VIEW_OPTIONS.filter(hasRaces);
  // The board shows the requested view when it has polls, and otherwise the
  // first view that does, so an empty race list, a legacy ?view=overview, and
  // the default Senate after useRouteSync drops it all land on the same tab.
  const view: PollingView = tabs.includes(routeState.view) ? routeState.view : tabs[0];

  const approvalDate = newestPollDate(snapshot.approvalPolls);
  const genericBallotDate = newestPollDate(snapshot.genericBallotPolls);
  const now = useClientNow();
  const daysToElection =
    now === null
      ? null
      : Math.round((new Date("2026-11-03T00:00:00Z").getTime() - now) / (1000 * 60 * 60 * 24));
  const racePolls = [...snapshot.senateRaces, ...snapshot.governorRaces].reduce(
    (count, race) => count + race.polls.length,
    0
  );
  const totalPolls = snapshot.approvalPolls.length + snapshot.genericBallotPolls.length + racePolls;
  const election =
    daysToElection === null || daysToElection < 0
      ? "midterms Nov 3, 2026"
      : daysToElection === 0
        ? "election day, Nov 3, 2026"
        : `${daysToElection} ${daysToElection === 1 ? "day" : "days"} to the Nov 3 midterms`;

  return (
    <div className="pa-root">
      <div className="c97-shell c97-frame pa-page">
        <header className="pa-head">
          <h1 className="pa-title">Polling Aggregator</h1>
          <p className="pa-standfirst">
            Presidential approval, the 2026 generic ballot, and every Senate and governor race with a
            recent named poll, averaged from VoteHub as new polls come in.
          </p>
        </header>

        <section className="pa-national" aria-label="National polling">
          <TrendChart snapshot={snapshot} />

          <div className="pa-summary">
            <dl className="pa-figures">
              <div>
                <dt>Approval net</dt>
                <dd className="pa-big">{formatNet(snapshot.approvalAvg.net)}</dd>
                <dd className="pa-muted pa-small">
                  {`${snapshot.approvalAvg.approve.toFixed(1)}% approve, ${snapshot.approvalAvg.disapprove.toFixed(1)}% disapprove`}
                </dd>
              </div>
              <div>
                <dt>Generic ballot margin</dt>
                <dd className="pa-big">{formatMargin(snapshot.genericBallotAvg.margin)}</dd>
                <dd className="pa-muted pa-small">
                  {`D ${snapshot.genericBallotAvg.dem.toFixed(1)}% vs R ${snapshot.genericBallotAvg.rep.toFixed(1)}%`}
                </dd>
              </div>
            </dl>
            <GenericBallotBar dem={snapshot.genericBallotAvg.dem} rep={snapshot.genericBallotAvg.rep} />
          </div>

          <p className="pa-source" role="note">
            <a href="https://votehub.com/polls/api/" target="_blank" rel="noopener noreferrer">
              VoteHub Polling API
            </a>
            {", CC BY 4.0"}
            {approvalDate ? ` · newest approval poll ${formatDate(approvalDate)}` : ""}
            {genericBallotDate ? ` · newest generic ballot poll ${formatDate(genericBallotDate)}` : ""}
            {` · ${totalPolls} polls tracked · ${election}.`}
            {staleSourceNote ? ` ${staleSourceNote}` : ""}
          </p>
        </section>

        <section className="pa-board" aria-label="Races and polls">
          <div className="pa-toolbar">
            <div role="group" className="pa-tabs" aria-label="Polling view switcher">
              {tabs.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => navigate({ view: key, race: routeState.race })}
                  aria-pressed={key === view}
                >
                  {POLLING_VIEW_LABELS[key]}
                </button>
              ))}
            </div>
          </div>

          {view === "approval" ? (
            <ApprovalPollsView snapshot={snapshot} />
          ) : (
            <RacesBoard
              races={view === "senate" ? snapshot.senateRaces : snapshot.governorRaces}
              selectedRaceId={routeState.race}
              onSelectRace={(race) => navigate({ view, race })}
              label={view === "senate" ? "Senate" : "Governor"}
            />
          )}
        </section>
      </div>
    </div>
  );
}
