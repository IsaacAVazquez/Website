import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Stands in for api.football-data.org on the free tier. The shapes come from
 * live probes on 2026-09-27: every response carries X-Requests-Available-Minute
 * and X-RequestCounter-Reset, competition matches ignore `limit` while club
 * matches honour it, and a match stays SCHEDULED at T00:00:00Z until its
 * kickoff is fixed, when it turns TIMED. The eleventh request inside any 60
 * seconds is answered with a 429, which was not observed live, so its body is
 * written from the provider's docs. The live counter ran a request behind,
 * and this one is exact.
 */
const REQUESTS_PER_MINUTE = 10;
const WINDOW_MS = 60_000;
const PRIOR_SEASON = 2025;
const CURRENT_SEASON = 2026;

export interface ServedRequest {
  path: string;
  status: number;
  at: number;
}

export interface FootballDataApiOptions {
  code: "PL" | "PD";
  /** False models the weeks after the season pointer rolls over and before the first match. */
  seasonStarted?: boolean;
  /** Returns a body to serve in place of the generated one, or undefined to leave it alone. */
  override?: (path: string) => unknown;
}

export const CLUBS = Array.from({ length: 20 }, (_, index) => {
  const tla = `C${String.fromCharCode(65 + Math.floor(index / 5))}${String.fromCharCode(65 + (index % 5))}`;
  return {
    id: 101 + index,
    name: `Club ${tla} FC`,
    shortName: `Club ${tla}`,
    tla,
    crest: `https://crests.football-data.org/${101 + index}.png`,
  };
});

type MatchStatus = "FINISHED" | "TIMED" | "SCHEDULED";

function buildMatchday(season: number, matchday: number, date: string, status: MatchStatus) {
  return Array.from({ length: 10 }, (_, slot) => {
    const played = status === "FINISHED";
    const home = (slot + matchday) % 4;
    const away = (slot * matchday) % 3;
    return {
      area: { id: 2072, name: "Europe", code: "EUR" },
      season: { id: season, currentMatchday: matchday },
      id: season * 1000 + matchday * 10 + slot,
      utcDate:
        status === "SCHEDULED"
          ? `${date}T00:00:00Z`
          : `${date}T${String(12 + (slot % 8)).padStart(2, "0")}:30:00Z`,
      status,
      matchday,
      stage: "REGULAR_SEASON",
      group: null,
      lastUpdated: `${date}T23:00:00Z`,
      homeTeam: CLUBS[slot],
      awayTeam: CLUBS[10 + ((slot + matchday) % 10)],
      score: {
        winner: !played ? null : home > away ? "HOME_TEAM" : home < away ? "AWAY_TEAM" : "DRAW",
        duration: "REGULAR",
        fullTime: { home: played ? home : null, away: played ? away : null },
        halfTime: { home: played ? 0 : null, away: played ? 0 : null },
      },
      odds: { msg: "Activate Odds-Package in User-Panel to retrieve odds." },
      referees: [],
    };
  });
}

function seasonMatches(season: number, seasonStarted: boolean) {
  if (season === PRIOR_SEASON) {
    return [
      ...buildMatchday(season, 36, "2026-05-10", "FINISHED"),
      ...buildMatchday(season, 37, "2026-05-17", "FINISHED"),
      ...buildMatchday(season, 38, "2026-05-24", "FINISHED"),
    ];
  }
  return [
    ...buildMatchday(season, 1, "2026-08-22", seasonStarted ? "FINISHED" : "TIMED"),
    ...buildMatchday(season, 2, "2026-08-29", seasonStarted ? "FINISHED" : "SCHEDULED"),
    ...buildMatchday(season, 3, "2026-09-12", seasonStarted ? "TIMED" : "SCHEDULED"),
    ...buildMatchday(season, 4, "2026-09-19", "SCHEDULED"),
  ];
}

function matchesBody(matches: ReturnType<typeof buildMatchday>, filters: Record<string, unknown>) {
  const dates = matches.map((match) => match.utcDate.slice(0, 10)).sort();
  return {
    filters,
    resultSet: {
      count: matches.length,
      first: dates[0],
      last: dates.at(-1),
      played: matches.filter((match) => match.status === "FINISHED").length,
    },
    matches,
  };
}

// The provider's SCHEDULED filter returns the TIMED matches as well.
function byStatus(matches: ReturnType<typeof buildMatchday>, status: string | null) {
  if (status === "SCHEDULED") return matches.filter((match) => match.status !== "FINISHED");
  return matches.filter((match) => match.status === status);
}

function routeBody(url: URL, options: FootballDataApiOptions): unknown {
  const seasonStarted = options.seasonStarted ?? true;
  const season = Number(url.searchParams.get("season") ?? CURRENT_SEASON);
  const live = season === PRIOR_SEASON || seasonStarted;
  const status = url.searchParams.get("status");
  const path = url.pathname.replace("/v4", "");
  const competition = { id: 2021, name: options.code === "PL" ? "Premier League" : "Primera Division", code: options.code, type: "LEAGUE", emblem: `https://crests.football-data.org/${options.code}.png` };
  const seasonMeta = {
    id: season,
    startDate: `${season}-08-21`,
    endDate: `${season + 1}-05-30`,
    currentMatchday: season === PRIOR_SEASON ? 38 : seasonStarted ? 3 : 1,
    winner: null,
  };

  const teamMatch = path.match(/^\/teams\/(\d+)(\/matches)?$/);
  if (teamMatch) {
    const club = CLUBS.find((candidate) => candidate.id === Number(teamMatch[1]));
    if (!club) return undefined;
    if (!teamMatch[2]) {
      return {
        area: { id: 2072, name: "Europe", code: "EUR" },
        ...club,
        address: `${club.shortName} Road 1`,
        website: `https://www.${club.tla.toLowerCase()}.example`,
        founded: 1900,
        clubColors: "Red / White",
        venue: `${club.shortName} Park`,
        coach: { id: club.id * 10, name: `Coach ${club.tla}` },
        squad: [],
        staff: [],
        lastUpdated: "2026-09-01T00:00:00Z",
      };
    }
    // The club fetch carries no season, so it always reads the current one.
    const clubMatches = seasonMatches(CURRENT_SEASON, seasonStarted).filter(
      (match) => match.homeTeam.id === club.id || match.awayTeam.id === club.id
    );
    const limit = Number(url.searchParams.get("limit"));
    const listed = byStatus(clubMatches, status);
    return matchesBody(status === "FINISHED" ? listed.slice(-limit) : listed.slice(0, limit), {
      competitions: url.searchParams.get("competitions"),
      permission: "TIER_ONE",
      status: [status],
      limit,
    });
  }

  if (path === `/competitions/${options.code}/standings`) {
    const played = season === PRIOR_SEASON ? 38 : seasonStarted ? 2 : 0;
    return {
      filters: { season: String(season) },
      area: { id: 2072, name: "Europe", code: "EUR" },
      competition,
      season: seasonMeta,
      standings: [
        {
          stage: "REGULAR_SEASON",
          type: "TOTAL",
          group: null,
          table: CLUBS.map((team, index) => ({
            position: index + 1,
            team,
            playedGames: played,
            form: null,
            won: played ? 1 : 0,
            draw: 0,
            lost: played ? played - 1 : 0,
            points: played ? 3 : 0,
            goalsFor: played,
            goalsAgainst: played,
            goalDifference: 0,
          })),
        },
      ],
    };
  }
  if (path === `/competitions/${options.code}/matches`) {
    return matchesBody(byStatus(seasonMatches(season, seasonStarted), status), {
      season: String(season),
      status: [status],
    });
  }
  if (path === `/competitions/${options.code}/teams`) {
    return {
      count: CLUBS.length,
      filters: { season: String(season) },
      competition,
      season: seasonMeta,
      teams: CLUBS.map((club) => ({ ...club, venue: `${club.shortName} Park`, founded: 1900 })),
    };
  }
  if (path === `/competitions/${options.code}/scorers`) {
    return {
      count: live ? 2 : 0,
      filters: { season: String(season), limit: 10 },
      competition,
      season: seasonMeta,
      scorers: live
        ? [
            { player: { id: 1, name: "First Scorer" }, team: CLUBS[0], playedMatches: 2, goals: 4, assists: 1, penalties: 0 },
            { player: { id: 2, name: "Second Scorer" }, team: CLUBS[1], playedMatches: 2, goals: 3, assists: 2, penalties: null },
          ]
        : [],
    };
  }
  return undefined;
}

export function createFootballDataApi(options: FootballDataApiOptions) {
  const served: ServedRequest[] = [];
  let accepted: number[] = [];

  const fetchMock = (input: Parameters<typeof fetch>[0]): Promise<Response> => {
    const url = new URL(String(input));
    const path = url.pathname.replace("/v4", "") + url.search;
    const now = Date.now();
    accepted = accepted.filter((time) => now - time < WINDOW_MS);
    const limited = accepted.length >= REQUESTS_PER_MINUTE;
    if (!limited) accepted.push(now);

    const resetSeconds = Math.ceil((accepted[0] + WINDOW_MS - now) / 1000);
    const body = limited
      ? { message: `You reached your request limit. Wait ${resetSeconds} seconds.`, errorCode: 429 }
      : options.override?.(path) ?? routeBody(url, options);
    const status = limited ? 429 : body === undefined ? 404 : 200;
    served.push({ path, status, at: now });

    return Promise.resolve(
      new Response(JSON.stringify(body ?? { message: "The resource you are looking for does not exist.", errorCode: 404 }), {
        status,
        headers: {
          "content-type": "application/json;charset=UTF-8",
          "x-api-version": "v4",
          "x-requests-available-minute": String(REQUESTS_PER_MINUTE - accepted.length),
          "x-requestcounter-reset": String(resetSeconds),
        },
      })
    );
  };

  return { fetchMock, served };
}

/** The most requests the provider saw start inside any 60 seconds. */
export function busiestMinute(served: readonly ServedRequest[]): number {
  return served.reduce(
    (most, first) =>
      Math.max(most, served.filter((other) => other.at >= first.at && other.at < first.at + WINDOW_MS).length),
    0
  );
}

/** Drives a task that waits on timers to its end under Jest's fake clock. */
export async function runOnFakeClock<T>(task: Promise<T>): Promise<T | Error> {
  let settled = false;
  const outcome = task
    .catch((error: Error) => error)
    .finally(() => {
      settled = true;
    });
  while (!settled) {
    await jest.advanceTimersByTimeAsync(1000);
  }
  return outcome;
}

/** Writes a stored snapshot in the generated file format and returns the directory to use as cwd. */
export function writeStoredSnapshot(fileName: string, snapshot: unknown): string {
  const root = mkdtempSync(join(tmpdir(), "football-snapshot-"));
  mkdirSync(join(root, "src", "data"), { recursive: true });
  writeFileSync(join(root, "src", "data", fileName), JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  return root;
}
