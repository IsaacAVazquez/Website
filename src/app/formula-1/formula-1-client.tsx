"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, CircleAlert, Clock, Flag, Minus } from "lucide-react";
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
  FORMULA1_ROUTE,
  FORMULA1_VIEW_DESCRIPTIONS,
  FORMULA1_VIEW_LABELS,
  FORMULA1_VIEW_OPTIONS,
  normalizeFormula1State,
  resolveFormula1State,
} from "./formula-1-state";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { TimingTowerSignature } from "./TimingTowerSignature";
import styles from "./formula-1.module.css";
import {
  DATE_TIME_FORMATTER,
  LONG_DATE_TIME_FORMATTER,
  SHORT_DATE_FORMATTER,
  formatUpdatedAt,
} from "@/lib/date-formatters";

interface Formula1ClientProps {
  initialState: Formula1RouteState;
  summary: Formula1Summary;
  initialMeeting: Formula1MeetingSummary | null;
}

function formatDateLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "TBD" : SHORT_DATE_FORMATTER.format(date);
}

function formatDateTimeLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "TBD" : DATE_TIME_FORMATTER.format(date);
}

function formatLongDateTimeLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "TBD" : LONG_DATE_TIME_FORMATTER.format(date);
}

function formatPoints(value: number): string {
  return Number.isFinite(value) ? value.toFixed(0) : "0";
}

const DELTA_FORMATTER = new Intl.NumberFormat("en-US", {
  signDisplay: "exceptZero",
  maximumFractionDigits: 0,
});

function formatDelta(value: number): string {
  if (!Number.isFinite(value) || value === 0) {
    return "No gain";
  }
  return DELTA_FORMATTER.format(value);
}

function formatGmtOffset(value: string | null): string | null {
  if (!value) return null;
  const match = value.trim().match(/^([+-]?)(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const sign = match[1] === "-" ? "-" : "+";
  return `UTC${sign}${match[2].padStart(2, "0")}:${match[3]}`;
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

function getMeetingStatusCopy(meeting: Formula1MeetingMeta): string {
  if (meeting.status === "upcoming") {
    return "Next weekend";
  }
  if (meeting.status === "live") {
    return "Live weekend";
  }
  return "Latest result";
}

function getSessionAccent(type: string): string {
  const value = type.toLowerCase();
  if (value.includes("race") && !value.includes("sprint")) return "var(--c97-accent)";
  if (value.includes("sprint")) return "var(--c97-warning)";
  if (value.includes("qualif")) return "var(--c97-accent)";
  return "var(--c97-ink-2)";
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
      <span className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--c97-ink-2)" }}>
        <Minus size={14} aria-hidden="true" />
        <span>Flat</span>
      </span>
    );
  }

  const delta = previousPosition - currentPosition;
  const isUp = delta > 0;
  const absoluteDelta = Math.abs(delta);
  const accent = isUp ? "var(--c97-positive)" : "var(--c97-negative)";
  const Icon = isUp ? ArrowUp : ArrowDown;
  const label = `${isUp ? "Up" : "Down"} ${absoluteDelta}`;

  return (
    <span
      className="inline-flex items-center gap-1 text-sm font-semibold"
      style={{ color: accent }}
      aria-label={label}
    >
      <Icon size={14} aria-hidden="true" />
      <span>{absoluteDelta}</span>
    </span>
  );
}

function CountryFlag({
  flagUrl,
  countryName,
}: {
  flagUrl: string | null;
  countryName: string;
}) {
  if (!flagUrl) {
    return null;
  }

  return (
    <img
      src={flagUrl}
      alt={`${countryName} flag`}
      loading="lazy"
      decoding="async"
      className="h-4 w-7 flex-shrink-0 object-cover"
    />
  );
}

function DriverHeadshot({
  url,
  name,
  teamColor,
  size = 36,
}: {
  url: string | null;
  name: string;
  teamColor: string | null;
  size?: number;
}) {
  const dimension = { width: size, height: size, borderRadius: "50%" };

  if (!url) {
    return (
      <div
        className="flex flex-shrink-0 items-center justify-center border text-3xs font-semibold uppercase"
        style={{
          borderColor: teamColor ?? "var(--c97-ink-2)",
          background: "var(--c97-field)",
          color: "var(--c97-ink-2)",
          letterSpacing: "0.08em",
          ...dimension,
        }}
        aria-hidden="true"
      >
        {name
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part.charAt(0))
          .join("")
          .toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      loading="lazy"
      decoding="async"
      className="flex-shrink-0 border object-cover object-top"
      style={{ borderColor: teamColor ?? "var(--c97-ink-2)", background: "var(--c97-field)", ...dimension }}
    />
  );
}

function TeamSwatch({ color }: { color: string | null }) {
  return (
    <span
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center border"
      style={{
        borderColor: color ?? "var(--c97-ink-2)",
        borderRadius: "50%",
        background: color ? `color-mix(in srgb, ${color} 18%, var(--c97-field))` : "var(--c97-field)",
      }}
      aria-hidden="true"
    >
      <span style={{ height: "12px", width: "12px", borderRadius: "50%", background: color ?? "var(--c97-ink-2)" }} />
    </span>
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

function CountdownCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2 py-2.5 text-center" style={{ border: "1px solid var(--c97-rule)", background: "var(--c97-field)" }}>
      <p className="c97-mono mb-0 text-[1.6rem] leading-none" style={{ color: "var(--c97-ink)" }}>
        {value}
      </p>
      <p className="mb-0 mt-1.5 text-3xs font-semibold uppercase" style={{ color: "var(--c97-ink-2)", letterSpacing: "0.16em" }}>
        {label}
      </p>
    </div>
  );
}

function RaceCountdown({ targetIso }: { targetIso: string | null }) {
  const parts = useCountdown(targetIso);

  if (parts?.isPast) {
    return (
      <div className="flex items-center gap-2 px-4 py-3" style={{ border: "1px solid var(--c97-rule)", background: "var(--c97-field)" }}>
        <span
          className="h-2.5 w-2.5 flex-shrink-0"
          style={{ borderRadius: "50%", background: "var(--c97-positive)" }}
          aria-hidden="true"
        />
        <p className="mb-0 text-sm font-semibold" style={{ color: "var(--c97-ink)" }}>
          Lights out. The race weekend is underway.
        </p>
      </div>
    );
  }

  const cells = [
    { label: "Days", value: parts ? pad2(parts.days) : "––" },
    { label: "Hrs", value: parts ? pad2(parts.hours) : "––" },
    { label: "Min", value: parts ? pad2(parts.minutes) : "––" },
    { label: "Sec", value: parts ? pad2(parts.seconds) : "––" },
  ];

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-2xs font-semibold uppercase" style={{ color: "var(--c97-ink-2)", letterSpacing: "0.18em" }}>
        <Clock size={13} aria-hidden="true" />
        Lights out in
      </p>
      <div className="grid grid-cols-4 gap-2">
        {cells.map((cell) => (
          <CountdownCell key={cell.label} value={cell.value} label={cell.label} />
        ))}
      </div>
    </div>
  );
}

interface LeaderboardRowData {
  position: number;
  previousPosition: number | null;
  primary: string;
  secondary: string | null;
  badge: string | null;
  headshotUrl: string | null;
  teamColor: string | null;
  points: number;
  pointsDelta: number;
}

function LeaderboardRow({
  row,
  leaderPoints,
  showHeadshot,
}: {
  row: LeaderboardRowData;
  leaderPoints: number;
  showHeadshot: boolean;
}) {
  const ratio = leaderPoints > 0 ? row.points / leaderPoints : 0;
  const pct = row.points <= 0 ? 0 : Math.max(4, Math.round(ratio * 100));
  const gap = Math.max(0, Math.round(leaderPoints - row.points));
  const isLeader = row.position === 1;
  const accent = row.teamColor ?? "var(--c97-ink-2)";

  return (
    <li
      className="flex flex-col gap-2.5 px-3.5 py-3"
      style={{ background: "var(--c97-field)", borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-center gap-3">
        <span className="c97-mono w-6 flex-shrink-0 text-center text-sm" style={{ color: "var(--c97-ink)" }}>
          {row.position}
        </span>
        {showHeadshot ? (
          <DriverHeadshot url={row.headshotUrl} name={row.primary} teamColor={row.teamColor} />
        ) : (
          <TeamSwatch color={row.teamColor} />
        )}
        <div className="min-w-0 flex-1">
          <p className="mb-0 truncate font-semibold" style={{ color: "var(--c97-ink)" }}>
            {row.primary}
          </p>
          {row.secondary || row.badge ? (
            <p className="mb-0 truncate text-xs uppercase" style={{ color: "var(--c97-ink-2)", letterSpacing: "0.12em" }}>
              {row.secondary ?? row.badge}
            </p>
          ) : null}
        </div>
        <PositionChangeIndicator currentPosition={row.position} previousPosition={row.previousPosition} />
        <div className="w-12 flex-shrink-0 text-right">
          <p className="c97-mono mb-0 text-base" style={{ color: "var(--c97-ink)" }}>
            {formatPoints(row.points)}
          </p>
          <p className="mb-0 text-3xs font-semibold uppercase" style={{ color: "var(--c97-ink-2)" }}>
            pts
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative h-1.5 flex-1" style={{ background: "var(--c97-rule)" }}>
          <span className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, background: accent }} />
        </div>
        {row.pointsDelta > 0 ? (
          <span
            className="inline-flex flex-shrink-0 items-center gap-0.5 text-2xs font-semibold"
            style={{ color: "var(--c97-positive)" }}
            title="Points gained at the last race"
          >
            <ArrowUp size={11} aria-hidden="true" />
            {formatDelta(row.pointsDelta)}
          </span>
        ) : null}
        <span className="w-[6.5ch] flex-shrink-0 text-right text-2xs font-semibold uppercase" style={{ color: "var(--c97-ink-2)" }}>
          {isLeader ? "Leader" : `−${gap}`}
        </span>
      </div>
    </li>
  );
}

function DriverLeaderboard({
  standings,
  limit,
}: {
  standings: Formula1DriverStanding[];
  limit?: number;
}) {
  const rows = typeof limit === "number" ? standings.slice(0, limit) : standings;
  const leaderPoints = standings[0]?.points ?? 0;

  if (rows.length === 0) {
    return (
      <p className="mb-0 text-sm leading-6" style={{ color: "var(--c97-ink-2)" }}>
        OpenF1 has not published a race-backed championship table yet.
      </p>
    );
  }

  return (
    <ol className="mt-0 space-y-2.5 pl-0">
      {rows.map((standing) => (
        <LeaderboardRow
          key={`${standing.driverNumber}-${standing.position}`}
          showHeadshot
          leaderPoints={leaderPoints}
          row={{
            position: standing.position,
            previousPosition: standing.previousPosition,
            primary: standing.driverName,
            secondary: standing.teamName,
            badge: standing.acronym ?? String(standing.driverNumber),
            headshotUrl: standing.headshotUrl,
            teamColor: standing.teamColor,
            points: standing.points,
            pointsDelta: standing.pointsDelta,
          }}
        />
      ))}
    </ol>
  );
}

function ConstructorLeaderboard({
  standings,
  limit,
}: {
  standings: Formula1ConstructorStanding[];
  limit?: number;
}) {
  const rows = typeof limit === "number" ? standings.slice(0, limit) : standings;
  const leaderPoints = standings[0]?.points ?? 0;

  if (rows.length === 0) {
    return (
      <p className="mb-0 text-sm leading-6" style={{ color: "var(--c97-ink-2)" }}>
        Constructor standings will show up after OpenF1 publishes a race-backed table.
      </p>
    );
  }

  return (
    <ol className="mt-0 space-y-2.5 pl-0">
      {rows.map((standing) => (
        <LeaderboardRow
          key={`${standing.teamName}-${standing.position}`}
          showHeadshot={false}
          leaderPoints={leaderPoints}
          row={{
            position: standing.position,
            previousPosition: standing.previousPosition,
            primary: standing.teamName,
            secondary: null,
            badge: null,
            headshotUrl: null,
            teamColor: standing.teamColor,
            points: standing.points,
            pointsDelta: standing.pointsDelta,
          }}
        />
      ))}
    </ol>
  );
}

function SectionHeader({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-3">
      <div>
        <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>{kicker}</p>
        <h3 className="c97-serif c97-h3">{title}</h3>
      </div>
      <p className="mb-0 sm:max-w-[32ch] sm:text-right" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
        {description}
      </p>
    </div>
  );
}

function ResultRow({ entry }: { entry: Formula1RaceResultEntry }) {
  const accent = entry.teamColor ?? "var(--c97-ink-2)";
  return (
    <li className="px-4 py-3" style={{ background: "var(--c97-field)", borderLeft: `3px solid ${accent}` }}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-0 font-semibold" style={{ color: "var(--c97-ink)" }}>
            {entry.position ?? "NC"} · {entry.driverName}
          </p>
          <p className="mb-0 mt-1 text-sm" style={{ color: "var(--c97-ink-2)" }}>
            {entry.teamName ?? "Unknown team"} · {entry.statusLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="c97-mono mb-0 font-semibold" style={{ color: "var(--c97-ink)" }}>
            {formatPoints(entry.points)}
          </p>
          <p className="mb-0 mt-1 text-xs uppercase" style={{ color: "var(--c97-ink-2)" }}>
            points
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="c97-chip">{entry.lapsCompleted} laps</span>
        {entry.gapToLeaderLabel ? <span className="c97-chip">{entry.gapToLeaderLabel}</span> : null}
        {entry.durationLabel ? <span className="c97-chip">{entry.durationLabel}</span> : null}
      </div>
    </li>
  );
}

function MeetingSchedule({ meeting }: { meeting: Formula1MeetingSummary }) {
  if (meeting.sessions.length === 0) {
    return (
      <p className="mb-0 text-sm leading-6" style={{ color: "var(--c97-ink-2)" }}>
        Session times have not landed in the snapshot yet.
      </p>
    );
  }

  return (
    <ol className="mt-0 space-y-3 pl-0">
      {meeting.sessions.map((session) => {
        const accent = getSessionAccent(session.type);
        return (
          <li
            key={session.key}
            className="min-h-[44px] px-4 py-3"
            style={{ background: "var(--c97-field)", borderLeft: `3px solid ${accent}` }}
          >
            <p className="mb-0 font-semibold" style={{ color: "var(--c97-ink)" }}>
              {session.name}
              {session.type !== session.name ? (
                <span className="ml-2 font-normal" style={{ color: "var(--c97-ink-2)" }}>
                  {session.type}
                </span>
              ) : null}
            </p>
            <p className="mb-0 mt-1 text-sm" style={{ color: "var(--c97-ink-2)" }}>
              {formatLongDateTimeLabel(session.startAt)} to {formatLongDateTimeLabel(session.endAt)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function MeetingDetailPanel({
  meeting,
  compact = false,
}: {
  meeting: Formula1MeetingSummary;
  compact?: boolean;
}) {
  return (
    <div className="c97-panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="c97-kicker">{getMeetingStatusCopy(meeting)}</p>
            <CountryFlag flagUrl={meeting.countryFlag} countryName={meeting.countryName} />
          </div>
          <h3 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-1)" }}>{meeting.name}</h3>
          <p className="mt-2 mb-0 max-w-[48ch] text-sm leading-6" style={{ color: "var(--c97-ink-2)" }}>
            {meeting.circuitShortName} in {meeting.location}. I keep the schedule and the
            classification in one place so the weekend reads cleanly.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="c97-chip">{formatDateLabel(meeting.startAt)}</span>
          {meeting.circuitType ? <span className="c97-chip">{meeting.circuitType}</span> : null}
          {meeting.hasSprint ? <span className="c97-chip c97-chip-warning">Sprint weekend</span> : null}
          {formatGmtOffset(meeting.gmtOffset) ? <span className="c97-chip">{formatGmtOffset(meeting.gmtOffset)}</span> : null}
        </div>
      </div>

      <div className={`mt-6 grid grid-cols-1 gap-6 ${compact ? "lg:grid-cols-[1.1fr_0.9fr]" : "xl:grid-cols-[1.05fr_0.95fr]"}`}>
        <div>
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>Weekend schedule</p>
          <MeetingSchedule meeting={meeting} />
          <p className="mt-4 mb-0 text-xs leading-6" style={{ color: "var(--c97-ink-2)" }}>
            Times render in your local timezone. The weekend offset chip shows the track timezone.
          </p>
        </div>

        <div>
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
            {meeting.resultPublished ? "Race classification" : "Result status"}
          </p>
          {meeting.resultPublished ? (
            <ol className="mt-0 space-y-3 pl-0">
              {meeting.classification.slice(0, compact ? 6 : meeting.classification.length).map((entry) => (
                <ResultRow key={`${meeting.key}-${entry.driverNumber}`} entry={entry} />
              ))}
            </ol>
          ) : (
            <p className="mb-0 text-sm leading-6" style={{ color: "var(--c97-ink-2)" }}>
              OpenF1 has not published the official classification for this race yet. I still keep
              the weekend here so the calendar stays intact.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PodiumDisplay({ meeting }: { meeting: Formula1MeetingSummary }) {
  if (!meeting.resultPublished || meeting.podium.length === 0) {
    return null;
  }

  const slots = meeting.podium.slice(0, 3);

  return (
    <div>
      <SectionHeader
        kicker="Podium"
        title={meeting.name}
        description="Top three from the last published classification."
      />

      <ol className={`pl-0 ${styles.podiumRow}`}>
        {slots.map((entry, index) => {
          const accent = entry.teamColor ?? "var(--c97-ink-2)";
          return (
            <li
              key={`${meeting.key}-podium-${entry.driverNumber}`}
              className="c97-panel"
              style={{ borderTop: `4px solid ${accent}` }}
            >
              <div className="flex items-center justify-between">
                <span className={`c97-mono ${styles.podiumRank}`} style={{ color: "var(--c97-ink-2)" }}>
                  P{index + 1}
                </span>
                <span className="c97-mono text-sm" style={{ color: "var(--c97-ink)" }}>
                  {formatPoints(entry.points)} pts
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <DriverHeadshot url={entry.headshotUrl} name={entry.driverName} teamColor={entry.teamColor} size={44} />
                <div className="min-w-0">
                  <p className="mb-0 truncate font-semibold" style={{ color: "var(--c97-ink)" }}>
                    {entry.driverName}
                  </p>
                  <p className="mb-0 truncate text-xs uppercase" style={{ color: "var(--c97-ink-2)" }}>
                    {entry.teamName ?? "Unknown team"}
                  </p>
                </div>
              </div>
              {entry.gapToLeaderLabel ? (
                <p className="mt-3 mb-0 text-xs" style={{ color: "var(--c97-ink-2)" }}>
                  {entry.gapToLeaderLabel}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
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
    <div className={styles.raceStrip}>
      {meetings.map((meeting) => {
        const isSelected = meeting.key === selectedMeetingKey;
        return (
          <button
            key={meeting.key}
            type="button"
            onClick={() => onSelect(meeting.key)}
            className={styles.raceStripItem}
            aria-pressed={isSelected}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="c97-kicker">{meeting.status}</p>
              <CountryFlag flagUrl={meeting.countryFlag} countryName={meeting.countryName} />
            </div>
            <p className="c97-serif" style={{ marginTop: "var(--c97-sp-1)", fontSize: "var(--c97-fs-body)" }}>
              {meeting.name}
            </p>
            <p className="mt-1 mb-0 text-sm" style={{ color: "var(--c97-ink-2)" }}>
              {formatDateLabel(meeting.startAt)} · {meeting.circuitShortName}
            </p>
          </button>
        );
      })}
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
    <ol className="space-y-3 pl-0">
      {meetings.map((meeting, index) => {
        const isSelected = meeting.key === selectedMeetingKey;

        return (
          <li key={meeting.key}>
            <button
              type="button"
              onClick={() => onSelect(meeting.key)}
              aria-pressed={isSelected}
              className="c97-row min-h-[44px] w-full px-4 py-3 text-left"
              style={{
                background: isSelected ? "var(--c97-field)" : "transparent",
                borderBottom: "1px solid var(--c97-rule)",
              }}
            >
              <div className="min-w-0">
                <p className="mb-0 text-xs font-semibold uppercase" style={{ color: "var(--c97-ink-2)" }}>
                  Round {index + 1}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <CountryFlag flagUrl={meeting.countryFlag} countryName={meeting.countryName} />
                  <p className="c97-serif truncate" style={{ fontSize: "var(--c97-fs-body)" }}>
                    {meeting.name}
                  </p>
                </div>
                <p className="mt-1 mb-0 text-sm leading-6" style={{ color: "var(--c97-ink-2)" }}>
                  {meeting.location}, {meeting.countryName}
                </p>
              </div>
              <div className="text-right text-sm" style={{ color: "var(--c97-ink-2)" }}>
                <p className="mb-0">{formatDateLabel(meeting.startAt)}</p>
                <p className="mb-0 mt-1">{meeting.status}</p>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function ViewToggle({
  view,
  activeView,
  onSelect,
}: {
  view: Formula1View;
  activeView: Formula1View;
  onSelect: (view: Formula1View) => void;
}) {
  const isActive = view === activeView;

  return (
    <button type="button" onClick={() => onSelect(view)} aria-pressed={isActive} className="min-h-[44px] text-sm font-semibold">
      {FORMULA1_VIEW_LABELS[view]}
    </button>
  );
}

function getRaceStripMeetings(
  summary: Formula1Summary,
  selectedMeeting: Formula1MeetingMeta | null
) {
  const completed = summary.meetings.filter((meeting) => meeting.status === "completed").slice(-3);
  const upcoming = summary.meetings.filter((meeting) => meeting.status === "upcoming").slice(0, 3);
  const raceStrip = [...completed, ...upcoming];

  if (selectedMeeting && !raceStrip.some((meeting) => meeting.key === selectedMeeting.key)) {
    raceStrip.unshift(selectedMeeting);
  }

  return raceStrip.slice(0, 6);
}

/**
 * Placeholder card while a meeting's full detail (schedule + classification)
 * loads from /api/formula-1/meetings/[meetingId], or when that fetch fails.
 * Mirrors the async states the golf drilldown uses.
 */
function MeetingDetailFallback({
  meeting,
  error,
}: {
  meeting: Formula1MeetingMeta;
  error: string | null;
}) {
  return (
    <div className="c97-panel">
      <div className="flex items-center gap-2">
        <p className="c97-kicker">{getMeetingStatusCopy(meeting)}</p>
        <CountryFlag flagUrl={meeting.countryFlag} countryName={meeting.countryName} />
      </div>
      <h3 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-1)" }}>{meeting.name}</h3>
      {error ? (
        <div
          className="mt-4 px-4 py-4"
          role="alert"
          style={{ background: "var(--c97-field)", borderLeft: "3px solid var(--c97-negative)" }}
        >
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--c97-negative)" }} aria-hidden="true" />
            <p className="mb-0 text-sm leading-6" style={{ color: "var(--c97-ink)" }}>
              {error}
            </p>
          </div>
        </div>
      ) : (
        <p className="mb-0 mt-4 text-sm leading-6" role="status" style={{ color: "var(--c97-ink-2)" }}>
          Loading race weekend detail…
        </p>
      )}
    </div>
  );
}

export function Formula1Client({ initialState, summary, initialMeeting }: Formula1ClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const currentHref = `/formula-1${currentQuery ? `?${currentQuery}` : ""}`;
  const hasManagedParams =
    searchParams.get("view") !== null || searchParams.get("meeting") !== null;
  const routeState = hasManagedParams ? normalizeFormula1State(searchParams) : initialState;
  const resolvedState = resolveFormula1State(routeState, summary);
  const desiredHref = buildFormula1Href(
    resolvedState,
    searchParams,
    summary.defaultMeetingKey
  );

  // Full meeting detail cache, keyed by meeting key. Seeded with everything
  // the summary already carries in full so the default paint needs no fetch;
  // other meetings load on demand from /api/formula-1/meetings/[meetingId].
  const [meetingDetails, setMeetingDetails] = useState<Record<string, Formula1MeetingSummary>>(
    () => {
      const seeded: Record<string, Formula1MeetingSummary> = {};
      for (const meeting of [summary.nextMeeting, summary.lastCompletedMeeting, initialMeeting]) {
        if (meeting) {
          seeded[meeting.key] = meeting;
        }
      }
      return seeded;
    }
  );
  const [meetingDetailErrors, setMeetingDetailErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentHref === desiredHref) {
      return;
    }

    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
    });
  }, [currentHref, desiredHref, router]);

  function navigate(nextState: Formula1RouteState) {
    const resolvedNextState = resolveFormula1State(nextState, summary);
    const href = buildFormula1Href(
      resolvedNextState,
      searchParams,
      summary.defaultMeetingKey
    );

    if (href === currentHref) {
      return;
    }

    startTransition(() => {
      router.push(href, { scroll: false });
    });
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
  const selectedMeeting = selectedMeetingKey
    ? meetingDetails[selectedMeetingKey] ?? null
    : null;
  const selectedMeetingError = selectedMeetingKey
    ? meetingDetailErrors[selectedMeetingKey] ?? null
    : null;

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
  const highlightIsUpcoming =
    highlightMeeting?.status === "upcoming" || highlightMeeting?.status === "live";
  const driverLeader = summary.driverStandings[0] ?? null;
  const driverRunnerUp = summary.driverStandings[1] ?? null;
  const constructorLeader = summary.constructorStandings[0] ?? null;
  const constructorRunnerUp = summary.constructorStandings[1] ?? null;
  const driverGap = driverLeader && driverRunnerUp ? driverLeader.points - driverRunnerUp.points : null;
  const constructorGap =
    constructorLeader && constructorRunnerUp ? constructorLeader.points - constructorRunnerUp.points : null;
  const raceStripMeetings = useMemo(
    () => getRaceStripMeetings(summary, selectedMeetingMeta),
    [selectedMeetingMeta, summary]
  );

  const lead = PROJECT_PRESS[FORMULA1_ROUTE].lead;
  const standfirst =
    "I wanted the season readable at a glance, from who's leading the title race, to who gained ground at the last Grand Prix, to when lights go out next. I pull OpenF1's historical feeds into a checked-in snapshot on a schedule, so the page stays fast and never depends on a live session mid-race.";
  const hasData = summary.meetings.length > 0;

  if (!hasData) {
    return (
      <Catalog97ProjectHero
        ink={lead}
        title="Formula 1 Pulse"
        standfirst={`${standfirst} The season snapshot has not generated yet. The dashboard fills in on the next scheduled refresh.`}
      />
    );
  }

  const towerKind: "drivers" | "constructors" = resolvedState.view === "constructors" ? "constructors" : "drivers";
  const towerStandings = towerKind === "constructors" ? summary.constructorStandings : summary.driverStandings;

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="Formula 1 Pulse"
        standfirst={standfirst}
        meta={`${summary.sourceLabel} · checked ${formatUpdatedAt(summary.generatedAt)}`}
        readouts={[
          {
            label: "Driver leader",
            value: driverLeader ? driverLeader.driverName : "TBD",
            detail: driverLeader
              ? driverGap !== null && driverRunnerUp
                ? `+${formatPoints(driverGap)} over ${driverRunnerUp.driverName}`
                : `${formatPoints(driverLeader.points)} pts`
              : "Not published yet",
          },
          {
            label: "Constructor leader",
            value: constructorLeader ? constructorLeader.teamName : "TBD",
            detail: constructorLeader
              ? constructorGap !== null && constructorRunnerUp
                ? `+${formatPoints(constructorGap)} over ${constructorRunnerUp.teamName}`
                : `${formatPoints(constructorLeader.points)} pts`
              : "Not published yet",
          },
          {
            label: "Season",
            value: `${summary.seasonMetrics.completedRaces} / ${summary.seasonMetrics.totalRaces}`,
            detail: "rounds complete",
          },
        ]}
      >
        <TimingTowerSignature standings={towerStandings} kind={towerKind} />
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell">
          <h2 className="c97-poster-sm">Race weekend</h2>

          {highlightMeeting ? (
            <div className="c97-panel" style={{ marginTop: "var(--c97-sp-4)" }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>{getMeetingStatusCopy(highlightMeeting)}</p>
                  <h3 className="c97-serif c97-h3 flex items-center gap-2">
                    <CountryFlag flagUrl={highlightMeeting.countryFlag} countryName={highlightMeeting.countryName} />
                    {highlightMeeting.name}
                  </h3>
                  <p className="mb-0 mt-1 text-sm leading-6" style={{ color: "var(--c97-ink-2)" }}>
                    {highlightMeeting.circuitShortName} in {highlightMeeting.location}
                  </p>
                </div>
                {highlightIsUpcoming ? (
                  <StartLights />
                ) : (
                  <Flag aria-hidden="true" size={18} style={{ color: "var(--c97-ink-2)" }} />
                )}
              </div>

              {highlightIsUpcoming ? (
                <div style={{ marginTop: "var(--c97-sp-4)" }}>
                  <RaceCountdown targetIso={highlightMeeting.raceStartsAt ?? highlightMeeting.startAt} />
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2" style={{ marginTop: "var(--c97-sp-3)" }}>
                <span className="c97-chip">
                  {highlightMeeting.raceStartsAt
                    ? formatDateTimeLabel(highlightMeeting.raceStartsAt)
                    : formatDateLabel(highlightMeeting.startAt)}
                </span>
                {highlightMeeting.circuitType ? <span className="c97-chip">{highlightMeeting.circuitType}</span> : null}
                {highlightMeeting.hasSprint ? (
                  <span className="c97-chip c97-chip-warning">Sprint weekend</span>
                ) : null}
                {formatGmtOffset(highlightMeeting.gmtOffset) ? (
                  <span className="c97-chip">{formatGmtOffset(highlightMeeting.gmtOffset)}</span>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="c97-prose" style={{ marginTop: "var(--c97-sp-3)" }}>
              The current snapshot does not include a published season schedule yet.
            </p>
          )}
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="torn">
        <div className="c97-shell">
          <h2 className="c97-poster-sm">The season</h2>

          <div className="c97-segmented" role="group" aria-label="Season view" style={{ marginTop: "var(--c97-sp-4)" }}>
            {FORMULA1_VIEW_OPTIONS.map((view) => (
              <ViewToggle
                key={view}
                view={view}
                activeView={resolvedState.view}
                onSelect={(nextView) =>
                  navigate({
                    view: nextView,
                    meeting: selectedMeetingKey ?? summary.defaultMeetingKey,
                  })
                }
              />
            ))}
          </div>
          <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)" }}>
            {FORMULA1_VIEW_DESCRIPTIONS[resolvedState.view]}
          </p>

          {resolvedState.view === "overview" ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2" style={{ marginTop: "var(--c97-sp-5)" }}>
              <div>
                <SectionHeader
                  kicker="Title race"
                  title="Drivers"
                  description="Bars scale to the leader so the championship spread reads in one look."
                />
                <DriverLeaderboard standings={summary.driverStandings} limit={8} />
              </div>

              <div>
                <SectionHeader
                  kicker="Title race"
                  title="Constructors"
                  description="Team points against the garage out front, colored by livery."
                />
                <ConstructorLeaderboard standings={summary.constructorStandings} limit={8} />
              </div>
            </div>
          ) : null}

          {resolvedState.view === "drivers" ? (
            <div style={{ marginTop: "var(--c97-sp-5)" }}>
              <SectionHeader
                kicker="Standings"
                title="Driver championship"
                description="Point bars reflect the latest race-backed snapshot, refreshed on a schedule."
              />
              <DriverLeaderboard standings={summary.driverStandings} />
            </div>
          ) : null}

          {resolvedState.view === "constructors" ? (
            <div style={{ marginTop: "var(--c97-sp-5)" }}>
              <SectionHeader
                kicker="Standings"
                title="Constructor championship"
                description="Team-first so you can read race-to-race movement without hunting through both garage lineups."
              />
              <ConstructorLeaderboard standings={summary.constructorStandings} />
            </div>
          ) : null}

          {resolvedState.view === "calendar" ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.88fr_1.12fr]" style={{ marginTop: "var(--c97-sp-5)" }}>
              <div>
                <h3 className="c97-serif c97-h3" style={{ marginBottom: "var(--c97-sp-2)" }}>Full season timeline</h3>
                <CalendarTimeline
                  meetings={summary.meetings}
                  selectedMeetingKey={selectedMeetingKey}
                  onSelect={(meetingKey) =>
                    navigate({
                      view: "calendar",
                      meeting: meetingKey,
                    })
                  }
                />
              </div>

              {selectedMeeting ? (
                <MeetingDetailPanel meeting={selectedMeeting} />
              ) : selectedMeetingMeta ? (
                <MeetingDetailFallback meeting={selectedMeetingMeta} error={selectedMeetingError} />
              ) : null}
            </div>
          ) : null}

          {resolvedState.view === "overview" && summary.lastCompletedMeeting ? (
            <div style={{ marginTop: "var(--c97-sp-6)" }}>
              <PodiumDisplay meeting={summary.lastCompletedMeeting} />
            </div>
          ) : null}

          {resolvedState.view === "overview" ? (
            <div style={{ marginTop: "var(--c97-sp-6)" }}>
              <SectionHeader
                kicker="Race strip"
                title="Recent and upcoming weekends"
                description="The latest results mixed with the next stops so the season never feels frozen in the past."
              />

              <MeetingStrip
                meetings={raceStripMeetings}
                selectedMeetingKey={selectedMeetingKey}
                onSelect={(meetingKey) =>
                  navigate({
                    view: "overview",
                    meeting: meetingKey,
                  })
                }
              />

              <div style={{ marginTop: "var(--c97-sp-4)" }}>
                {selectedMeeting ? (
                  <MeetingDetailPanel meeting={selectedMeeting} compact />
                ) : selectedMeetingMeta ? (
                  <MeetingDetailFallback meeting={selectedMeetingMeta} error={selectedMeetingError} />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="deckle">
        <div className="c97-shell grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Data notes</p>
            <p className="c97-prose">
              I pull OpenF1&apos;s historical endpoints for this route, then freeze the result into a
              checked-in snapshot. That keeps the page fast and predictable while still letting the
              calendar, standings, and classifications move with the season.
            </p>
          </div>

          <div>
            <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Attribution</p>
            <p className="c97-prose">
              OpenF1 is community-run and unofficial. This dashboard is not affiliated with Formula 1,
              the FIA, or Formula One Management. Read the{" "}
              <a href={summary.sourceUrls.docs} style={{ color: "var(--c97-accent)" }}>
                docs
              </a>{" "}
              or the{" "}
              <a href="https://openf1.org/" style={{ color: "var(--c97-accent)" }}>
                project FAQ
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
