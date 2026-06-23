/**
 * @jest-environment node
 */
import { getPremierLeagueSummary } from "../premierLeagueData";

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

    expect(typeof summary.generatedAt).toBe("string");
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
    // Falls back to the default season label when dates are absent.
    expect(summary.competition?.seasonLabel).toBe("Current season");
  });
});
