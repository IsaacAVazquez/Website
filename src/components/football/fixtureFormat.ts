import type { GenericFixture } from "./FixtureCard";
import { formatStableDateTime } from "@/lib/date-formatters";

// Pinned to one named zone so the server and the browser print the same string.
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
  timeZoneName: "short",
});

const KICKOFF_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
  timeZoneName: "short",
});

// A placeholder time carries the scheduled calendar day only in UTC.
const DATE_ONLY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

// The two halves of DATE_TIME_FORMATTER, for a row that stacks them.
const DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "America/New_York",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
  timeZoneName: "short",
});

/** A rate to fixed decimals, or an em dash when it divided by zero. */
export function formatFixed(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

/** A rank as "#3", or the same em dash formatFixed uses when the rank is missing. */
export function formatRank(rank: number | null | undefined): string {
  return rank == null ? "—" : `#${rank}`;
}

export function formatFixtureDateTime(fixture: GenericFixture): string {
  const date = new Date(fixture.utcDate);
  if (Number.isNaN(date.getTime())) return "Time TBD";
  // MLB leaves both flags on a game after it is played.
  const isFinal = fixture.status === "FINISHED";
  if (fixture.startTimeTbd && isFinal) return DATE_ONLY_FORMATTER.format(date);
  const when = fixture.startTimeTbd
    ? `${DATE_ONLY_FORMATTER.format(date)} · time TBD`
    : formatStableDateTime(DATE_TIME_FORMATTER, date);
  return fixture.ifNecessary && !isFinal ? `${when} · if necessary` : when;
}

/** The fixture's calendar day, as "Oct 7", or null when the date cannot be read. */
export function formatFixtureDay(fixture: GenericFixture): string | null {
  const date = new Date(fixture.utcDate);
  if (Number.isNaN(date.getTime())) return null;
  return (fixture.startTimeTbd ? DATE_ONLY_FORMATTER : DAY_FORMATTER).format(date);
}

/** The start time alone, as "1:25 PM EDT", for a row whose day prints beside it. */
export function formatFixtureTime(fixture: GenericFixture): string {
  const date = new Date(fixture.utcDate);
  if (fixture.startTimeTbd || Number.isNaN(date.getTime())) return "time TBD";
  return formatStableDateTime(TIME_FORMATTER, date);
}

export function formatKickoff(utcDate: string): string {
  const date = new Date(utcDate);
  return Number.isNaN(date.getTime()) ? "Time TBD" : formatStableDateTime(KICKOFF_FORMATTER, date);
}

export function getResultForTeam(
  fixture: GenericFixture,
  teamId: string
): "W" | "D" | "L" | null {
  const isHome = fixture.homeTeam.id === teamId;
  const isAway = fixture.awayTeam.id === teamId;
  if (!isHome && !isAway) return null;
  // An unplayed or postponed game has no winner, and that is not a loss.
  if (fixture.status !== "FINISHED") return null;
  const { winner } = fixture.score;
  if (winner === "DRAW" || winner === "TIE") return "D";
  if (winner !== "HOME_TEAM" && winner !== "AWAY_TEAM") return null;
  return (isHome && winner === "HOME_TEAM") || (isAway && winner === "AWAY_TEAM")
    ? "W"
    : "L";
}
