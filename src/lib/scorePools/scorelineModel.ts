// ============================================================
// Scoreline model — Dixon-Coles grid, market calibration, and the
// extra-time extension
//
// The core idea: instead of inventing team strengths, solve for the
// two teams' expected goals (and the low-score correlation) so the
// scoreline distribution reproduces what the market is pricing —
// the de-vigged 1X2 masses and the totals line. The scorelines are
// then anchored to the market rather than pulled from nowhere.
//
// Solver structure (all bisections, each level re-solving the ones
// inside it, so every equation is monotone in its own unknown):
//   outer   total T = λh + λa   → matches the totals target
//   middle  rho                 → matches the draw mass (three-way only)
//   inner   home share r        → matches the home/away ratio
// ============================================================

import { poissonRow } from "./poisson";
import type {
  CalibrationDiagnostics,
  CalibrationTargets,
  ComparisonCell,
  ComparisonDistribution,
  ExtraTimeConfig,
  MatchOutcome,
  Scoreline,
  ScorelineDistribution,
  ScoringBasis,
} from "./types";

// ─── Dixon-Coles grid ────────────────────────────────────────────────────────

/**
 * Dixon-Coles low-score correction. Negative rho lifts 0-0 and 1-1 and
 * dampens 1-0 and 0-1, which is exactly the misprice a plain independent
 * Poisson makes on tight games. Floored at 0 so an out-of-range rho
 * saturates instead of producing negative probabilities.
 */
function dcTau(home: number, away: number, lambdaHome: number, lambdaAway: number, rho: number): number {
  let tau = 1;
  if (home === 0 && away === 0) tau = 1 - lambdaHome * lambdaAway * rho;
  else if (home === 0 && away === 1) tau = 1 + lambdaHome * rho;
  else if (home === 1 && away === 0) tau = 1 + lambdaAway * rho;
  else if (home === 1 && away === 1) tau = 1 - rho;
  return Math.max(0, tau);
}

/** Valid rho range for the correction to stay a probability everywhere. */
export function rhoBounds(lambdaHome: number, lambdaAway: number): { lower: number; upper: number } {
  return {
    lower: Math.max(-1 / Math.max(lambdaHome, 1e-9), -1 / Math.max(lambdaAway, 1e-9)),
    upper: Math.min(1 / Math.max(lambdaHome * lambdaAway, 1e-9), 1),
  };
}

/** Build the normalized scoreline grid p[home][away]. */
export function buildGrid(
  lambdaHome: number,
  lambdaAway: number,
  rho: number,
  maxGoals: number,
): number[][] {
  const homeRow = poissonRow(lambdaHome, maxGoals);
  const awayRow = poissonRow(lambdaAway, maxGoals);
  const grid: number[][] = [];
  let total = 0;
  for (let h = 0; h <= maxGoals; h++) {
    const row = new Array<number>(maxGoals + 1);
    for (let a = 0; a <= maxGoals; a++) {
      const p = homeRow[h] * awayRow[a] * dcTau(h, a, lambdaHome, lambdaAway, rho);
      row[a] = p;
      total += p;
    }
    grid.push(row);
  }
  // Renormalize the truncation (and any tau flooring) away.
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) grid[h][a] /= total;
  }
  return grid;
}

export function outcomeMasses(grid: number[][]): { home: number; draw: number; away: number } {
  let home = 0;
  let draw = 0;
  let away = 0;
  for (let h = 0; h < grid.length; h++) {
    for (let a = 0; a < grid[h].length; a++) {
      if (h > a) home += grid[h][a];
      else if (h === a) draw += grid[h][a];
      else away += grid[h][a];
    }
  }
  return { home, draw, away };
}

export function expectedTotalOfGrid(grid: number[][]): number {
  let total = 0;
  for (let h = 0; h < grid.length; h++) {
    for (let a = 0; a < grid[h].length; a++) total += (h + a) * grid[h][a];
  }
  return total;
}

export function pOverLine(grid: number[][], line: number): number {
  let over = 0;
  for (let h = 0; h < grid.length; h++) {
    for (let a = 0; a < grid[h].length; a++) {
      if (h + a > line) over += grid[h][a];
    }
  }
  return over;
}

// ─── Calibration ─────────────────────────────────────────────────────────────

export interface CalibrationConfig {
  maxGoals: number;
  defaultRho: number;
  defaultExpectedTotal: number;
}

// 28 halvings of the widest bracket resolve well past 1e-7 — plenty against
// the 1e-3-scale market targets, and it keeps the triple-nested solve cheap
// enough to re-run in the browser on every settings change.
const BISECTION_STEPS = 28;
const SHARE_MIN = 0.03;
const SHARE_MAX = 0.97;
const TOTAL_MIN = 0.2;

interface SolveState {
  targets: CalibrationTargets;
  config: CalibrationConfig;
  notes: string[];
}

function isHalfLine(line: number): boolean {
  return Math.abs(line * 2 - Math.round(line * 2)) < 1e-9 && Math.round(line * 2) % 2 === 1;
}

/**
 * Inner solve: given total and rho, find the home share of the goals so the
 * grid's home/away masses sit in the target ratio. Monotone increasing in r.
 */
function solveShare(total: number, rho: number, state: SolveState): number {
  const { home: targetHome, away: targetAway } = state.targets.outcome;
  const ratioGap = (r: number) => {
    const grid = buildGrid(total * r, total * (1 - r), rho, state.config.maxGoals);
    const { home, away } = outcomeMasses(grid);
    return home * targetAway - away * targetHome;
  };
  let lo = SHARE_MIN;
  let hi = SHARE_MAX;
  if (ratioGap(lo) >= 0) return lo;
  if (ratioGap(hi) <= 0) return hi;
  for (let i = 0; i < BISECTION_STEPS; i++) {
    const mid = (lo + hi) / 2;
    if (ratioGap(mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Middle solve: given total, find rho matching the draw mass (with the share
 * re-solved at every trial). P(draw) is decreasing in rho, so bisection works;
 * when the draw target wants a rho outside the valid range, clamp and say so.
 * Clamping is reported per solve, never as shared state — the outer bisection
 * probes extreme totals where clamping is normal and meaningless.
 */
function solveRho(
  total: number,
  state: SolveState,
): { rho: number; share: number; clamped: boolean } {
  const targetDraw = state.targets.outcome.draw;
  if (targetDraw === undefined) {
    const share = solveShare(total, state.config.defaultRho, state);
    return { rho: state.config.defaultRho, share, clamped: false };
  }
  const drawGap = (rho: number) => {
    const share = solveShare(total, rho, state);
    const grid = buildGrid(total * share, total * (1 - share), rho, state.config.maxGoals);
    return outcomeMasses(grid).draw - targetDraw;
  };
  // Generous fixed bracket; dcTau's floor keeps out-of-range trials valid, and
  // the true bounds are checked afterwards for the diagnostics.
  let lo = -0.9;
  let hi = 0.9;
  if (drawGap(lo) <= 0) {
    return { rho: lo, share: solveShare(total, lo, state), clamped: true };
  }
  if (drawGap(hi) >= 0) {
    return { rho: hi, share: solveShare(total, hi, state), clamped: true };
  }
  for (let i = 0; i < BISECTION_STEPS; i++) {
    const mid = (lo + hi) / 2;
    if (drawGap(mid) > 0) lo = mid;
    else hi = mid;
  }
  const rho = (lo + hi) / 2;
  return { rho, share: solveShare(total, rho, state), clamped: false };
}

interface TotalsTargetResolved {
  mode: "quantile" | "mean" | "default";
  line: number | null;
  pOver: number | null;
  mean: number | null;
}

function resolveTotalsTarget(state: SolveState): TotalsTargetResolved {
  const { targets, config } = state;
  if (targets.expectedTotalOverride !== undefined) {
    return { mode: "mean", line: null, pOver: null, mean: targets.expectedTotalOverride };
  }
  if (targets.totals) {
    const { line, pOver } = targets.totals;
    if (isHalfLine(line)) {
      if (pOver === undefined) {
        state.notes.push(
          `No totals prices, so the ${line} line is treated as a fair 50/50 split.`,
        );
      }
      return { mode: "quantile", line, pOver: pOver ?? 0.5, mean: null };
    }
    state.notes.push(
      `Whole-number totals line ${line} approximated as the expected total (pushes are not modeled).`,
    );
    return { mode: "mean", line, pOver: null, mean: line };
  }
  state.notes.push(
    `No totals market; using the default expected total of ${config.defaultExpectedTotal} goals.`,
  );
  return { mode: "default", line: null, pOver: null, mean: config.defaultExpectedTotal };
}

function totalsGap(
  grid: number[][],
  resolved: TotalsTargetResolved,
): number {
  if (resolved.mode === "quantile") {
    return pOverLine(grid, resolved.line as number) - (resolved.pOver as number);
  }
  return expectedTotalOfGrid(grid) - (resolved.mean as number);
}

/**
 * Calibrate the scoreline distribution to the market: outcome masses match
 * the de-vigged moneyline, the total matches the over/under target, and rho
 * absorbs whatever draw mass a plain Poisson would misprice.
 */
export function calibrateDistribution(
  targets: CalibrationTargets,
  config: CalibrationConfig,
): ScorelineDistribution {
  const state: SolveState = { targets, config, notes: [] };
  const resolved = resolveTotalsTarget(state);
  const maxTotal = Math.max(4, config.maxGoals * 1.6);

  const evaluate = (total: number) => {
    const { rho, share, clamped } = solveRho(total, state);
    const grid = buildGrid(total * share, total * (1 - share), rho, config.maxGoals);
    return { rho, share, clamped, grid };
  };

  // Outer solve on the total. Both totals gaps are increasing in T.
  let lo = TOTAL_MIN;
  let hi = maxTotal;
  let totalGoals: number;
  if (totalsGap(evaluate(lo).grid, resolved) >= 0) {
    totalGoals = lo;
    state.notes.push("Totals target sits below the model floor; using the minimum total.");
  } else if (totalsGap(evaluate(hi).grid, resolved) <= 0) {
    totalGoals = hi;
    state.notes.push("Totals target sits above the model cap; using the maximum total.");
  } else {
    for (let i = 0; i < BISECTION_STEPS; i++) {
      const mid = (lo + hi) / 2;
      if (totalsGap(evaluate(mid).grid, resolved) < 0) lo = mid;
      else hi = mid;
    }
    totalGoals = (lo + hi) / 2;
  }
  // Evaluate once at the chosen total so lambdas, rho, and grid agree exactly.
  let solution = evaluate(totalGoals);

  // If the draw target could not be hit inside the valid rho range and the
  // totals anchor was soft (no real prices behind it), let the total move a
  // bounded amount to trade a little totals error for a better draw fit.
  const targetDraw = targets.outcome.draw;
  const softTotals = resolved.mode !== "quantile" || targets.totals?.pOver === undefined;
  if (solution.clamped && targetDraw !== undefined && softTotals) {
    const baseline = resolved.mean ?? expectedTotalOfGrid(solution.grid);
    let best = { totalGoals, solution, error: Number.POSITIVE_INFINITY };
    for (let step = -5; step <= 5; step++) {
      const trialTotal = Math.max(TOTAL_MIN, baseline * (1 + 0.05 * step));
      const trial = evaluate(trialTotal);
      const masses = outcomeMasses(trial.grid);
      const outcomeError =
        Math.pow(masses.home - targets.outcome.home, 2) +
        Math.pow(masses.draw - targetDraw, 2) +
        Math.pow(masses.away - targets.outcome.away, 2);
      const totalError = Math.pow((expectedTotalOfGrid(trial.grid) - baseline) / Math.max(baseline, 0.5), 2);
      const error = 5 * outcomeError + totalError;
      if (error < best.error) best = { totalGoals: trialTotal, solution: trial, error };
    }
    if (Math.abs(best.totalGoals - totalGoals) > 1e-9) {
      state.notes.push(
        "The draw target was outside what the low-score correction can reach, so the total moved a little to get closer.",
      );
    }
    totalGoals = best.totalGoals;
    solution = best.solution;
  }

  const lambdaHome = totalGoals * solution.share;
  const lambdaAway = totalGoals * (1 - solution.share);
  const grid = solution.grid;
  const outcome = outcomeMasses(grid);
  const bounds = rhoBounds(lambdaHome, lambdaAway);
  const rhoClamped =
    solution.clamped ||
    solution.rho < bounds.lower - 1e-9 ||
    solution.rho > bounds.upper + 1e-9;

  const residuals = {
    home: targets.outcome.home - outcome.home,
    draw: targetDraw !== undefined ? targetDraw - outcome.draw : null,
    away: targets.outcome.away - outcome.away,
    total:
      resolved.mode === "quantile"
        ? (resolved.pOver as number) - pOverLine(grid, resolved.line as number)
        : (resolved.mean as number) - expectedTotalOfGrid(grid),
  };
  const converged =
    Math.abs(residuals.home) < 0.005 &&
    Math.abs(residuals.away) < 0.005 &&
    (residuals.draw === null || Math.abs(residuals.draw) < 0.01);
  if (!converged) {
    state.notes.push(
      "Calibration could not match every market target exactly; the residuals show what gave.",
    );
  }

  const diagnostics: CalibrationDiagnostics = {
    converged,
    residuals,
    rho: solution.rho,
    rhoClamped,
    totalsMode: resolved.mode,
    notes: state.notes,
  };

  return {
    maxGoals: config.maxGoals,
    grid,
    lambdaHome,
    lambdaAway,
    rho: solution.rho,
    outcome,
    expectedTotal: expectedTotalOfGrid(grid),
    diagnostics,
  };
}

// ─── Comparison distribution (what the pool actually scores) ────────────────

export function outcomeOfScore(score: Scoreline): MatchOutcome {
  if (score.home > score.away) return "home";
  if (score.home < score.away) return "away";
  return "draw";
}

interface ComparisonOptions {
  basis: ScoringBasis;
  knockout: boolean;
  penaltiesCountAsWin: boolean;
  extraTime: ExtraTimeConfig;
}

/**
 * Turn the 90-minute distribution into the distribution of the thing the
 * pool scores. Under 90-minute rules that is the grid itself — which is why
 * a tight knockout carries real draw-after-90 probability even though someone
 * will lift the trophy. Under final-result rules in a knockout, level games
 * extend through extra time, and games still level after 120 go to penalties.
 */
export function buildComparisonDistribution(
  dist: ScorelineDistribution,
  options: ComparisonOptions,
): ComparisonDistribution {
  const { basis, knockout, penaltiesCountAsWin, extraTime } = options;
  const cellMap = new Map<string, ComparisonCell>();
  const add = (score: Scoreline, outcome: MatchOutcome, probability: number) => {
    if (probability <= 0) return;
    const key = `${score.home}-${score.away}:${outcome}`;
    const existing = cellMap.get(key);
    if (existing) existing.probability += probability;
    else cellMap.set(key, { score, outcome, probability });
  };

  const pDraw90 = dist.outcome.draw;
  let pPenalties = 0;

  if (basis === "ninetyMinutes" || !knockout) {
    for (let h = 0; h <= dist.maxGoals; h++) {
      for (let a = 0; a <= dist.maxGoals; a++) {
        add({ home: h, away: a }, outcomeOfScore({ home: h, away: a }), dist.grid[h][a]);
      }
    }
  } else {
    // Final-result scoring in a knockout: draws extend through extra time.
    const etLambdaHome = (dist.lambdaHome / 3) * extraTime.tempo;
    const etLambdaAway = (dist.lambdaAway / 3) * extraTime.tempo;
    const etCap = extraTime.maxGoalsPerSide;
    const etHome = normalizeRow(poissonRow(etLambdaHome, etCap));
    const etAway = normalizeRow(poissonRow(etLambdaAway, etCap));

    for (let h = 0; h <= dist.maxGoals; h++) {
      for (let a = 0; a <= dist.maxGoals; a++) {
        const p90 = dist.grid[h][a];
        if (p90 <= 0) continue;
        if (h !== a) {
          add({ home: h, away: a }, h > a ? "home" : "away", p90);
          continue;
        }
        for (let i = 0; i <= etCap; i++) {
          for (let j = 0; j <= etCap; j++) {
            const pCell = p90 * etHome[i] * etAway[j];
            if (pCell <= 0) continue;
            const finalScore = {
              home: Math.min(h + i, dist.maxGoals),
              away: Math.min(a + j, dist.maxGoals),
            };
            if (i !== j) {
              add(finalScore, i > j ? "home" : "away", pCell);
            } else {
              pPenalties += pCell;
              if (penaltiesCountAsWin) {
                add(finalScore, "home", pCell * extraTime.penaltyHomeWinProbability);
                add(finalScore, "away", pCell * (1 - extraTime.penaltyHomeWinProbability));
              } else {
                add(finalScore, "draw", pCell);
              }
            }
          }
        }
      }
    }
  }

  const cells = Array.from(cellMap.values());
  const outcome = { home: 0, draw: 0, away: 0 };
  for (const cell of cells) outcome[cell.outcome] += cell.probability;

  return {
    basis,
    cells,
    outcome,
    pExtraTime: knockout ? pDraw90 : 0,
    pPenalties: knockout && basis === "finalResult" ? pPenalties : knockout ? estimatePenalties(dist, extraTime) : 0,
  };
}

function normalizeRow(row: number[]): number[] {
  const total = row.reduce((sum, p) => sum + p, 0);
  return row.map((p) => p / total);
}

/** P(still level after extra time), for display under 90-minute scoring. */
function estimatePenalties(dist: ScorelineDistribution, extraTime: ExtraTimeConfig): number {
  const etLambdaHome = (dist.lambdaHome / 3) * extraTime.tempo;
  const etLambdaAway = (dist.lambdaAway / 3) * extraTime.tempo;
  const cap = extraTime.maxGoalsPerSide;
  const etHome = normalizeRow(poissonRow(etLambdaHome, cap));
  const etAway = normalizeRow(poissonRow(etLambdaAway, cap));
  let pLevelEt = 0;
  for (let k = 0; k <= cap; k++) pLevelEt += etHome[k] * etAway[k];
  return dist.outcome.draw * pLevelEt;
}
