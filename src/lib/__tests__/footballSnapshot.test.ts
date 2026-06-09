import type {
  PremierLeagueFixture,
  PremierLeagueTeamSnapshot,
} from "@/types/premier-league";
import type { LaLigaFixture, LaLigaTeamSnapshot } from "@/types/la-liga";

const PL_TEAM_ID = "57";
const LA_LIGA_TEAM_ID = "fcb";

const SUMMARY_FIXTURE_LIMIT = 8;
const TEAM_FIXTURE_LIMIT = 5;
const OVERSIZED_FIXTURE_COUNT = 20;

function buildPlFixture(index: number): PremierLeagueFixture {
  return {
    id: String(1000 + index),
    matchday: 30,
    stage: "REGULAR_SEASON",
    status: "TIMED",
    utcDate: `2026-01-${String((index % 28) + 1).padStart(2, "0")}T15:00:00Z`,
    homeTeam: {
      id: "1",
      name: "Home FC",
      shortName: "Home",
      tla: "HOM",
      crest: "https://example.com/home.png",
    },
    awayTeam: {
      id: "2",
      name: "Away FC",
      shortName: "Away",
      tla: "AWY",
      crest: "https://example.com/away.png",
    },
    score: { home: null, away: null, winner: null },
  };
}

function buildLaLigaFixture(index: number): LaLigaFixture {
  return {
    id: String(2000 + index),
    matchday: 30,
    stage: "REGULAR_SEASON",
    status: "TIMED",
    utcDate: `2026-01-${String((index % 28) + 1).padStart(2, "0")}T19:00:00Z`,
    homeTeam: {
      id: "94",
      name: "Villarreal CF",
      shortName: "Villarreal",
      tla: "VIL",
      crest: "https://example.com/villarreal.png",
    },
    awayTeam: {
      id: "81",
      name: "FC Barcelona",
      shortName: "Barcelona",
      tla: "FCB",
      crest: "https://example.com/barca.png",
    },
    score: { home: null, away: null, winner: null },
  };
}

const oversizedPlFixtures = Array.from({ length: OVERSIZED_FIXTURE_COUNT }, (_, i) =>
  buildPlFixture(i)
);
const oversizedLaLigaFixtures = Array.from({ length: OVERSIZED_FIXTURE_COUNT }, (_, i) =>
  buildLaLigaFixture(i)
);

const plTeamSnapshot: PremierLeagueTeamSnapshot = {
  team: {
    id: PL_TEAM_ID,
    name: "Arsenal FC",
    shortName: "Arsenal",
    tla: "ARS",
    crest: "https://example.com/arsenal.png",
    venue: null,
    founded: null,
    clubColors: null,
    website: null,
    address: null,
  },
  recentFixtures: oversizedPlFixtures,
  upcomingFixtures: oversizedPlFixtures,
  form: {
    sequence: [],
    wins: 0,
    draws: 0,
    losses: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  },
  generatedAt: "2026-01-01T00:00:00Z",
};

const laLigaTeamSnapshot: LaLigaTeamSnapshot = {
  team: {
    id: "81",
    name: "FC Barcelona",
    shortName: "Barcelona",
    tla: "FCB",
    crest: "https://example.com/barca.png",
    venue: null,
    founded: null,
    clubColors: null,
  },
  recentFixtures: oversizedLaLigaFixtures,
  upcomingFixtures: oversizedLaLigaFixtures,
  form: {
    sequence: [],
    wins: 0,
    draws: 0,
    losses: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  },
  generatedAt: "2026-01-01T00:00:00Z",
};

jest.mock("@/data/premierLeagueSnapshot", () => ({
  premierLeagueSnapshot: {
    sourceLabel: "test",
    sourceUrls: { provider: "", standings: "", fixtures: "", teams: "" },
    summary: {
      competition: null,
      standings: [],
      recentFixtures: oversizedPlFixtures,
      upcomingFixtures: oversizedPlFixtures,
      teams: [],
      scorers: [],
      generatedAt: "2026-01-01T00:00:00Z",
    },
    teamSnapshots: { [PL_TEAM_ID]: plTeamSnapshot },
  },
}));

jest.mock("@/data/laLigaSnapshot", () => ({
  laLigaSnapshot: {
    season: "2025-26",
    matchday: 30,
    updatedAt: "2026-01-01T00:00:00Z",
    sourceLabel: "test",
    sourceUrls: { standings: "", scorers: "", assists: "" },
    clubs: [],
    scorers: [],
    assists: [],
    recentFixtures: oversizedLaLigaFixtures,
    upcomingFixtures: oversizedLaLigaFixtures,
    teams: [],
    teamSnapshots: { [LA_LIGA_TEAM_ID]: laLigaTeamSnapshot },
  },
}));

describe("football snapshot helpers", () => {
  it("caps the league summary fixture payloads for Premier League and La Liga", async () => {
    const { getPremierLeagueSummary } = await import("@/lib/premierLeagueSnapshot");
    const { getLaLigaSummarySnapshot } = await import("@/lib/laLigaSnapshot");

    const [premierLeagueSummary, laLigaSummary] = await Promise.all([
      getPremierLeagueSummary(),
      getLaLigaSummarySnapshot(),
    ]);

    expect(premierLeagueSummary.recentFixtures).toHaveLength(SUMMARY_FIXTURE_LIMIT);
    expect(premierLeagueSummary.upcomingFixtures).toHaveLength(SUMMARY_FIXTURE_LIMIT);
    expect(laLigaSummary.recentFixtures).toHaveLength(SUMMARY_FIXTURE_LIMIT);
    expect(laLigaSummary.upcomingFixtures).toHaveLength(SUMMARY_FIXTURE_LIMIT);
  });

  it("caps team drilldown fixtures to the recent five matches", async () => {
    const { getPremierLeagueTeamSnapshot } = await import("@/lib/premierLeagueSnapshot");
    const { getLaLigaTeamSnapshot } = await import("@/lib/laLigaSnapshot");

    const [premierLeagueTeamResult, laLigaTeamResult] = await Promise.all([
      getPremierLeagueTeamSnapshot(PL_TEAM_ID),
      getLaLigaTeamSnapshot(LA_LIGA_TEAM_ID),
    ]);

    expect(premierLeagueTeamResult.recentFixtures).toHaveLength(TEAM_FIXTURE_LIMIT);
    expect(premierLeagueTeamResult.upcomingFixtures).toHaveLength(TEAM_FIXTURE_LIMIT);
    expect(laLigaTeamResult.recentFixtures).toHaveLength(TEAM_FIXTURE_LIMIT);
    expect(laLigaTeamResult.upcomingFixtures).toHaveLength(TEAM_FIXTURE_LIMIT);
  });
});
