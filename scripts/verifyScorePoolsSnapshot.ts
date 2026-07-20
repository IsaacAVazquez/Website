import { appendFile } from "node:fs/promises";
import path from "node:path";
import type { ScorePoolsSnapshot } from "../src/types/scorePools";
import { readGeneratedSnapshot } from "./snapshotFallback";

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

async function main() {
  const snapshotPath = path.join(
    process.cwd(),
    "src/data/scorePoolsSnapshot.ts"
  );
  const snapshot = readGeneratedSnapshot<ScorePoolsSnapshot>(
    snapshotPath,
    "scorePoolsSnapshot"
  );
  if (!snapshot) throw new Error(`Could not parse ${snapshotPath}.`);

  const result = assessScorePoolsSnapshotQuality(snapshot);
  console.log(JSON.stringify(result, null, 2));

  if (process.env.GITHUB_OUTPUT) {
    await appendFile(
      process.env.GITHUB_OUTPUT,
      [
        `leagues=${result.leagues}`,
        `fixtures=${result.fixtures}`,
        `odds=${result.odds}`,
        `live_leagues=${result.liveLeagues}`,
        `live_fixtures=${result.liveFixtures}`,
        `live_odds=${result.liveOdds}`,
        "",
      ].join("\n")
    );
  }

  if (result.issues.length > 0) {
    throw new Error(result.issues.join("; "));
  }
}

if (process.argv[1]?.endsWith("verifyScorePoolsSnapshot.ts")) {
  void main().catch((error) => {
    console.error(`::error::${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
