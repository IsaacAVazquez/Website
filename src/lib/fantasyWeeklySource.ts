import {
  fetchFantasyProsConsensusBoard,
  type FantasyProsPublicBoard,
} from "@/lib/fantasyProsPublicSource";
import type { ScoringFormat } from "@/types";

/**
 * The in-season FantasyPros boards. These are separate pages from the
 * preseason cheat sheets the draft snapshot reads, and they behave differently
 * enough to need their own thresholds rather than the draft ones.
 *
 * Two differences drive everything here. In-season boards rank only players
 * worth starting, so they are much shorter than a draft board (95 running
 * backs against 100+ in August), and fewer experts contribute to a weekly
 * board than to a preseason one (six on kickers when this was written, against
 * the ten the draft pipeline requires). Reusing the draft gates would reject a
 * perfectly healthy weekly response.
 */

const WEEKLY_FLEX_URLS: Record<ScoringFormat, string> = {
  PPR: "https://www.fantasypros.com/nfl/rankings/ppr-flex.php",
  HALF_PPR: "https://www.fantasypros.com/nfl/rankings/half-point-ppr-flex.php",
  STANDARD: "https://www.fantasypros.com/nfl/rankings/flex.php",
};

// One quarterback board serves every scoring format, the same way the draft
// pipeline shares its QB cheat sheet.
const WEEKLY_QB_URL = "https://www.fantasypros.com/nfl/rankings/qb.php";

/**
 * Rest-of-season boards. On 2026-09-27 all three served year 2026 with 396 to
 * 397 players from 6 experts, so they pass the season check. Nothing publishes
 * them yet, and the weekly builder does not request one, which keeps a request
 * off FantasyPros on every run until a board is built from them.
 */
export const REST_OF_SEASON_URLS: Record<ScoringFormat, string> = {
  PPR: "https://www.fantasypros.com/nfl/rankings/ros-ppr-overall.php",
  HALF_PPR: "https://www.fantasypros.com/nfl/rankings/ros-half-point-ppr-overall.php",
  STANDARD: "https://www.fantasypros.com/nfl/rankings/ros-overall.php",
};

/** Lowest contributing-expert count observed across the weekly boards was six. */
const WEEKLY_MIN_EXPERTS = 5;

const WEEKLY_MIN_FLEX_PLAYERS = 150;
const WEEKLY_MIN_QUARTERBACKS = 24;
const REST_OF_SEASON_MIN_PLAYERS = 250;

export interface FantasyWeeklyBoardResult {
  board: FantasyProsPublicBoard;
  sourceUrl: string;
}

async function fetchWeeklyBoard(options: {
  sourceUrl: string;
  scoringFormat: ScoringFormat;
  requestedPosition: "FLEX" | "QB" | "OVERALL";
  expectedSeason: number;
  minimumPlayers: number;
  rankingType: "weekly" | "ros";
}): Promise<FantasyProsPublicBoard> {
  const board = await fetchFantasyProsConsensusBoard({
    scoringFormat: options.scoringFormat,
    requestedPosition: options.requestedPosition,
    publicSourceUrl: options.sourceUrl,
    expectedSeason: options.expectedSeason,
    expectedRankingType: options.rankingType,
    minimumExperts: WEEKLY_MIN_EXPERTS,
  });

  if (board.players.length < options.minimumPlayers) {
    throw new Error(
      `FantasyPros ${options.rankingType} ${options.scoringFormat} ${options.requestedPosition} board returned ${board.players.length} players, below the ${options.minimumPlayers}-player floor.`
    );
  }
  if (options.rankingType === "weekly" && (board.week < 1 || board.week > 18)) {
    throw new Error(
      `FantasyPros weekly board returned week ${board.week}, which is outside the regular season.`
    );
  }

  return board;
}

export function fetchWeeklyFlexBoard(
  scoringFormat: ScoringFormat,
  expectedSeason: number
): Promise<FantasyProsPublicBoard> {
  return fetchWeeklyBoard({
    sourceUrl: WEEKLY_FLEX_URLS[scoringFormat],
    scoringFormat,
    requestedPosition: "FLEX",
    expectedSeason,
    minimumPlayers: WEEKLY_MIN_FLEX_PLAYERS,
    rankingType: "weekly",
  });
}

export function fetchWeeklyQuarterbackBoard(
  expectedSeason: number
): Promise<FantasyProsPublicBoard> {
  return fetchWeeklyBoard({
    sourceUrl: WEEKLY_QB_URL,
    // The quarterback page is shared across formats and reports STD scoring,
    // which is why it is requested as STANDARD rather than per format.
    scoringFormat: "STANDARD",
    requestedPosition: "QB",
    expectedSeason,
    minimumPlayers: WEEKLY_MIN_QUARTERBACKS,
    rankingType: "weekly",
  });
}

export function fetchRestOfSeasonBoard(
  scoringFormat: ScoringFormat,
  expectedSeason: number
): Promise<FantasyProsPublicBoard> {
  return fetchWeeklyBoard({
    sourceUrl: REST_OF_SEASON_URLS[scoringFormat],
    scoringFormat,
    requestedPosition: "OVERALL",
    expectedSeason,
    minimumPlayers: REST_OF_SEASON_MIN_PLAYERS,
    rankingType: "ros",
  });
}
