import type { ScorePoolsSnapshot } from "../src/types/scorePools";

const MAX_LIVE_LEAGUE_AGE_MS = 8 * 60 * 60 * 1000;

export interface ScorePoolsQualityResult {
  leagues: number;
  fixtures: number;
  odds: number;
  liveLeagues: number;
  liveFixtures: number;
  liveOdds: number;
  issues: string[];
}

export function assessScorePoolsSnapshotQuality(
  snapshot: ScorePoolsSnapshot,
  now = new Date()
): ScorePoolsQualityResult {
  const leagues = Array.isArray(snapshot.leagues) ? snapshot.leagues : [];
  const fixtures = leagues.reduce(
    (sum, league) => sum + league.fixtures.length,
    0
  );
  const odds = leagues.reduce(
    (sum, league) =>
      sum + league.fixtures.reduce((count, fixture) => count + fixture.odds.length, 0),
    0
  );
  const providerLeagues = leagues.filter((league) => !league.sample);
  const liveLeagueRows = providerLeagues.filter(
    (league) =>
      league.sources.fixtures !== "manual entry" &&
      league.sources.odds !== "manual entry"
  );
  const liveFixtures = liveLeagueRows.reduce(
    (sum, league) => sum + league.fixtures.length,
    0
  );
  const liveOdds = liveLeagueRows.reduce(
    (sum, league) =>
      sum +
      league.fixtures.reduce(
        (count, fixture) =>
          count + fixture.odds.filter((entry) => !entry.manual).length,
        0
      ),
    0
  );
  const issues: string[] = [];

  if (leagues.length === 0) issues.push("snapshot has no leagues");
  if (liveLeagueRows.length === 0) issues.push("snapshot has no provider-backed live leagues");
  if (liveFixtures === 0) issues.push("live leagues have no fixtures");
  if (liveOdds === 0) issues.push("live leagues have no provider odds");

  for (const league of liveLeagueRows) {
    const generatedAt = Date.parse(league.generatedAt);
    if (
      !Number.isFinite(generatedAt) ||
      generatedAt > now.getTime() + 5 * 60 * 1000 ||
      now.getTime() - generatedAt > MAX_LIVE_LEAGUE_AGE_MS
    ) {
      issues.push(`live league is stale or invalid: ${league.key}`);
    }
  }

  return {
    leagues: leagues.length,
    fixtures,
    odds,
    liveLeagues: liveLeagueRows.length,
    liveFixtures,
    liveOdds,
    issues,
  };
}
