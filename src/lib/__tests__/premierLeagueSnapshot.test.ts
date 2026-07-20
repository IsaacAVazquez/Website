/**
 * @jest-environment node
 */
import { premierLeagueSnapshot } from "@/data/premierLeagueSnapshot";
import {
  getPremierLeagueSummary,
  resetPremierLeagueLiveSummaryCacheForTests,
} from "../premierLeagueSnapshot";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const ARSENAL = { id: 57, name: "Arsenal FC", shortName: "Arsenal", tla: "ARS", crest: null };
const CHELSEA = { id: 61, name: "Chelsea FC", shortName: "Chelsea", tla: "CHE", crest: null };

function liveStandingsPayload() {
  return {
    area: { name: "England" },
    competition: {
      code: "PL",
      name: "Premier League",
      emblem: null,
      area: { name: "England" },
    },
    season: {
      startDate: "2025-08-15",
      endDate: "2026-05-24",
      currentMatchday: 38,
      winner: null,
    },
    standings: [
      {
        type: "TOTAL",
        table: [
          { position: 1, playedGames: 38, won: 28, draw: 6, lost: 4, points: 90, goalsFor: 88, goalsAgainst: 30, goalDifference: 58, team: CHELSEA },
          { position: 2, playedGames: 38, won: 26, draw: 7, lost: 5, points: 85, goalsFor: 80, goalsAgainst: 32, goalDifference: 48, team: ARSENAL },
        ],
      },
    ],
  };
}

/**
 * Off-season placeholder: the season pointer has rolled forward but no games
 * are played, which must never replace the committed table.
 */
function rolledOverStandingsPayload() {
  return {
    area: { name: "England" },
    competition: { code: "PL", name: "Premier League", emblem: null, area: { name: "England" } },
    season: { startDate: "2026-08-21", endDate: "2027-05-30", currentMatchday: 1, winner: null },
    standings: [
      {
        type: "TOTAL",
        table: [
          { position: 1, playedGames: 0, won: 0, draw: 0, lost: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, team: ARSENAL },
          { position: 2, playedGames: 0, won: 0, draw: 0, lost: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, team: CHELSEA },
        ],
      },
    ],
  };
}

function liveFinishedPayload() {
  return {
    matches: [
      {
        id: 90001,
        utcDate: "2026-05-24T15:00:00Z",
        status: "FINISHED",
        matchday: 38,
        stage: "REGULAR_SEASON",
        homeTeam: ARSENAL,
        awayTeam: CHELSEA,
        score: { winner: "HOME_TEAM", fullTime: { home: 2, away: 1 } },
      },
    ],
  };
}

function liveScheduledPayload() {
  return {
    matches: [
      {
        id: 90002,
        utcDate: "2026-08-22T15:00:00Z",
        status: "SCHEDULED",
        matchday: 1,
        stage: "REGULAR_SEASON",
        homeTeam: CHELSEA,
        awayTeam: ARSENAL,
        score: { winner: null, fullTime: { home: null, away: null } },
      },
    ],
  };
}

function routeLiveFetch(url: string): Response {
  if (url.includes("/standings")) return jsonResponse(liveStandingsPayload());
  if (url.includes("/matches")) {
    if (url.includes("status=FINISHED")) return jsonResponse(liveFinishedPayload());
    if (url.includes("status=SCHEDULED")) return jsonResponse(liveScheduledPayload());
  }
  throw new Error(`Unexpected fetch URL in test: ${url}`);
}

describe("getPremierLeagueSummary accessor", () => {
  let previousToken: string | undefined;

  beforeAll(() => {
    previousToken = process.env.FOOTBALL_DATA_API_TOKEN;
  });

  beforeEach(() => {
    resetPremierLeagueLiveSummaryCacheForTests();
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

  describe("without a configured token", () => {
    beforeEach(() => {
      delete process.env.FOOTBALL_DATA_API_TOKEN;
    });

    it("returns the committed snapshot and never fetches, even with preferLive", async () => {
      const fetchSpy = jest.spyOn(global, "fetch");

      const committed = await getPremierLeagueSummary();
      const preferLive = await getPremierLeagueSummary({ preferLive: true });

      expect(fetchSpy).not.toHaveBeenCalled();
      // Byte-for-byte identical to the token-less default path.
      expect(JSON.stringify(preferLive)).toBe(JSON.stringify(committed));
      expect(preferLive.standings).toEqual(premierLeagueSnapshot.summary.standings);
    });

    it("treats a whitespace-only token as absent", async () => {
      process.env.FOOTBALL_DATA_API_TOKEN = "   ";
      const fetchSpy = jest.spyOn(global, "fetch");

      const summary = await getPremierLeagueSummary({ preferLive: true });

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(summary.standings).toEqual(premierLeagueSnapshot.summary.standings);
    });
  });

  describe("with a configured token", () => {
    beforeEach(() => {
      process.env.FOOTBALL_DATA_API_TOKEN = "test-token";
    });

    it("merges live standings and fixtures over the committed snapshot", async () => {
      const fetchSpy = jest
        .spyOn(global, "fetch")
        .mockImplementation((input: Parameters<typeof fetch>[0]) =>
          Promise.resolve(routeLiveFetch(String(input)))
        );

      const summary = await getPremierLeagueSummary({ preferLive: true });

      // Exactly three upstream requests: standings, finished, scheduled.
      expect(fetchSpy).toHaveBeenCalledTimes(3);
      const urls = fetchSpy.mock.calls.map((call) => String(call[0]));
      expect(urls.every((url) => url.includes("/competitions/PL/"))).toBe(true);

      // Live sections replace the committed values.
      expect(summary.standings.map((row) => row.team.id)).toEqual(["61", "57"]);
      expect(summary.standings[0].points).toBe(90);
      expect(summary.competition?.currentMatchday).toBe(38);
      expect(summary.recentFixtures.map((f) => f.id)).toEqual(["90001"]);
      expect(summary.upcomingFixtures.map((f) => f.id)).toEqual(["90002"]);

      // Untouched sections keep the committed snapshot values.
      expect(summary.scorers).toEqual(premierLeagueSnapshot.summary.scorers);
      expect(summary.teams).toEqual(premierLeagueSnapshot.summary.teams);
    });

    it("single-flights concurrent requests and re-fetches only after the TTL", async () => {
      let now = 1_800_000_000_000;
      jest.spyOn(Date, "now").mockImplementation(() => now);
      const fetchSpy = jest
        .spyOn(global, "fetch")
        .mockImplementation((input: Parameters<typeof fetch>[0]) =>
          Promise.resolve(routeLiveFetch(String(input)))
        );

      const [first, second] = await Promise.all([
        getPremierLeagueSummary({ preferLive: true }),
        getPremierLeagueSummary({ preferLive: true }),
      ]);

      // One flight (3 requests) serves both concurrent callers.
      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(second.standings).toEqual(first.standings);

      // Within the TTL the cache serves without fetching.
      await getPremierLeagueSummary({ preferLive: true });
      expect(fetchSpy).toHaveBeenCalledTimes(3);

      // Past the TTL a new flight runs.
      now += 5 * 60 * 1000 + 1;
      await getPremierLeagueSummary({ preferLive: true });
      expect(fetchSpy).toHaveBeenCalledTimes(6);
    });

    it("falls back to the committed snapshot on total failure without negative-caching", async () => {
      // 404 is a non-retried client error, so each section fails after one call.
      const fetchSpy = jest
        .spyOn(global, "fetch")
        .mockImplementation(() => Promise.resolve(jsonResponse({}, 404)));

      const committed = await getPremierLeagueSummary();
      const fallback = await getPremierLeagueSummary({ preferLive: true });

      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(JSON.stringify(fallback)).toBe(JSON.stringify(committed));

      // The failure was not cached: the next request retries the live path.
      fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) =>
        Promise.resolve(routeLiveFetch(String(input)))
      );
      const refreshed = await getPremierLeagueSummary({ preferLive: true });

      expect(fetchSpy).toHaveBeenCalledTimes(6);
      expect(refreshed.standings.map((row) => row.team.id)).toEqual(["61", "57"]);
    });

    it("keeps the committed section when a single section fails", async () => {
      jest.spyOn(global, "fetch").mockImplementation((input: Parameters<typeof fetch>[0]) => {
        const url = String(input);
        if (url.includes("/standings")) return Promise.resolve(jsonResponse({}, 404));
        return Promise.resolve(routeLiveFetch(url));
      });

      const summary = await getPremierLeagueSummary({ preferLive: true });

      expect(summary.standings).toEqual(premierLeagueSnapshot.summary.standings);
      expect(summary.recentFixtures.map((f) => f.id)).toEqual(["90001"]);
      expect(summary.upcomingFixtures.map((f) => f.id)).toEqual(["90002"]);
    });

    it("keeps the committed table when live standings are a zeroed rolled-over placeholder", async () => {
      jest.spyOn(global, "fetch").mockImplementation((input: Parameters<typeof fetch>[0]) => {
        const url = String(input);
        if (url.includes("/standings")) {
          return Promise.resolve(jsonResponse(rolledOverStandingsPayload()));
        }
        return Promise.resolve(routeLiveFetch(url));
      });

      const summary = await getPremierLeagueSummary({ preferLive: true });

      expect(summary.standings).toEqual(premierLeagueSnapshot.summary.standings);
      expect(summary.competition).toEqual(premierLeagueSnapshot.summary.competition);
      expect(summary.recentFixtures.map((f) => f.id)).toEqual(["90001"]);
    });
  });
});
