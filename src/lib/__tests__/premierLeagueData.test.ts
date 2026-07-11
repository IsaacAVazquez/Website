/**
 * @jest-environment node
 */
import {
  getPremierLeagueSummary,
  getPremierLeagueTeamSnapshot,
  isValidPremierLeagueTeamId,
  createEmptyPremierLeagueSummary,
  createEmptyPremierLeagueTeamSnapshot,
  sumPlayedGames,
} from "../premierLeagueData";

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

describe("isValidPremierLeagueTeamId", () => {
  it("accepts positive integer id strings", () => {
    expect(isValidPremierLeagueTeamId("57")).toBe(true);
    expect(isValidPremierLeagueTeamId("1")).toBe(true);
    expect(isValidPremierLeagueTeamId("64")).toBe(true);
    expect(isValidPremierLeagueTeamId("1000")).toBe(true);
  });

  it("rejects zero, leading zeros, non-numeric, and empty ids", () => {
    expect(isValidPremierLeagueTeamId("0")).toBe(false);
    expect(isValidPremierLeagueTeamId("01")).toBe(false);
    expect(isValidPremierLeagueTeamId("abc")).toBe(false);
    expect(isValidPremierLeagueTeamId("")).toBe(false);
    expect(isValidPremierLeagueTeamId("-5")).toBe(false);
    expect(isValidPremierLeagueTeamId("1.5")).toBe(false);
    expect(isValidPremierLeagueTeamId("57a")).toBe(false);
    expect(isValidPremierLeagueTeamId(" 57")).toBe(false);
  });
});

describe("createEmptyPremierLeagueSummary", () => {
  it("returns an all-empty summary with a valid generatedAt timestamp", () => {
    const summary = createEmptyPremierLeagueSummary();

    expect(summary.competition).toBeNull();
    expect(summary.standings).toEqual([]);
    expect(summary.scorers).toEqual([]);
    expect(summary.recentFixtures).toEqual([]);
    expect(summary.upcomingFixtures).toEqual([]);
    expect(summary.teams).toEqual([]);
    expect(summary.goalsPerMatchday).toEqual([]);
    expect(typeof summary.generatedAt).toBe("string");
    expect(() => new Date(summary.generatedAt).toISOString()).not.toThrow();
  });
});

describe("createEmptyPremierLeagueTeamSnapshot", () => {
  it("returns a null-team snapshot with a zeroed default form", () => {
    const snapshot = createEmptyPremierLeagueTeamSnapshot();

    expect(snapshot.team).toBeNull();
    expect(snapshot.recentFixtures).toEqual([]);
    expect(snapshot.upcomingFixtures).toEqual([]);
    expect(snapshot.form).toEqual({
      sequence: [],
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    });
    expect(typeof snapshot.generatedAt).toBe("string");
    expect(() => new Date(snapshot.generatedAt).toISOString()).not.toThrow();
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
