import type { FantasyWeeklyPlayer } from "@/lib/fantasyWeeklySnapshot";

/**
 * Tiers for the weekly board. FantasyPros publishes tiers on its draft cheat
 * sheets but none on the weekly or rest-of-season pages (checked 2026-10-15),
 * so these are drawn here from the published expert averages and spreads, and
 * the page says so.
 *
 * The rule splits a board at its widest gaps. A gap is how far the expert
 * average moves between two neighbours, measured against how much the experts
 * disagree about the pair, so a four-rank jump between two players the
 * experts agree on counts for more than the same jump between two they do not.
 * A run is split at its widest gap until no tier holds more than
 * `WEEKLY_TIER_MAX_SIZE` players, and a split never leaves a tier of one.
 *
 * On the week 6 PPR flex board the first breaks land after Lamb (8.6 to 10.4)
 * and after Olave (11.7 to 15.8), which is where the averages visibly jump.
 */

export const WEEKLY_TIER_MAX_SIZE = 10;
const WEEKLY_TIER_MIN_SIZE = 2;

export interface WeeklyTier {
  tier: number;
  players: FantasyWeeklyPlayer[];
  /** How far the expert average drops from the tier above, 0 for the first. */
  cliff: number;
}

/** The published mean when there is one, the whole-number consensus rank otherwise. */
export function getWeeklyAverage(player: FantasyWeeklyPlayer): number {
  return player.rankAverage ?? player.rank;
}

function gapScore(above: FantasyWeeklyPlayer, below: FantasyWeeklyPlayer): number {
  const spread = ((above.standardDeviation ?? 0) + (below.standardDeviation ?? 0)) / 2;
  return (getWeeklyAverage(below) - getWeeklyAverage(above)) / Math.max(1, spread);
}

/** Players in board order, split into tiers. */
export function computeWeeklyTiers(players: readonly FantasyWeeklyPlayer[]): WeeklyTier[] {
  const runs: FantasyWeeklyPlayer[][] = [];
  const pending: FantasyWeeklyPlayer[][] = players.length > 0 ? [players.slice()] : [];
  while (pending.length > 0) {
    const run = pending.shift() as FantasyWeeklyPlayer[];
    if (run.length <= WEEKLY_TIER_MAX_SIZE) {
      runs.push(run);
      continue;
    }
    // The widest gap that leaves both sides at least the minimum size. A tie
    // goes to the gap nearest the middle, so a board with no published
    // averages (every gap one rank) halves into even tiers instead of peeling
    // off pairs from the top.
    const middle = run.length / 2;
    let at = WEEKLY_TIER_MIN_SIZE;
    for (let index = at + 1; index <= run.length - WEEKLY_TIER_MIN_SIZE; index += 1) {
      const score = gapScore(run[index - 1], run[index]);
      const best = gapScore(run[at - 1], run[at]);
      if (score > best || (score === best && Math.abs(index - middle) < Math.abs(at - middle))) at = index;
    }
    pending.unshift(run.slice(0, at), run.slice(at));
  }

  return runs.map((run, index) => {
    const above = runs[index - 1];
    const cliff = above
      ? Math.max(0, Number((getWeeklyAverage(run[0]) - getWeeklyAverage(above[above.length - 1])).toFixed(1)))
      : 0;
    return { tier: index + 1, players: run, cliff };
  });
}
