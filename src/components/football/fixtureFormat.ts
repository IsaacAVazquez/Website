import type { GenericFixture } from "./FixtureCard";

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

export function formatFixtureDateTime(fixture: GenericFixture): string {
  const date = new Date(fixture.utcDate);
  if (Number.isNaN(date.getTime())) return "Time TBD";
  if (!fixture.startTimeTbd) return DATE_TIME_FORMATTER.format(date);
  const day = DATE_ONLY_FORMATTER.format(date);
  // MLB leaves the flag on the second game of a doubleheader after it is played.
  if (fixture.status === "FINISHED") return day;
  return fixture.ifNecessary ? `${day} · time TBD · if necessary` : `${day} · time TBD`;
}

export function formatKickoff(utcDate: string): string {
  const date = new Date(utcDate);
  return Number.isNaN(date.getTime()) ? "Time TBD" : KICKOFF_FORMATTER.format(date);
}

export function formatFixed(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "—";
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
