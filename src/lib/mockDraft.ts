import type { Player, TeamRoster } from "@/types";
import { getPickBaseline } from "@/lib/draftAnalytics";

/**
 * Pure auto-pick engine behind the mock draft practice simulator. Given the
 * remaining board, the picking team's roster so far, and a seeded RNG, it
 * returns one realistic pick. Callers own the loop, roster bookkeeping, and
 * the seed, so a whole draft replays byte-for-byte from (board, seed).
 */
export interface MockDraftEngineConfig {
  totalTeams: number;
  rounds: number;
}

type CountedPosition = keyof TeamRoster["positionCounts"];

/**
 * One-QB starting lineup minimums every simulated roster must exit the draft
 * with. When a team's remaining picks are down to its unfilled minimums, the
 * engine stops taking best-available and fills them.
 */
const REQUIRED_STARTERS: Record<CountedPosition, number> = {
  QB: 1,
  RB: 2,
  WR: 2,
  TE: 1,
  K: 1,
  DST: 1,
};

/** Hard caps that keep a simulated roster from hoarding a position. */
const POSITION_CAPS: Record<CountedPosition, number> = {
  QB: 2,
  RB: 8,
  WR: 8,
  TE: 3,
  K: 1,
  DST: 1,
};

/** K and DST only become draftable in the final rounds, as in real rooms. */
const K_DST_CLOSING_ROUNDS = 3;

/**
 * Where the engine ranks a player: reliable market ADP, else consensus rank
 * while it still maps onto the pick scale (getPickBaseline), else the raw
 * consensus rank pushed past every real baseline so the deep board keeps a
 * stable order once market signal runs out.
 */
const NO_BASELINE_OFFSET = 1000;

function boardValue(player: Player): number {
  const baseline = getPickBaseline(player);
  if (baseline !== null) return baseline;
  const rank = Number.isFinite(player.rankEcr)
    ? (player.rankEcr as number)
    : Number.isFinite(player.averageRank)
      ? player.averageRank
      : Number.MAX_SAFE_INTEGER - NO_BASELINE_OFFSET;
  return NO_BASELINE_OFFSET + rank;
}

/**
 * Sample an index from the top of an ordered list with harmonic weights, so
 * the best remaining value is the most likely pick but never a lock.
 * ponytail: naive 1/(i+1) weighting; swap for tier-aware softmax if picks read
 * as too random in play testing.
 */
function sampleTopOfBoard(size: number, rng: () => number): number {
  if (size <= 1) return 0;
  let total = 0;
  for (let i = 0; i < size; i += 1) total += 1 / (i + 1);
  let remaining = rng() * total;
  for (let i = 0; i < size; i += 1) {
    remaining -= 1 / (i + 1);
    if (remaining <= 0) return i;
  }
  return size - 1;
}

/**
 * Choose one pick for a simulated team. Returns null only when the board is
 * empty. Selection narrows in three stages: forced starters when the roster
 * is out of spare picks, then positional caps and the late-round K/DST gate,
 * then a weighted sample from the top of what survives. If every filter
 * empties the pool the engine falls back to best available rather than stall.
 */
export function pickForTeam(
  available: readonly Player[],
  roster: Pick<TeamRoster, "picks" | "positionCounts">,
  pickNumber: number,
  config: MockDraftEngineConfig,
  rng: () => number
): Player | null {
  if (available.length === 0) return null;

  const round = Math.ceil(pickNumber / config.totalTeams);
  const remainingPicks = config.rounds - roster.picks.length;
  const counts = roster.positionCounts;

  const missing = (Object.keys(REQUIRED_STARTERS) as CountedPosition[]).filter(
    (position) => (counts[position] ?? 0) < REQUIRED_STARTERS[position]
  );
  const missingTotal = missing.reduce(
    (sum, position) => sum + REQUIRED_STARTERS[position] - (counts[position] ?? 0),
    0
  );
  const mustFill = missingTotal > 0 && remainingPicks <= missingTotal;

  const hasCountedPosition = (player: Player): boolean => player.position in counts;

  let candidates = available.filter((player) => {
    if (!hasCountedPosition(player)) return false;
    const position = player.position as CountedPosition;
    if (mustFill) return missing.includes(position);
    if ((counts[position] ?? 0) >= POSITION_CAPS[position]) return false;
    if (
      (position === "K" || position === "DST") &&
      round <= config.rounds - K_DST_CLOSING_ROUNDS
    ) {
      return false;
    }
    return true;
  });
  if (candidates.length === 0) candidates = available.filter(hasCountedPosition);
  if (candidates.length === 0) candidates = [...available];

  const ordered = [...candidates].sort((a, b) => boardValue(a) - boardValue(b));

  // Past the market and consensus baselines there is no signal to randomize
  // over, so the deep board goes strictly best-available.
  if (boardValue(ordered[0]) >= NO_BASELINE_OFFSET) return ordered[0];

  const windowSize = Math.min(ordered.length, round <= 2 ? 3 : round <= 8 ? 5 : 8);
  return ordered[sampleTopOfBoard(windowSize, rng)];
}
