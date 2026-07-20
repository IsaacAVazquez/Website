/**
 * @jest-environment node
 */
jest.mock("@/data/mlbSnapshot", () => ({
  mlbSnapshot: {
    season: "2026",
    updatedAt: "2026-07-19",
    sourceLabel: "MLB Stats API",
    sourceUrls: { standings: "standings", schedule: "schedule", leaders: "leaders" },
    teams: [],
    standings: [],
    recentGames: [],
    upcomingGames: [],
    hittingLeaders: { homeRuns: [], runsBattedIn: [], battingAverage: [] },
    pitchingLeaders: { earnedRunAverage: [], wins: [], strikeouts: [] },
    teamSnapshots: {},
  },
}));

jest.mock("@/lib/mlbData", () => ({
  buildMlbLiveSummaryData: jest.fn(),
}));

import { getMlbSummarySnapshot, resetMlbLiveCacheForTests } from "../mlbSnapshot";
import { buildMlbLiveSummaryData } from "@/lib/mlbData";
import type { MlbSummarySnapshot } from "@/types/mlb";

const mockBuildLive = buildMlbLiveSummaryData as jest.MockedFunction<
  typeof buildMlbLiveSummaryData
>;

function liveSummaryFixture(): MlbSummarySnapshot {
  return {
    season: "2026",
    updatedAt: "2026-07-20",
    sourceLabel: "MLB Stats API",
    sourceUrls: { standings: "standings", schedule: "schedule", leaders: "leaders" },
    teams: [],
    standings: [],
    recentGames: [
      {
        id: "776001",
        utcDate: "2026-07-19T23:10:00Z",
        status: "FINISHED",
        matchday: null,
        stage: "R",
        homeTeam: {
          id: "147",
          name: "New York Yankees",
          shortName: "Yankees",
          abbreviation: "NYY",
          crest: null,
        },
        awayTeam: {
          id: "111",
          name: "Boston Red Sox",
          shortName: "Red Sox",
          abbreviation: "BOS",
          crest: null,
        },
        score: { winner: "HOME_TEAM", home: 5, away: 2 },
      },
    ],
    upcomingGames: [],
    hittingLeaders: { homeRuns: [], runsBattedIn: [], battingAverage: [] },
    pitchingLeaders: { earnedRunAverage: [], wins: [], strikeouts: [] },
  };
}

describe("getMlbSummarySnapshot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMlbLiveCacheForTests();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the committed summary without calling the live builder by default", async () => {
    const summary = await getMlbSummarySnapshot();

    expect(summary.updatedAt).toBe("2026-07-19");
    expect("teamSnapshots" in summary).toBe(false);
    expect(mockBuildLive).not.toHaveBeenCalled();
  });

  it("serves the live summary from the TTL cache on repeat calls", async () => {
    jest.useFakeTimers();
    mockBuildLive.mockResolvedValue(liveSummaryFixture());

    const first = await getMlbSummarySnapshot({ preferLive: true });
    jest.advanceTimersByTime(59_000);
    const second = await getMlbSummarySnapshot({ preferLive: true });

    expect(first.updatedAt).toBe("2026-07-20");
    expect(second).toBe(first);
    expect(mockBuildLive).toHaveBeenCalledTimes(1);
    // The builder receives the committed summary (minus team snapshots) as
    // its fallback seed.
    const fallbackArg = mockBuildLive.mock.calls[0][0];
    expect(fallbackArg.updatedAt).toBe("2026-07-19");
    expect("teamSnapshots" in fallbackArg).toBe(false);
  });

  it("rebuilds the live summary after the TTL expires", async () => {
    jest.useFakeTimers();
    mockBuildLive.mockResolvedValue(liveSummaryFixture());

    await getMlbSummarySnapshot({ preferLive: true });
    jest.advanceTimersByTime(60_001);
    await getMlbSummarySnapshot({ preferLive: true });

    expect(mockBuildLive).toHaveBeenCalledTimes(2);
  });

  it("coalesces concurrent live requests into a single in-flight build", async () => {
    let resolveBuild: (summary: MlbSummarySnapshot) => void = () => undefined;
    mockBuildLive.mockImplementation(
      () =>
        new Promise<MlbSummarySnapshot>((resolve) => {
          resolveBuild = resolve;
        })
    );

    const firstPromise = getMlbSummarySnapshot({ preferLive: true });
    const secondPromise = getMlbSummarySnapshot({ preferLive: true });
    resolveBuild(liveSummaryFixture());
    const [first, second] = await Promise.all([firstPromise, secondPromise]);

    expect(mockBuildLive).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
    expect(first.updatedAt).toBe("2026-07-20");
  });

  it("falls back to the committed summary on failure without caching the failure", async () => {
    mockBuildLive.mockRejectedValueOnce(new Error("statsapi unavailable"));

    const fallback = await getMlbSummarySnapshot({ preferLive: true });
    expect(fallback.updatedAt).toBe("2026-07-19");

    // The failure must not be cached: the next call retries the live build.
    mockBuildLive.mockResolvedValueOnce(liveSummaryFixture());
    const live = await getMlbSummarySnapshot({ preferLive: true });

    expect(live.updatedAt).toBe("2026-07-20");
    expect(mockBuildLive).toHaveBeenCalledTimes(2);
  });
});
