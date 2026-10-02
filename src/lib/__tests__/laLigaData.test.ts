/**
 * @jest-environment node
 */
import {
  buildLaLigaSnapshot,
  getLaLigaSummary,
  getLaLigaTeamSnapshot,
  isValidLaLigaTeamId,
} from "../laLigaData";
import { resetFootballDataPacingForTests } from "../footballData";
import type { LaLigaSnapshot, LaLigaTeamSnapshot } from "@/types/la-liga";
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

/**
 * The season object has advanced to a not-yet-started future season, but the
 * standings table still holds last season's completed data (the La Liga
 * rollover quirk observed live). Un-pinned scorers/matches come back empty
 * upstream. A future start date is the signal that the season hasn't begun.
 */
function rolledOverStandingsPayload() {
  return {
    competition: { code: "PD", name: "Primera Division" },
    season: { startDate: "2099-08-16", endDate: "2100-05-30", currentMatchday: 1 },
    standings: [
      {
        type: "TOTAL",
        table: [
          { position: 1, team: BARCA, points: 94, playedGames: 38, won: 30, draw: 4, lost: 4, goalsFor: 100, goalsAgainst: 30, goalDifference: 70 },
          { position: 2, team: MADRID, points: 84, playedGames: 38, won: 26, draw: 6, lost: 6, goalsFor: 90, goalsAgainst: 40, goalDifference: 50 },
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

    // Assists board: re-sorted from the same /scorers response by assists
    // descending (Mbappé has 5 assists vs. Lewandowski's 3), not hardcoded
    // to []. The malformed (empty-name) entry is excluded.
    expect(summary.assists).toHaveLength(2);
    expect(summary.assists[0]).toMatchObject({
      rank: 1,
      name: "Kylian Mbappé",
      clubId: "rma",
      clubCode: "RMA",
      total: 5,
    });
    expect(summary.assists[1]).toMatchObject({
      rank: 2,
      name: "Robert Lewandowski",
      total: 3,
    });

    // Club accent color is resolved from the src/data/clubColors.ts lookup by TLA.
    expect(barca?.accentColor).toBe("#A50044");

    // Goals-per-matchday aggregates the full-season FINISHED-matches fetch
    // (a separate, unlimited call from the 8-most-recent `recentRes`),
    // grouped by matchday and summed. The malformed match (missing awayTeam,
    // no matchday) contributes nothing.
    expect(summary.goalsPerMatchday).toEqual([
      { matchday: 11, totalGoals: 4 },
      { matchday: 12, totalGoals: 4 },
    ]);

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

  it("re-pins to the completed prior season when the season has not started (future start date)", async () => {
    // Un-pinned requests describe the rolled-over future season (stale table,
    // empty scorers/matches); requests pinned to a season return the real
    // completed data.
    jest.spyOn(global, "fetch").mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      const pinned = url.includes("season=");
      if (url.includes("/standings")) {
        return Promise.resolve(jsonResponse(pinned ? standingsPayload() : rolledOverStandingsPayload()));
      }
      if (url.includes("/scorers")) return Promise.resolve(jsonResponse(pinned ? scorersPayload() : { scorers: [] }));
      if (url.includes("/teams")) return Promise.resolve(jsonResponse(teamsPayload()));
      if (url.includes("/matches")) {
        if (url.includes("status=FINISHED")) return Promise.resolve(jsonResponse(pinned ? finishedMatchesPayload() : { matches: [] }));
        if (url.includes("status=SCHEDULED")) return Promise.resolve(jsonResponse({ matches: [] }));
      }
      throw new Error(`Unexpected fetch URL in test: ${url}`);
    });

    const summary = await getLaLigaSummary();

    // Without the fix, this surfaces the rolled-over future label + matchday 1
    // + empty scorers. After re-pinning it shows the completed 2025/26 season.
    expect(summary.season).toBe("2025/26");
    expect(summary.matchday).toBe(12);
    expect(summary.clubs.length).toBeGreaterThan(0);
    expect(summary.scorers.length).toBeGreaterThan(0);
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
    expect(summary.assists).toEqual([]);
    expect(summary.goalsPerMatchday).toEqual([]);
    expect(summary.recentFixtures).toEqual([]);
    expect(summary.upcomingFixtures).toEqual([]);
    expect(summary.teams).toEqual([]);
    // No season dates -> fallback label, and matchday defaults to 0.
    expect(summary.season).toBe("Current season");
    expect(summary.matchday).toBe(0);
  });
});

// --- Team snapshot fixture builders ---------------------------------------

/**
 * The team-detail endpoint (`/teams/{id}`) returns the club object directly
 * (not wrapped in `{ team }`), and carries the extra profile fields — founded,
 * clubColors, and coach.name — that the list/fixture endpoints omit.
 */
function teamDetailPayload() {
  return {
    id: 81,
    name: "FC Barcelona",
    shortName: "Barça",
    tla: "FCB",
    crest: "https://crests.example/FCB.png",
    venue: "Spotify Camp Nou",
    founded: 1899,
    clubColors: "Blue / Garnet",
    website: "https://www.fcbarcelona.com",
    coach: { name: "Hansi Flick" },
  };
}

function teamFinishedMatchesPayload() {
  return {
    matches: [
      // Barça win at home (HOME_TEAM winner).
      {
        id: 3001,
        utcDate: "2026-01-10T20:00:00Z",
        status: "FINISHED",
        matchday: 20,
        stage: "REGULAR_SEASON",
        homeTeam: BARCA,
        awayTeam: ATLETI,
        score: { winner: "HOME_TEAM", fullTime: { home: 3, away: 1 } },
      },
      // Barça draw away.
      {
        id: 3002,
        utcDate: "2026-01-17T18:30:00Z",
        status: "FINISHED",
        matchday: 21,
        stage: "REGULAR_SEASON",
        homeTeam: MADRID,
        awayTeam: BARCA,
        score: { winner: "DRAW", fullTime: { home: 2, away: 2 } },
      },
      // Barça loss at home (AWAY_TEAM winner) — newest, sorts first.
      {
        id: 3003,
        utcDate: "2026-01-24T21:00:00Z",
        status: "FINISHED",
        matchday: 22,
        stage: "REGULAR_SEASON",
        homeTeam: BARCA,
        awayTeam: MADRID,
        score: { winner: "AWAY_TEAM", fullTime: { home: 0, away: 2 } },
      },
      // Malformed: missing utcDate -> normalizeFixture returns null, dropped.
      {
        id: 3004,
        status: "FINISHED",
        matchday: 19,
        homeTeam: BARCA,
        awayTeam: ATLETI,
        score: { winner: "HOME_TEAM", fullTime: { home: 1, away: 0 } },
      },
    ],
  };
}

function teamScheduledMatchesPayload() {
  return {
    matches: [
      {
        id: 4002,
        utcDate: "2026-02-07T20:00:00Z",
        status: "SCHEDULED",
        matchday: 24,
        homeTeam: BARCA,
        awayTeam: ATLETI,
        score: { winner: null, fullTime: { home: null, away: null } },
      },
      {
        id: 4001,
        utcDate: "2026-02-01T16:15:00Z",
        status: "SCHEDULED",
        matchday: 23,
        homeTeam: MADRID,
        awayTeam: BARCA,
        score: { winner: null, fullTime: { home: null, away: null } },
      },
    ],
  };
}

/**
 * Routes the three `getLaLigaTeamSnapshot` requests. The team-detail URL
 * (`/teams/{id}`) and the fixtures URLs (`/teams/{id}/matches?...`) both
 * contain `/teams/`, so `/matches` is matched first.
 */
function routeTeamFetch(detailPayload: unknown) {
  return (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/matches")) {
      if (url.includes("status=FINISHED")) {
        return Promise.resolve(jsonResponse(teamFinishedMatchesPayload()));
      }
      if (url.includes("status=SCHEDULED")) {
        return Promise.resolve(jsonResponse(teamScheduledMatchesPayload()));
      }
    }
    if (url.includes("/teams/")) return Promise.resolve(jsonResponse(detailPayload));
    throw new Error(`Unexpected fetch URL in test: ${url}`);
  };
}

describe("getLaLigaTeamSnapshot", () => {
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

  it("normalizes the team profile, splits fixtures, and derives form", async () => {
    jest
      .spyOn(global, "fetch")
      .mockImplementation((input: RequestInfo | URL) => routeTeamFetch(teamDetailPayload())(input));

    const snapshot = await getLaLigaTeamSnapshot("81");

    // Profile carries the extra team-detail fields (founded, clubColors,
    // manager) plus the venue and TLA-resolved accent color.
    expect(snapshot.team).toMatchObject({
      id: "81",
      name: "FC Barcelona",
      shortName: "Barça",
      tla: "FCB",
      crest: "https://crests.example/FCB.png",
      venue: "Spotify Camp Nou",
      accentColor: "#A50044",
      founded: 1899,
      clubColors: "Blue / Garnet",
      manager: "Hansi Flick",
    });

    // Recent fixtures newest-first, capped at 5; the malformed (no utcDate)
    // match is dropped.
    expect(snapshot.recentFixtures.map((f) => f.id)).toEqual(["3003", "3002", "3001"]);
    // Upcoming fixtures soonest-first.
    expect(snapshot.upcomingFixtures.map((f) => f.id)).toEqual(["4001", "4002"]);

    // Form derived over the newest-first recent fixtures: loss (0-2 at home),
    // draw (2-2 away), win (3-1 at home) — exercising all three branches.
    expect(snapshot.form).toEqual({
      sequence: ["L", "D", "W"],
      wins: 1,
      draws: 1,
      losses: 1,
      points: 4,
      goalsFor: 5,
      goalsAgainst: 5,
    });

    expect(typeof snapshot.generatedAt).toBe("string");
    expect(Number.isNaN(Date.parse(snapshot.generatedAt))).toBe(false);
  });

  it("falls back on missing profile fields and handles empty fixtures", async () => {
    // Minimal detail: no shortName (falls back to name), crest via crestUrl,
    // no venue/founded/clubColors/coach (all null).
    const detail = {
      id: 78,
      name: "Club Atlético de Madrid",
      tla: "ATM",
      crestUrl: "https://crests.example/ATM-alt.png",
    };
    jest.spyOn(global, "fetch").mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/matches")) return Promise.resolve(jsonResponse({ matches: [] }));
      if (url.includes("/teams/")) return Promise.resolve(jsonResponse(detail));
      throw new Error(`Unexpected fetch URL in test: ${url}`);
    });

    const snapshot = await getLaLigaTeamSnapshot("78");

    expect(snapshot.team).toMatchObject({
      id: "78",
      name: "Club Atlético de Madrid",
      shortName: "Club Atlético de Madrid", // no shortName -> name
      tla: "ATM",
      crest: "https://crests.example/ATM-alt.png", // crest -> crestUrl fallback
      venue: null,
      accentColor: "#CB3524",
      founded: null,
      clubColors: null,
      manager: null,
    });
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
  });

  it("rejects an invalid team id before hitting the network", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    await expect(getLaLigaTeamSnapshot("bad-id")).rejects.toMatchObject({ status: 400 });
    await expect(getLaLigaTeamSnapshot("0")).rejects.toMatchObject({ status: 400 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("surfaces a 404 from the upstream team-detail feed", async () => {
    // 404 is a 4xx, so fetchFootballDataJson throws immediately with no retry
    // backoff — keeps the test fast.
    jest.spyOn(global, "fetch").mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/matches")) return Promise.resolve(jsonResponse({ matches: [] }));
      if (url.includes("/teams/")) return Promise.resolve(jsonResponse({}, 404));
      throw new Error(`Unexpected fetch URL in test: ${url}`);
    });

    await expect(getLaLigaTeamSnapshot("81")).rejects.toMatchObject({ status: 404 });
  });
});

describe("isValidLaLigaTeamId", () => {
  it("accepts positive-integer ids and rejects everything else", () => {
    expect(isValidLaLigaTeamId("81")).toBe(true);
    expect(isValidLaLigaTeamId("1")).toBe(true);
    expect(isValidLaLigaTeamId("100")).toBe(true);
    expect(isValidLaLigaTeamId("0")).toBe(false); // zero
    expect(isValidLaLigaTeamId("01")).toBe(false); // leading zero
    expect(isValidLaLigaTeamId("")).toBe(false);
    expect(isValidLaLigaTeamId("12a")).toBe(false);
    expect(isValidLaLigaTeamId("abc")).toBe(false);
    expect(isValidLaLigaTeamId("-5")).toBe(false);
    expect(isValidLaLigaTeamId(" 81")).toBe(false); // leading space
  });
});

function storedTeamSnapshot(clubKey: string): LaLigaTeamSnapshot {
  const club = { id: clubKey, name: `Club ${clubKey}`, shortName: `Club ${clubKey}`, tla: null, crest: null };
  return {
    team: null,
    recentFixtures: [
      {
        id: `stored-${clubKey}`,
        utcDate: "2026-05-24T19:00:00Z",
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
    generatedAt: "2026-05-29T10:29:00.000Z",
  };
}

function storedSnapshotRoot(clubKeys: string[]): string {
  return writeStoredSnapshot("laLigaSnapshot.json", {
    teamSnapshots: Object.fromEntries(clubKeys.map((key) => [key, storedTeamSnapshot(key)])),
  });
}

describe("La Liga data on the free tier rate limit", () => {
  const ORIGINAL_TOKEN = process.env.FOOTBALL_DATA_API_TOKEN;
  const CLUB_KEYS = CLUBS.map((club) => club.tla.toLowerCase());

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
    const api = createFootballDataApi({ code: "PD" });
    jest.spyOn(global, "fetch").mockImplementation(api.fetchMock);

    const snapshot = (await runOnFakeClock(buildLaLigaSnapshot())) as LaLigaSnapshot;

    expect(tally(api.served)).toEqual({ requests: 65, rateLimited: 0, busiestMinute: 8 });
    expect(Object.keys(snapshot.teamSnapshots)).toHaveLength(20);
  });

  it("re-pins a table with zero games played without bursting past the limit", async () => {
    jest.setSystemTime(new Date("2026-08-05T12:00:00Z"));
    jest.spyOn(process, "cwd").mockReturnValue(storedSnapshotRoot(CLUB_KEYS));
    const api = createFootballDataApi({ code: "PD", seasonStarted: false });
    jest.spyOn(global, "fetch").mockImplementation(api.fetchMock);

    const snapshot = (await runOnFakeClock(buildLaLigaSnapshot())) as LaLigaSnapshot;

    expect(snapshot).not.toBeInstanceOf(Error);
    expect(tally(api.served)).toEqual({ requests: 66, rateLimited: 0, busiestMinute: 8 });
    expect(snapshot.season).toBe("2025/26");
    expect(snapshot.clubs.every((club) => club.played === 38)).toBe(true);
  });

  it("keeps a club's stored results and form when the fresh list is empty", async () => {
    jest.setSystemTime(new Date("2026-08-05T12:00:00Z"));
    jest.spyOn(process, "cwd").mockReturnValue(storedSnapshotRoot(CLUB_KEYS));
    const api = createFootballDataApi({ code: "PD", seasonStarted: false });
    jest.spyOn(global, "fetch").mockImplementation(api.fetchMock);

    const snapshot = (await runOnFakeClock(buildLaLigaSnapshot())) as LaLigaSnapshot;
    const club = snapshot.teamSnapshots.caa;

    expect(club.recentFixtures).toEqual(storedTeamSnapshot("caa").recentFixtures);
    expect(club.form).toEqual(storedTeamSnapshot("caa").form);
    // Everything else on the club is the fresh fetch.
    expect(club.team?.manager).toBe("Coach CAA");
    expect(club.upcomingFixtures).toHaveLength(4);
    expect(club.generatedAt).toBe(snapshot.generatedAt);
  });

  it("waits for the reset header after a 429, retries, and names the status if it never clears", async () => {
    const limited = () =>
      new Response(
        JSON.stringify({ message: "You reached your request limit. Wait 42 seconds.", errorCode: 429 }),
        {
          status: 429,
          headers: {
            "content-type": "application/json;charset=UTF-8",
            "x-requests-available-minute": "0",
            "x-requestcounter-reset": "42",
          },
        }
      );
    const api = createFootballDataApi({ code: "PD" });
    const attempts: number[] = [];
    jest.spyOn(global, "fetch").mockImplementation((input) => {
      attempts.push(Date.now());
      return attempts.length === 1 ? Promise.resolve(limited()) : api.fetchMock(input);
    });

    const snapshot = await runOnFakeClock(getLaLigaTeamSnapshot("101"));

    expect(snapshot).not.toBeInstanceOf(Error);
    expect(attempts[1] - attempts[0]).toBe(43_000);

    resetFootballDataPacingForTests();
    jest.spyOn(global, "fetch").mockImplementation(() => Promise.resolve(limited()));

    const outcome = await runOnFakeClock(getLaLigaTeamSnapshot("101"));

    expect((outcome as Error).message).toBe(
      "Unable to load La Liga data from the upstream provider (HTTP 429)."
    );
  });

  it("drops a relegated club's snapshot only when the table is full", async () => {
    jest.spyOn(process, "cwd").mockReturnValue(storedSnapshotRoot([...CLUB_KEYS, "gir"]));
    const full = createFootballDataApi({ code: "PD" });
    jest.spyOn(global, "fetch").mockImplementation(full.fetchMock);

    const pruned = (await runOnFakeClock(
      buildLaLigaSnapshot({ skipTeamSnapshots: true })
    )) as LaLigaSnapshot;

    expect(Object.keys(pruned.teamSnapshots)).toHaveLength(20);
    expect(pruned.teamSnapshots.gir).toBeUndefined();

    resetFootballDataPacingForTests();
    const partial = createFootballDataApi({
      code: "PD",
      override: (path) => {
        if (!path.includes("/standings")) return undefined;
        const body = JSON.parse(JSON.stringify(standingsPayload()));
        body.standings = [
          {
            type: "TOTAL",
            table: CLUBS.slice(0, 19).map((team, index) => ({
              position: index + 1,
              team,
              playedGames: 2,
              points: 3,
            })),
          },
        ];
        return body;
      },
    });
    jest.spyOn(global, "fetch").mockImplementation(partial.fetchMock);

    const kept = (await runOnFakeClock(
      buildLaLigaSnapshot({ skipTeamSnapshots: true })
    )) as LaLigaSnapshot;

    expect(kept.clubs).toHaveLength(19);
    expect(Object.keys(kept.teamSnapshots)).toHaveLength(21);
    expect(kept.teamSnapshots.gir).toBeDefined();
  });

  it("asks for finished matches once and slices the recent list locally", async () => {
    const api = createFootballDataApi({ code: "PD" });
    jest.spyOn(global, "fetch").mockImplementation(api.fetchMock);

    const summary = (await runOnFakeClock(getLaLigaSummary())) as Awaited<
      ReturnType<typeof getLaLigaSummary>
    >;

    expect(api.served.filter((request) => request.path.includes("status=FINISHED"))).toHaveLength(1);
    expect(api.served).toHaveLength(5);
    // The API returned all 20 finished matches, and the newest 8 are matchday 2.
    expect(summary.recentFixtures).toHaveLength(8);
    expect(summary.recentFixtures.every((fixture) => fixture.matchday === 2)).toBe(true);
    expect(summary.goalsPerMatchday.map((entry) => entry.matchday)).toEqual([1, 2]);
  });

  it("marks a fixture whose kickoff time is not confirmed yet", async () => {
    const api = createFootballDataApi({ code: "PD" });
    jest.spyOn(global, "fetch").mockImplementation(api.fetchMock);

    const snapshot = (await runOnFakeClock(getLaLigaTeamSnapshot("101"))) as LaLigaTeamSnapshot;

    expect(
      snapshot.upcomingFixtures.map(({ utcDate, status, startTimeTbd }) => ({ utcDate, status, startTimeTbd }))
    ).toEqual([
      { utcDate: "2026-09-12T12:30:00Z", status: "TIMED", startTimeTbd: undefined },
      { utcDate: "2026-09-19T00:00:00Z", status: "SCHEDULED", startTimeTbd: true },
    ]);
    expect(snapshot.recentFixtures.some((fixture) => fixture.startTimeTbd)).toBe(false);
  });
});
