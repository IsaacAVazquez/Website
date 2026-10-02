import { mkdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { FANTASY_SCORING_LABELS, routeScoringToScoringFormat, type FantasyRouteScoring } from "@/lib/fantasy";
import { getSnapshotSeason } from "@/lib/fantasySnapshotBuilder";
import {
  FANTASY_PROS_PUBLIC_SOURCE,
  type FantasyProsPublicBoard,
} from "@/lib/fantasyProsPublicSource";
import { fetchWeeklyFlexBoard, fetchWeeklyQuarterbackBoard } from "@/lib/fantasyWeeklySource";
import {
  FANTASY_WEEKLY_SNAPSHOT_SCHEMA_VERSION,
  FANTASY_WEEKLY_STARTABLE_DEPTH,
  formatFantasyWeeklyProviderLabel,
  normalizeFantasyWeeklySnapshot,
  type FantasyWeeklyBoard,
  type FantasyWeeklyBoardSource,
  type FantasyWeeklyPlayer,
  type FantasyWeeklySnapshot,
} from "@/lib/fantasyWeeklySnapshot";
import { getNflRegularSeasonWeek } from "@/lib/fantasyUtils";
import { withRetry } from "./fetchRetry";
import { writeFileAtomic } from "./snapshotFallback";

const OUTPUT_PATH = path.join(process.cwd(), "public", "data", "fantasy", "weekly.json");

const MS_PER_HOUR = 3_600_000;
const FINAL_REGULAR_SEASON_WEEK = 18;
const OFFSEASON_AFTER_DAYS = 7;
// Across the 18 boards committed through 2026-09-26 the oldest source was 27.8
// hours old at build time, on both Mondays.
const MAX_UPSTREAM_AGE_HOURS = 72;

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

/**
 * The parser stamps every public-HTML board with the draft pipeline's
 * cheat-sheet boilerplate as its source label, and that prose says the flex
 * board is derived locally from an overall board, which is false here: the
 * weekly fetcher reads a published flex page. So the label is keyed on the
 * board that was actually requested, and an unknown source label is refused
 * the way the best ball builder refuses one, rather than passed through.
 */
export function toSource(board: FantasyProsPublicBoard): FantasyWeeklyBoardSource {
  if (board.sourceLabel !== FANTASY_PROS_PUBLIC_SOURCE) {
    throw new Error(`Weekly board returned an unknown source label: ${board.sourceLabel}`);
  }
  if (board.requestedPosition !== "FLEX" && board.requestedPosition !== "QB") {
    throw new Error(
      `Weekly board was requested as ${board.requestedPosition}, which is neither the flex nor the quarterback page.`
    );
  }
  return {
    provider: formatFantasyWeeklyProviderLabel(
      board.requestedPosition === "FLEX" ? "flex" : "quarterback"
    ),
    url: board.sourceUrl,
    asOf: board.upstreamUpdatedAt,
    expertCount: board.totalExperts,
    playerCount: board.players.length,
  };
}

/**
 * A page that has stopped moving still parses, so without this the builder
 * publishes the old board under a new generatedAt. The page and the calendar
 * turn over on different days, so one week of disagreement is normal. The
 * preseason validation run reads a board that has not started moving yet, so
 * it is not held to either limit.
 */
function assertBoardIsCurrent(
  board: FantasyProsPublicBoard,
  label: string,
  calendarWeek: number,
  now: Date
) {
  if (calendarWeek < 1) return;
  if (calendarWeek - board.week > 1) {
    throw new Error(
      `FantasyPros served week ${board.week} for the ${label} board while the calendar is in week ${calendarWeek}. Refusing to publish a board more than one week behind.`
    );
  }
  const ageHours = (now.getTime() - new Date(board.upstreamUpdatedAt).getTime()) / MS_PER_HOUR;
  if (ageHours > MAX_UPSTREAM_AGE_HOURS) {
    throw new Error(
      `FantasyPros last updated the ${label} board ${ageHours.toFixed(1)} hours ago, at ${board.upstreamUpdatedAt}, past the ${MAX_UPSTREAM_AGE_HOURS} hour limit. Refusing to publish a stalled board as new.`
    );
  }
}

async function readPreviousSnapshot(outputPath: string): Promise<FantasyWeeklySnapshot | null> {
  try {
    return normalizeFantasyWeeklySnapshot(JSON.parse(await readFile(outputPath, "utf8")));
  } catch {
    return null;
  }
}

async function atomicWriteSnapshot(snapshot: FantasyWeeklySnapshot, outputPath: string) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  writeFileAtomic(outputPath, `${JSON.stringify(snapshot)}\n`);
}

export async function buildFantasyWeeklySnapshot(
  now: Date = new Date(),
  outputPath = OUTPUT_PATH
): Promise<void> {
  const season = getSnapshotSeason(now);
  // FantasyPros publishes the coming week's board before the week starts, so
  // the pipeline can be exercised end to end during the preseason. Set
  // FANTASY_WEEKLY_ALLOW_PRESEASON=1 to do that. It is a validation escape
  // hatch and never set in CI, because ownership percentages before leagues
  // have drafted are draft-season artifacts and would make the waiver view lie.
  const allowPreseason = process.env.FANTASY_WEEKLY_ALLOW_PRESEASON === "1";
  const week = getNflRegularSeasonWeek(season, now);

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

  // The calendar holds at the final week until the next season opens. Without
  // this gate the builder spends the winter failing on a page that has rolled
  // past the regular season, or stamping the last board as new.
  const weekBeforeGrace = getNflRegularSeasonWeek(
    season,
    new Date(now.getTime() - OFFSEASON_AFTER_DAYS * 24 * MS_PER_HOUR)
  );
  if (weekBeforeGrace >= FINAL_REGULAR_SEASON_WEEK) {
    console.log(
      `Week ${FINAL_REGULAR_SEASON_WEEK} of ${season} opened more than ${OFFSEASON_AFTER_DAYS} days ago, so the regular season is over. Leaving the committed snapshot alone.`
    );
    return;
  }

  const previous = await readPreviousSnapshot(outputPath);
  const scoringKeys = Object.keys(FANTASY_SCORING_LABELS) as FantasyRouteScoring[];

  // One quarterback board serves every format, so it is fetched once, and it
  // is checked before the flex pages so a stalled source costs one request.
  const quarterbackBoard = await withRetry("weekly quarterback board", () =>
    fetchWeeklyQuarterbackBoard(season)
  );
  assertBoardIsCurrent(quarterbackBoard, "quarterback", week, now);
  const quarterbacks = quarterbackBoard.players.map(toWeeklyPlayer);
  const quarterbackSource = toSource(quarterbackBoard);

  const boards = {} as Record<FantasyRouteScoring, FantasyWeeklyBoard>;
  for (const scoring of scoringKeys) {
    const flexBoard = await withRetry(`weekly ${scoring} flex board`, () =>
      fetchWeeklyFlexBoard(routeScoringToScoringFormat(scoring), season)
    );
    if (flexBoard.week !== quarterbackBoard.week) {
      throw new Error(
        `FantasyPros served week ${flexBoard.week} for the ${scoring} flex board and week ${quarterbackBoard.week} for quarterbacks. Refusing to publish a board that mixes two weeks.`
      );
    }
    assertBoardIsCurrent(flexBoard, `${scoring} flex`, week, now);
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
    generatedAt: now.toISOString(),
    boards,
  });

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

  await atomicWriteSnapshot(snapshot, outputPath);
  console.log(
    `Wrote the ${season} week ${snapshot.week} board with ${snapshot.boards.ppr.flex.length} flex players and ${quarterbacks.length} quarterbacks.`
  );
}

const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  buildFantasyWeeklySnapshot().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
