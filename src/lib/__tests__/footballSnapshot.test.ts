import {
  getPremierLeagueSummary,
  getPremierLeagueTeamSnapshot,
} from "@/lib/premierLeagueSnapshot";
import {
  getLaLigaSummarySnapshot,
  getLaLigaTeamSnapshot,
} from "@/lib/laLigaSnapshot";

describe("football snapshot helpers", () => {
  it("caps the league summary fixture payloads for Premier League and La Liga", async () => {
    const [premierLeagueSummary, laLigaSummary] = await Promise.all([
      getPremierLeagueSummary(),
      getLaLigaSummarySnapshot(),
    ]);

    expect(premierLeagueSummary.recentFixtures).toHaveLength(8);
    expect(premierLeagueSummary.upcomingFixtures).toHaveLength(8);
    expect(laLigaSummary.recentFixtures).toHaveLength(8);
    expect(laLigaSummary.upcomingFixtures).toHaveLength(8);
  });

  it("caps team drilldown fixtures to the recent five matches", async () => {
    const [premierLeagueTeamSnapshot, laLigaTeamSnapshot] = await Promise.all([
      getPremierLeagueTeamSnapshot("57"),
      getLaLigaTeamSnapshot("fcb"),
    ]);

    expect(premierLeagueTeamSnapshot.recentFixtures.length).toBeLessThanOrEqual(5);
    expect(premierLeagueTeamSnapshot.upcomingFixtures.length).toBeLessThanOrEqual(5);
    expect(laLigaTeamSnapshot.recentFixtures.length).toBeLessThanOrEqual(5);
    expect(laLigaTeamSnapshot.upcomingFixtures.length).toBeLessThanOrEqual(5);
    expect(premierLeagueTeamSnapshot.recentFixtures.length).toBeGreaterThan(0);
    expect(premierLeagueTeamSnapshot.upcomingFixtures.length).toBeGreaterThan(0);
    expect(laLigaTeamSnapshot.recentFixtures.length).toBeGreaterThan(0);
    expect(laLigaTeamSnapshot.upcomingFixtures.length).toBeGreaterThan(0);
  });
});
