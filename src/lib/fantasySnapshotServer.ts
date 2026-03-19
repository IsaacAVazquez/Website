import { readFile } from "fs/promises";
import path from "path";
import { FantasyRouteScoring, FantasySnapshot, normalizeFantasySnapshot } from "@/lib/fantasy";

function getFantasySnapshotPath(scoring: FantasyRouteScoring): string {
  return path.join(process.cwd(), "public", "data", "fantasy", `${scoring}.json`);
}

export async function loadFantasySnapshot(scoring: FantasyRouteScoring): Promise<FantasySnapshot> {
  const snapshotPath = getFantasySnapshotPath(scoring);
  const fileContents = await readFile(snapshotPath, "utf8");
  return normalizeFantasySnapshot(JSON.parse(fileContents), scoring);
}
