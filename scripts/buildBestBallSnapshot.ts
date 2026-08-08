import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import {
  fetchBestBallAdpBoard,
  fetchBestBallRankingsBoard,
  fetchBestBallScheduleBoard,
  fetchBestBallSuperflexRankingsBoard,
} from "@/lib/bestBallSource";
import {
  assertBestBallAdpCoverage,
  assertBestBallRankingCoverage,
  assertBestBallSuperflexCoverage,
  BEST_BALL_MIN_RANKING_PLAYERS,
  BEST_BALL_RANKING_TOP_BOARD_SIZE,
  BEST_BALL_SNAPSHOT_SCHEMA_VERSION,
  BEST_BALL_SUPERFLEX_TOP_BOARD_SIZE,
  normalizeBestBallSnapshot,
  type BestBallSnapshot,
} from "@/lib/bestBallSnapshot";
import {
  buildFantasyAdpIndex,
  matchPlayerAdp,
  normalizeAdpTeam,
} from "@/lib/fantasyAdpMatcher";
import type { FantasySnapshot } from "@/lib/fantasy";
import type { Player } from "@/types";

const OUTPUT_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "fantasy",
  "best-ball.json"
);
const HALF_PPR_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "fantasy",
  "half_ppr.json"
);

async function readPreviousSnapshot(): Promise<BestBallSnapshot | null> {
  try {
    return normalizeBestBallSnapshot(JSON.parse(await readFile(OUTPUT_PATH, "utf8")));
  } catch {
    return null;
  }
}

async function readByeWeeks(season: number): Promise<Map<string, number>> {
  try {
    const snapshot = JSON.parse(await readFile(HALF_PPR_PATH, "utf8")) as FantasySnapshot;
    if (snapshot.season !== season) return new Map();
    return new Map(
      (snapshot.overall ?? [])
        .filter((player) => Number.isFinite(player.byeWeek))
        .map((player) => [player.id, Number(player.byeWeek)])
    );
  } catch {
    return new Map();
  }
}

function normalizeScheduleTeams(opponents: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(opponents).map(([team, opponent]) => [
      normalizeAdpTeam(team),
      normalizeAdpTeam(opponent),
    ])
  );
}

async function atomicWriteSnapshot(snapshot: BestBallSnapshot) {
  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  const tempPath = `${OUTPUT_PATH}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await rename(tempPath, OUTPUT_PATH);
}

async function main() {
  const previous = await readPreviousSnapshot();
  let rankings;

  try {
    rankings = await fetchBestBallRankingsBoard();
  } catch (error) {
    if (previous) {
      const priorBuiltAt = Date.parse(previous.generatedAt);
      const ageDays = (Date.now() - priorBuiltAt) / 86_400_000;
      if (Number.isFinite(ageDays) && ageDays <= 10) {
        console.warn("Best ball rankings refresh failed. Keeping the recent committed snapshot.", error);
        return;
      }
      throw new Error("Best ball rankings refresh failed and the committed snapshot is stale.", {
        cause: error,
      });
    }
    throw error;
  }

  const sameSeasonPrevious = previous?.season === rankings.season ? previous : null;
  const freshRankingIds = new Set(rankings.players.map((player) => player.id));
  const previousTopRankingPlayers = (sameSeasonPrevious?.players ?? []).slice(
    0,
    BEST_BALL_RANKING_TOP_BOARD_SIZE
  );
  assertBestBallRankingCoverage({
    players: rankings.players.length,
    previousPlayers: sameSeasonPrevious?.players.length ?? 0,
    previousTopPlayers: previousTopRankingPlayers.length,
    retainedTopPlayers: previousTopRankingPlayers.filter((player) =>
      freshRankingIds.has(player.id)
    ).length,
  });

  const [superflexResult, adpResult, scheduleResult, byeWeeks] = await Promise.all([
    fetchBestBallSuperflexRankingsBoard().catch((error) => {
      console.warn(
        "Superflex rankings refresh failed. Keeping prior Superflex ranks when available.",
        error
      );
      return null;
    }),
    fetchBestBallAdpBoard(rankings.season).catch((error) => {
      console.warn("Best ball ADP refresh failed. Keeping prior ADP when available.", error);
      return null;
    }),
    fetchBestBallScheduleBoard(rankings.season).catch((error) => {
      console.warn("Best ball Week 17 schedule refresh failed. Keeping the prior schedule when available.", error);
      return null;
    }),
    readByeWeeks(rankings.season),
  ]);

  const adpIndex = adpResult ? buildFantasyAdpIndex(adpResult.entries) : null;
  const superflexById = new Map(
    (superflexResult?.players ?? []).map((player) => [
      player.id,
      {
        rank: player.rankEcr ?? player.averageRank,
        tier: player.tier,
      },
    ])
  );
  const previousById = new Map(
    (sameSeasonPrevious?.players ?? []).map((player) => [player.id, player])
  );
  let matchedCount = 0;
  const freshAdpMatchedIds = new Set<string>();
  let superflexMatchedCount = 0;
  let superflexTierMatchedCount = 0;
  let topBoardSuperflexMatchedCount = 0;
  let topBoardSuperflexTierMatchedCount = 0;
  let superflexQuarterbackCount = 0;
  let superflexQuarterbackMatchedCount = 0;
  let superflexQuarterbackTierMatchedCount = 0;

  const players: Player[] = rankings.players.map((player, index) => {
    const matchedAdp = adpIndex ? matchPlayerAdp(player, adpIndex) : null;
    if (matchedAdp) {
      matchedCount += 1;
      freshAdpMatchedIds.add(player.id);
    }

    const priorPlayer = previousById.get(player.id);
    const adp = adpResult ? matchedAdp?.adp : priorPlayer?.adp;
    const byeWeek = player.byeWeek ?? byeWeeks.get(player.id) ?? priorPlayer?.byeWeek;
    const superflexMatch = superflexById.get(player.id);
    const superflexRank = superflexResult
      ? superflexMatch?.rank
      : priorPlayer?.superflexRank;
    const superflexTier = superflexResult
      ? superflexMatch?.tier
      : priorPlayer?.superflexTier;
    if (Number.isFinite(superflexMatch?.rank)) superflexMatchedCount += 1;
    if (Number.isFinite(superflexMatch?.tier)) superflexTierMatchedCount += 1;
    if (index < BEST_BALL_SUPERFLEX_TOP_BOARD_SIZE) {
      if (Number.isFinite(superflexMatch?.rank)) topBoardSuperflexMatchedCount += 1;
      if (Number.isFinite(superflexMatch?.tier)) topBoardSuperflexTierMatchedCount += 1;
    }
    if (player.position === "QB") {
      superflexQuarterbackCount += 1;
      if (Number.isFinite(superflexMatch?.rank)) superflexQuarterbackMatchedCount += 1;
      if (Number.isFinite(superflexMatch?.tier)) superflexQuarterbackTierMatchedCount += 1;
    }

    return {
      ...player,
      team: normalizeAdpTeam(player.team) || "FA",
      ...(Number.isFinite(adp) ? { adp } : {}),
      ...(Number.isFinite(byeWeek) ? { byeWeek } : {}),
      ...(Number.isFinite(superflexRank) ? { superflexRank } : {}),
      ...(Number.isFinite(superflexTier) ? { superflexTier } : {}),
    };
  });

  const normalizedSchedule = scheduleResult
    ? normalizeScheduleTeams(scheduleResult.opponents)
    : sameSeasonPrevious?.week17Opponents ?? {};
  const snapshot: BestBallSnapshot = {
    schemaVersion: BEST_BALL_SNAPSHOT_SCHEMA_VERSION,
    season: rankings.season,
    generatedAt: new Date().toISOString(),
    players,
    rankingSource: {
      provider: "FantasyPros PPR best ball consensus",
      url: rankings.sourceUrl,
      asOf: rankings.updatedAt,
      matchedCount: players.length,
    },
    superflexSource: superflexResult
      ? {
          provider: "FantasyPros half PPR Superflex consensus",
          url: superflexResult.sourceUrl,
          asOf: superflexResult.updatedAt,
          matchedCount: superflexMatchedCount,
        }
      : sameSeasonPrevious?.superflexSource ?? null,
    adpSource: adpResult
      ? {
          provider: "Underdog ADP via Hayden Winks",
          url: adpResult.sourceUrl,
          asOf: adpResult.updatedAt,
          matchedCount,
        }
      : sameSeasonPrevious?.adpSource ?? null,
    scheduleSource: scheduleResult
      ? {
          provider: "ESPN NFL schedule",
          url: scheduleResult.sourceUrl,
          asOf: new Date().toISOString(),
          matchedCount: Object.keys(normalizedSchedule).length,
        }
      : sameSeasonPrevious?.scheduleSource ?? null,
    week17Opponents: normalizedSchedule,
  };

  if (players.length < BEST_BALL_MIN_RANKING_PLAYERS) {
    throw new Error(`Best ball snapshot has only ${players.length} players.`);
  }
  const previousAdpMatches = sameSeasonPrevious?.adpSource?.matchedCount ??
    (sameSeasonPrevious?.players ?? []).filter((player) => Number.isFinite(player.adp)).length;
  const previousTopAdpPlayers = rankings.players
    .slice(0, 150)
    .filter((player) => Number.isFinite(previousById.get(player.id)?.adp));
  const retainedTopAdpPlayers = previousTopAdpPlayers.filter((player) =>
    freshAdpMatchedIds.has(player.id)
  ).length;
  assertBestBallAdpCoverage({
    freshSourceReceived: adpResult !== null,
    matches: matchedCount,
    previousMatches: previousAdpMatches,
    previousTopPlayers: previousTopAdpPlayers.length,
    retainedTopPlayers: retainedTopAdpPlayers,
  });
  assertBestBallSuperflexCoverage({
    freshSourceReceived: superflexResult !== null,
    totalPlayers: players.length,
    rankMatches: superflexMatchedCount,
    tierMatches: superflexTierMatchedCount,
    topBoardPlayers: Math.min(players.length, BEST_BALL_SUPERFLEX_TOP_BOARD_SIZE),
    topBoardRankMatches: topBoardSuperflexMatchedCount,
    topBoardTierMatches: topBoardSuperflexTierMatchedCount,
    quarterbackPlayers: superflexQuarterbackCount,
    quarterbackRankMatches: superflexQuarterbackMatchedCount,
    quarterbackTierMatches: superflexQuarterbackTierMatchedCount,
    hasPreviousSource: Boolean(sameSeasonPrevious?.superflexSource),
  });

  await atomicWriteSnapshot(snapshot);
  console.log(
    `Wrote best ball snapshot with ${players.length} rankings, ${superflexMatchedCount} Superflex rank matches, ${superflexTierMatchedCount} Superflex tier matches, ${matchedCount} current ADP matches, and ${Object.keys(normalizedSchedule).length} Week 17 team mappings.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
