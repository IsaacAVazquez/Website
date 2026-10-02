/**
 * @jest-environment node
 */
import {
  buildPremierLeagueSnapshot,
  getPremierLeagueSummary,
  getPremierLeagueTeamSnapshot,
  sumPlayedGames,
} from "../premierLeagueData";
import { resetFootballDataPacingForTests } from "../footballData";
import type {
  PremierLeagueSnapshot,
  PremierLeagueSummary,
  PremierLeagueTeamSnapshot,
} from "@/types/premier-league";
import {
  CLUBS,
  busiestMinute,
  createFootballDataApi,
  runOnFakeClock,
  writeStoredSnapshot,
  type ServedRequest,
} from "./fixtures/footballDataApi";

// The request pacing is module state, so each test starts with a clear minute.
beforeEach(() => {
  resetFootballDataPacingForTests();
});

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

interface TeamFixtureOpts {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
  venue?: string;
}

function rawTeam(opts: TeamFixtureOpts) {
  return {
    id: opts.id,
    name: opts.name,
    shortName: opts.shortName ?? opts.name,
    tla: opts.tla ?? null,
    crest: opts.crest ?? null,
    venue: opts.venue ?? null,
  };
}

const ARSENAL = rawTeam({ id: 57, name: "Arsenal FC", shortName: "Arsenal", tla: "ARS", crest: "https://crests/ars.png", venue: "Emirates" });
const CHELSEA = rawTeam({ id: 61, name: "Chelsea FC", shortName: "Chelsea", tla: "CHE", crest: "https://crests/che.png", venue: "Stamford Bridge" });
const LIVERPOOL = rawTeam({ id: 64, name: "Liverpool FC", shortName: "Liverpool", tla: "LIV", crest: "https://crests/liv.png", venue: "Anfield" });

function standingsPayload() {
  return {
    area: { name: "England" },
    competition: {
      code: "PL",
      name: "Premier League",
      emblem: "https://emblem.png",
      area: { name: "England" },
    },
    season: {
      startDate: "2025-08-15",
      endDate: "2026-05-24",
      currentMatchday: 30,
      winner: null,
    },
    standings: [
      {
        type: "TOTAL",
        table: [
          // Intentionally out of order to verify the table is preserved by position.
          {
            position: 2,
            playedGames: 30,
            won: 18,
            draw: 6,
            lost: 6,
            points: 60,
            goalsFor: 55,
            goalsAgainst: 30,
            goalDifference: 25,
            team: CHELSEA,
          },
          {
            position: 1,
            playedGames: 30,
            won: 22,
            draw: 5,
            lost: 3,
            points: 71,
            goalsFor: 70,
            goalsAgainst: 25,
            goalDifference: 45,
            team: ARSENAL,
          },
          {
            position: 3,
            playedGames: 30,
            won: 17,
            draw: 7,
            lost: 6,
            points: 58,
            goalsFor: 60,
            goalsAgainst: 35,
            goalDifference: 25,
            team: LIVERPOOL,
          },
          // Malformed row (no team) should be dropped.
          {
            position: 4,
            playedGames: 30,
            team: null,
          },
        ],
      },
      // A non-TOTAL group should be ignored in favor of TOTAL.
      {
        type: "HOME",
        table: [],
      },
    ],
  };
}

function finishedMatchesPayload() {
  return {
    matches: [
      {
        id: 1001,
        utcDate: "2026-03-01T15:00:00Z",
        status: "FINISHED",
        matchday: 28,
        stage: "REGULAR_SEASON",
        homeTeam: ARSENAL,
        awayTeam: CHELSEA,
        score: { winner: "HOME_TEAM", fullTime: { home: 2, away: 1 } },
      },
      {
        id: 1002,
        utcDate: "2026-03-08T17:30:00Z",
        status: "FINISHED",
        matchday: 29,
        stage: "REGULAR_SEASON",
        homeTeam: LIVERPOOL,
        awayTeam: ARSENAL,
        score: { winner: "DRAW", fullTime: { home: 1, away: 1 } },
      },
      // Malformed match (no away team) should be dropped.
      {
        id: 1003,
        utcDate: "2026-03-09T17:30:00Z",
        status: "FINISHED",
        homeTeam: LIVERPOOL,
        awayTeam: null,
        score: { winner: null, fullTime: { home: null, away: null } },
      },
    ],
  };
}

function scheduledMatchesPayload() {
  return {
    matches: [
      {
        id: 2002,
        utcDate: "2026-03-22T15:00:00Z",
        status: "SCHEDULED",
        matchday: 31,
        stage: "REGULAR_SEASON",
        homeTeam: CHELSEA,
        awayTeam: LIVERPOOL,
        score: { winner: null, fullTime: { home: null, away: null } },
      },
      {
        id: 2001,
        utcDate: "2026-03-15T15:00:00Z",
        status: "SCHEDULED",
        matchday: 30,
        stage: "REGULAR_SEASON",
        homeTeam: ARSENAL,
        awayTeam: LIVERPOOL,
        score: { winner: null, fullTime: { home: null, away: null } },
      },
    ],
  };
}

/**
 * The upstream competition has rolled to 2026/27 but no matches are played yet
 * (the off-season state that produced the zeroed-table wipe). Every row is
 * position-ordered with 0 played games.
 */
function rolledOverStandingsPayload() {
  return {
    area: { name: "England" },
    competition: {
      code: "PL",
      name: "Premier League",
      emblem: "https://emblem.png",
      area: { name: "England" },
    },
    season: {
      startDate: "2026-08-21",
      endDate: "2027-05-30",
      currentMatchday: 1,
      winner: null,
    },
    standings: [
      {
        type: "TOTAL",
        table: [
          { position: 1, playedGames: 0, won: 0, draw: 0, lost: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, team: ARSENAL },
          { position: 2, playedGames: 0, won: 0, draw: 0, lost: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, team: CHELSEA },
          { position: 3, playedGames: 0, won: 0, draw: 0, lost: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, team: LIVERPOOL },
        ],
      },
    ],
  };
}

function teamsPayload() {
  return {
    teams: [LIVERPOOL, ARSENAL, CHELSEA],
  };
}

function scorersPayload() {
  return {
    scorers: [
      { player: { name: "Bukayo Saka" }, team: ARSENAL, goals: 18, assists: 9, playedMatches: 30 },
      { player: { name: "Cole Palmer" }, team: CHELSEA, goals: 16, assists: 7, playedMatches: 29 },
      // Malformed scorer (no name) should be dropped.
      { player: { name: null }, team: LIVERPOOL, goals: 12 },
    ],
  };
}

/**
 * Routes a football-data.org request URL to the right canned payload.
 */
function routeFetch(url: string): Response {
  if (url.includes("/standings")) return jsonResponse(standingsPayload());
  if (url.includes("/scorers")) return jsonResponse(scorersPayload());
  if (url.includes("/teams")) return jsonResponse(teamsPayload());
  if (url.includes("/matches")) {
    if (url.includes("status=FINISHED")) return jsonResponse(finishedMatchesPayload());
    if (url.includes("status=SCHEDULED")) return jsonResponse(scheduledMatchesPayload());
  }
  throw new Error(`Unexpected fetch URL in test: ${url}`);
}

describe("sumPlayedGames", () => {
  it("sums playedGames across rows and treats a zeroed table as zero", () => {
    expect(sumPlayedGames([{ playedGames: 30 }, { playedGames: 28 }])).toBe(58);
    expect(sumPlayedGames([{ playedGames: 0 }, { playedGames: 0 }])).toBe(0);
    expect(sumPlayedGames([])).toBe(0);
  });
});

describe("getPremierLeagueSummary", () => {
  let previousToken: string | undefined;

  beforeAll(() => {
    previousToken = process.env.FOOTBALL_DATA_API_TOKEN;
  });

  beforeEach(() => {
    process.env.FOOTBALL_DATA_API_TOKEN = "test-token";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (previousToken === undefined) {
      delete process.env.FOOTBALL_DATA_API_TOKEN;
    } else {
      process.env.FOOTBALL_DATA_API_TOKEN = previousToken;
    }
  });

  it("normalizes and sorts standings, fixtures, teams, and scorers", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockImplementation((input: Parameters<typeof fetch>[0]) =>
        Promise.resolve(routeFetch(String(input)))
      );

    const summary = await getPremierLeagueSummary();

    // Requests carry the configured auth token header.
    const lastCallInit = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    expect((lastCallInit?.headers as Record<string, string>)["X-Auth-Token"]).toBe("test-token");

    // Competition metadata is derived from the standings response.
    expect(summary.competition?.code).toBe("PL");
    expect(summary.competition?.name).toBe("Premier League");
    expect(summary.competition?.areaName).toBe("England");
    expect(summary.competition?.seasonLabel).toBe("2025/26");
    expect(summary.competition?.currentMatchday).toBe(30);

    // Standings: TOTAL group used, malformed row dropped, rows preserve position values.
    expect(summary.standings).toHaveLength(3);
    expect(summary.standings.map((r) => r.position)).toEqual([2, 1, 3]);
    const arsenalRow = summary.standings.find((r) => r.team.id === "57");
    expect(arsenalRow?.points).toBe(71);
    expect(arsenalRow?.goalDifference).toBe(45);
    expect(arsenalRow?.team.shortName).toBe("Arsenal");
    expect(arsenalRow?.team.crest).toBe("https://crests/ars.png");

    // Recent (finished) fixtures: malformed dropped, sorted newest-first.
    expect(summary.recentFixtures).toHaveLength(2);
    expect(summary.recentFixtures[0].id).toBe("1002");
    expect(summary.recentFixtures[1].id).toBe("1001");
    expect(summary.recentFixtures[1].score).toEqual({
      winner: "HOME_TEAM",
      home: 2,
      away: 1,
    });

    // Upcoming (scheduled) fixtures sorted oldest-first.
    expect(summary.upcomingFixtures).toHaveLength(2);
    expect(summary.upcomingFixtures[0].id).toBe("2001");
    expect(summary.upcomingFixtures[1].id).toBe("2002");

    // Teams sorted alphabetically by shortName.
    expect(summary.teams.map((t) => t.shortName)).toEqual([
      "Arsenal",
      "Chelsea",
      "Liverpool",
    ]);
    expect(summary.teams[0].venue).toBe("Emirates");

    // Scorers: malformed dropped, ranks assigned in order.
    expect(summary.scorers).toHaveLength(2);
    expect(summary.scorers[0]).toMatchObject({
      rank: 1,
      name: "Bukayo Saka",
      teamId: "57",
      teamName: "Arsenal",
      goals: 18,
      assists: 9,
      appearances: 30,
    });
    expect(summary.scorers[1].rank).toBe(2);

    // Club accent color is resolved from the src/data/clubColors.ts lookup by TLA.
    expect(arsenalRow?.team.accentColor).toBe("#EF0107");

    // Goals-per-matchday aggregates the full-season FINISHED-matches fetch
    // (a separate, unlimited call from the 8-most-recent `recentFixtures`),
    // grouped by matchday and summed. The malformed match (no matchday, no
    // away team) contributes nothing.
    expect(summary.goalsPerMatchday).toEqual([
      { matchday: 28, totalGoals: 3 },
      { matchday: 29, totalGoals: 2 },
    ]);

    expect(typeof summary.generatedAt).toBe("string");
  });

  it("re-pins to the completed prior season when the live standings show zero games played", async () => {
    // Off-season rollover: the /standings request with no season param returns
    // the zeroed 2026/27 placeholder; a request pinned to season=2025 returns
    // the real completed 2025/26 table.
    jest.spyOn(global, "fetch").mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = String(input);
      if (url.includes("/standings")) {
        return Promise.resolve(
          jsonResponse(url.includes("season=2025") ? standingsPayload() : rolledOverStandingsPayload())
        );
      }
      if (url.includes("/scorers")) return Promise.resolve(jsonResponse(scorersPayload()));
      if (url.includes("/teams")) return Promise.resolve(jsonResponse(teamsPayload()));
      if (url.includes("/matches")) {
        if (url.includes("status=FINISHED")) return Promise.resolve(jsonResponse(finishedMatchesPayload()));
        if (url.includes("status=SCHEDULED")) return Promise.resolve(jsonResponse(scheduledMatchesPayload()));
      }
      throw new Error(`Unexpected fetch URL in test: ${url}`);
    });

    const summary = await getPremierLeagueSummary();

    // Must NOT surface the zeroed 2026/27 placeholder; re-pins to 2025/26.
    expect(summary.competition?.seasonLabel).toBe("2025/26");
    expect(summary.standings.length).toBeGreaterThan(0);
    const totalPlayed = summary.standings.reduce((sum, row) => sum + row.playedGames, 0);
    expect(totalPlayed).toBeGreaterThan(0);
    // Position ordering [2, 1, 3] is unique to the completed-season payload.
    expect(summary.standings.map((r) => r.position)).toEqual([2, 1, 3]);
  });

  it("throws when the API token is not configured", async () => {
    delete process.env.FOOTBALL_DATA_API_TOKEN;
    jest.spyOn(global, "fetch").mockResolvedValue(jsonResponse({}));

    await expect(getPremierLeagueSummary()).rejects.toThrow(/not configured/i);
  });

  it("handles empty feeds gracefully", async () => {
    jest.spyOn(global, "fetch").mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = String(input);
      if (url.includes("/standings")) {
        return Promise.resolve(
          jsonResponse({
            competition: { code: "PL", name: "Premier League" },
            season: {},
            standings: [],
          })
        );
      }
      if (url.includes("/scorers")) return Promise.resolve(jsonResponse({ scorers: [] }));
      if (url.includes("/teams")) return Promise.resolve(jsonResponse({ teams: [] }));
      if (url.includes("/matches")) return Promise.resolve(jsonResponse({ matches: [] }));
      throw new Error(`Unexpected fetch URL in test: ${url}`);
    });

    const summary = await getPremierLeagueSummary();

    expect(summary.standings).toEqual([]);
    expect(summary.recentFixtures).toEqual([]);
    expect(summary.upcomingFixtures).toEqual([]);
    expect(summary.teams).toEqual([]);
    expect(summary.scorers).toEqual([]);
    expect(summary.goalsPerMatchday).toEqual([]);
    // Falls back to the default season label when dates are absent.
    expect(summary.competition?.seasonLabel).toBe("Current season");
  });
});

describe("sumPlayedGames edge cases", () => {
  it("treats a missing/nullish playedGames as zero", () => {
    // The `?? 0` guard: rows whose playedGames is absent (older/partial upstream
    // rows) must not turn the running total into NaN.
    expect(
      sumPlayedGames([
        { playedGames: undefined as unknown as number },
        { playedGames: 12 },
      ])
    ).toBe(12);
    expect(
      sumPlayedGames([{ playedGames: null as unknown as number }])
    ).toBe(0);
  });
});

// Team-detail endpoint returns the raw team object directly (not wrapped), and
// carries the club-detail-only fields (founded, clubColors, website, address,
// coach) that the summary team-list objects omit.
const ARSENAL_DETAIL = {
  id: 57,
  name: "Arsenal FC",
  shortName: "Arsenal",
  tla: "ARS",
  crest: "https://crests/ars.png",
  venue: "Emirates Stadium",
  founded: 1886,
  clubColors: "Red / White",
  website: "https://www.arsenal.com",
  address: "75 Drayton Park London N5 1BU",
  coach: { name: "Mikel Arteta" },
};

function arsenalFinishedPayload() {
  return {
    matches: [
      // Arsenal home win (older).
      {
        id: 3001,
        utcDate: "2026-03-01T15:00:00Z",
        status: "FINISHED",
        matchday: 28,
        stage: "REGULAR_SEASON",
        homeTeam: ARSENAL,
        awayTeam: CHELSEA,
        score: { winner: "HOME_TEAM", fullTime: { home: 2, away: 1 } },
      },
      // Arsenal away draw (newest).
      {
        id: 3002,
        utcDate: "2026-03-08T17:30:00Z",
        status: "FINISHED",
        matchday: 29,
        stage: "REGULAR_SEASON",
        homeTeam: LIVERPOOL,
        awayTeam: ARSENAL,
        score: { winner: "DRAW", fullTime: { home: 1, away: 1 } },
      },
      // Arsenal away loss (oldest).
      {
        id: 3003,
        utcDate: "2026-02-20T15:00:00Z",
        status: "FINISHED",
        matchday: 27,
        stage: "REGULAR_SEASON",
        homeTeam: CHELSEA,
        awayTeam: ARSENAL,
        score: { winner: "HOME_TEAM", fullTime: { home: 3, away: 0 } },
      },
      // Malformed match (no home team) should be dropped.
      {
        id: 3004,
        utcDate: "2026-02-25T15:00:00Z",
        status: "FINISHED",
        homeTeam: null,
        awayTeam: ARSENAL,
        score: { winner: null, fullTime: { home: null, away: null } },
      },
    ],
  };
}

function arsenalScheduledPayload() {
  return {
    matches: [
      // Later fixture, listed first to prove the ascending sort runs.
      {
        id: 4002,
        utcDate: "2026-03-22T15:00:00Z",
        status: "SCHEDULED",
        matchday: 31,
        stage: "REGULAR_SEASON",
        homeTeam: ARSENAL,
        awayTeam: LIVERPOOL,
        score: { winner: null, fullTime: { home: null, away: null } },
      },
      // Earlier fixture.
      {
        id: 4001,
        utcDate: "2026-03-15T15:00:00Z",
        status: "SCHEDULED",
        matchday: 30,
        stage: "REGULAR_SEASON",
        homeTeam: CHELSEA,
        awayTeam: ARSENAL,
        score: { winner: null, fullTime: { home: null, away: null } },
      },
    ],
  };
}

/**
 * Routes a team-scoped football-data.org request URL to the right canned
 * payload. The team-matches URL (`/teams/57/matches?...`) contains both
 * `/teams/` and `/matches`, so `/matches` must be checked first.
 */
function routeTeamFetch(url: string): Response {
  if (url.includes("/matches")) {
    if (url.includes("status=FINISHED")) return jsonResponse(arsenalFinishedPayload());
    if (url.includes("status=SCHEDULED")) return jsonResponse(arsenalScheduledPayload());
  }
  if (url.includes("/teams/")) return jsonResponse(ARSENAL_DETAIL);
  throw new Error(`Unexpected fetch URL in test: ${url}`);
}

describe("getPremierLeagueTeamSnapshot", () => {
  let previousToken: string | undefined;

  beforeAll(() => {
    previousToken = process.env.FOOTBALL_DATA_API_TOKEN;
  });

  beforeEach(() => {
    process.env.FOOTBALL_DATA_API_TOKEN = "test-token";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (previousToken === undefined) {
      delete process.env.FOOTBALL_DATA_API_TOKEN;
    } else {
      process.env.FOOTBALL_DATA_API_TOKEN = previousToken;
    }
  });

  it("rejects an invalid team id before hitting the network", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");

    await expect(getPremierLeagueTeamSnapshot("not-an-id")).rejects.toMatchObject({
      status: 400,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("normalizes the club profile, splits fixtures, and derives form", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockImplementation((input: Parameters<typeof fetch>[0]) =>
        Promise.resolve(routeTeamFetch(String(input)))
      );

    const snapshot = await getPremierLeagueTeamSnapshot("57");

    // Requests carry the configured auth token header.
    const lastCallInit = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    expect((lastCallInit?.headers as Record<string, string>)["X-Auth-Token"]).toBe("test-token");

    // Profile: normalized team option fields plus the club-detail-only fields
    // that only the `/teams/{id}` endpoint exposes.
    expect(snapshot.team?.id).toBe("57");
    expect(snapshot.team?.name).toBe("Arsenal FC");
    expect(snapshot.team?.shortName).toBe("Arsenal");
    expect(snapshot.team?.tla).toBe("ARS");
    expect(snapshot.team?.venue).toBe("Emirates Stadium");
    // Accent color resolved from src/data/clubColors.ts by TLA.
    expect(snapshot.team?.accentColor).toBe("#EF0107");
    expect(snapshot.team?.founded).toBe(1886);
    expect(snapshot.team?.clubColors).toBe("Red / White");
    expect(snapshot.team?.website).toBe("https://www.arsenal.com");
    expect(snapshot.team?.address).toBe("75 Drayton Park London N5 1BU");
    // Manager is read from the upstream `coach.name`.
    expect(snapshot.team?.manager).toBe("Mikel Arteta");

    // Recent (finished) fixtures: malformed dropped, sorted newest-first.
    expect(snapshot.recentFixtures.map((f) => f.id)).toEqual(["3002", "3001", "3003"]);

    // Upcoming (scheduled) fixtures sorted oldest-first.
    expect(snapshot.upcomingFixtures.map((f) => f.id)).toEqual(["4001", "4002"]);

    // Form is derived over the recent fixtures in their (newest-first) order:
    // draw (3002), win (3001), loss (3003).
    expect(snapshot.form.sequence).toEqual(["D", "W", "L"]);
    expect(snapshot.form.wins).toBe(1);
    expect(snapshot.form.draws).toBe(1);
    expect(snapshot.form.losses).toBe(1);
    expect(snapshot.form.points).toBe(4);
    // Goals for/against are counted from Arsenal's perspective per fixture.
    expect(snapshot.form.goalsFor).toBe(3);
    expect(snapshot.form.goalsAgainst).toBe(5);

    expect(typeof snapshot.generatedAt).toBe("string");
    expect(() => new Date(snapshot.generatedAt).toISOString()).not.toThrow();
  });

  it("surfaces a 404 from the upstream team-detail feed without retrying", async () => {
    // 404 is a client error, so fetchFootballDataJson throws immediately rather
    // than backing off — keeping the mock fast and the retry path untriggered.
    jest.spyOn(global, "fetch").mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = String(input);
      if (url.includes("/matches")) {
        if (url.includes("status=FINISHED")) return Promise.resolve(jsonResponse(arsenalFinishedPayload()));
        if (url.includes("status=SCHEDULED")) return Promise.resolve(jsonResponse(arsenalScheduledPayload()));
      }
      if (url.includes("/teams/")) return Promise.resolve(jsonResponse({}, 404));
      throw new Error(`Unexpected fetch URL in test: ${url}`);
    });

    await expect(getPremierLeagueTeamSnapshot("57")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("throws when the API token is not configured", async () => {
    delete process.env.FOOTBALL_DATA_API_TOKEN;
    jest.spyOn(global, "fetch").mockResolvedValue(jsonResponse({}));

    await expect(getPremierLeagueTeamSnapshot("57")).rejects.toThrow(/not configured/i);
  });
});

function storedTeamSnapshot(clubId: number): PremierLeagueTeamSnapshot {
  const club = { id: String(clubId), name: `Club ${clubId}`, shortName: `Club ${clubId}`, tla: null, crest: null };
  return {
    team: null,
    recentFixtures: [
      {
        id: `stored-${clubId}`,
        utcDate: "2026-05-24T15:00:00Z",
        status: "FINISHED",
        matchday: 38,
        stage: "REGULAR_SEASON",
        homeTeam: club,
        awayTeam: { ...club, id: "1" },
        score: { winner: "HOME_TEAM", home: 2, away: 0 },
      },
    ],
    upcomingFixtures: [],
    form: { sequence: ["W"], wins: 1, draws: 0, losses: 0, points: 3, goalsFor: 2, goalsAgainst: 0 },
    generatedAt: "2026-05-29T10:13:00.000Z",
  };
}

function storedSnapshotRoot(clubIds: number[]): string {
  return writeStoredSnapshot("premierLeagueSnapshot.json", {
    teamSnapshots: Object.fromEntries(clubIds.map((id) => [String(id), storedTeamSnapshot(id)])),
  });
}

function rateLimitedResponse(headers: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ message: "You reached your request limit. Wait 60 seconds.", errorCode: 429 }),
    { status: 429, headers: { "content-type": "application/json;charset=UTF-8", ...headers } }
  );
}

describe("Premier League data on the free tier rate limit", () => {
  const ORIGINAL_TOKEN = process.env.FOOTBALL_DATA_API_TOKEN;
  const CLUB_IDS = CLUBS.map((club) => club.id);

  function tally(served: readonly ServedRequest[]) {
    return {
      requests: served.length,
      rateLimited: served.filter((request) => request.status === 429).length,
      busiestMinute: busiestMinute(served),
    };
  }

  beforeEach(() => {
    process.env.FOOTBALL_DATA_API_TOKEN = "test-token";
    jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask", "setImmediate"] });
    jest.setSystemTime(new Date("2026-09-01T12:00:00Z"));
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    if (ORIGINAL_TOKEN === undefined) {
      delete process.env.FOOTBALL_DATA_API_TOKEN;
    } else {
      process.env.FOOTBALL_DATA_API_TOKEN = ORIGINAL_TOKEN;
    }
  });

  it("refreshes every club in one full run without a 429", async () => {
    jest.spyOn(process, "cwd").mockReturnValue(storedSnapshotRoot([]));
    const api = createFootballDataApi({ code: "PL" });
    jest.spyOn(global, "fetch").mockImplementation(api.fetchMock);

    const snapshot = (await runOnFakeClock(buildPremierLeagueSnapshot())) as PremierLeagueSnapshot;

    expect(tally(api.served)).toEqual({ requests: 65, rateLimited: 0, busiestMinute: 8 });
    expect(Object.keys(snapshot.teamSnapshots)).toHaveLength(20);
  });

  it("re-pins a table with zero games played without bursting past the limit", async () => {
    jest.setSystemTime(new Date("2026-08-05T12:00:00Z"));
    jest.spyOn(process, "cwd").mockReturnValue(storedSnapshotRoot(CLUB_IDS));
    const api = createFootballDataApi({ code: "PL", seasonStarted: false });
    jest.spyOn(global, "fetch").mockImplementation(api.fetchMock);

    const snapshot = (await runOnFakeClock(buildPremierLeagueSnapshot())) as PremierLeagueSnapshot;

    expect(snapshot).not.toBeInstanceOf(Error);
    expect(tally(api.served)).toEqual({ requests: 66, rateLimited: 0, busiestMinute: 8 });
    expect(snapshot.summary.competition?.seasonLabel).toBe("2025/26");
    expect(sumPlayedGames(snapshot.summary.standings)).toBe(20 * 38);
  });

  it("keeps a club's stored results and form when the fresh list is empty", async () => {
    jest.setSystemTime(new Date("2026-08-05T12:00:00Z"));
    jest.spyOn(process, "cwd").mockReturnValue(storedSnapshotRoot(CLUB_IDS));
    const api = createFootballDataApi({ code: "PL", seasonStarted: false });
    jest.spyOn(global, "fetch").mockImplementation(api.fetchMock);

    const snapshot = (await runOnFakeClock(buildPremierLeagueSnapshot())) as PremierLeagueSnapshot;
    const club = snapshot.teamSnapshots["101"];

    expect(club.recentFixtures).toEqual(storedTeamSnapshot(101).recentFixtures);
    expect(club.form).toEqual(storedTeamSnapshot(101).form);
    // Everything else on the club is the fresh fetch.
    expect(club.team?.manager).toBe("Coach CAA");
    expect(club.upcomingFixtures).toHaveLength(4);
    expect(club.generatedAt).toBe(snapshot.summary.generatedAt);
  });

  it.each([
    ["the reset header", { "x-requests-available-minute": "0", "x-requestcounter-reset": "42" }, 43_000],
    ["Retry-After when the reset header is missing", { "retry-after": "30" }, 31_000],
    ["60 seconds when neither header is present", {}, 61_000],
    ["70 seconds at most", { "x-requestcounter-reset": "500" }, 70_000],
  ])("waits for %s after a 429 and then retries", async (_label, headers, expectedWaitMs) => {
    const api = createFootballDataApi({ code: "PL" });
    const attempts: number[] = [];
    jest.spyOn(global, "fetch").mockImplementation((input) => {
      attempts.push(Date.now());
      return attempts.length === 1
        ? Promise.resolve(rateLimitedResponse(headers))
        : api.fetchMock(input);
    });

    const snapshot = await runOnFakeClock(getPremierLeagueTeamSnapshot("101"));

    expect(snapshot).not.toBeInstanceOf(Error);
    expect(attempts[1] - attempts[0]).toBe(expectedWaitMs);
  });

  it("names the upstream status when the limit never clears", async () => {
    jest
      .spyOn(global, "fetch")
      .mockImplementation(() =>
        Promise.resolve(rateLimitedResponse({ "x-requests-available-minute": "0", "x-requestcounter-reset": "60" }))
      );

    const outcome = await runOnFakeClock(getPremierLeagueTeamSnapshot("101"));

    expect(outcome).toBeInstanceOf(Error);
    expect((outcome as Error).message).toBe(
      "Unable to load Premier League data from the upstream provider (HTTP 429)."
    );
  });

  it("holds the next request back when the API reports two or fewer left", async () => {
    const api = createFootballDataApi({ code: "PL" });
    const attempts: number[] = [];
    jest.spyOn(global, "fetch").mockImplementation(async (input) => {
      attempts.push(Date.now());
      const response = await api.fetchMock(input);
      if (attempts.length > 1) return response;
      // Another run on the same token has used most of this minute.
      const headers = new Headers(response.headers);
      headers.set("x-requests-available-minute", "2");
      headers.set("x-requestcounter-reset", "25");
      return new Response(response.body, { status: response.status, headers });
    });

    const snapshot = await runOnFakeClock(getPremierLeagueTeamSnapshot("101"));

    expect(snapshot).not.toBeInstanceOf(Error);
    expect(attempts[1] - attempts[0]).toBe(26_000);
    expect(api.served.filter((request) => request.status === 429)).toHaveLength(0);
  });

  it("drops a relegated club's snapshot only when the table is full", async () => {
    jest.spyOn(process, "cwd").mockReturnValue(storedSnapshotRoot([...CLUB_IDS, 999]));
    const full = createFootballDataApi({ code: "PL" });
    jest.spyOn(global, "fetch").mockImplementation(full.fetchMock);

    const pruned = (await runOnFakeClock(
      buildPremierLeagueSnapshot({ skipTeamSnapshots: true })
    )) as PremierLeagueSnapshot;

    expect(Object.keys(pruned.teamSnapshots)).toHaveLength(20);
    expect(pruned.teamSnapshots["999"]).toBeUndefined();

    resetFootballDataPacingForTests();
    const partial = createFootballDataApi({
      code: "PL",
      override: (path) => {
        if (!path.includes("/standings")) return undefined;
        const body = JSON.parse(JSON.stringify(standingsPayload()));
        body.standings[0].table = CLUBS.slice(0, 19).map((team, index) => ({
          position: index + 1,
          team,
          playedGames: 2,
          points: 3,
        }));
        return body;
      },
    });
    jest.spyOn(global, "fetch").mockImplementation(partial.fetchMock);

    const kept = (await runOnFakeClock(
      buildPremierLeagueSnapshot({ skipTeamSnapshots: true })
    )) as PremierLeagueSnapshot;

    expect(kept.summary.standings).toHaveLength(19);
    expect(Object.keys(kept.teamSnapshots)).toHaveLength(21);
    expect(kept.teamSnapshots["999"]).toBeDefined();
  });

  it("asks for finished matches once and slices the recent list locally", async () => {
    const api = createFootballDataApi({ code: "PL" });
    jest.spyOn(global, "fetch").mockImplementation(api.fetchMock);

    const summary = (await runOnFakeClock(getPremierLeagueSummary())) as PremierLeagueSummary;

    expect(api.served.filter((request) => request.path.includes("status=FINISHED"))).toHaveLength(1);
    expect(api.served).toHaveLength(5);
    // The API returned all 20 finished matches, and the newest 8 are matchday 2.
    expect(summary.recentFixtures).toHaveLength(8);
    expect(summary.recentFixtures.every((fixture) => fixture.matchday === 2)).toBe(true);
    expect(summary.goalsPerMatchday?.map((entry) => entry.matchday)).toEqual([1, 2]);
  });

  it("marks a fixture whose kickoff time is not confirmed yet", async () => {
    const api = createFootballDataApi({ code: "PL" });
    jest.spyOn(global, "fetch").mockImplementation(api.fetchMock);

    const snapshot = (await runOnFakeClock(
      getPremierLeagueTeamSnapshot("101")
    )) as PremierLeagueTeamSnapshot;

    expect(
      snapshot.upcomingFixtures.map(({ utcDate, status, startTimeTbd }) => ({ utcDate, status, startTimeTbd }))
    ).toEqual([
      { utcDate: "2026-09-12T12:30:00Z", status: "TIMED", startTimeTbd: undefined },
      { utcDate: "2026-09-19T00:00:00Z", status: "SCHEDULED", startTimeTbd: true },
    ]);
    expect(snapshot.recentFixtures.some((fixture) => fixture.startTimeTbd)).toBe(false);
  });
});
