import { readFile } from "fs/promises";
import path from "path";
import {
  FANTASY_RANKINGS_PAGE_SIZE,
  FantasyRoutePosition,
  FantasyRouteScoring,
  FantasySnapshot,
  getFantasyPlayersForPosition,
  normalizeFantasySnapshot,
  routePositionToSnapshotPosition,
} from "@/lib/fantasy";
import {
  buildFantasyVorpIndex,
  fantasyVorpTeamSizeKey,
  sortPlayersByVorpRank,
  type FantasyVorpTeamSize,
} from "@/lib/fantasyVorp";

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
  // Lenient at runtime: a bad row should cost one player, not the whole board.
  // The builder and the snapshot tests validate strictly before publishing.
  const data = normalizeFantasySnapshot(JSON.parse(fileContents), scoring, {
    lenient: true,
  });
  snapshotCache.set(scoring, { data, expiresAt: Date.now() + SNAPSHOT_TTL_MS });
  return data;
}

export interface FantasySnapshotSeedRequest {
  scoring: FantasyRouteScoring;
  position: FantasyRoutePosition;
  ranking: "consensus" | "vorp";
  teams: FantasyVorpTeamSize;
}

/**
 * The first page of one board slice, shaped as a partial snapshot so the
 * rankings page can server-render real rows before the client's own fetch
 * lands. It applies the board's own filter and sort (see fantasy-football-
 * client.tsx) so the seeded rows are exactly the rows the full snapshot
 * yields; every other slice is empty and the client treats those as loading.
 */
export async function loadFantasySnapshotSeed(
  request: FantasySnapshotSeedRequest,
  size = FANTASY_RANKINGS_PAGE_SIZE
): Promise<FantasySnapshot> {
  const snapshot = await loadFantasySnapshot(request.scoring);
  const slice = getFantasyPlayersForPosition(snapshot, request.position);
  const vorpIndex = buildFantasyVorpIndex(snapshot.vorpRankings, request.teams);
  const vorpMode =
    request.ranking === "vorp" && snapshot.vorpSource !== null && vorpIndex.size > 0;
  const rows = (
    vorpMode
      ? sortPlayersByVorpRank(slice.filter((player) => vorpIndex.has(player.id)), vorpIndex)
      : slice
  ).slice(0, size);
  const seeded = new Set(rows.map((player) => player.id));
  const target = routePositionToSnapshotPosition(request.position);
  const teamKey = fantasyVorpTeamSizeKey(request.teams);
  const positions = Object.fromEntries(
    (Object.keys(snapshot.positions) as Array<keyof FantasySnapshot["positions"]>).map((key) => [
      key,
      key === target ? rows : [],
    ])
  ) as FantasySnapshot["positions"];

  return {
    ...snapshot,
    overall: target === "OVERALL" ? rows : [],
    positions,
    vorpRankings: {
      [teamKey]: (snapshot.vorpRankings[teamKey] ?? []).filter((entry) => seeded.has(entry.playerId)),
    },
  };
}

/** Test-only: clears the in-memory snapshot cache so cache behavior is testable. */
export function resetFantasySnapshotCache(): void {
  snapshotCache.clear();
}
