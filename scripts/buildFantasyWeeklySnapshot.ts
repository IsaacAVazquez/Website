import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { FANTASY_SCORING_LABELS, routeScoringToScoringFormat, type FantasyRouteScoring } from "@/lib/fantasy";
import { getSnapshotSeason } from "@/lib/fantasySnapshotBuilder";
import type { FantasyProsPublicBoard } from "@/lib/fantasyProsPublicSource";
import {
  fetchRestOfSeasonBoard,
  fetchWeeklyFlexBoard,
  fetchWeeklyQuarterbackBoard,
} from "@/lib/fantasyWeeklySource";
import {
  FANTASY_WEEKLY_SNAPSHOT_SCHEMA_VERSION,
  FANTASY_WEEKLY_STARTABLE_DEPTH,
  normalizeFantasyWeeklySnapshot,
  type FantasyWeeklyBoard,
  type FantasyWeeklyBoardSource,
  type FantasyWeeklyPlayer,
  type FantasyWeeklySnapshot,
} from "@/lib/fantasyWeeklySnapshot";
import { getNflRegularSeasonWeek } from "@/lib/fantasyUtils";

const OUTPUT_PATH = path.join(process.cwd(), "public", "data", "fantasy", "weekly.json");

/**
 * Builds the in-season weekly board. This is the one fantasy snapshot that is
 * useless before the season and load-bearing after it, so it deliberately
 * refuses to write anything during the preseason rather than committing a
 * week-0 board that would read as live.
 *
 * Failure is soft in the same way the other fantasy refreshes are. A failed
 * fetch keeps the committed snapshot rather than replacing it with nothing,
 * because a board that is a day old beats no board on a Tuesday morning.
 */

function toWeeklyPlayer(player: FantasyProsPublicBoard["players"][number]): FantasyWeeklyPlayer {
  return {
    id: player.id,
    name: player.name,
    team: player.team,
    position: player.position,
    rank: player.averageRank,
    ...(player.positionRank !== undefined ? { positionRank: player.positionRank } : {}),
    ...(player.standardDeviation !== undefined
      ? { standardDeviation: player.standardDeviation }
      : {}),
    ...(player.minRank !== undefined ? { minRank: player.minRank } : {}),
    ...(player.maxRank !== undefined ? { maxRank: player.maxRank } : {}),
    ...(player.opponent ? { opponent: player.opponent } : {}),
    ...(player.ownership !== undefined ? { ownership: player.ownership } : {}),
  };
}

function toSource(board: FantasyProsPublicBoard): FantasyWeeklyBoardSource {
  return {
    provider: board.sourceLabel,
    url: board.sourceUrl,
    asOf: board.upstreamUpdatedAt,
    expertCount: board.totalExperts,
    playerCount: board.players.length,
  };
}

async function readPreviousSnapshot(): Promise<FantasyWeeklySnapshot | null> {
  try {
    return normalizeFantasyWeeklySnapshot(JSON.parse(await readFile(OUTPUT_PATH, "utf8")));
  } catch {
    return null;
  }
}

async function atomicWriteSnapshot(snapshot: FantasyWeeklySnapshot) {
  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  const tempPath = `${OUTPUT_PATH}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(snapshot)}\n`, "utf8");
  await rename(tempPath, OUTPUT_PATH);
}

async function main() {
  const season = getSnapshotSeason();
  // FantasyPros publishes the coming week's board before the week starts, so
  // the pipeline can be exercised end to end during the preseason. Set
  // FANTASY_WEEKLY_ALLOW_PRESEASON=1 to do that. It is a validation escape
  // hatch and never set in CI, because ownership percentages before leagues
  // have drafted are draft-season artifacts and would make the waiver view lie.
  const allowPreseason = process.env.FANTASY_WEEKLY_ALLOW_PRESEASON === "1";
  const week = getNflRegularSeasonWeek(season);

  if (allowPreseason && week < 1) {
    console.warn(
      "FANTASY_WEEKLY_ALLOW_PRESEASON is set. Building a preseason board for validation; do not commit the result."
    );
  }

  if (week < 1 && !allowPreseason) {
    console.log(
      `Week ${week} of ${season}: the regular season has not started, so there is no weekly board to build. Leaving any committed snapshot alone.`
    );
    return;
  }

  const previous = await readPreviousSnapshot();
  const scoringKeys = Object.keys(FANTASY_SCORING_LABELS) as FantasyRouteScoring[];

  // One quarterback board serves every format, so it is fetched once.
  const quarterbackBoard = await fetchWeeklyQuarterbackBoard(season);
  const quarterbacks = quarterbackBoard.players.map(toWeeklyPlayer);
  const quarterbackSource = toSource(quarterbackBoard);

  const boards = {} as Record<FantasyRouteScoring, FantasyWeeklyBoard>;
  for (const scoring of scoringKeys) {
    const flexBoard = await fetchWeeklyFlexBoard(routeScoringToScoringFormat(scoring), season);
    if (flexBoard.week !== quarterbackBoard.week) {
      throw new Error(
        `FantasyPros served week ${flexBoard.week} for the ${scoring} flex board and week ${quarterbackBoard.week} for quarterbacks. Refusing to publish a board that mixes two weeks.`
      );
    }
    boards[scoring] = {
      flex: flexBoard.players.map(toWeeklyPlayer),
      quarterbacks,
      flexSource: toSource(flexBoard),
      quarterbackSource,
    };
  }

  const snapshot = normalizeFantasyWeeklySnapshot({
    schemaVersion: FANTASY_WEEKLY_SNAPSHOT_SCHEMA_VERSION,
    season,
    week: quarterbackBoard.week,
    generatedAt: new Date().toISOString(),
    boards,
  });

  // Rest-of-season is optional on purpose. As of 2026-08-21 FantasyPros still
  // serves 2025 on those pages, so the season check rejects them and this logs
  // the reason rather than failing the build. It starts populating on its own
  // once the pages roll over.
  try {
    const ros = await fetchRestOfSeasonBoard("PPR", season);
    console.log(`Rest-of-season board is available: ${ros.players.length} players for ${ros.season}.`);
  } catch (error) {
    console.log(`Rest-of-season board not usable yet: ${(error as Error).message}`);
  }

  // Absolute floors, applied to every build including the first board of a
  // new week. The same-week regression check below only fires when a previous
  // snapshot for the same week exists, so without these a truncated first
  // fetch of the week would publish unchecked. The startable depth is the
  // minimum the waiver math needs to mean anything.
  for (const scoring of scoringKeys) {
    const flexCount = snapshot.boards[scoring].flex.length;
    const quarterbackCount = snapshot.boards[scoring].quarterbacks.length;
    if (flexCount < FANTASY_WEEKLY_STARTABLE_DEPTH.flex) {
      throw new Error(
        `Weekly ${scoring} flex board has ${flexCount} players, below the ${FANTASY_WEEKLY_STARTABLE_DEPTH.flex} startable-depth floor. Refusing to publish.`
      );
    }
    if (quarterbackCount < FANTASY_WEEKLY_STARTABLE_DEPTH.quarterback) {
      throw new Error(
        `Weekly ${scoring} quarterback board has ${quarterbackCount} players, below the ${FANTASY_WEEKLY_STARTABLE_DEPTH.quarterback} startable-depth floor. Refusing to publish.`
      );
    }
  }

  if (previous && previous.week === snapshot.week && previous.season === snapshot.season) {
    const priorFlex = previous.boards.ppr.flex.length;
    const freshFlex = snapshot.boards.ppr.flex.length;
    if (freshFlex < priorFlex * 0.8) {
      throw new Error(
        `Weekly flex board dropped to ${freshFlex} players from ${priorFlex} in the same week. Refusing to overwrite the committed board.`
      );
    }
  }

  await atomicWriteSnapshot(snapshot);
  console.log(
    `Wrote the ${season} week ${snapshot.week} board with ${snapshot.boards.ppr.flex.length} flex players and ${quarterbacks.length} quarterbacks.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
