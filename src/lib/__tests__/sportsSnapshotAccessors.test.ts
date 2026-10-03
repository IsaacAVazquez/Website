/**
 * @jest-environment node
 */
/**
 * Accessors over the committed sports and trending snapshots. Each data module
 * is mocked with a small fixture so the tests can hold more fixtures than the
 * caps allow, omit fields older snapshots lacked, and plant entries a route
 * must not serve.
 */
function mockFixtures(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => ({ id: `${prefix}-${index + 1}` }));
}

function mockTeam(name: string) {
  return {
    team: { id: name, name },
    recentFixtures: mockFixtures(`${name}-recent`, 7),
    upcomingFixtures: mockFixtures(`${name}-upcoming`, 6),
    form: { sequence: ["W"] },
    generatedAt: "2026-09-01T00:00:00.000Z",
  };
}

jest.mock("@/data/nbaSnapshot", () => ({
  nbaSnapshot: {
    updatedAt: "2026-09-01",
    recentFixtures: mockFixtures("nba-recent", 14),
    upcomingFixtures: mockFixtures("nba-upcoming", 3),
    teamSnapshots: { lal: mockTeam("lal"), bos: null },
  },
}));

jest.mock("@/data/nflSnapshot", () => ({
  nflSnapshot: {
    updatedAt: "2026-09-02",
    recentFixtures: mockFixtures("nfl-recent", 9),
    upcomingFixtures: mockFixtures("nfl-upcoming", 12),
    teamSnapshots: { kc: mockTeam("kc") },
  },
}));

jest.mock("@/data/worldCupSnapshot", () => ({
  worldCupSnapshot: {
    updatedAt: "2026-07-19",
    recentFixtures: mockFixtures("wc-recent", 20),
    upcomingFixtures: mockFixtures("wc-upcoming", 2),
    teamSnapshots: { "united-states": { ...mockTeam("united-states"), standing: null } },
  },
}));

jest.mock("@/data/laLigaSnapshot", () => ({
  laLigaSnapshot: {
    updatedAt: "2026-05-24",
    recentFixtures: mockFixtures("liga-recent", 11),
    upcomingFixtures: mockFixtures("liga-upcoming", 9),
    // assists and goalsPerMatchday are absent, as in snapshots written before them.
    teamSnapshots: { rma: mockTeam("rma"), "86": mockTeam("86") },
  },
}));

jest.mock("@/data/premierLeagueSnapshot", () => ({
  premierLeagueSnapshot: {
    summary: {
      updatedAt: "2026-05-24",
      recentFixtures: mockFixtures("pl-recent", 10),
      upcomingFixtures: mockFixtures("pl-upcoming", 4),
    },
    teamSnapshots: { "57": mockTeam("57") },
  },
}));

jest.mock("@/data/golfSnapshot", () => ({
  golfSnapshot: {
    summary: { tournament: { name: "Test Open" }, leaderboard: [] },
    playerSnapshots: {
      "scottie-scheffler": { player: { id: "scottie-scheffler", name: "Scottie Scheffler" } },
    },
  },
}));

jest.mock("@/data/githubTrendingSnapshot", () => ({
  githubTrendingSnapshot: {
    generatedAt: "2026-09-30T00:00:00.000Z",
    sourceLabel: "GitHub search",
    repositories: [
      {
        fullName: "acme/rocket",
        stars: 1200,
        language: "TypeScript",
        nodeId: "R_123",
        homepageUrl: "https://acme.dev",
        watchers: 40,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-09-29T00:00:00Z",
        starHistory: [1, 2, 3],
      },
    ],
  },
}));

import { HttpStatusError } from "@/lib/utils";
import {
  createEmptyNbaTeamSnapshot,
  getNbaSummarySnapshot,
  getNbaTeamSnapshot,
  isNbaTeamIdShape,
  isValidNbaTeamId,
} from "../nbaSnapshot";
import {
  createEmptyNflTeamSnapshot,
  getNflSummarySnapshot,
  getNflTeamSnapshot,
  isNflTeamIdShape,
  isValidNflTeamId,
} from "../nflSnapshot";
import {
  createEmptyWorldCupTeamSnapshot,
  getWorldCupSummarySnapshot,
  getWorldCupTeamSnapshot,
  isValidWorldCupTeamId,
  isWorldCupTeamIdShape,
} from "../worldCupSnapshot";
import {
  createEmptyLaLigaTeamSnapshot,
  getLaLigaSummarySnapshot,
  getLaLigaTeamSnapshot,
  isLaLigaTeamIdShape,
  isValidLaLigaTeamId,
} from "../laLigaSnapshot";
import {
  createEmptyPremierLeagueTeamSnapshot,
  getPremierLeagueSummary,
  getPremierLeagueTeamSnapshot,
  isPremierLeagueTeamIdShape,
  isValidPremierLeagueTeamId,
} from "../premierLeagueSnapshot";
import {
  createEmptyGolfPlayerSnapshot,
  getGolfPlayerSnapshot,
  getGolfSummary,
  isGolfPlayerIdShape,
  isValidGolfPlayerId,
} from "../golfSnapshot";
import { getGitHubTrendingClientSnapshot } from "../githubTrendingSnapshot";

function ids(list: Array<{ id: string }>): string[] {
  return list.map((item) => item.id);
}

function expectFreshTimestamp(generatedAt: string) {
  expect(Number.isNaN(Date.parse(generatedAt))).toBe(false);
}

const previousToken = process.env.FOOTBALL_DATA_API_TOKEN;

beforeAll(() => {
  // Without a token the football accessors serve the committed snapshot only.
  delete process.env.FOOTBALL_DATA_API_TOKEN;
});

afterAll(() => {
  if (previousToken === undefined) delete process.env.FOOTBALL_DATA_API_TOKEN;
  else process.env.FOOTBALL_DATA_API_TOKEN = previousToken;
});

describe("NBA snapshot accessors", () => {
  it("returns a summary without team snapshots and caps fixtures at ten", async () => {
    const summary = await getNbaSummarySnapshot();
    expect("teamSnapshots" in summary).toBe(false);
    expect(summary.recentFixtures).toHaveLength(10);
    expect(ids(summary.upcomingFixtures as unknown as Array<{ id: string }>)).toEqual([
      "nba-upcoming-1",
      "nba-upcoming-2",
      "nba-upcoming-3",
    ]);
  });

  it("caps a team's fixtures at five and 404s unknown, null, or prototype ids", async () => {
    const team = await getNbaTeamSnapshot("lal");
    expect(team.recentFixtures).toHaveLength(5);
    expect(team.upcomingFixtures).toHaveLength(5);

    await expect(getNbaTeamSnapshot("nyk")).rejects.toMatchObject({ status: 404 });
    await expect(getNbaTeamSnapshot("bos")).rejects.toBeInstanceOf(HttpStatusError);
    await expect(getNbaTeamSnapshot("constructor")).rejects.toMatchObject({
      status: 404,
      message: "NBA team snapshot was not found.",
    });
  });

  it("checks id shape before membership", () => {
    expect(isNbaTeamIdShape("LAL")).toBe(true);
    expect(isNbaTeamIdShape("l")).toBe(false);
    expect(isNbaTeamIdShape("lal!")).toBe(false);
    expect(isValidNbaTeamId("lal")).toBe(true);
    expect(isValidNbaTeamId("nyk")).toBe(false);
    expect(isValidNbaTeamId("lakers")).toBe(false);
  });

  it("builds an empty team snapshot for the unavailable state", () => {
    const empty = createEmptyNbaTeamSnapshot();
    expect(empty).toMatchObject({
      team: null,
      recentFixtures: [],
      upcomingFixtures: [],
      form: { sequence: [], wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 },
    });
    expectFreshTimestamp(empty.generatedAt);
  });
});

describe("NFL snapshot accessors", () => {
  it("caps the summary at eight fixtures per list", async () => {
    const summary = await getNflSummarySnapshot();
    expect("teamSnapshots" in summary).toBe(false);
    expect(summary.recentFixtures).toHaveLength(8);
    expect(summary.upcomingFixtures).toHaveLength(8);
  });

  it("serves a capped team snapshot and 404s an unknown team", async () => {
    const team = await getNflTeamSnapshot("kc");
    expect(team.recentFixtures).toHaveLength(5);
    await expect(getNflTeamSnapshot("buf")).rejects.toMatchObject({
      status: 404,
      message: "NFL team snapshot was not found.",
    });
  });

  it("accepts letters only for team ids", () => {
    expect(isNflTeamIdShape("kc")).toBe(true);
    expect(isNflTeamIdShape("k1")).toBe(false);
    expect(isNflTeamIdShape("kansas")).toBe(false);
    expect(isValidNflTeamId("kc")).toBe(true);
    expect(isValidNflTeamId("buf")).toBe(false);
  });

  it("builds an empty team snapshot with ties tracked", () => {
    const empty = createEmptyNflTeamSnapshot();
    expect(empty.team).toBeNull();
    expect(empty.form).toEqual({
      sequence: [],
      wins: 0,
      ties: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    });
    expectFreshTimestamp(empty.generatedAt);
  });
});

describe("World Cup snapshot accessors", () => {
  it("caps the summary at twelve fixtures per list", async () => {
    const summary = await getWorldCupSummarySnapshot();
    expect("teamSnapshots" in summary).toBe(false);
    expect(summary.recentFixtures).toHaveLength(12);
    expect(summary.upcomingFixtures).toHaveLength(2);
  });

  it("serves a slugged team and refuses prototype keys", async () => {
    const team = await getWorldCupTeamSnapshot("united-states");
    expect(team.upcomingFixtures).toHaveLength(5);

    expect(isValidWorldCupTeamId("united-states")).toBe(true);
    expect(isValidWorldCupTeamId("constructor")).toBe(false);
    expect(isValidWorldCupTeamId("brazil")).toBe(false);
    await expect(getWorldCupTeamSnapshot("toString")).rejects.toMatchObject({ status: 404 });
  });

  it("accepts URL slugs up to 64 characters", () => {
    expect(isWorldCupTeamIdShape("south-korea")).toBe(true);
    expect(isWorldCupTeamIdShape("-leading-dash")).toBe(false);
    expect(isWorldCupTeamIdShape("trailing-dash-")).toBe(false);
    expect(isWorldCupTeamIdShape("a".repeat(64))).toBe(true);
    expect(isWorldCupTeamIdShape("a".repeat(65))).toBe(false);
  });

  it("builds an empty team snapshot with no standing", () => {
    const empty = createEmptyWorldCupTeamSnapshot();
    expect(empty).toMatchObject({ team: null, standing: null, recentFixtures: [] });
    expect(empty.form.goalsAgainst).toBe(0);
    expectFreshTimestamp(empty.generatedAt);
  });
});

describe("La Liga snapshot accessors", () => {
  it("defaults the lists older snapshots lacked and caps fixtures at eight", async () => {
    const summary = await getLaLigaSummarySnapshot();
    expect(summary.assists).toEqual([]);
    expect(summary.goalsPerMatchday).toEqual([]);
    expect(summary.recentFixtures).toHaveLength(8);
    expect(summary.upcomingFixtures).toHaveLength(8);
    expect("teamSnapshots" in summary).toBe(false);
  });

  it("looks teams up by TLA or numeric id and 404s unknown ones", async () => {
    expect((await getLaLigaTeamSnapshot("rma")).recentFixtures).toHaveLength(5);
    expect((await getLaLigaTeamSnapshot("86")).team).toMatchObject({ id: "86" });
    await expect(getLaLigaTeamSnapshot("fcb")).rejects.toMatchObject({
      status: 404,
      message: "La Liga team snapshot was not found.",
    });
  });

  it("checks TLA and numeric id shapes", () => {
    expect(isLaLigaTeamIdShape("RMA")).toBe(true);
    expect(isLaLigaTeamIdShape("86")).toBe(true);
    expect(isLaLigaTeamIdShape("0")).toBe(false);
    expect(isLaLigaTeamIdShape("real-madrid")).toBe(false);
    expect(isValidLaLigaTeamId("rma")).toBe(true);
    expect(isValidLaLigaTeamId("fcb")).toBe(false);
  });

  it("builds an empty team snapshot", () => {
    const empty = createEmptyLaLigaTeamSnapshot();
    expect(empty).toMatchObject({ team: null, upcomingFixtures: [] });
    expect(empty.form).toEqual({
      sequence: [],
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    });
    expectFreshTimestamp(empty.generatedAt);
  });
});

describe("Premier League snapshot accessors", () => {
  it("defaults goals per matchday and caps fixtures at eight", async () => {
    const summary = await getPremierLeagueSummary();
    expect(summary.goalsPerMatchday).toEqual([]);
    expect(summary.recentFixtures).toHaveLength(8);
    expect(summary.upcomingFixtures).toHaveLength(4);
  });

  it("serves a capped team snapshot and 404s an unknown club", async () => {
    expect((await getPremierLeagueTeamSnapshot("57")).upcomingFixtures).toHaveLength(5);
    await expect(getPremierLeagueTeamSnapshot("61")).rejects.toMatchObject({
      status: 404,
      message: "Premier League team snapshot was not found.",
    });
  });

  it("accepts positive integer ids only", () => {
    expect(isPremierLeagueTeamIdShape("57")).toBe(true);
    expect(isPremierLeagueTeamIdShape("057")).toBe(false);
    expect(isPremierLeagueTeamIdShape("ars")).toBe(false);
    expect(isPremierLeagueTeamIdShape("123456")).toBe(false);
    expect(isValidPremierLeagueTeamId("57")).toBe(true);
    expect(isValidPremierLeagueTeamId("61")).toBe(false);
  });

  it("builds an empty team snapshot", () => {
    const empty = createEmptyPremierLeagueTeamSnapshot();
    expect(empty).toMatchObject({ team: null, recentFixtures: [], form: { points: 0 } });
    expectFreshTimestamp(empty.generatedAt);
  });
});

describe("golf snapshot accessors", () => {
  it("returns the committed summary", async () => {
    await expect(getGolfSummary()).resolves.toEqual({
      tournament: { name: "Test Open" },
      leaderboard: [],
    });
  });

  it("serves a known player and 404s unknown or prototype ids", async () => {
    await expect(getGolfPlayerSnapshot("scottie-scheffler")).resolves.toMatchObject({
      player: { name: "Scottie Scheffler" },
    });
    await expect(getGolfPlayerSnapshot("rory-mcilroy")).rejects.toMatchObject({
      status: 404,
      message: "Golf player snapshot was not found.",
    });
    await expect(getGolfPlayerSnapshot("constructor")).rejects.toBeInstanceOf(HttpStatusError);
  });

  it("checks slug shape before membership", () => {
    expect(isGolfPlayerIdShape("scottie-scheffler")).toBe(true);
    expect(isGolfPlayerIdShape("scottie scheffler")).toBe(false);
    expect(isGolfPlayerIdShape("a".repeat(65))).toBe(false);
    expect(isValidGolfPlayerId("scottie-scheffler")).toBe(true);
    expect(isValidGolfPlayerId("constructor")).toBe(false);
    expect(isValidGolfPlayerId("../etc")).toBe(false);
  });

  it("builds an empty player snapshot for the unavailable state", () => {
    const empty = createEmptyGolfPlayerSnapshot();
    expect(empty.player).toBeNull();
    expect(empty.tournamentStatus).toMatchObject({
      status: "Snapshot unavailable",
      totalToPar: 0,
      nextTeeTime: null,
    });
    expect(empty.roundByRound).toEqual([]);
    expect(empty.scoring).toEqual({ birdies: 0, bogeys: 0, pars: 0, eagles: 0, doubleBogeys: 0 });
    expectFreshTimestamp(empty.generatedAt);
  });
});

describe("GitHub trending client snapshot", () => {
  it("strips build bookkeeping from each repository and keeps the rest", async () => {
    const snapshot = await getGitHubTrendingClientSnapshot();
    expect(snapshot.generatedAt).toBe("2026-09-30T00:00:00.000Z");
    expect(snapshot.repositories).toEqual([
      { fullName: "acme/rocket", stars: 1200, language: "TypeScript" },
    ]);
  });
});
