/**
 * @jest-environment node
 */
import { laLigaSnapshot } from "@/data/laLigaSnapshot";
import {
  getLaLigaSummarySnapshot,
  resetLaLigaLiveSummaryCacheForTests,
} from "../laLigaSnapshot";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const REAL_MADRID = { id: 86, name: "Real Madrid CF", shortName: "Real Madrid", tla: "RMA", crest: null };
const BARCELONA = { id: 81, name: "FC Barcelona", shortName: "Barcelona", tla: "FCB", crest: null };

function liveStandingsPayload() {
  return {
    competition: { code: "PD", name: "Primera Division" },
    season: { startDate: "2025-08-15", endDate: "2026-05-24", currentMatchday: 38 },
    standings: [
      {
        type: "TOTAL",
        table: [
          { position: 1, playedGames: 38, won: 29, draw: 5, lost: 4, points: 92, goalsFor: 95, goalsAgainst: 28, goalDifference: 67, team: BARCELONA },
          { position: 2, playedGames: 38, won: 27, draw: 7, lost: 4, points: 88, goalsFor: 84, goalsAgainst: 30, goalDifference: 54, team: REAL_MADRID },
        ],
      },
    ],
  };
}

function liveFinishedPayload() {
  return {
    matches: [
      {
        id: 80001,
        utcDate: "2026-05-24T19:00:00Z",
        status: "FINISHED",
        matchday: 38,
        stage: "REGULAR_SEASON",
        homeTeam: BARCELONA,
        awayTeam: REAL_MADRID,
        score: { winner: "DRAW", fullTime: { home: 2, away: 2 } },
      },
    ],
  };
}

function liveScheduledPayload() {
  return {
    matches: [
      {
        id: 80002,
        utcDate: "2026-08-23T19:00:00Z",
        status: "SCHEDULED",
        matchday: 1,
        stage: "REGULAR_SEASON",
        homeTeam: REAL_MADRID,
        awayTeam: BARCELONA,
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

describe("getLaLigaSummarySnapshot accessor", () => {
  let previousToken: string | undefined;

  beforeAll(() => {
    previousToken = process.env.FOOTBALL_DATA_API_TOKEN;
  });

  beforeEach(() => {
    resetLaLigaLiveSummaryCacheForTests();
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

      const committed = await getLaLigaSummarySnapshot();
      const preferLive = await getLaLigaSummarySnapshot({ preferLive: true });

      expect(fetchSpy).not.toHaveBeenCalled();
      // Byte-for-byte identical to the token-less default path.
      expect(JSON.stringify(preferLive)).toBe(JSON.stringify(committed));
      expect(preferLive.clubs).toEqual(laLigaSnapshot.clubs);
      expect(preferLive.updatedAt).toBe(laLigaSnapshot.updatedAt);
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

      const summary = await getLaLigaSummarySnapshot({ preferLive: true });

      // Exactly three upstream requests: standings, finished, scheduled.
      expect(fetchSpy).toHaveBeenCalledTimes(3);
      const urls = fetchSpy.mock.calls.map((call) => String(call[0]));
      expect(urls.every((url) => url.includes("/competitions/PD/"))).toBe(true);

      // Live sections replace the committed values.
      expect(summary.clubs.map((club) => club.code)).toEqual(["FCB", "RMA"]);
      expect(summary.clubs[0].points).toBe(92);
      expect(summary.matchday).toBe(38);
      expect(summary.season).toBe("2025/26");
      expect(summary.recentFixtures.map((f) => f.id)).toEqual(["80001"]);
      expect(summary.upcomingFixtures.map((f) => f.id)).toEqual(["80002"]);

      // Untouched sections keep the committed snapshot values.
      expect(summary.scorers).toEqual(laLigaSnapshot.scorers);
      expect(summary.teams).toEqual(laLigaSnapshot.teams);
      expect(summary.sourceLabel).toBe(laLigaSnapshot.sourceLabel);
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
        getLaLigaSummarySnapshot({ preferLive: true }),
        getLaLigaSummarySnapshot({ preferLive: true }),
      ]);

      // One flight (3 requests) serves both concurrent callers.
      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(second.clubs).toEqual(first.clubs);

      // Within the TTL the cache serves without fetching.
      await getLaLigaSummarySnapshot({ preferLive: true });
      expect(fetchSpy).toHaveBeenCalledTimes(3);

      // Past the TTL a new flight runs.
      now += 5 * 60 * 1000 + 1;
      await getLaLigaSummarySnapshot({ preferLive: true });
      expect(fetchSpy).toHaveBeenCalledTimes(6);
    });

    it("falls back to the committed snapshot on total failure without negative-caching", async () => {
      // 404 is a non-retried client error, so each section fails after one call.
      const fetchSpy = jest
        .spyOn(global, "fetch")
        .mockImplementation(() => Promise.resolve(jsonResponse({}, 404)));

      const committed = await getLaLigaSummarySnapshot();
      const fallback = await getLaLigaSummarySnapshot({ preferLive: true });

      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(JSON.stringify(fallback)).toBe(JSON.stringify(committed));

      // The failure was not cached: the next request retries the live path.
      fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) =>
        Promise.resolve(routeLiveFetch(String(input)))
      );
      const refreshed = await getLaLigaSummarySnapshot({ preferLive: true });

      expect(fetchSpy).toHaveBeenCalledTimes(6);
      expect(refreshed.clubs.map((club) => club.code)).toEqual(["FCB", "RMA"]);
    });

    it("keeps the committed section when a single section fails", async () => {
      jest.spyOn(global, "fetch").mockImplementation((input: Parameters<typeof fetch>[0]) => {
        const url = String(input);
        if (url.includes("/standings")) return Promise.resolve(jsonResponse({}, 404));
        return Promise.resolve(routeLiveFetch(url));
      });

      const summary = await getLaLigaSummarySnapshot({ preferLive: true });

      expect(summary.clubs).toEqual(laLigaSnapshot.clubs);
      expect(summary.matchday).toBe(laLigaSnapshot.matchday);
      expect(summary.recentFixtures.map((f) => f.id)).toEqual(["80001"]);
      expect(summary.upcomingFixtures.map((f) => f.id)).toEqual(["80002"]);
    });
  });
});
