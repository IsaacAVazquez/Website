import path from "node:path";
import type { DataSurfaceId } from "../src/lib/dataFreshnessPolicy";

export interface RefreshArtifactDefinition {
  surface: DataSurfaceId;
  artifactPath: string;
  exportName?: string;
  sourceAsOfPath: readonly string[];
  sourceAsOfFallbackPath?: readonly string[];
  revisionPayloadPath?: readonly string[];
  /**
   * The quality gate. Each key is a dotted path, and `a+b` sums several. An
   * array, string, or object counts its length or keys, and a number counts as
   * itself. A count under its minimum means the upstream returned a truncated
   * or empty payload, so the refresh refuses to commit it.
   */
  minimums?: Readonly<Record<string, number>>;
}

const definition = (
  surface: DataSurfaceId,
  artifactPath: string,
  sourceAsOfPath: readonly string[],
  options: Pick<
    RefreshArtifactDefinition,
    "exportName" | "revisionPayloadPath" | "sourceAsOfFallbackPath" | "minimums"
  > = {}
): RefreshArtifactDefinition => ({
  surface,
  artifactPath: path.join(process.cwd(), artifactPath),
  sourceAsOfPath,
  ...options,
});

export const DATA_REFRESH_ARTIFACTS: Partial<
  Record<DataSurfaceId, RefreshArtifactDefinition>
> = {
  earthquake: definition(
    "earthquake",
    "src/data/earthquakeSnapshot.ts",
    ["summary", "generatedAt"],
    {
      exportName: "earthquakeSnapshot",
      revisionPayloadPath: ["summary"],
      minimums: { "summary.recent+summary.significant+summary.regions": 1 },
    }
  ),
  "bay-area-transit": definition(
    "bay-area-transit",
    "src/data/bayAreaTransitSnapshot.ts",
    ["summary", "system", "generatedAt"],
    {
      exportName: "bayAreaTransitSnapshot",
      revisionPayloadPath: ["summary"],
      minimums: { "summary.lines": 3, "summary.stations": 10 },
    }
  ),
  "formula-1": definition(
    "formula-1",
    "src/data/formula1Snapshot.ts",
    ["generatedAt"],
    { exportName: "formula1Snapshot" }
  ),
  "github-trending": definition(
    "github-trending",
    "src/data/githubTrendingSnapshot.ts",
    ["generatedAt"],
    { exportName: "githubTrendingSnapshot", minimums: { "totals.repositories": 50 } }
  ),
  golf: definition(
    "golf",
    "src/data/golfSnapshot.ts",
    ["summary", "tournament", "generatedAt"],
    {
      exportName: "golfSnapshot",
      minimums: { "summary.tournament.name": 1, "summary.leaderboard": 5 },
    }
  ),
  investments: definition(
    "investments",
    "public/data/investments/index.json",
    ["lastUpdated"]
  ),
  spacex: definition(
    "spacex",
    "src/data/spacexSnapshot.generated.json",
    ["generatedAt"]
  ),
  "world-cup": definition(
    "world-cup",
    "src/data/worldCupSnapshot.ts",
    ["tournament", "generatedAt"],
    { exportName: "worldCupSnapshot", minimums: { "tournament.name": 1 } }
  ),
  "premier-league": definition(
    "premier-league",
    "src/data/premierLeagueSnapshot.ts",
    ["summary", "generatedAt"],
    {
      exportName: "premierLeagueSnapshot",
      revisionPayloadPath: ["summary"],
      minimums: { "summary.standings": 18 },
    }
  ),
  "la-liga": definition(
    "la-liga",
    "src/data/laLigaSnapshot.ts",
    ["generatedAt"],
    { exportName: "laLigaSnapshot", minimums: { clubs: 18 } }
  ),
  mlb: definition("mlb", "src/data/mlbSnapshot.ts", ["generatedAt"], {
    exportName: "mlbSnapshot",
    minimums: {
      teams: 28,
      standings: 28,
      teamSnapshots: 20,
      "hittingLeaders.homeRuns": 5,
      "pitchingLeaders.earnedRunAverage": 5,
    },
  }),
  nba: definition("nba", "src/data/nbaSnapshot.ts", ["generatedAt"], {
    exportName: "nbaSnapshot",
    minimums: {
      "teamsByConference.east": 14,
      "teamsByConference.west": 14,
      teams: 28,
      teamSnapshots: 20,
      scorers: 5,
      rebounders: 5,
      assistLeaders: 5,
    },
  }),
  // updatedAt is a date with no time, which reads as midnight UTC. It stays as
  // the fallback until the first refresh writes generatedAt.
  nfl: definition("nfl", "src/data/nflSnapshot.ts", ["generatedAt"], {
    exportName: "nflSnapshot",
    sourceAsOfFallbackPath: ["updatedAt"],
    minimums: {
      teams: 30,
      teamOptions: 30,
      teamSnapshots: 28,
      "leaders.passing": 5,
      "leaders.rushing": 5,
      "leaders.receiving": 5,
    },
  }),
  "fantasy-football": definition(
    "fantasy-football",
    "public/data/fantasy/ppr.json",
    ["upstreamUpdatedAt"],
    { sourceAsOfFallbackPath: ["generatedAt"] }
  ),
  "score-pools": definition(
    "score-pools",
    "src/data/scorePoolsSnapshot.ts",
    ["generatedAt"],
    { exportName: "scorePoolsSnapshot" }
  ),
  polling: definition(
    "polling",
    "src/data/pollingSnapshot.ts",
    ["generatedAt"],
    { exportName: "pollingSnapshot" }
  ),
};
