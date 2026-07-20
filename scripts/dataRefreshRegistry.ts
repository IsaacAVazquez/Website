import path from "node:path";
import type { DataSurfaceId } from "../src/lib/dataFreshnessPolicy";

export interface RefreshArtifactDefinition {
  surface: DataSurfaceId;
  artifactPath: string;
  exportName?: string;
  sourceAsOfPath: readonly string[];
  revisionPayloadPath?: readonly string[];
}

const definition = (
  surface: DataSurfaceId,
  artifactPath: string,
  sourceAsOfPath: readonly string[],
  options: Pick<RefreshArtifactDefinition, "exportName" | "revisionPayloadPath"> = {}
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
    { exportName: "earthquakeSnapshot", revisionPayloadPath: ["summary"] }
  ),
  "bay-area-transit": definition(
    "bay-area-transit",
    "src/data/bayAreaTransitSnapshot.ts",
    ["summary", "system", "generatedAt"],
    { exportName: "bayAreaTransitSnapshot", revisionPayloadPath: ["summary"] }
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
    { exportName: "githubTrendingSnapshot" }
  ),
  golf: definition(
    "golf",
    "src/data/golfSnapshot.ts",
    ["summary", "tournament", "generatedAt"],
    { exportName: "golfSnapshot" }
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
    { exportName: "worldCupSnapshot" }
  ),
  "premier-league": definition(
    "premier-league",
    "src/data/premierLeagueSnapshot.ts",
    ["summary", "generatedAt"],
    { exportName: "premierLeagueSnapshot", revisionPayloadPath: ["summary"] }
  ),
  "la-liga": definition(
    "la-liga",
    "src/data/laLigaSnapshot.ts",
    ["updatedAt"],
    { exportName: "laLigaSnapshot" }
  ),
  mlb: definition("mlb", "src/data/mlbSnapshot.ts", ["updatedAt"], {
    exportName: "mlbSnapshot",
  }),
  nba: definition("nba", "src/data/nbaSnapshot.ts", ["updatedAt"], {
    exportName: "nbaSnapshot",
  }),
  nfl: definition("nfl", "src/data/nflSnapshot.ts", ["updatedAt"], {
    exportName: "nflSnapshot",
  }),
  "fantasy-football": definition(
    "fantasy-football",
    "public/data/fantasy/ppr.json",
    ["generatedAt"]
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
    ["sourceAsOf"],
    { exportName: "pollingSnapshot" }
  ),
};
