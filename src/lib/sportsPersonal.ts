import { isRecord } from "./utils";
import { escapeCalendarText, foldCalendarLine } from "./travelExtras";

export type PersonalLeague = "nba" | "nfl" | "premier-league" | "la-liga" | "mlb";
export function standingRankLabel(league: PersonalLeague) {
  return league === "mlb" ? "Division rank" : league === "premier-league" || league === "la-liga" ? "League rank" : "Conference rank";
}

export interface PersonalStanding {
  id: string;
  name: string;
  conference: string;
  rank: number;
  wins: number;
  losses: number;
  ties: number;
}
export interface SportsObservation {
  season: string;
  sourceAt: string;
  teams: PersonalStanding[];
}
export interface PersonalFixture {
  id: string;
  utcDate: string;
  home: string;
  away: string;
  status: string;
  startTimeTbd?: boolean;
  ifNecessary?: boolean;
}
const validId = (id: unknown): id is string =>
  typeof id === "string" && /^[a-zA-Z0-9_-]{1,50}$/.test(id);
export function parseFavoriteTeams(raw: string): string[] {
  try {
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data)
      ? [...new Set(data.filter(validId))].slice(0, 10)
      : [];
  } catch {
    return [];
  }
}
export function parseSportsHistory(raw: string): SportsObservation[] {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .flatMap((row): SportsObservation[] => {
        if (
          !isRecord(row) ||
          typeof row.season !== "string" ||
          !row.season ||
          row.season.length > 40 ||
          typeof row.sourceAt !== "string" ||
          !Number.isFinite(Date.parse(row.sourceAt)) ||
          !Array.isArray(row.teams) ||
          row.teams.length > 40
        )
          return [];
        const teams = row.teams.flatMap((team): PersonalStanding[] => {
          if (
            !isRecord(team) ||
            !validId(team.id) ||
            typeof team.name !== "string" ||
            !team.name ||
            typeof team.conference !== "string"
          )
            return [];
          for (const key of ["rank", "wins", "losses", "ties"] as const)
            if (
              typeof team[key] !== "number" ||
              !Number.isInteger(team[key]) ||
              team[key] < 0 ||
              team[key] > 200
            )
              return [];
          return [
            {
              id: team.id,
              name: team.name.slice(0, 120),
              conference: team.conference.slice(0, 40),
              rank: team.rank as number,
              wins: team.wins as number,
              losses: team.losses as number,
              ties: team.ties as number,
            },
          ];
        });
        if (
          !teams.length ||
          teams.length !== row.teams.length ||
          new Set(teams.map((team) => team.id)).size !== teams.length
        )
          return [];
        return [{ season: row.season, sourceAt: row.sourceAt, teams }];
      })
      .sort((a, b) => Date.parse(b.sourceAt) - Date.parse(a.sourceAt))
      .slice(0, 8);
  } catch {
    return [];
  }
}
export function observeSportsSnapshot(
  history: SportsObservation[],
  current: SportsObservation,
) {
  if (
    history[0]?.season === current.season &&
    Date.parse(history[0].sourceAt) >= Date.parse(current.sourceAt)
  )
    return history;
  return [
    current,
    ...history.filter((item) => item.season === current.season),
  ].slice(0, 8);
}
export function standingsChanges(
  current: SportsObservation,
  previous: SportsObservation,
) {
  if (current.season !== previous.season) return [];
  const old = new Map(previous.teams.map((team) => [team.id, team]));
  return current.teams.flatMap((team) => {
    const before = old.get(team.id);
    return before && before.conference === team.conference
      ? [
          {
            ...team,
            rankChange: before.rank - team.rank,
            winsChange: team.wins - before.wins,
            lossesChange: team.losses - before.losses,
            tiesChange: team.ties - before.ties,
          },
        ]
      : [];
  });
}
export function sportsCalendar(
  league: PersonalLeague,
  name: string,
  fixtures: PersonalFixture[],
  now = new Date(),
) {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Isaac Vazquez//Team Schedules//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeCalendarText(`${name} ${league.toUpperCase()}`)}`,
  ];
  for (const fixture of fixtures) {
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(fixture.utcDate) ||
      !Number.isFinite(Date.parse(fixture.utcDate)) ||
      Date.parse(fixture.utcDate) <= now.getTime() ||
      /POSTPONED|CANCELLED|CANCELED|TBD/i.test(fixture.status) || fixture.startTimeTbd || fixture.ifNecessary
    )
      continue;
    const start = new Date(fixture.utcDate)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${league}-${encodeURIComponent(fixture.id)}@isaacvazquez.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `SUMMARY:${escapeCalendarText(`${fixture.away} at ${fixture.home}`)}`,
      `DESCRIPTION:${escapeCalendarText("Published schedule. Check the league for time changes before the game.")}`,
      "END:VEVENT",
    );
  }
  return (
    [...lines, "END:VCALENDAR"].map(foldCalendarLine).join("\r\n") + "\r\n"
  );
}
