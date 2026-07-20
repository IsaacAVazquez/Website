// ============================================================
// Context flags — manual shading plus standings-derived suggestions
//
// Flags adjust the calibration targets before the solve, so the whole
// model machinery stays untouched: a dead rubber lowers the total and
// flattens the gap, a draw-suits-both game pulls the draw mass up.
// The adjustments are deliberately modest (the market prices most of
// this already) and every change is recorded in an audit trail.
// ============================================================

import type {
  CalibrationTargets,
  ContextFlagKey,
  ContextFlags,
  ContextParams,
  StandingsTeam,
  SuggestedFlag,
} from "./types";

export interface ContextAdjustmentResult {
  targets: CalibrationTargets;
  /**
   * Multiplier the flags want applied to the expected total. Returned
   * separately because a priced totals market can't be scaled directly —
   * the engine resolves it to an expected-total override first.
   */
  totalFactor: number;
  applied: ContextFlagKey[];
  audit: string[];
}

function normalizeOutcome(outcome: { home: number; draw?: number; away: number }): {
  home: number;
  draw?: number;
  away: number;
} {
  const total = outcome.home + (outcome.draw ?? 0) + outcome.away;
  return {
    home: outcome.home / total,
    ...(outcome.draw !== undefined ? { draw: outcome.draw / total } : {}),
    away: outcome.away / total,
  };
}

/**
 * Apply the active context flags to the calibration targets. Total-goals
 * effects compose multiplicatively; outcome effects are applied to the
 * de-vigged masses and renormalized at the end.
 */
export function applyContextAdjustments(
  targets: CalibrationTargets,
  flags: ContextFlags | undefined,
  params: ContextParams,
): ContextAdjustmentResult {
  const applied: ContextFlagKey[] = [];
  const audit: string[] = [];
  if (!flags) return { targets, totalFactor: 1, applied, audit };

  let { home, away } = targets.outcome;
  let draw = targets.outcome.draw;
  let totalFactor = 1;

  if (flags.deadRubber) {
    applied.push("deadRubber");
    totalFactor *= params.deadRubberTotalFactor;
    const mid = (home + away) / 2;
    home = mid + (home - mid) * params.deadRubberGapFactor;
    away = mid + (away - mid) * params.deadRubberGapFactor;
    if (draw !== undefined) draw *= params.deadRubberDrawBoost;
    audit.push(
      `Dead rubber: expected total scaled by ${params.deadRubberTotalFactor}, favorite edge scaled by ${params.deadRubberGapFactor}.`,
    );
  }

  if (flags.drawSuitsBoth && draw !== undefined) {
    applied.push("drawSuitsBoth");
    draw *= params.drawSuitsBothDrawBoost;
    totalFactor *= params.drawSuitsBothTotalFactor;
    audit.push(
      `Draw suits both: draw mass scaled by ${params.drawSuitsBothDrawBoost}, expected total by ${params.drawSuitsBothTotalFactor}.`,
    );
  }

  if (flags.mustWinHome) {
    applied.push("mustWinHome");
    home *= params.mustWinSideBoost;
    if (draw !== undefined) draw *= params.mustWinDrawFactor;
    totalFactor *= params.mustWinTotalFactor;
    audit.push(`Must-win for the home side: their mass scaled by ${params.mustWinSideBoost}.`);
  }
  if (flags.mustWinAway) {
    applied.push("mustWinAway");
    away *= params.mustWinSideBoost;
    if (draw !== undefined) draw *= params.mustWinDrawFactor;
    totalFactor *= params.mustWinTotalFactor;
    audit.push(`Must-win for the away side: their mass scaled by ${params.mustWinSideBoost}.`);
  }

  if (flags.rotationRiskHome) {
    applied.push("rotationRiskHome");
    home *= params.rotationSideFactor;
    totalFactor *= params.rotationTotalFactor;
    audit.push(`Rotation risk for the home side: their mass scaled by ${params.rotationSideFactor}.`);
  }
  if (flags.rotationRiskAway) {
    applied.push("rotationRiskAway");
    away *= params.rotationSideFactor;
    totalFactor *= params.rotationTotalFactor;
    audit.push(`Rotation risk for the away side: their mass scaled by ${params.rotationSideFactor}.`);
  }

  if (applied.length === 0) return { targets, totalFactor: 1, applied, audit };

  const outcome = normalizeOutcome({ home, ...(draw !== undefined ? { draw } : {}), away });
  const adjusted: CalibrationTargets = { ...targets, outcome };
  if (totalFactor !== 1 && targets.expectedTotalOverride !== undefined) {
    adjusted.expectedTotalOverride = targets.expectedTotalOverride * totalFactor;
    totalFactor = 1;
  }
  return { targets: adjusted, totalFactor, applied, audit };
}

/**
 * Derive suggested flags from standings. Conservative on purpose: only
 * suggests when the feed states qualification/elimination outright, and
 * everything surfaces as a suggestion for the user to confirm, never a
 * silent change.
 */
export function suggestContextFlags(
  homeTeam: string,
  awayTeam: string,
  standings: StandingsTeam[] | undefined,
): SuggestedFlag[] {
  if (!standings || standings.length === 0) return [];
  const findTeam = (name: string) =>
    standings.find((row) => row.team.toLowerCase() === name.toLowerCase());
  const home = findTeam(homeTeam);
  const away = findTeam(awayTeam);
  if (!home || !away) return [];

  const suggestions: SuggestedFlag[] = [];
  if (home.qualified && away.qualified) {
    suggestions.push({
      flag: "deadRubber",
      reason: "The standings say both teams are already through, so rotation and a flat game are live possibilities.",
      source: "standings",
    });
    suggestions.push({
      flag: "drawSuitsBoth",
      reason: "Both teams are already through; neither needs to chase this one.",
      source: "standings",
    });
  } else if (home.eliminated && away.eliminated) {
    suggestions.push({
      flag: "deadRubber",
      reason: "The standings say both teams are already out, which usually means changes and lower intensity.",
      source: "standings",
    });
  }
  return suggestions;
}
