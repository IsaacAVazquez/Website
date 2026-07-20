// ============================================================
// Field model — what the rest of the pool is likely to submit
//
// In practice the field is mostly chalk: the favorite with a modal
// scoreline, a couple of adjacent favorite scores, and a slice of
// 1-1 in tight games. This is a documented heuristic, not a
// measurement — the shares are configurable, and known rival picks
// replace the whole thing when you have them.
// ============================================================

import { outcomeOfScore } from "./scorelineModel";
import { scorePickAgainstCell } from "./scoring";
import type {
  ComparisonDistribution,
  FieldModelConfig,
  FieldPick,
  MatchOutcome,
  Scoreline,
  ScorelineDistribution,
  ScoringRules,
} from "./types";

function scoreKey(score: Scoreline): string {
  return `${score.home}-${score.away}`;
}

interface WeightedScore {
  score: Scoreline;
  probability: number;
}

function cellsByOutcome(dist: ScorelineDistribution, outcome: MatchOutcome): WeightedScore[] {
  const cells: WeightedScore[] = [];
  for (let h = 0; h <= dist.maxGoals; h++) {
    for (let a = 0; a <= dist.maxGoals; a++) {
      const score = { home: h, away: a };
      if (outcomeOfScore(score) === outcome) {
        cells.push({ score, probability: dist.grid[h][a] });
      }
    }
  }
  cells.sort((a, b) => b.probability - a.probability);
  return cells;
}

/**
 * Model the pool's picks from the calibrated distribution. The favorite's
 * modal scoreline takes `modalShare`, the rest of a small chalk set fills
 * out `chalkShare`, and whatever remains spreads across the other
 * scorelines in proportion to the model itself.
 */
export function buildFieldPicks(
  dist: ScorelineDistribution,
  config: FieldModelConfig,
): FieldPick[] {
  if (config.overrides && config.overrides.length > 0) {
    const total = config.overrides.reduce((sum, pick) => sum + pick.share, 0);
    if (total > 0) {
      return config.overrides.map((pick) => ({ score: pick.score, share: pick.share / total }));
    }
  }

  const favorite: MatchOutcome = dist.outcome.home >= dist.outcome.away ? "home" : "away";
  const underdog: MatchOutcome = favorite === "home" ? "away" : "home";
  const favoriteCells = cellsByOutcome(dist, favorite);
  const drawCells = cellsByOutcome(dist, "draw");
  const underdogCells = cellsByOutcome(dist, underdog);

  const chalk: WeightedScore[] = favoriteCells.slice(0, 3);
  // Tight games put a visible slice of the field on 1-1.
  if (dist.outcome.draw >= 0.26 && drawCells.length > 0) chalk.push(drawCells[0]);
  // Near coin flips see some of the field back the other side too.
  if (dist.outcome[underdog] >= 0.35 && underdogCells.length > 0) chalk.push(underdogCells[0]);

  const shares = new Map<string, { score: Scoreline; share: number }>();
  const addShare = (score: Scoreline, share: number) => {
    if (share <= 0) return;
    const key = scoreKey(score);
    const existing = shares.get(key);
    if (existing) existing.share += share;
    else shares.set(key, { score, share });
  };

  const modal = chalk[0];
  const modalShare = Math.min(config.modalShare, config.chalkShare);
  addShare(modal.score, modalShare);

  const rest = chalk.slice(1);
  const restWeight = rest.reduce((sum, cell) => sum + cell.probability, 0);
  const restShare = Math.max(0, config.chalkShare - modalShare);
  for (const cell of rest) {
    addShare(cell.score, restWeight > 0 ? (restShare * cell.probability) / restWeight : 0);
  }

  // The tail: everyone else picks plausible-looking scores, so spread the
  // remainder across non-chalk cells in proportion to the model.
  const chalkKeys = new Set(chalk.map((cell) => scoreKey(cell.score)));
  const tailShare = Math.max(0, 1 - config.chalkShare);
  let tailWeight = 0;
  for (let h = 0; h <= dist.maxGoals; h++) {
    for (let a = 0; a <= dist.maxGoals; a++) {
      if (!chalkKeys.has(`${h}-${a}`)) tailWeight += dist.grid[h][a];
    }
  }
  if (tailWeight > 0 && tailShare > 0) {
    for (let h = 0; h <= dist.maxGoals; h++) {
      for (let a = 0; a <= dist.maxGoals; a++) {
        if (chalkKeys.has(`${h}-${a}`)) continue;
        addShare({ home: h, away: a }, (tailShare * dist.grid[h][a]) / tailWeight);
      }
    }
  }

  const picks = Array.from(shares.values()).map(({ score, share }) => ({ score, share }));
  const total = picks.reduce((sum, pick) => sum + pick.share, 0);
  picks.forEach((pick) => (pick.share /= total));
  picks.sort((a, b) => b.share - a.share);
  return picks;
}

/**
 * The field's expected points on each cell of the comparison distribution,
 * i.e. what an average pool member scores when that result lands. The
 * leaderboard layer uses this to price a pick relative to the room.
 */
export function fieldPointsByCell(
  fieldPicks: FieldPick[],
  comparison: ComparisonDistribution,
  rules: ScoringRules,
): number[] {
  return comparison.cells.map((cell) => {
    let points = 0;
    for (const pick of fieldPicks) {
      points +=
        pick.share * scorePickAgainstCell(pick.score, cell.score, cell.outcome, rules).points;
    }
    return points;
  });
}

/** The field's overall expected points on the game. */
export function fieldExpectedPoints(
  fieldPicks: FieldPick[],
  comparison: ComparisonDistribution,
  rules: ScoringRules,
): number {
  const perCell = fieldPointsByCell(fieldPicks, comparison, rules);
  return comparison.cells.reduce(
    (sum, cell, index) => sum + cell.probability * perCell[index],
    0,
  );
}

/** Share of the field expected to sit on a given scoreline. */
export function fieldShareOf(fieldPicks: FieldPick[], score: Scoreline): number {
  const key = scoreKey(score);
  let share = 0;
  for (const pick of fieldPicks) {
    if (scoreKey(pick.score) === key) share += pick.share;
  }
  return share;
}
