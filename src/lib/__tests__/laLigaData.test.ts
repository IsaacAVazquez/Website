/**
 * @jest-environment node
 */
import { getLaLigaSummary } from "../laLigaData";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

interface TeamFixture {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest?: string;
  venue?: string;
}

function makeTeam(t: TeamFixture) {
  return {
    id: t.id,
    name: t.name,
    shortName: t.shortName,
    tla: t.tla,
    crest: t.crest ?? `https://crests.example/${t.tla}.png`,
    venue: t.venue ?? `${t.shortName} Stadium`,
  };
}

const BARCA = makeTeam({ id: 81, name: "FC Barcelona", shortName: "Barça", tla: "FCB" });
const MADRID = makeTeam({ id: 86, name: "Real Madrid CF", shortName: "Real Madrid", tla: "RMA" });
const ATLETI = makeTeam({ id: 78, name: "Club Atlético de Madrid", shortName: "Atléti", tla: "ATM" });

function standingsPayload() {
  return {
    competition: { code: "PD", name: "Primera Division" },
    season: {
      startDate: "2025-08-15",
      endDate: "2026-05-24",
      currentMatchday: 12,
    },
    standings: [
      {
        type: "HOME",
        table: [
          { position: 1, team: MADRID, points: 99, playedGames: 6 },
        ],
      },
      {
        type: "TOTAL",
        table: [
          {
            position: 2,
            team: MADRID,
            points: 30,
            playedGames: 12,
            won: 9,
            draw: 3,
            lost: 0,
            goalsFor: 28,
            goalsAgainst: 8,
            goalDifference: 20,
          },
          {
            position: 1,
            team: BARCA,
            points: 31,
            playedGames: 12,
            won: 10,
            draw: 1,
            lost: 1,
            goalsFor: 34,
            goalsAgainst: 12,
            goalDifference: 22,
          },
          {
            position: 3,
            team: ATLETI,
            points: 25,
            playedGames: 12,
            won: 7,
            draw: 4,
            lost: 1,
            goalsFor: 22,
            goalsAgainst: 11,
            goalDifference: 11,
          },
          // Malformed row: no position -> filtered out.
          { team: BARCA, points: 5 },
        ],
      },
    ],
  };
}

function finishedMatchesPayload() {
  return {
    matches: [
      {
        id: 1001,
        utcDate: "2026-01-10T20:00:00Z",
        status: "FINISHED",
        matchday: 11,
        stage: "REGULAR_SEASON",
        homeTeam: BARCA,
        awayTeam: ATLETI,
        score: { winner: "HOME_TEAM", fullTime: { home: 3, away: 1 } },
      },
      {
        id: 1002,
        utcDate: "2026-01-17T18:30:00Z",
        status: "FINISHED",
        matchday: 12,
        stage: "REGULAR_SEASON",
        homeTeam: MADRID,
        awayTeam: BARCA,
        score: { winner: "DRAW", fullTime: { home: 2, away: 2 } },
      },
      // Malformed: missing awayTeam -> filtered out.
      {
        id: 1003,
        utcDate: "2026-01-05T18:30:00Z",
        status: "FINISHED",
        homeTeam: MADRID,
        score: { winner: "HOME_TEAM", fullTime: { home: 1, away: 0 } },
      },
    ],
  };
}

function scheduledMatchesPayload() {
  return {
    matches: [
      {
        id: 2002,
        utcDate: "2026-02-01T20:00:00Z",
        status: "SCHEDULED",
        matchday: 14,
        homeTeam: ATLETI,
        awayTeam: MADRID,
        score: { winner: null, fullTime: { home: null, away: null } },
      },
      {
        id: 2001,
        utcDate: "2026-01-25T16:15:00Z",
        status: "SCHEDULED",
        matchday: 13,
        homeTeam: BARCA,
        awayTeam: MADRID,
        score: { winner: null, fullTime: { home: null, away: null } },
      },
    ],
  };
}

function teamsPayload() {
  return {
    teams: [
      MADRID, // "Real Madrid"
      BARCA, // "Barça"
      ATLETI, // "Atléti"
    ],
  };
}

function scorersPayload() {
  return {
    scorers: [
      { player: { name: "Robert Lewandowski" }, team: BARCA, goals: 14, assists: 3, playedMatches: 12 },
      { player: { name: "Kylian Mbappé" }, team: MADRID, goals: 13, assists: 5, playedMatches: 11 },
      // Malformed: no player name -> filtered out.
      { player: { name: "" }, team: ATLETI, goals: 9, assists: 2, playedMatches: 10 },
    ],
  };
}

/**
 * Routes a football-data.org request URL to the right fixture payload.
 */
function routeFetch(url: string) {
  if (url.includes("/standings")) return jsonResponse(standingsPayload());
  if (url.includes("/scorers")) return jsonResponse(scorersPayload());
  if (url.includes("/teams")) return jsonResponse(teamsPayload());
  if (url.includes("/matches")) {
    if (url.includes("status=FINISHED")) return jsonResponse(finishedMatchesPayload());
    if (url.includes("status=SCHEDULED")) return jsonResponse(scheduledMatchesPayload());
  }
  throw new Error(`Unexpected fetch URL in test: ${url}`);
}

describe("getLaLigaSummary", () => {
  const ORIGINAL_TOKEN = process.env.FOOTBALL_DATA_API_TOKEN;

  beforeEach(() => {
    process.env.FOOTBALL_DATA_API_TOKEN = "test-token";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (ORIGINAL_TOKEN === undefined) {
      delete process.env.FOOTBALL_DATA_API_TOKEN;
    } else {
      process.env.FOOTBALL_DATA_API_TOKEN = ORIGINAL_TOKEN;
    }
  });

  it("parses standings, scorers, fixtures, and teams from the football-data.org feeds", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockImplementation((input: RequestInfo | URL) =>
        Promise.resolve(routeFetch(String(input)))
      );

    const summary = await getLaLigaSummary();

    // Season label derived from start/end years; matchday from currentMatchday.
    expect(summary.season).toBe("2025/26");
    expect(summary.matchday).toBe(12);

    // The TOTAL standings group is chosen (not the HOME group), and the
    // malformed (no-position) row is dropped. Source order is preserved.
    expect(summary.clubs).toHaveLength(3);
    expect(summary.clubs.map((c) => c.position)).toEqual([2, 1, 3]);

    const barca = summary.clubs.find((c) => c.code === "FCB");
    expect(barca).toBeDefined();
    expect(barca).toMatchObject({
      id: "fcb",
      code: "FCB",
      name: "FC Barcelona",
      shortName: "Barça",
      position: 1,
      points: 31,
      played: 12,
      won: 10,
      drawn: 1,
      lost: 1,
      goalsFor: 34,
      goalsAgainst: 12,
      goalDifference: 22,
    });

    // Scorers: ranked in order, malformed (empty name) entry filtered out.
    expect(summary.scorers).toHaveLength(2);
    expect(summary.scorers[0]).toMatchObject({
      rank: 1,
      name: "Robert Lewandowski",
      clubId: "fcb",
      clubCode: "FCB",
      total: 14,
      appearances: 12,
    });
    expect(summary.scorers[0].perMatch).toBeCloseTo(14 / 12);
    expect(summary.scorers[1].name).toBe("Kylian Mbappé");

    // Recent fixtures sorted newest-first; malformed (no awayTeam) one dropped.
    expect(summary.recentFixtures.map((f) => f.id)).toEqual(["1002", "1001"]);
    const clasico = summary.recentFixtures[0];
    expect(clasico.homeTeam.tla).toBe("RMA");
    expect(clasico.awayTeam.tla).toBe("FCB");
    expect(clasico.score).toEqual({ winner: "DRAW", home: 2, away: 2 });
    expect(clasico.status).toBe("FINISHED");

    // Upcoming fixtures sorted soonest-first.
    expect(summary.upcomingFixtures.map((f) => f.id)).toEqual(["2001", "2002"]);

    // Teams sorted by shortName via localeCompare.
    expect(summary.teams.map((t) => t.shortName)).toEqual([
      "Atléti",
      "Barça",
      "Real Madrid",
    ]);
    expect(summary.teams[0]).toMatchObject({ id: "78", tla: "ATM" });

    // generatedAt is an ISO string (don't assert exact value — non-deterministic).
    expect(typeof summary.generatedAt).toBe("string");
    expect(Number.isNaN(Date.parse(summary.generatedAt))).toBe(false);

    // Every request carries the auth token header.
    expect(fetchSpy).toHaveBeenCalled();
    const firstCallInit = fetchSpy.mock.calls[0][1] as RequestInit;
    expect((firstCallInit.headers as Record<string, string>)["X-Auth-Token"]).toBe(
      "test-token"
    );
  });

  it("throws when the API token is not configured", async () => {
    delete process.env.FOOTBALL_DATA_API_TOKEN;
    const fetchSpy = jest.spyOn(global, "fetch");

    await expect(getLaLigaSummary()).rejects.toThrow(/not configured/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns empty collections when every feed is empty", async () => {
    jest.spyOn(global, "fetch").mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/standings")) {
        return Promise.resolve(
          jsonResponse({ season: {}, standings: [] })
        );
      }
      // matches, teams, scorers all empty.
      return Promise.resolve(jsonResponse({ matches: [], teams: [], scorers: [] }));
    });

    const summary = await getLaLigaSummary();

    expect(summary.clubs).toEqual([]);
    expect(summary.scorers).toEqual([]);
    expect(summary.recentFixtures).toEqual([]);
    expect(summary.upcomingFixtures).toEqual([]);
    expect(summary.teams).toEqual([]);
    // No season dates -> fallback label, and matchday defaults to 0.
    expect(summary.season).toBe("Current season");
    expect(summary.matchday).toBe(0);
  });
});
