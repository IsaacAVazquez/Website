"use client";

import { startTransition, useEffect, useMemo, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Flag,
  Gauge,
  MapPinned,
  Medal,
  Minus,
  TimerReset,
  Trophy,
  Users,
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
import { MetricCard } from "@/components/football/MetricCard";

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
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const normalized = trimmed.slice(0, 6);
  return normalized.startsWith("-") ? `UTC${normalized}` : `UTC+${normalized.slice(-5)}`;
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
      className="h-4 w-7 flex-shrink-0 rounded-[3px] border border-[var(--home-rule)] object-cover"
    />
  );
}

function DriverHeadshot({
  url,
  name,
  teamColor,
}: {
  url: string | null;
  name: string;
  teamColor: string | null;
}) {
  if (!url) {
    return (
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border bg-[var(--home-paper-alt)] text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--home-ink-muted)]"
        style={{ borderColor: teamColor ?? "var(--home-rule)" }}
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
      alt=""
      loading="lazy"
      className="h-9 w-9 flex-shrink-0 rounded-full border bg-[var(--home-paper-alt)] object-cover object-top"
      style={{ borderColor: teamColor ?? "var(--home-rule)" }}
    />
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

function StandingsHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <p className="home-kicker mb-1">Standings</p>
        <h2
          className="text-[1.35rem] font-semibold tracking-[-0.04em] text-[var(--home-ink)]"
          style={{ fontFamily: "var(--font-home-sans)" }}
        >
          {title}
        </h2>
      </div>
      <p className="mb-0 max-w-[34ch] text-sm leading-6 text-[var(--home-ink-muted)]">
        {description}
      </p>
    </div>
  );
}

function DriverStandingsTable({
  standings,
  limit,
}: {
  standings: Formula1DriverStanding[];
  limit?: number;
}) {
  const rows = typeof limit === "number" ? standings.slice(0, limit) : standings;

  if (rows.length === 0) {
    return (
      <p className="mb-0 text-sm leading-6 text-[var(--home-ink-muted)]">
        OpenF1 has not published a race-backed championship table yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[580px] border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
            <th className="px-3 py-2">Pos</th>
            <th className="px-3 py-2">Driver</th>
            <th className="px-3 py-2">Team</th>
            <th className="px-3 py-2">Last race</th>
            <th className="px-3 py-2">Move</th>
            <th className="px-3 py-2 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((standing) => (
            <tr
              key={`${standing.driverNumber}-${standing.position}`}
              className="rounded-2xl"
              style={getTeamAccentStyle(standing.teamColor)}
            >
              <td className="rounded-l-2xl border-y border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] px-3 py-3 font-semibold text-[var(--home-ink)]">
                {standing.position}
              </td>
              <td className="border-y border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] px-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <DriverHeadshot
                    url={standing.headshotUrl}
                    name={standing.driverName}
                    teamColor={standing.teamColor}
                  />
                  <div className="min-w-0">
                    <p className="mb-0 truncate font-semibold text-[var(--home-ink)]">
                      {standing.driverName}
                    </p>
                    <p className="mb-0 text-xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                      {standing.acronym ?? standing.driverNumber}
                    </p>
                  </div>
                </div>
              </td>
              <td className="border-y border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] px-3 py-3 text-sm text-[var(--home-ink-muted)]">
                {standing.teamName}
              </td>
              <td className="border-y border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] px-3 py-3 text-sm font-semibold text-[var(--home-ink)]">
                {formatDelta(standing.pointsDelta)}
              </td>
              <td className="border-y border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] px-3 py-3 text-sm">
                <PositionChangeIndicator
                  currentPosition={standing.position}
                  previousPosition={standing.previousPosition}
                />
              </td>
              <td className="rounded-r-2xl border-y border-r border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] px-3 py-3 text-right font-semibold text-[var(--home-ink)]">
                {formatPoints(standing.points)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConstructorStandingsTable({
  standings,
  limit,
}: {
  standings: Formula1ConstructorStanding[];
  limit?: number;
}) {
  const rows = typeof limit === "number" ? standings.slice(0, limit) : standings;

  if (rows.length === 0) {
    return (
      <p className="mb-0 text-sm leading-6 text-[var(--home-ink-muted)]">
        Constructor standings will show up after OpenF1 publishes a race-backed table.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px] border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
            <th className="px-3 py-2">Pos</th>
            <th className="px-3 py-2">Team</th>
            <th className="px-3 py-2">Last race</th>
            <th className="px-3 py-2">Move</th>
            <th className="px-3 py-2 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((standing) => (
            <tr key={`${standing.teamName}-${standing.position}`} style={getTeamAccentStyle(standing.teamColor)}>
              <td className="rounded-l-2xl border-y border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] px-3 py-3 font-semibold text-[var(--home-ink)]">
                {standing.position}
              </td>
              <td className="border-y border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] px-3 py-3 font-semibold text-[var(--home-ink)]">
                {standing.teamName}
              </td>
              <td className="border-y border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] px-3 py-3 text-sm font-semibold text-[var(--home-ink)]">
                {formatDelta(standing.pointsDelta)}
              </td>
              <td className="border-y border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] px-3 py-3 text-sm">
                <PositionChangeIndicator
                  currentPosition={standing.position}
                  previousPosition={standing.previousPosition}
                />
              </td>
              <td className="rounded-r-2xl border-y border-r border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] px-3 py-3 text-right font-semibold text-[var(--home-ink)]">
                {formatPoints(standing.points)}
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
    <li
      className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] px-4 py-3"
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
      {meeting.sessions.map((session) => (
        <li
          key={session.key}
          className="flex min-h-[44px] items-center justify-between gap-4 rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] px-4 py-3"
        >
          <div>
            <p className="mb-0 font-semibold text-[var(--home-ink)]">{session.name}</p>
            <p className="mb-0 mt-1 text-sm text-[var(--home-ink-muted)]">{session.type}</p>
          </div>
          <div className="text-right text-sm text-[var(--home-ink-muted)]">
            <p className="mb-0">{formatLongDateTimeLabel(session.startAt)}</p>
            <p className="mb-0 mt-1">{formatLongDateTimeLabel(session.endAt)}</p>
          </div>
        </li>
      ))}
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
          {meeting.circuitImage ? (
            <img
              src={meeting.circuitImage}
              alt={`${meeting.circuitShortName} circuit map`}
              loading="lazy"
              className="hidden h-20 w-24 flex-shrink-0 rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] object-contain p-2 sm:block"
            />
          ) : null}
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
            <span className="rounded-full border border-[var(--home-rule)] px-3 py-1.5">
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
            <div className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] p-4">
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

const PODIUM_LABELS = ["P1", "P2", "P3"] as const;
const PODIUM_ACCENTS = ["#D6B65A", "#A4A4AC", "#B07845"] as const;

function PodiumHighlight({ meeting }: { meeting: Formula1MeetingSummary }) {
  if (!meeting.resultPublished || meeting.podium.length === 0) {
    return null;
  }

  const slots = meeting.podium.slice(0, 3);

  return (
    <section className="home-card p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Medal size={16} className="text-[var(--home-ink-muted)]" />
          <div>
            <p className="home-kicker mb-1">Podium</p>
            <h2
              className="text-[1.35rem] font-semibold tracking-[-0.04em] text-[var(--home-ink)]"
              style={{ fontFamily: "var(--font-home-sans)" }}
            >
              {meeting.name}
            </h2>
          </div>
        </div>
        <p className="mb-0 max-w-[28ch] text-right text-sm leading-6 text-[var(--home-ink-muted)]">
          Top three from the last published classification.
        </p>
      </div>

      <ol className="grid gap-3 pl-0 sm:grid-cols-3">
        {slots.map((entry, index) => (
          <li
            key={`${meeting.key}-podium-${entry.driverNumber}`}
            className="rounded-2xl border bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,white)] p-4"
            style={{
              borderColor: entry.teamColor ?? "var(--home-rule)",
              borderTopWidth: "3px",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className="text-xs font-semibold uppercase tracking-[0.16em]"
                style={{ color: PODIUM_ACCENTS[index] }}
              >
                {PODIUM_LABELS[index]}
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                {formatPoints(entry.points)} pts
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <DriverHeadshot
                url={entry.headshotUrl}
                name={entry.driverName}
                teamColor={entry.teamColor}
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
  const driverLeader = snapshot.driverStandings[0] ?? null;
  const constructorLeader = snapshot.constructorStandings[0] ?? null;
  const raceStripMeetings = useMemo(
    () => getRaceStripMeetings(snapshot, selectedMeeting),
    [selectedMeeting, snapshot]
  );

  return (
    <div className="home-shell home-section space-y-6 sm:space-y-8">
      <section
        className="overflow-hidden rounded-[32px] border p-6 sm:p-8 lg:p-10"
        style={{
          borderColor: "color-mix(in srgb, var(--home-haze) 24%, var(--home-rule))",
          background:
            "radial-gradient(circle at top right, color-mix(in srgb, var(--home-haze) 18%, transparent) 0%, transparent 38%), linear-gradient(140deg, color-mix(in srgb, var(--home-paper) 94%, var(--home-elev-mix)) 0%, color-mix(in srgb, var(--home-paper-alt) 88%, var(--home-elev-mix)) 100%)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
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

            <div className="mt-6 flex flex-wrap gap-3">
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
            className="rounded-[28px] border p-5 sm:p-6"
            style={getMeetingToneStyle(highlightMeeting?.status ?? "completed")}
          >
            <div className="flex items-start justify-between gap-4">
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
              <Flag className="text-[var(--home-ink-muted)]" size={18} />
            </div>

            {highlightMeeting ? (
              <>
                <p className="mt-3 mb-0 text-sm leading-6 text-[var(--home-ink-muted)]">
                  {highlightMeeting.circuitShortName} in {highlightMeeting.location}. I want the
                  next jump to the calendar to feel obvious from the first screen.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_84%,white)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                      Race start
                    </p>
                    <p className="mt-2 mb-0 font-semibold text-[var(--home-ink)]">
                      {highlightMeeting.raceStartsAt
                        ? formatDateTimeLabel(highlightMeeting.raceStartsAt)
                        : formatDateLabel(highlightMeeting.startAt)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_84%,white)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                      Weekend type
                    </p>
                    <p className="mt-2 mb-0 font-semibold text-[var(--home-ink)]">
                      {highlightMeeting.hasSprint ? "Sprint weekend" : "Standard weekend"}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-4 mb-0 text-sm leading-6 text-[var(--home-ink-muted)]">
                The current snapshot does not include a published season schedule yet.
              </p>
            )}
          </aside>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Rounds"
          value={`${snapshot.seasonMetrics.completedRaces}/${snapshot.seasonMetrics.totalRaces}`}
          detail="Completed grands prix against the full current-season calendar."
          icon={<Gauge size={18} />}
        />
        <MetricCard
          label="Driver leader"
          value={driverLeader ? driverLeader.driverName : "Pending"}
          detail={
            driverLeader
              ? `${formatPoints(driverLeader.points)} points after the latest published race.`
              : "Driver standings will appear once OpenF1 publishes race-backed tables."
          }
          icon={<Trophy size={18} />}
        />
        <MetricCard
          label="Constructor leader"
          value={constructorLeader ? constructorLeader.teamName : "Pending"}
          detail={
            constructorLeader
              ? `${formatPoints(constructorLeader.points)} points on the team side.`
              : "Constructor standings will appear with the first published team table."
          }
          icon={<Users size={18} />}
        />
        <MetricCard
          label="Sprint weekends"
          value={String(snapshot.seasonMetrics.sprintWeekends)}
          detail="Sprint rounds change the rhythm of the calendar, so I call them out directly."
          icon={<TimerReset size={18} />}
        />
      </section>

      {resolvedState.view === "overview" ? (
        <>
          {snapshot.lastCompletedMeeting ? (
            <PodiumHighlight meeting={snapshot.lastCompletedMeeting} />
          ) : null}

          <section className="grid gap-6 xl:grid-cols-2">
            <article className="home-card p-5 sm:p-6">
              <StandingsHeader
                title="Driver table"
                description="The top five stay on the landing view so the title picture reads in one scan."
              />
              <DriverStandingsTable standings={snapshot.driverStandings} limit={5} />
            </article>

            <article className="home-card p-5 sm:p-6">
              <StandingsHeader
                title="Constructor table"
                description="Team movement matters because Sunday points rarely tell the full pressure story alone."
              />
              <ConstructorStandingsTable standings={snapshot.constructorStandings} limit={5} />
            </article>
          </section>

          <section className="home-card p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="home-kicker mb-1">Race strip</p>
                <h2
                  className="text-[1.35rem] font-semibold tracking-[-0.04em] text-[var(--home-ink)]"
                  style={{ fontFamily: "var(--font-home-sans)" }}
                >
                  Recent and upcoming weekends
                </h2>
              </div>
              <p className="mb-0 max-w-[30ch] text-sm leading-6 text-[var(--home-ink-muted)]">
                I mix the latest results with the next stops on the calendar so the season never
                feels frozen in the past.
              </p>
            </div>

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
          <StandingsHeader
            title="Driver championship"
            description="The point delta column is tied to the latest race-backed championship snapshot, not a live-session guess."
          />
          <DriverStandingsTable standings={snapshot.driverStandings} />
        </section>
      ) : null}

      {resolvedState.view === "constructors" ? (
        <section className="home-card p-5 sm:p-6">
          <StandingsHeader
            title="Constructor championship"
            description="This view stays team-first so you can read race-to-race movement without hunting through both garage lineups."
          />
          <ConstructorStandingsTable standings={snapshot.constructorStandings} />
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
  );
}
