import { readFile } from "fs/promises";
import path from "path";
import { FantasyRouteScoring, FantasySnapshot, normalizeFantasySnapshot } from "@/lib/fantasy";

// The published boards are static committed JSON (~700KB combined) that only
// change on deploy, yet /api/fantasy-data re-read and re-parsed the file on every
// request. Cache the normalized snapshot per scoring format with the same 5-minute
// TTL the investments server uses (src/lib/investmentsData.ts), so bursts of
// requests reuse one parse instead of hitting the disk each time.
const SNAPSHOT_TTL_MS = 5 * 60 * 1000;

const snapshotCache = new Map<
  FantasyRouteScoring,
  { data: FantasySnapshot; expiresAt: number }
>();

function getFantasySnapshotPath(scoring: FantasyRouteScoring): string {
  return path.join(process.cwd(), "public", "data", "fantasy", `${scoring}.json`);
}

export async function loadFantasySnapshot(scoring: FantasyRouteScoring): Promise<FantasySnapshot> {
  const cached = snapshotCache.get(scoring);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const snapshotPath = getFantasySnapshotPath(scoring);
  const fileContents = await readFile(snapshotPath, "utf8");
  const data = normalizeFantasySnapshot(JSON.parse(fileContents), scoring);
  snapshotCache.set(scoring, { data, expiresAt: Date.now() + SNAPSHOT_TTL_MS });
  return data;
}

/** Test-only: clears the in-memory snapshot cache so cache behavior is testable. */
export function resetFantasySnapshotCache(): void {
  snapshotCache.clear();
}
