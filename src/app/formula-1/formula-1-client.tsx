"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Clock,
  Flag,
  MapPinned,
  Medal,
  Minus,
  Trophy,
} from "lucide-react";
import type {
  Formula1ConstructorStanding,
  Formula1DriverStanding,
  Formula1MeetingSummary,
  Formula1RaceResultEntry,
  Formula1RouteState,
  Formula1Snapshot,
  Formula1View,
} from "@/types/formula1";
import {
  buildFormula1Href,
  FORMULA1_VIEW_DESCRIPTIONS,
  FORMULA1_VIEW_LABELS,
  FORMULA1_VIEW_OPTIONS,
  normalizeFormula1State,
  resolveFormula1State,
} from "./formula-1-state";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";
import {
  Article,
  Briefcase,
  Calendar,
  ChartBar,
  User,
} from "@/components/ui/ServerIcons";
import styles from "./formula-1.module.css";

interface Formula1ClientProps {
  initialState: Formula1RouteState;
  snapshot: Formula1Snapshot;
}

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const LONG_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const UPDATED_AT_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

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

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : UPDATED_AT_FORMATTER.format(date);
}

function formatPoints(value: number): string {
  return Number.isFinite(value) ? value.toFixed(0) : "0";
}

// Use Intl.NumberFormat with explicit signDisplay so the locale handles its
// own decimal/grouping separators rather than hardcoding "+" + .toFixed(0).
const DELTA_FORMATTER = new Intl.NumberFormat(undefined, {
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

function getMeetingStatusCopy(meeting: Formula1MeetingSummary): string {
  if (meeting.status === "upcoming") {
    return "Next weekend";
  }

  if (meeting.status === "live") {
    return "Live weekend";
  }

  return "Latest result";
}

function getMeetingToneStyle(status: Formula1MeetingSummary["status"]): CSSProperties {
  switch (status) {
    case "upcoming":
      return {
        borderColor: "color-mix(in srgb, var(--home-haze) 28%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-haze) 8%, var(--home-paper-alt))",
      };
    case "live":
      return {
        borderColor: "color-mix(in srgb, var(--home-acid) 30%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-acid) 12%, var(--home-paper-alt))",
      };
    case "completed":
    default:
      return {
        borderColor: "var(--home-rule)",
        background: "color-mix(in srgb, var(--home-paper-alt) 80%, var(--home-elev-mix))",
      };
  }
}

function getTeamAccentStyle(teamColor: string | null): CSSProperties {
  return {
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: teamColor ?? "var(--home-rule)",
  };
}

function getSessionAccent(type: string): string {
  const value = type.toLowerCase();
  if (value.includes("race") && !value.includes("sprint")) return "var(--home-haze)";
  if (value.includes("sprint")) return "#E8943B";
  if (value.includes("qualif")) return "var(--home-acid)";
  return "color-mix(in srgb, var(--home-ink-muted) 70%, var(--home-rule))";
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
      <span className="inline-flex items-center gap-1 text-sm text-[var(--home-ink-muted)]">
        <Minus size={14} aria-hidden="true" />
        <span>Flat</span>
      </span>
    );
  }

  const delta = previousPosition - currentPosition;
  const isUp = delta > 0;
  const absoluteDelta = Math.abs(delta);
  const accent = isUp ? "#22A06B" : "#D54E4E";
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
      className="h-4 w-7 flex-shrink-0 rounded-[3px] border border-[var(--home-rule)] object-cover"
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
  const dimension = { width: size, height: size };

  if (!url) {
    return (
      <div
        className="flex flex-shrink-0 items-center justify-center rounded-full border bg-[var(--home-paper-alt)] text-3xs font-semibold uppercase tracking-[0.08em] text-[var(--home-ink-muted)]"
        style={{ borderColor: teamColor ?? "var(--home-rule)", ...dimension }}
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
      className="flex-shrink-0 rounded-full border bg-[var(--home-paper-alt)] object-cover object-top"
      style={{ borderColor: teamColor ?? "var(--home-rule)", ...dimension }}
    />
  );
}

function TeamSwatch({ color }: { color: string | null }) {
  return (
    <span
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border"
      style={{
        borderColor: color ?? "var(--home-rule)",
        background: color
          ? `color-mix(in srgb, ${color} 18%, var(--home-paper-alt))`
          : "var(--home-paper-alt)",
      }}
      aria-hidden="true"
    >
      <span
        className="h-3 w-3 rounded-full"
        style={{ background: color ?? "var(--home-ink-muted)" }}
      />
    </span>
  );
}

function TrackOutline({
  meeting,
  className = "",
}: {
  meeting: Formula1MeetingSummary;
  className?: string;
}) {
  if (meeting.circuitImage) {
    return (
      <img
        src={meeting.circuitImage}
        alt=""
        loading="lazy"
        decoding="async"
        aria-hidden="true"
        className={`object-contain opacity-80 dark:invert ${className}`.trim()}
      />
    );
  }

  return (
    <MapPinned
      size={26}
      aria-hidden="true"
      className={`text-[var(--home-ink-muted)] ${className}`.trim()}
    />
  );
}

function CircuitMarker({ meeting }: { meeting: Formula1MeetingSummary }) {
  return (
    <div
      className="hidden h-20 w-24 flex-shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_82%,var(--home-elev-mix))] p-2.5 text-center sm:flex"
      aria-label={`${meeting.circuitShortName} circuit marker`}
    >
      <TrackOutline meeting={meeting} className="h-9 w-12" />
      <span
        className="max-w-full text-[0.62rem] font-semibold uppercase leading-tight text-[var(--home-ink-muted)]"
        style={{ overflowWrap: "anywhere" }}
      >
        {meeting.circuitShortName}
      </span>
    </div>
  );
}

/**
 * Five-light F1 start gantry. Purely decorative. The lights arm left to right,
 * hold red, then go dark together — the real start procedure in miniature —
 * looping on a timer. Honors `prefers-reduced-motion` (lights hold lit) via the
 * CSS module.
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
    <div className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_86%,var(--home-elev-mix))] px-2 py-2.5 text-center">
      <p className="mb-0 text-[1.6rem] font-semibold leading-none tracking-[-0.04em] tabular-nums text-[var(--home-ink)]">
        {value}
      </p>
      <p className="mb-0 mt-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
        {label}
      </p>
    </div>
  );
}

function RaceCountdown({ targetIso }: { targetIso: string | null }) {
  const parts = useCountdown(targetIso);

  if (parts?.isPast) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--home-acid)_35%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-acid)_14%,var(--home-paper))] px-4 py-3">
        <span
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#22A06B]"
          aria-hidden="true"
        />
        <p className="mb-0 text-sm font-semibold text-[var(--home-ink)]">
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
      <p className="mb-2 flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-muted)]">
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

function SeasonProgress({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  if (total <= 0) {
    return null;
  }

  const safeCompleted = Math.min(Math.max(completed, 0), total);
  const pct = Math.round((safeCompleted / total) * 100);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="home-kicker mb-0">Season progress</p>
        <p className="mb-0 text-xs font-semibold tabular-nums text-[var(--home-ink-muted)]">
          Round {safeCompleted} of {total} · {pct}%
        </p>
      </div>
      <div
        className="flex items-stretch gap-[3px]"
        role="img"
        aria-label={`${safeCompleted} of ${total} rounds complete, ${pct} percent of the season`}
      >
        {Array.from({ length: total }).map((_, index) => {
          const isDone = index < safeCompleted;
          const isNext = index === safeCompleted;
          return (
            <span
              key={index}
              className="h-2.5 flex-1 rounded-full"
              style={{
                background: isDone
                  ? "linear-gradient(180deg, color-mix(in srgb, var(--home-acid) 78%, var(--home-ink)) 0%, var(--home-acid) 100%)"
                  : isNext
                    ? "color-mix(in srgb, var(--home-haze) 60%, var(--home-paper))"
                    : "color-mix(in srgb, var(--home-ink) 10%, var(--home-paper-alt))",
                boxShadow: isNext
                  ? "0 0 0 1px color-mix(in srgb, var(--home-haze) 45%, transparent)"
                  : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

interface LeaderboardRowData {
  key: string;
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
  const accent = row.teamColor ?? "var(--home-haze)";

  return (
    <li
      className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,var(--home-elev-mix))] px-3.5 py-3 transition-[border-color,box-shadow] duration-200 hover:border-[color-mix(in_srgb,var(--home-ink)_18%,var(--home-rule))]"
      style={getTeamAccentStyle(row.teamColor)}
    >
      <div className="flex items-center gap-3">
        <span className="w-6 flex-shrink-0 text-center text-sm font-semibold tabular-nums text-[var(--home-ink)]">
          {row.position}
        </span>
        {showHeadshot ? (
          <DriverHeadshot
            url={row.headshotUrl}
            name={row.primary}
            teamColor={row.teamColor}
          />
        ) : (
          <TeamSwatch color={row.teamColor} />
        )}
        <div className="min-w-0 flex-1">
          <p className="mb-0 truncate font-semibold text-[var(--home-ink)]">
            {row.primary}
          </p>
          {row.secondary || row.badge ? (
            <p className="mb-0 truncate text-xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
              {row.secondary ?? row.badge}
            </p>
          ) : null}
        </div>
        <PositionChangeIndicator
          currentPosition={row.position}
          previousPosition={row.previousPosition}
        />
        <div className="w-12 flex-shrink-0 text-right">
          <p className="mb-0 text-base font-semibold tabular-nums text-[var(--home-ink)]">
            {formatPoints(row.points)}
          </p>
          <p className="mb-0 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
            pts
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-3">
        <div
          className="relative h-1.5 flex-1 overflow-hidden rounded-full"
          style={{
            background: "color-mix(in srgb, var(--home-ink) 8%, var(--home-paper-alt))",
          }}
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, color-mix(in srgb, ${accent} 45%, transparent), ${accent})`,
              boxShadow: `0 0 8px color-mix(in srgb, ${accent} 30%, transparent)`,
            }}
          />
        </div>
        {row.pointsDelta > 0 ? (
          <span
            className="inline-flex flex-shrink-0 items-center gap-0.5 text-[0.66rem] font-semibold tabular-nums text-[#22A06B]"
            title="Points gained at the last race"
          >
            <ArrowUp size={11} aria-hidden="true" />
            {formatDelta(row.pointsDelta)}
          </span>
        ) : null}
        <span className="w-[6.5ch] flex-shrink-0 text-right text-[0.68rem] font-semibold uppercase tracking-[0.08em] tabular-nums text-[var(--home-ink-muted)]">
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
      <p className="mb-0 text-sm leading-6 text-[var(--home-ink-muted)]">
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
            key: `${standing.driverNumber}`,
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
      <p className="mb-0 text-sm leading-6 text-[var(--home-ink-muted)]">
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
            key: standing.teamName,
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
  icon,
}: {
  kicker: string;
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-2">
        {icon ? (
          <span className="mt-1 text-[var(--home-ink-muted)]">{icon}</span>
        ) : null}
        <div>
          <p className="home-kicker mb-1">{kicker}</p>
          <h2
            className="text-[1.35rem] font-semibold tracking-[-0.04em] text-[var(--home-ink)]"
            style={{ fontFamily: "var(--font-home-sans)" }}
          >
            {title}
          </h2>
        </div>
      </div>
      <p className="mb-0 max-w-[32ch] text-right text-sm leading-6 text-[var(--home-ink-muted)]">
        {description}
      </p>
    </div>
  );
}

function ResultRow({ entry }: { entry: Formula1RaceResultEntry }) {
  return (
    <li
      className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,var(--home-elev-mix))] px-4 py-3"
      style={getTeamAccentStyle(entry.teamColor)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-0 font-semibold text-[var(--home-ink)]">
            {entry.position ?? "NC"} · {entry.driverName}
          </p>
          <p className="mb-0 mt-1 text-sm leading-6 text-[var(--home-ink-muted)]">
            {entry.teamName ?? "Unknown team"} · {entry.statusLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="mb-0 font-semibold text-[var(--home-ink)]">{formatPoints(entry.points)}</p>
          <p className="mb-0 mt-1 text-xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
            points
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-[var(--home-ink-muted)]">
        <span className="rounded-full border border-[var(--home-rule)] px-2.5 py-1">
          {entry.lapsCompleted} laps
        </span>
        {entry.gapToLeaderLabel ? (
          <span className="rounded-full border border-[var(--home-rule)] px-2.5 py-1">
            {entry.gapToLeaderLabel}
          </span>
        ) : null}
        {entry.durationLabel ? (
          <span className="rounded-full border border-[var(--home-rule)] px-2.5 py-1">
            {entry.durationLabel}
          </span>
        ) : null}
      </div>
    </li>
  );
}

function MeetingSchedule({ meeting }: { meeting: Formula1MeetingSummary }) {
  if (meeting.sessions.length === 0) {
    return (
      <p className="mb-0 text-sm leading-6 text-[var(--home-ink-muted)]">
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
            className="flex min-h-[44px] items-center justify-between gap-4 rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,var(--home-elev-mix))] px-4 py-3"
            style={{ borderLeftWidth: "3px", borderLeftColor: accent }}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ background: accent }}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="mb-0 truncate font-semibold text-[var(--home-ink)]">{session.name}</p>
                <p className="mb-0 mt-1 text-sm text-[var(--home-ink-muted)]">{session.type}</p>
              </div>
            </div>
            <div className="flex-shrink-0 text-right text-sm text-[var(--home-ink-muted)]">
              <p className="mb-0">{formatLongDateTimeLabel(session.startAt)}</p>
              <p className="mb-0 mt-1">{formatLongDateTimeLabel(session.endAt)}</p>
            </div>
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
    <section className="home-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <CircuitMarker meeting={meeting} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="home-kicker mb-0">{getMeetingStatusCopy(meeting)}</p>
              <CountryFlag flagUrl={meeting.countryFlag} countryName={meeting.countryName} />
            </div>
            <h2
              className="mt-1 text-[1.4rem] font-semibold tracking-[-0.05em] text-[var(--home-ink)]"
              style={{ fontFamily: "var(--font-home-sans)" }}
            >
              {meeting.name}
            </h2>
            <p className="mt-2 mb-0 max-w-[48ch] text-sm leading-6 text-[var(--home-ink-muted)]">
              {meeting.circuitShortName} in {meeting.location}. I keep the schedule and the
              classification in one place so the weekend reads cleanly.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
          <span className="rounded-full border border-[var(--home-rule)] px-3 py-1.5">
            {formatDateLabel(meeting.startAt)}
          </span>
          {meeting.circuitType ? (
            <span className="rounded-full border border-[var(--home-rule)] px-3 py-1.5">
              {meeting.circuitType}
            </span>
          ) : null}
          {meeting.hasSprint ? (
            <span className="rounded-full border border-[color-mix(in_srgb,#E8943B_45%,var(--home-rule))] bg-[color-mix(in_srgb,#E8943B_12%,transparent)] px-3 py-1.5 text-[var(--home-ink)]">
              Sprint weekend
            </span>
          ) : null}
          {formatGmtOffset(meeting.gmtOffset) ? (
            <span className="rounded-full border border-[var(--home-rule)] px-3 py-1.5">
              {formatGmtOffset(meeting.gmtOffset)}
            </span>
          ) : null}
        </div>
      </div>

      <div className={`mt-6 grid gap-6 ${compact ? "lg:grid-cols-[1.1fr_0.9fr]" : "xl:grid-cols-[1.05fr_0.95fr]"}`}>
        <div>
          <p className="home-kicker mb-3">Weekend schedule</p>
          <MeetingSchedule meeting={meeting} />
          <p className="mt-4 mb-0 text-xs leading-6 text-[var(--home-ink-muted)]">
            Times render in your local timezone. The weekend offset chip shows the track timezone.
          </p>
        </div>

        <div>
          <p className="home-kicker mb-3">
            {meeting.resultPublished ? "Race classification" : "Result status"}
          </p>
          {meeting.resultPublished ? (
            <ol className="mt-0 space-y-3 pl-0">
              {meeting.classification.slice(0, compact ? 6 : meeting.classification.length).map((entry) => (
                <ResultRow key={`${meeting.key}-${entry.driverNumber}`} entry={entry} />
              ))}
            </ol>
          ) : (
            <div className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,var(--home-elev-mix))] p-4">
              <p className="mb-0 text-sm leading-6 text-[var(--home-ink-muted)]">
                OpenF1 has not published the official classification for this race yet. I still keep
                the weekend here so the calendar stays intact.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const PODIUM_META = [
  { label: "P1", accent: "#D6B65A", step: "sm:min-h-[8rem]", order: "sm:order-2" },
  { label: "P2", accent: "#A4A4AC", step: "sm:min-h-[6rem]", order: "sm:order-1" },
  { label: "P3", accent: "#B07845", step: "sm:min-h-[4.5rem]", order: "sm:order-3" },
] as const;

function PodiumDisplay({ meeting }: { meeting: Formula1MeetingSummary }) {
  if (!meeting.resultPublished || meeting.podium.length === 0) {
    return null;
  }

  const slots = meeting.podium.slice(0, 3);

  return (
    <section className="home-card p-5 sm:p-6">
      <SectionHeader
        kicker="Podium"
        title={meeting.name}
        description="Top three from the last published classification."
        icon={<Medal size={16} />}
      />

      <ol className="grid items-end gap-3 pl-0 sm:grid-cols-3">
        {slots.map((entry, index) => {
          const meta = PODIUM_META[index] ?? PODIUM_META[2];
          const teamColor = entry.teamColor ?? "var(--home-rule)";
          return (
            <li
              key={`${meeting.key}-podium-${entry.driverNumber}`}
              className={`flex flex-col ${meta.order}`}
            >
              <div
                className="rounded-t-2xl border border-b-0 bg-[color-mix(in_srgb,var(--home-paper-alt)_82%,var(--home-elev-mix))] p-4"
                style={{ borderColor: teamColor, borderTopWidth: "3px" }}
              >
                <div className="flex items-center gap-3">
                  <DriverHeadshot
                    url={entry.headshotUrl}
                    name={entry.driverName}
                    teamColor={entry.teamColor}
                    size={44}
                  />
                  <div className="min-w-0">
                    <p className="mb-0 truncate font-semibold text-[var(--home-ink)]">
                      {entry.driverName}
                    </p>
                    <p className="mb-0 text-xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                      {entry.teamName ?? "Unknown team"}
                    </p>
                  </div>
                </div>
                {entry.gapToLeaderLabel ? (
                  <p className="mt-3 mb-0 text-xs font-medium text-[var(--home-ink-muted)]">
                    {entry.gapToLeaderLabel}
                  </p>
                ) : null}
              </div>
              <div
                className={`flex items-end justify-between gap-2 rounded-b-2xl border border-t-0 px-4 py-3 ${meta.step}`}
                style={{
                  borderColor: teamColor,
                  background: `linear-gradient(180deg, color-mix(in srgb, ${meta.accent} 24%, var(--home-paper-alt)) 0%, color-mix(in srgb, var(--home-paper-alt) 92%, var(--home-elev-mix)) 100%)`,
                }}
              >
                <span
                  className="text-[2.6rem] font-semibold leading-none tracking-[-0.04em]"
                  style={{ fontFamily: "var(--font-home-serif)", color: meta.accent }}
                >
                  {index + 1}
                </span>
                <span className="pb-1 text-right text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                  {meta.label}
                  <span className="block text-[var(--home-ink)]">
                    {formatPoints(entry.points)} pts
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function MeetingStrip({
  meetings,
  selectedMeetingKey,
  onSelect,
}: {
  meetings: Formula1MeetingSummary[];
  selectedMeetingKey: string | null;
  onSelect: (meetingKey: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {meetings.map((meeting) => {
        const isSelected = meeting.key === selectedMeetingKey;
        return (
          <button
            key={meeting.key}
            type="button"
            onClick={() => onSelect(meeting.key)}
            className="min-h-[44px] min-w-[220px] flex-shrink-0 rounded-[22px] border px-4 py-3 text-left transition-[border-color,background-color,box-shadow] duration-200"
            style={
              isSelected
                ? {
                    ...getMeetingToneStyle(meeting.status),
                    boxShadow: "var(--shadow-sm)",
                  }
                : getMeetingToneStyle("completed")
            }
            aria-pressed={isSelected}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="mb-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                {meeting.status}
              </p>
              <CountryFlag flagUrl={meeting.countryFlag} countryName={meeting.countryName} />
            </div>
            <p className="mt-2 mb-0 font-semibold text-[var(--home-ink)]">{meeting.name}</p>
            <p className="mt-1 mb-0 text-sm text-[var(--home-ink-muted)]">
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
  meetings: Formula1MeetingSummary[];
  selectedMeetingKey: string | null;
  onSelect: (meetingKey: string) => void;
}) {
  return (
    <ol className="space-y-3 pl-0">
      {meetings.map((meeting) => {
        const isSelected = meeting.key === selectedMeetingKey;

        return (
          <li key={meeting.key}>
            <button
              type="button"
              onClick={() => onSelect(meeting.key)}
              className="min-h-[44px] w-full rounded-[24px] border p-4 text-left transition-[border-color,background-color,box-shadow] duration-200"
              style={
                isSelected
                  ? {
                      ...getMeetingToneStyle(meeting.status),
                      boxShadow: "var(--shadow-sm)",
                    }
                  : getMeetingToneStyle("completed")
              }
              aria-pressed={isSelected}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="mb-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                    Round {meetings.findIndex((candidate) => candidate.key === meeting.key) + 1}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <CountryFlag flagUrl={meeting.countryFlag} countryName={meeting.countryName} />
                    <p className="mb-0 truncate font-semibold text-[var(--home-ink)]">{meeting.name}</p>
                  </div>
                  <p className="mt-1 mb-0 text-sm leading-6 text-[var(--home-ink-muted)]">
                    {meeting.location}, {meeting.countryName}
                  </p>
                </div>
                <div className="text-right text-sm text-[var(--home-ink-muted)]">
                  <p className="mb-0">{formatDateLabel(meeting.startAt)}</p>
                  <p className="mb-0 mt-1">{meeting.status}</p>
                </div>
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
    <button
      type="button"
      onClick={() => onSelect(view)}
      className="min-h-[44px] rounded-full border px-4 py-2.5 text-sm font-semibold transition-[border-color,background-color,box-shadow] duration-200"
      style={
        isActive
          ? {
              borderColor: "color-mix(in srgb, var(--home-haze) 30%, var(--home-rule))",
              background: "color-mix(in srgb, var(--home-haze) 10%, var(--home-paper-alt))",
              boxShadow: "var(--shadow-sm)",
            }
          : {
              borderColor: "var(--home-rule)",
              background: "color-mix(in srgb, var(--home-paper-alt) 80%, var(--home-elev-mix))",
            }
      }
      aria-pressed={isActive}
    >
      {FORMULA1_VIEW_LABELS[view]}
    </button>
  );
}

function getRaceStripMeetings(snapshot: Formula1Snapshot, selectedMeeting: Formula1MeetingSummary | null) {
  const completed = snapshot.meetings.filter((meeting) => meeting.status === "completed").slice(-3);
  const upcoming = snapshot.meetings.filter((meeting) => meeting.status === "upcoming").slice(0, 3);
  const raceStrip = [...completed, ...upcoming];

  if (selectedMeeting && !raceStrip.some((meeting) => meeting.key === selectedMeeting.key)) {
    raceStrip.unshift(selectedMeeting);
  }

  return raceStrip.slice(0, 6);
}

export function Formula1Client({ initialState, snapshot }: Formula1ClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const currentHref = `/formula-1${currentQuery ? `?${currentQuery}` : ""}`;
  const hasManagedParams =
    searchParams.get("view") !== null || searchParams.get("meeting") !== null;
  const routeState = hasManagedParams ? normalizeFormula1State(searchParams) : initialState;
  const resolvedState = resolveFormula1State(routeState, snapshot);
  const desiredHref = buildFormula1Href(
    resolvedState,
    searchParams,
    snapshot.defaultMeetingKey
  );

  useEffect(() => {
    if (currentHref === desiredHref) {
      return;
    }

    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
    });
  }, [currentHref, desiredHref, router]);

  function navigate(nextState: Formula1RouteState) {
    const resolvedNextState = resolveFormula1State(nextState, snapshot);
    const href = buildFormula1Href(
      resolvedNextState,
      searchParams,
      snapshot.defaultMeetingKey
    );

    if (href === currentHref) {
      return;
    }

    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  const selectedMeeting = useMemo(
    () =>
      snapshot.meetings.find((meeting) => meeting.key === resolvedState.meeting) ??
      snapshot.nextMeeting ??
      snapshot.lastCompletedMeeting ??
      snapshot.meetings[0] ??
      null,
    [resolvedState.meeting, snapshot]
  );

  const highlightMeeting = snapshot.nextMeeting ?? snapshot.lastCompletedMeeting ?? selectedMeeting;
  const highlightIsUpcoming =
    highlightMeeting?.status === "upcoming" || highlightMeeting?.status === "live";
  const driverLeader = snapshot.driverStandings[0] ?? null;
  const driverRunnerUp = snapshot.driverStandings[1] ?? null;
  const constructorLeader = snapshot.constructorStandings[0] ?? null;
  const constructorRunnerUp = snapshot.constructorStandings[1] ?? null;
  const raceStripMeetings = useMemo(
    () => getRaceStripMeetings(snapshot, selectedMeeting),
    [selectedMeeting, snapshot]
  );

  // Stats panel cells
  const lastCompletedMeeting = snapshot.lastCompletedMeeting;
  const lastWinner = lastCompletedMeeting?.podium?.[0] ?? null;
  const driverGap = driverLeader && driverRunnerUp ? driverLeader.points - driverRunnerUp.points : null;
  const constructorGap = constructorLeader && constructorRunnerUp
    ? constructorLeader.points - constructorRunnerUp.points
    : null;

  const statsPanelCells: HomeStatsCell[] = [
    {
      label: "Rounds",
      tooltip: "Completed grands prix relative to the full season schedule.",
      value: `${snapshot.seasonMetrics.completedRaces} / ${snapshot.seasonMetrics.totalRaces}`,
    },
    {
      label: "Driver leader",
      tooltip: "Driver currently leading the championship and total points.",
      value: driverLeader ? `${driverLeader.driverName} · ${formatPoints(driverLeader.points)}` : "Pending",
      sub: driverLeader ? driverLeader.teamName : undefined,
    },
    {
      label: "Constructor leader",
      tooltip: "Team currently leading the constructor standings and total points.",
      value: constructorLeader
        ? `${constructorLeader.teamName} · ${formatPoints(constructorLeader.points)}`
        : "Pending",
    },
    {
      label: "Driver gap",
      tooltip: "Points the championship leader holds over the second-placed driver.",
      value: driverGap !== null ? `+${formatPoints(driverGap)} pts` : "—",
      sub: "to next driver",
    },
    {
      label: "Constructor gap",
      tooltip: "Points the leading team holds over the second-placed team.",
      value: constructorGap !== null ? `+${formatPoints(constructorGap)} pts` : "—",
      sub: "to next team",
    },
    {
      label: "Sprint weekends",
      tooltip: "Number of sprint-format weekends scheduled this season.",
      value: String(snapshot.seasonMetrics.sprintWeekends),
    },
    {
      label: "Last GP winner",
      tooltip: "Driver who won the most recently completed grand prix.",
      value: lastWinner?.driverName
        ? `${lastWinner.driverName}${lastCompletedMeeting?.name ? ` · ${lastCompletedMeeting.name}` : ""}`
        : lastCompletedMeeting?.name ?? "Pending",
    },
    {
      label: "Next race",
      tooltip: "Scheduled start time for the next grand prix in the calendar.",
      value: highlightMeeting?.raceStartsAt
        ? formatDateTimeLabel(highlightMeeting.raceStartsAt)
        : highlightMeeting?.startAt
          ? formatDateLabel(highlightMeeting.startAt)
          : "TBD",
      sub: highlightMeeting?.name,
    },
  ];

  return (
    <div className={`home-page min-h-screen ${styles.f1}`}>
      <div className="home-shell home-section space-y-6 sm:space-y-8">
      <section
        className={`relative overflow-hidden rounded-[32px] border p-6 sm:p-8 lg:p-10 ${styles.carbon}`}
        style={{
          borderColor: "color-mix(in srgb, var(--home-haze) 30%, var(--home-rule))",
          background:
            "radial-gradient(circle at top right, color-mix(in srgb, var(--home-haze) 22%, transparent) 0%, transparent 42%), linear-gradient(140deg, color-mix(in srgb, var(--home-paper) 94%, var(--home-elev-mix)) 0%, color-mix(in srgb, var(--home-paper-alt) 88%, var(--home-elev-mix)) 100%)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <span
          className={styles.speedLines}
          aria-hidden="true"
          style={{ top: 0, right: 0, width: "42%", height: "60%" }}
        />
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="home-kicker mb-2">Formula 1 project</p>
            <h1
              className="max-w-[11ch] text-[clamp(2.7rem,7vw,5.4rem)] font-semibold tracking-[-0.08em] text-[var(--home-ink)]"
              style={{ fontFamily: "var(--font-home-serif)", lineHeight: 0.92 }}
            >
              Formula 1 Pulse
            </h1>
            <p className="mt-5 mb-0 max-w-[52ch] text-base leading-7 text-[var(--home-ink-muted)]">
              I built this to keep the season readable at a glance. The point is simple. See the
              next Grand Prix, who gained ground last Sunday, and where the title picture sits
              right now.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="resume-chip">{snapshot.season} season</span>
              <span className="resume-chip">
                {snapshot.seasonMetrics.completedRaces} of {snapshot.seasonMetrics.totalRaces} races complete
              </span>
              <span className="resume-chip">{snapshot.sourceLabel}</span>
              <span className="resume-chip">Updated {formatUpdatedAt(snapshot.generatedAt)}</span>
            </div>

            <div className="mt-7 max-w-[34rem]">
              <SeasonProgress
                completed={snapshot.seasonMetrics.completedRaces}
                total={snapshot.seasonMetrics.totalRaces}
              />
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              {FORMULA1_VIEW_OPTIONS.map((view) => (
                <ViewToggle
                  key={view}
                  view={view}
                  activeView={resolvedState.view}
                  onSelect={(nextView) =>
                    navigate({
                      view: nextView,
                      meeting: selectedMeeting?.key ?? snapshot.defaultMeetingKey,
                    })
                  }
                />
              ))}
            </div>

            <p className="mt-4 mb-0 text-sm leading-6 text-[var(--home-ink-muted)]">
              {FORMULA1_VIEW_DESCRIPTIONS[resolvedState.view]}
            </p>
          </div>

          <aside
            className="relative overflow-hidden rounded-[28px] border p-5 sm:p-6"
            style={getMeetingToneStyle(highlightMeeting?.status ?? "completed")}
          >
            {highlightMeeting?.circuitImage ? (
              <img
                src={highlightMeeting.circuitImage}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute -right-5 -top-5 h-32 w-32 object-contain opacity-[0.08] dark:opacity-[0.16] dark:invert"
              />
            ) : null}

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="home-kicker mb-1">
                  {highlightMeeting ? getMeetingStatusCopy(highlightMeeting) : "Season status"}
                </p>
                <h2
                  className="text-[1.55rem] font-semibold tracking-[-0.05em] text-[var(--home-ink)]"
                  style={{ fontFamily: "var(--font-home-sans)" }}
                >
                  {highlightMeeting?.name ?? "Schedule coming soon"}
                </h2>
              </div>
              {highlightIsUpcoming ? <StartLights /> : <Flag className="text-[var(--home-ink-muted)]" size={18} />}
            </div>

            {highlightMeeting ? (
              <div className="relative">
                <p className="mt-3 mb-0 flex items-center gap-2 text-sm leading-6 text-[var(--home-ink-muted)]">
                  <CountryFlag
                    flagUrl={highlightMeeting.countryFlag}
                    countryName={highlightMeeting.countryName}
                  />
                  {highlightMeeting.circuitShortName} · {highlightMeeting.location}
                </p>

                {highlightIsUpcoming ? (
                  <div className="mt-4">
                    <RaceCountdown
                      targetIso={highlightMeeting.raceStartsAt ?? highlightMeeting.startAt}
                    />
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_84%,var(--home-elev-mix))] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                      Race start
                    </p>
                    <p className="mt-2 mb-0 font-semibold text-[var(--home-ink)]">
                      {highlightMeeting.raceStartsAt
                        ? formatDateTimeLabel(highlightMeeting.raceStartsAt)
                        : formatDateLabel(highlightMeeting.startAt)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_84%,var(--home-elev-mix))] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                      Weekend type
                    </p>
                    <p className="mt-2 mb-0 font-semibold text-[var(--home-ink)]">
                      {highlightMeeting.hasSprint ? "Sprint weekend" : "Standard weekend"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 mb-0 text-sm leading-6 text-[var(--home-ink-muted)]">
                The current snapshot does not include a published season schedule yet.
              </p>
            )}
          </aside>
        </div>
        <span className={`${styles.finishLine} ${styles.checkers}`} aria-hidden="true" />
      </section>

      <HomeStatsPanel
        id="f1-stats-panel"
        title="Formula 1 at a glance"
        meta={`Live · refreshed ${formatUpdatedAt(snapshot.generatedAt)}`}
        cells={statsPanelCells}
        pills={[
          { label: "Drivers", href: "?view=drivers", icon: User },
          { label: "Constructors", href: "?view=constructors", icon: Briefcase },
          { label: "Schedule", href: "?view=calendar", icon: Calendar },
          { label: "Last race", href: "?view=overview", icon: ChartBar },
          { label: "Article", href: "/writing", icon: Article },
        ]}
      />

      {resolvedState.view === "overview" ? (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <article className="home-card p-5 sm:p-6">
              <SectionHeader
                kicker="Title race"
                title="Drivers"
                description="Bars scale to the leader so the championship spread reads in one look."
                icon={<Trophy size={16} />}
              />
              <DriverLeaderboard standings={snapshot.driverStandings} limit={8} />
            </article>

            <article className="home-card p-5 sm:p-6">
              <SectionHeader
                kicker="Title race"
                title="Constructors"
                description="Team points against the garage out front, colored by livery."
                icon={<Flag size={16} />}
              />
              <ConstructorLeaderboard standings={snapshot.constructorStandings} limit={8} />
            </article>
          </section>

          {snapshot.lastCompletedMeeting ? (
            <PodiumDisplay meeting={snapshot.lastCompletedMeeting} />
          ) : null}

          <section className="home-card p-5 sm:p-6">
            <SectionHeader
              kicker="Race strip"
              title="Recent and upcoming weekends"
              description="The latest results mixed with the next stops so the season never feels frozen in the past."
              icon={<CalendarDays size={16} />}
            />

            <MeetingStrip
              meetings={raceStripMeetings}
              selectedMeetingKey={selectedMeeting?.key ?? null}
              onSelect={(meetingKey) =>
                navigate({
                  view: "overview",
                  meeting: meetingKey,
                })
              }
            />
          </section>

          {selectedMeeting ? <MeetingDetailPanel meeting={selectedMeeting} compact /> : null}
        </>
      ) : null}

      {resolvedState.view === "drivers" ? (
        <section className="home-card p-5 sm:p-6">
          <SectionHeader
            kicker="Standings"
            title="Driver championship"
            description="Point bars are tied to the latest race-backed snapshot, not a live-session guess."
            icon={<Trophy size={16} />}
          />
          <DriverLeaderboard standings={snapshot.driverStandings} />
        </section>
      ) : null}

      {resolvedState.view === "constructors" ? (
        <section className="home-card p-5 sm:p-6">
          <SectionHeader
            kicker="Standings"
            title="Constructor championship"
            description="Team-first so you can read race-to-race movement without hunting through both garage lineups."
            icon={<Flag size={16} />}
          />
          <ConstructorLeaderboard standings={snapshot.constructorStandings} />
        </section>
      ) : null}

      {resolvedState.view === "calendar" ? (
        <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="home-card p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="home-kicker mb-1">Calendar</p>
                <h2
                  className="text-[1.35rem] font-semibold tracking-[-0.04em] text-[var(--home-ink)]"
                  style={{ fontFamily: "var(--font-home-sans)" }}
                >
                  Full season timeline
                </h2>
              </div>
              <CalendarDays className="text-[var(--home-ink-muted)]" size={18} />
            </div>
            <CalendarTimeline
              meetings={snapshot.meetings}
              selectedMeetingKey={selectedMeeting?.key ?? null}
              onSelect={(meetingKey) =>
                navigate({
                  view: "calendar",
                  meeting: meetingKey,
                })
              }
            />
          </div>

          {selectedMeeting ? <MeetingDetailPanel meeting={selectedMeeting} /> : null}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="home-card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <MapPinned size={16} className="text-[var(--home-ink-muted)]" />
            <p className="home-kicker mb-0">Data notes</p>
          </div>
          <p className="mb-0 text-sm leading-7 text-[var(--home-ink-muted)]">
            I am using OpenF1 historical endpoints for this route, then freezing the result into a
            checked-in snapshot. That keeps the page fast and predictable while still letting the
            calendar, standings, and classifications move with the season.
          </p>
        </article>

        <article className="home-card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Flag size={16} className="text-[var(--home-ink-muted)]" />
            <p className="home-kicker mb-0">Attribution</p>
          </div>
          <p className="mb-0 text-sm leading-7 text-[var(--home-ink-muted)]">
            OpenF1 is community-run and unofficial. This dashboard is not affiliated with Formula 1,
            the FIA, or Formula One Management. Read the{" "}
            <a
              href={snapshot.sourceUrls.docs}
              className="text-[var(--home-haze)] underline decoration-transparent transition-[color,text-decoration-color] duration-200 hover:decoration-current"
            >
              docs
            </a>{" "}
            or the{" "}
            <a
              href="https://openf1.org/"
              className="text-[var(--home-haze)] underline decoration-transparent transition-[color,text-decoration-color] duration-200 hover:decoration-current"
            >
              project FAQ
            </a>
            .
          </p>
        </article>
      </section>
      </div>
    </div>
  );
}
