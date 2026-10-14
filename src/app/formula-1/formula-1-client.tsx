"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, CircleAlert, Minus } from "lucide-react";
import type {
  Formula1ConstructorStanding,
  Formula1DriverStanding,
  Formula1MeetingMeta,
  Formula1MeetingSummary,
  Formula1RaceResultEntry,
  Formula1RouteState,
  Formula1Summary,
  Formula1View,
} from "@/types/formula1";
import {
  buildFormula1Href,
  FORMULA1_VIEW_LABELS,
  FORMULA1_VIEW_OPTIONS,
  normalizeFormula1State,
  resolveFormula1State,
} from "./formula-1-state";
import { TimingTowerSignature } from "./TimingTowerSignature";
import { formatDeficit } from "./timingTower";
import { normaliseTeamColor } from "@/lib/formula1TeamColor";
import styles from "./formula-1.module.css";
import {
  DATE_TIME_FORMATTER,
  formatStableDateTime,
  LONG_DATE_TIME_FORMATTER,
  SHORT_DATE_FORMATTER,
  formatUpdatedAt,
} from "@/lib/date-formatters";
import { useRouteSync } from "@/hooks/useRouteSync";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Formula1ClientProps {
  initialState: Formula1RouteState;
  summary: Formula1Summary;
  initialMeeting: Formula1MeetingSummary | null;
}

/** The board's anchor, where a view switch made from further down the page scrolls back to. */
const BOARD_ID = "f1-board";

function formatDateLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "TBD" : SHORT_DATE_FORMATTER.format(date);
}

function formatDateTimeLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "TBD" : formatStableDateTime(DATE_TIME_FORMATTER, date);
}

function formatLongDateTimeLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "TBD" : formatStableDateTime(LONG_DATE_TIME_FORMATTER, date);
}

function formatPoints(value: number): string {
  return Number.isFinite(value) ? value.toFixed(0) : "0";
}

function formatGmtOffset(value: string | null): string | null {
  if (!value) return null;
  const match = value.trim().match(/^([+-]?)(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const sign = match[1] === "-" ? "-" : "+";
  return `UTC${sign}${match[2].padStart(2, "0")}:${match[3]}`;
}

function liveryOf(color: string | null): string {
  return normaliseTeamColor(color) ?? "var(--f1-ink-2)";
}

async function fetchFormula1Meeting(
  meetingKey: string,
  signal: AbortSignal
): Promise<Formula1MeetingSummary> {
  const response = await fetch(`/api/formula-1/meetings/${meetingKey}`, { signal });
  const payload = (await response.json()) as Formula1MeetingSummary & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "Unable to load the race weekend detail.");
  }

  return payload;
}

// OpenF1 names most circuits after their city, so fifteen of the 2026 rounds
// would otherwise print as "Suzuka in Suzuka".
function describeVenue(
  meeting: Pick<Formula1MeetingMeta, "circuitShortName" | "location" | "countryName">
): string {
  return meeting.circuitShortName === meeting.location
    ? `${meeting.location}, ${meeting.countryName}`
    : `${meeting.circuitShortName} in ${meeting.location}`;
}

function getMeetingStatusCopy(meeting: Formula1MeetingMeta): string {
  if (meeting.status === "upcoming") {
    return "Next weekend";
  }
  if (meeting.status === "live") {
    return "Live weekend";
  }
  return "Latest result";
}

function pad2(value: number): string {
  return String(Math.max(0, value)).padStart(2, "0");
}

function PositionChangeIndicator({
  currentPosition,
  previousPosition,
}: {
  currentPosition: number;
  previousPosition: number | null;
}) {
  if (previousPosition === null || previousPosition === currentPosition) {
    return (
      <span className={styles.move}>
        <Minus size={14} aria-hidden="true" />
        <span className="sr-only">No change</span>
      </span>
    );
  }

  const delta = previousPosition - currentPosition;
  const isUp = delta > 0;
  const Icon = isUp ? ArrowUp : ArrowDown;

  return (
    <span className={styles.move} data-dir={isUp ? "up" : "down"}>
      <Icon size={14} aria-hidden="true" />
      <span aria-hidden="true">{Math.abs(delta)}</span>
      <span className="sr-only">{`${isUp ? "Up" : "Down"} ${Math.abs(delta)}`}</span>
    </span>
  );
}

function CountryFlag({ flagUrl, countryName }: { flagUrl: string | null; countryName: string }) {
  if (!flagUrl) {
    return null;
  }

  return (
    <img
      src={flagUrl}
      alt={`${countryName} flag`}
      loading="lazy"
      decoding="async"
      className={styles.flag}
    />
  );
}

/**
 * Five-light F1 start gantry. Purely decorative. The lights arm left to
 * right and hold lit. Honors `prefers-reduced-motion` (lights hold lit) via
 * the CSS module.
 */
function StartLights() {
  return (
    <span className={styles.gantry} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((index) => (
        <span key={index} className={styles.light} />
      ))}
    </span>
  );
}

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

/**
 * Live countdown to a race start, computed after mount so the ticking digits
 * never trip a server/client hydration mismatch. Returns null until mounted.
 */
function useCountdown(targetIso: string | null): CountdownParts | null {
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    if (!targetIso) return;
    const target = new Date(targetIso).getTime();
    if (Number.isNaN(target)) return;

    const update = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setParts({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      setParts({
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
        isPast: false,
      });
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [targetIso]);

  return parts;
}

function RaceCountdown({ targetIso }: { targetIso: string | null }) {
  const parts = useCountdown(targetIso);

  if (parts?.isPast) {
    return <p className={styles.countdownPast}>Lights out. The race weekend is underway.</p>;
  }

  const cells = [
    { label: "Days", value: parts ? pad2(parts.days) : "––" },
    { label: "Hrs", value: parts ? pad2(parts.hours) : "––" },
    { label: "Min", value: parts ? pad2(parts.minutes) : "––" },
    { label: "Sec", value: parts ? pad2(parts.seconds) : "––" },
  ];

  return (
    <>
      {/* A dl takes no accessible name, so the figures get their label as text. */}
      <p className="sr-only">Lights out in</p>
      <dl className={styles.countdown}>
        {cells.map((cell) => (
          <div key={cell.label} className={styles.countdownCell}>
            <dt>{cell.label}</dt>
            <dd>{cell.value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

/** The right column's masthead: the next (or latest) Grand Prix, its lights, and its clock. */
function NextRace({ meeting, round, total }: { meeting: Formula1MeetingMeta; round: number; total: number }) {
  const isUpcoming = meeting.status === "upcoming" || meeting.status === "live";
  const gmt = formatGmtOffset(meeting.gmtOffset);

  return (
    <section className={styles.next} aria-labelledby="f1-next-heading">
      <div className={styles.nextHead}>
        <p className={styles.kicker}>
          {getMeetingStatusCopy(meeting)} · Round {round} of {total}
        </p>
        {isUpcoming ? <StartLights /> : null}
      </div>
      <h2 id="f1-next-heading" className={styles.nextName}>
        <CountryFlag flagUrl={meeting.countryFlag} countryName={meeting.countryName} />
        {meeting.name}
      </h2>
      <p className={styles.nextMeta}>
        <span>{describeVenue(meeting)}</span>
        <span>
          {meeting.raceStartsAt ? formatDateTimeLabel(meeting.raceStartsAt) : formatDateLabel(meeting.startAt)}
        </span>
        {meeting.circuitType ? <span>{meeting.circuitType}</span> : null}
        {meeting.hasSprint ? <span className={styles.sprint}>Sprint weekend</span> : null}
        {gmt ? <span>{gmt} track time</span> : null}
      </p>
      {isUpcoming ? <RaceCountdown targetIso={meeting.raceStartsAt ?? meeting.startAt} /> : null}
    </section>
  );
}

type StandingRow = {
  key: string;
  position: number;
  previousPosition: number | null;
  name: string;
  team: string | null;
  teamColor: string | null;
  points: number;
  pointsDelta: number;
};

function driverRows(standings: Formula1DriverStanding[]): StandingRow[] {
  return standings.map((standing) => ({
    key: `${standing.driverNumber}-${standing.position}`,
    position: standing.position,
    previousPosition: standing.previousPosition,
    name: standing.driverName,
    team: standing.teamName,
    teamColor: standing.teamColor,
    points: standing.points,
    pointsDelta: standing.pointsDelta,
  }));
}

function constructorRows(standings: Formula1ConstructorStanding[]): StandingRow[] {
  return standings.map((standing) => ({
    key: `${standing.teamName}-${standing.position}`,
    position: standing.position,
    previousPosition: standing.previousPosition,
    name: standing.teamName,
    team: null,
    teamColor: standing.teamColor,
    points: standing.points,
    pointsDelta: standing.pointsDelta,
  }));
}

/** The championship in real table markup, with what the tower leaves out. */
function StandingsTable({
  caption,
  rows,
  nameHeading,
  emptyLabel,
}: {
  caption: string;
  rows: StandingRow[];
  nameHeading: string;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className={styles.empty}>{emptyLabel}</p>;
  }
  const leaderPoints = rows[0]?.points ?? 0;
  const showTeam = rows.some((row) => row.team);

  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className={styles.num}>Pos</th>
            <th scope="col">{nameHeading}</th>
            {showTeam ? <th scope="col" className={styles.wideOnly}>Team</th> : null}
            <th scope="col" className={styles.num}>Pts</th>
            <th scope="col" className={`${styles.num} ${styles.wideOnly}`}>Last race</th>
            <th scope="col" className={styles.num}>Gap</th>
            <th scope="col" className={styles.num}>Move</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td className={styles.num}>{row.position}</td>
              {/* Under 560px the Team and Last race columns are hidden, so each rides under its neighbour. */}
              <td>
                <span className={styles.livery} style={{ background: liveryOf(row.teamColor) }} aria-hidden="true" />
                {row.name}
                {row.team ? <span className={styles.narrowOnly}>{row.team}</span> : null}
              </td>
              {showTeam ? <td className={`${styles.muted} ${styles.wideOnly}`}>{row.team}</td> : null}
              <td className={`${styles.num} ${styles.strong}`}>
                {formatPoints(row.points)}
                {row.pointsDelta > 0 ? (
                  <span className={styles.narrowOnly}>
                    +{formatPoints(row.pointsDelta)}
                    <span className="sr-only"> points at the last race</span>
                  </span>
                ) : null}
              </td>
              <td className={`${styles.num} ${styles.wideOnly}`}>
                {row.pointsDelta > 0 ? `+${formatPoints(row.pointsDelta)}` : "0"}
              </td>
              <td className={`${styles.num} ${styles.muted}`}>
                {row.position === 1 ? "Leader" : formatDeficit(Math.max(0, Math.round(leaderPoints - row.points)))}
              </td>
              <td className={styles.num}>
                <PositionChangeIndicator currentPosition={row.position} previousPosition={row.previousPosition} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultRow({ entry }: { entry: Formula1RaceResultEntry }) {
  return (
    <li className={styles.result} style={{ borderLeftColor: liveryOf(entry.teamColor) }}>
      <div className={styles.resultMain}>
        <p className={styles.strong}>
          {entry.position ?? "NC"} · {entry.driverName}
        </p>
        <p className={styles.muted}>
          {entry.teamName ?? "Unknown team"} · {entry.statusLabel} · {entry.lapsCompleted}{" "}
          {entry.lapsCompleted === 1 ? "lap" : "laps"}
          {entry.gapToLeaderLabel ? ` · ${entry.gapToLeaderLabel}` : ""}
          {entry.durationLabel ? ` · ${entry.durationLabel}` : ""}
        </p>
      </div>
      <p className={styles.resultPoints}>
        {formatPoints(entry.points)}
        <span className="sr-only"> points</span>
        <span aria-hidden="true"> pts</span>
      </p>
    </li>
  );
}

function MeetingSchedule({ meeting }: { meeting: Formula1MeetingSummary }) {
  if (meeting.sessions.length === 0) {
    return <p className={styles.empty}>Session times have not landed in the snapshot yet.</p>;
  }

  return (
    <ol className={styles.schedule}>
      {meeting.sessions.map((session) => (
        <li key={session.key}>
          <p className={styles.strong}>
            {session.name}
            {session.type !== session.name ? <span className={styles.muted}> {session.type}</span> : null}
          </p>
          <p className={styles.muted}>
            {formatLongDateTimeLabel(session.startAt)} to {formatLongDateTimeLabel(session.endAt)}
          </p>
        </li>
      ))}
    </ol>
  );
}

/**
 * One weekend's schedule and classification. When the weekend is the one the
 * masthead already names, its name and venue are not printed a second time.
 * The kicker is the weekend's own status, since any round can be picked here.
 */
function MeetingDetailPanel({ meeting, named }: { meeting: Formula1MeetingSummary; named: boolean }) {
  const gmt = formatGmtOffset(meeting.gmtOffset);
  return (
    <article className={styles.detail} aria-label={`${meeting.name} weekend`}>
      {named ? (
        <h3 className="sr-only">{meeting.name} weekend</h3>
      ) : (
        <>
          <p className={styles.kicker}>{meeting.status}</p>
          <h3 className={styles.h3}>
            <CountryFlag flagUrl={meeting.countryFlag} countryName={meeting.countryName} />
            {meeting.name}
          </h3>
          <p className={styles.nextMeta}>
            <span>{describeVenue(meeting)}</span>
            <span>{formatDateLabel(meeting.startAt)}</span>
            {meeting.circuitType ? <span>{meeting.circuitType}</span> : null}
            {meeting.hasSprint ? <span className={styles.sprint}>Sprint weekend</span> : null}
            {gmt ? <span>{gmt} track time</span> : null}
          </p>
        </>
      )}

      <div className={styles.detailGrid}>
        <div>
          <h4 className={styles.h4}>Weekend schedule</h4>
          <MeetingSchedule meeting={meeting} />
          <p className={styles.note}>Times print in Pacific time.</p>
        </div>
        <div>
          <h4 className={styles.h4}>{meeting.resultPublished ? "Race classification" : "Result status"}</h4>
          {meeting.resultPublished ? (
            <ol className={styles.results}>
              {meeting.classification.map((entry) => (
                <ResultRow key={`${meeting.key}-${entry.driverNumber}`} entry={entry} />
              ))}
            </ol>
          ) : (
            <p className={styles.empty}>
              OpenF1 has not published the official classification for this race yet. I still keep
              the weekend here so the calendar stays intact.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Placeholder while a meeting's full detail (schedule + classification)
 * loads from /api/formula-1/meetings/[meetingId], or when that fetch fails.
 */
function MeetingDetailFallback({ meeting, error }: { meeting: Formula1MeetingMeta; error: string | null }) {
  return (
    <article className={styles.detail}>
      <p className={styles.kicker}>{meeting.status}</p>
      <h3 className={styles.h3}>
        <CountryFlag flagUrl={meeting.countryFlag} countryName={meeting.countryName} />
        {meeting.name}
      </h3>
      {error ? (
        <p role="alert" className={styles.alert}>
          <CircleAlert size={16} aria-hidden="true" />
          {error}
        </p>
      ) : (
        <p role="status" className={styles.empty}>
          Loading race weekend detail…
        </p>
      )}
    </article>
  );
}

function PodiumDisplay({ meeting }: { meeting: Formula1MeetingSummary }) {
  if (!meeting.resultPublished || meeting.podium.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-labelledby="f1-podium-heading">
      <h2 id="f1-podium-heading" className={styles.h2}>
        Podium <span className={styles.muted}>· {meeting.name}</span>
      </h2>
      <ol className={styles.podium}>
        {meeting.podium.slice(0, 3).map((entry, index) => (
          <li key={`${meeting.key}-podium-${entry.driverNumber}`} style={{ borderLeftColor: liveryOf(entry.teamColor) }}>
            <span className={styles.podiumRank}>P{index + 1}</span>
            <span className={styles.podiumName}>
              <span className={styles.strong}>{entry.driverName}</span>
              <span className={styles.muted}>{entry.teamName ?? "Unknown team"}</span>
            </span>
            <span className={styles.podiumGap}>{entry.gapToLeaderLabel ?? `${formatPoints(entry.points)} pts`}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MeetingStrip({
  meetings,
  selectedMeetingKey,
  onSelect,
}: {
  meetings: Formula1MeetingMeta[];
  selectedMeetingKey: string | null;
  onSelect: (meetingKey: string) => void;
}) {
  return (
    // A browser gives a partly visible button focus without scrolling the strip, which leaves
    // one side of its ring cut off, so the strip brings the focused button fully into view.
    <div
      className={styles.raceStrip}
      onFocus={(event) => event.target.scrollIntoView?.({ block: "nearest", inline: "nearest" })}
    >
      {meetings.map((meeting) => (
        <button
          key={meeting.key}
          type="button"
          onClick={() => onSelect(meeting.key)}
          className={styles.raceStripItem}
          aria-pressed={meeting.key === selectedMeetingKey}
        >
          <span className={styles.kicker}>{meeting.status}</span>
          <span className={styles.raceStripName}>{meeting.name}</span>
          <span className={styles.muted}>
            {formatDateLabel(meeting.startAt)} · {meeting.circuitShortName}
          </span>
        </button>
      ))}
    </div>
  );
}

function CalendarTimeline({
  meetings,
  selectedMeetingKey,
  onSelect,
}: {
  meetings: Formula1MeetingMeta[];
  selectedMeetingKey: string | null;
  onSelect: (meetingKey: string) => void;
}) {
  return (
    <ol className={styles.timeline}>
      {meetings.map((meeting, index) => (
        <li key={meeting.key}>
          <button
            type="button"
            onClick={() => onSelect(meeting.key)}
            aria-pressed={meeting.key === selectedMeetingKey}
            className={styles.timelineRow}
          >
            <span className={styles.timelineRound}>R{index + 1}</span>
            <span className={styles.timelineName}>
              <span className={styles.strong}>{meeting.name}</span>
              <span className={styles.muted}>
                {meeting.location}, {meeting.countryName}
              </span>
            </span>
            <span className={styles.timelineDate}>
              <span>{formatDateLabel(meeting.startAt)}</span>
              <span className={styles.muted}>{meeting.status}</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function getRaceStripMeetings(summary: Formula1Summary, selectedMeeting: Formula1MeetingMeta | null) {
  const completed = summary.meetings.filter((meeting) => meeting.status === "completed").slice(-3);
  const live = summary.meetings.filter((meeting) => meeting.status === "live");
  const upcoming = summary.meetings.filter((meeting) => meeting.status === "upcoming").slice(0, 3);
  const raceStrip = [...completed, ...live, ...upcoming];

  if (selectedMeeting && !raceStrip.some((meeting) => meeting.key === selectedMeeting.key)) {
    raceStrip.unshift(selectedMeeting);
  }

  return raceStrip.slice(0, 6);
}

export function Formula1Client({ initialState, summary, initialMeeting }: Formula1ClientProps) {
  const searchParams = useSearchParams();
  const hasManagedParams = searchParams.get("view") !== null || searchParams.get("meeting") !== null;
  const routeState = hasManagedParams ? normalizeFormula1State(searchParams) : initialState;
  const resolvedState = resolveFormula1State(routeState, summary);
  const desiredHref = buildFormula1Href(resolvedState, searchParams, summary.defaultMeetingKey);

  // Full meeting detail cache, keyed by meeting key. Seeded with everything
  // the summary already carries in full so the default paint needs no fetch;
  // other meetings load on demand from /api/formula-1/meetings/[meetingId].
  const [meetingDetails, setMeetingDetails] = useState<Record<string, Formula1MeetingSummary>>(() => {
    const seeded: Record<string, Formula1MeetingSummary> = {};
    for (const meeting of [summary.nextMeeting, summary.lastCompletedMeeting, initialMeeting]) {
      if (meeting) {
        seeded[meeting.key] = meeting;
      }
    }
    return seeded;
  });
  const [meetingDetailErrors, setMeetingDetailErrors] = useState<Record<string, string>>({});

  const pushHref = useRouteSync("/formula-1", desiredHref);
  const reduceMotion = useReducedMotion();

  function navigate(nextState: Formula1RouteState) {
    const resolvedNextState = resolveFormula1State(nextState, summary);
    pushHref(buildFormula1Href(resolvedNextState, searchParams, summary.defaultMeetingKey));
  }

  const selectedMeetingMeta = useMemo(
    () =>
      summary.meetings.find((meeting) => meeting.key === resolvedState.meeting) ??
      summary.nextMeeting ??
      summary.lastCompletedMeeting ??
      summary.meetings[0] ??
      null,
    [resolvedState.meeting, summary]
  );
  const selectedMeetingKey = selectedMeetingMeta?.key ?? null;
  const selectedMeeting = selectedMeetingKey ? meetingDetails[selectedMeetingKey] ?? null : null;
  const selectedMeetingError = selectedMeetingKey ? meetingDetailErrors[selectedMeetingKey] ?? null : null;

  useEffect(() => {
    if (!selectedMeetingKey) {
      return;
    }

    if (meetingDetails[selectedMeetingKey] || meetingDetailErrors[selectedMeetingKey]) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    fetchFormula1Meeting(selectedMeetingKey, controller.signal)
      .then((meeting) => {
        if (cancelled) {
          return;
        }

        setMeetingDetails((current) =>
          current[selectedMeetingKey] ? current : { ...current, [selectedMeetingKey]: meeting }
        );
        setMeetingDetailErrors((current) => {
          if (!(selectedMeetingKey in current)) {
            return current;
          }

          const next = { ...current };
          delete next[selectedMeetingKey];
          return next;
        });
      })
      .catch((error: Error) => {
        if (!cancelled && error.name !== "AbortError") {
          setMeetingDetailErrors((current) => ({
            ...current,
            [selectedMeetingKey]: error.message || "Unable to load the race weekend detail.",
          }));
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [meetingDetailErrors, meetingDetails, selectedMeetingKey]);

  const highlightMeeting: Formula1MeetingMeta | null =
    summary.nextMeeting ?? summary.lastCompletedMeeting ?? selectedMeetingMeta;
  const raceStripMeetings = useMemo(
    () => getRaceStripMeetings(summary, selectedMeetingMeta),
    [selectedMeetingMeta, summary]
  );
  const hasData = summary.meetings.length > 0;
  const { completedRaces, totalRaces } = summary.seasonMetrics;
  const statusLine = `${completedRaces} of ${totalRaces} rounds complete · OpenF1 snapshot checked ${formatUpdatedAt(summary.generatedAt)}`;

  const titleRow = (
    <header className={styles.titleRow}>
      <h1 className={styles.title}>Formula 1 Pulse</h1>
      <p className={styles.standfirst}>
        The {summary.season} championship as a timing tower, with the next Grand Prix beside it and
        every race weekend a click away.
      </p>
      {hasData ? <p className={styles.status}>{statusLine}</p> : null}
    </header>
  );

  if (!hasData) {
    return (
      <div className={styles.root}>
        <div className={`c97-shell c97-frame ${styles.page}`}>
          {titleRow}
          <p className={styles.empty}>
            The season snapshot has not generated yet. The board fills in on the next scheduled refresh.
          </p>
        </div>
      </div>
    );
  }

  const towerKind: "drivers" | "constructors" = resolvedState.view === "constructors" ? "constructors" : "drivers";
  const towerStandings = towerKind === "constructors" ? summary.constructorStandings : summary.driverStandings;
  // The full table's own heading, since the board opens on the same shortened tower.
  const fullTableHref = `${buildFormula1Href(
    { view: towerKind, meeting: selectedMeetingKey ?? summary.defaultMeetingKey },
    searchParams,
    summary.defaultMeetingKey
  )}#f1-${towerKind}-heading`;
  const highlightRound = highlightMeeting
    ? summary.meetings.findIndex((meeting) => meeting.key === highlightMeeting.key) + 1
    : 0;

  // The calendar scrolls a pick's detail to the top, past the masthead, so only
  // the overview leaves the name to the masthead.
  const detail = selectedMeeting ? (
    <MeetingDetailPanel
      meeting={selectedMeeting}
      named={resolvedState.view === "overview" && selectedMeeting.key === highlightMeeting?.key}
    />
  ) : selectedMeetingMeta ? (
    <MeetingDetailFallback meeting={selectedMeetingMeta} error={selectedMeetingError} />
  ) : null;

  return (
    <div className={styles.root}>
      <div className={`c97-shell c97-frame ${styles.page}`}>
        {titleRow}

        <div className={styles.toolbar}>
          <div className={styles.switch} role="group" aria-label="Season view">
            {FORMULA1_VIEW_OPTIONS.map((view: Formula1View) => (
              <button
                key={view}
                type="button"
                aria-pressed={view === resolvedState.view}
                onClick={() => {
                  navigate({ view, meeting: selectedMeetingKey ?? summary.defaultMeetingKey });
                  // The switch is sticky and the views differ in length, so a switch made
                  // below the board's top would otherwise leave the page near the footer.
                  const board = document.getElementById(BOARD_ID);
                  if (board && board.getBoundingClientRect().top < 0) {
                    board.scrollIntoView?.({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
                  }
                }}
              >
                {FORMULA1_VIEW_LABELS[view]}
              </button>
            ))}
          </div>
        </div>

        <div id={BOARD_ID} className={styles.board}>
          <div className={styles.towerColumn}>
            <TimingTowerSignature standings={towerStandings} kind={towerKind} fullTableHref={fullTableHref} />
          </div>

          <div className={styles.main}>
            {highlightMeeting ? (
              <NextRace meeting={highlightMeeting} round={highlightRound} total={totalRaces} />
            ) : null}

            {resolvedState.view === "overview" ? (
              <>
                <section className={styles.section} aria-labelledby="f1-constructors-heading">
                  <h2 id="f1-constructors-heading" className={styles.h2}>
                    Constructors
                  </h2>
                  <StandingsTable
                    caption="Constructor championship"
                    nameHeading="Team"
                    rows={constructorRows(summary.constructorStandings)}
                    emptyLabel="Constructor standings will show up after OpenF1 publishes a race-backed table."
                  />
                </section>

                {summary.lastCompletedMeeting ? <PodiumDisplay meeting={summary.lastCompletedMeeting} /> : null}

                <section className={styles.section} aria-labelledby="f1-weekends-heading">
                  <h2 id="f1-weekends-heading" className={styles.h2}>
                    Recent and upcoming weekends
                  </h2>
                  <MeetingStrip
                    meetings={raceStripMeetings}
                    selectedMeetingKey={selectedMeetingKey}
                    onSelect={(meetingKey) => navigate({ view: "overview", meeting: meetingKey })}
                  />
                  {detail}
                </section>
              </>
            ) : null}

            {resolvedState.view === "drivers" ? (
              <section className={styles.section} aria-labelledby="f1-drivers-heading">
                <h2 id="f1-drivers-heading" className={`${styles.h2} ${styles.anchor}`}>
                  Driver championship
                </h2>
                <StandingsTable
                  caption="Driver championship"
                  nameHeading="Driver"
                  rows={driverRows(summary.driverStandings)}
                  emptyLabel="OpenF1 has not published a race-backed championship table yet."
                />
              </section>
            ) : null}

            {resolvedState.view === "constructors" ? (
              <section className={styles.section} aria-labelledby="f1-constructors-heading">
                <h2 id="f1-constructors-heading" className={`${styles.h2} ${styles.anchor}`}>
                  Constructor championship
                </h2>
                <StandingsTable
                  caption="Constructor championship"
                  nameHeading="Team"
                  rows={constructorRows(summary.constructorStandings)}
                  emptyLabel="Constructor standings will show up after OpenF1 publishes a race-backed table."
                />
              </section>
            ) : null}

            {resolvedState.view === "calendar" ? (
              <section className={styles.section} aria-labelledby="f1-calendar-heading">
                <h2 id="f1-calendar-heading" className={styles.h2}>
                  Season calendar
                </h2>
                <div id="race-weekend-detail" className={styles.anchor}>
                  {detail}
                </div>
                <CalendarTimeline
                  meetings={summary.meetings}
                  selectedMeetingKey={selectedMeetingKey}
                  onSelect={(meetingKey) => {
                    navigate({ view: "calendar", meeting: meetingKey });
                    // The detail sits above the timeline, so a pick brings it into view.
                    document
                      .getElementById("race-weekend-detail")
                      ?.scrollIntoView?.({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
                  }}
                />
              </section>
            ) : null}
          </div>
        </div>

        <p className={styles.source}>
          From OpenF1&apos;s community-run and unofficial historical feeds (
          <a href={summary.sourceUrls.docs}>docs</a>), frozen into a checked-in snapshot on a schedule.
          This dashboard is not affiliated with Formula 1, the FIA, or Formula One Management.
        </p>
      </div>
    </div>
  );
}
