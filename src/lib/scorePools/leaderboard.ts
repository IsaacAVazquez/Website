// ============================================================
// Leaderboard layer — standing-aware recommendation
//
// Raw expected points is only the right answer when nobody is
// managing a lead. Every pick is both a bet on one game and a move
// in the standings that pays off relative to what everyone else
// does, so this layer prices each candidate against the field:
// E[my points − field points] and the spread of that gap. Moving
// with the field makes the gap's variance collapse (shared games
// cancel); diverging makes it wide.
//
// The posture then sets an appetite for that variance. Protecting
// a lead tilts toward low-variance, field-mirroring picks even
// when both score zero on a game that goes to penalties; chasing
// tilts toward the differentiators. The appetite is a continuous
// function of the gap and the games remaining, not a binary
// safe-versus-risky label.
// ============================================================

import { fieldExpectedPoints, fieldPointsByCell, fieldShareOf } from "./field";
import { scorePickAgainstCell } from "./scoring";
import type {
  CandidateEvaluation,
  ComparisonDistribution,
  ConfidenceReport,
  FieldPick,
  PickRecommendation,
  RankedPick,
  RiskParams,
  RiskProfile,
  ScoringRules,
  StandingContext,
} from "./types";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Turn the standing into a variance appetite `k`, used as
 * utility = E[gap] + k · SD(gap). Positive k chases variance, negative
 * avoids it. The urgency scale is the points a pick can realistically
 * swing per game times the games left — so a one-point lead with two
 * games left reads very differently from a ten-point lead with ten to go.
 */
export function deriveRiskProfile(
  standing: StandingContext,
  rules: ScoringRules,
  params: RiskParams,
): RiskProfile {
  const games = Math.max(1, standing.gamesRemaining);
  const budget = Math.max(1e-9, rules.exact * params.swingFactor * games);

  const gapAbove =
    standing.nearestAbovePoints !== null
      ? Math.max(0, standing.nearestAbovePoints - standing.myPoints)
      : null;
  const gapBelow =
    standing.nearestBelowPoints !== null
      ? Math.max(0, standing.myPoints - standing.nearestBelowPoints)
      : null;

  // Chasing: urgency rises with the deficit relative to what's catchable.
  const chaseNeed = gapAbove !== null ? clamp01(gapAbove / budget) : 0;
  // Protecting: urgency rises as the cushion shrinks relative to the same scale.
  const protectUrgency = gapBelow !== null ? 1 - clamp01(gapBelow / budget) : 0;

  let k: number;
  switch (standing.posture) {
    case "protect":
      k = -params.kMax * Math.max(Math.pow(protectUrgency, params.gamma), params.forcedFloor);
      break;
    case "chase":
      k = params.kMax * Math.max(Math.pow(chaseNeed, params.gamma), params.forcedFloor);
      break;
    case "neutral":
      k = 0;
      break;
    case "auto":
    default: {
      // Defending an outright lead is the pool win; defending a mid-pack
      // position matters less than catching whoever is above, so the protect
      // term is damped whenever someone is.
      const protectWeight =
        standing.nearestAbovePoints === null ? 1 : params.midPackProtectWeight;
      k =
        params.kMax *
        (Math.pow(chaseNeed, params.gamma) -
          protectWeight * Math.pow(protectUrgency, params.gamma));
      break;
    }
  }

  const derivedPosture: RiskProfile["derivedPosture"] =
    k > 0.05 ? "chase" : k < -0.05 ? "protect" : "neutral";

  const explanation = buildRiskExplanation(standing, derivedPosture, gapAbove, gapBelow, games);
  return { k, derivedPosture, chaseNeed, protectUrgency, explanation };
}

function buildRiskExplanation(
  standing: StandingContext,
  posture: RiskProfile["derivedPosture"],
  gapAbove: number | null,
  gapBelow: number | null,
  games: number,
): string {
  const gameWord = games === 1 ? "game" : "games";
  if (posture === "protect") {
    const cushion = gapBelow ?? 0;
    return `You lead by ${cushion} with ${games} ${gameWord} left, so the play is to move with the field and let the shared games cancel out.`;
  }
  if (posture === "chase") {
    const deficit = gapAbove ?? 0;
    return `You trail by ${deficit} with ${games} ${gameWord} left, so it makes sense to accept variance and look for spots the field underweights.`;
  }
  if (gapAbove !== null && gapBelow !== null) {
    return `You're ${gapAbove} back and ${gapBelow} clear with ${games} ${gameWord} left, so the pressures roughly cancel and straight expected points is the play.`;
  }
  return `With ${games} ${gameWord} left and no tight race on either side, straight expected points is the play.`;
}

/** Rank candidates by standing-aware utility and assemble the recommendation. */
export function recommendPick(
  candidates: CandidateEvaluation[],
  fieldPicks: FieldPick[],
  comparison: ComparisonDistribution,
  rules: ScoringRules,
  standing: StandingContext,
  params: RiskParams,
  referencePicks?: FieldPick[],
): PickRecommendation {
  const risk = deriveRiskProfile(standing, rules, params);
  const epField = fieldExpectedPoints(fieldPicks, comparison, rules);

  // The race is against one person — whoever sits nearest above or below —
  // not against the pool average. Known rival picks (passed explicitly) are
  // that opponent directly; otherwise the modal chalk pick stands in for
  // them. Mirroring the reference makes the gap variance exactly zero, which
  // is what "move with the field and let shared games cancel" means in numbers.
  const reference: FieldPick[] =
    referencePicks && referencePicks.length > 0
      ? referencePicks
      : fieldPicks.length > 0
        ? [{ score: fieldPicks[0].score, share: 1 }]
        : [];
  const referencePerCell = fieldPointsByCell(reference, comparison, rules);

  const ranked: RankedPick[] = candidates.map((candidate) => {
    // Distribution of (my points − reference points) across actual results.
    let gapMean = 0;
    let gapSquare = 0;
    comparison.cells.forEach((cell, index) => {
      const points = scorePickAgainstCell(candidate.score, cell.score, cell.outcome, rules).points;
      const gap = points - referencePerCell[index];
      gapMean += cell.probability * gap;
      gapSquare += cell.probability * gap * gap;
    });
    const gapVariance = Math.max(0, gapSquare - gapMean * gapMean);
    const gapSd = Math.sqrt(gapVariance);
    return {
      ...candidate,
      relative: { expected: gapMean, standardDeviation: gapSd },
      fieldShare: fieldShareOf(fieldPicks, candidate.score),
      utility: gapMean + risk.k * gapSd,
    };
  });

  ranked.sort((a, b) => {
    if (b.utility !== a.utility) return b.utility - a.utility;
    if (b.expectedPoints !== a.expectedPoints) return b.expectedPoints - a.expectedPoints;
    return b.pExact - a.pExact;
  });

  const recommended = ranked[0];
  const topEp = Math.max(...ranked.map((pick) => pick.expectedPoints));

  // Higher-floor alternative: near the top on expected points, most likely
  // to bank something. Floors compare with an epsilon because many picks
  // share the exact same floor (every home-win pick banks on every home
  // win), and float noise must not decide between them — expected points
  // does, then closeness to the room.
  const safetyPool = ranked.filter(
    (pick) => pick.expectedPoints >= topEp - params.safetyEpWindow,
  );
  const safest = [...safetyPool].sort((a, b) => {
    if (Math.abs(b.pAnyPoints - a.pAnyPoints) > 1e-9) return b.pAnyPoints - a.pAnyPoints;
    if (b.expectedPoints !== a.expectedPoints) return b.expectedPoints - a.expectedPoints;
    return a.relative.standardDeviation - b.relative.standardDeviation;
  })[0];

  // Differentiator: low ownership, competitive expected points, and the most
  // upside relative to the field when you need to make ground.
  const chaseK = params.kMax;
  const differentiator =
    ranked
      .filter(
        (pick) =>
          pick.fieldShare <= params.diffMaxFieldShare &&
          pick.expectedPoints >= topEp - params.diffEpWindow,
      )
      .sort(
        (a, b) =>
          b.relative.expected +
          chaseK * b.relative.standardDeviation -
          (a.relative.expected + chaseK * a.relative.standardDeviation),
      )[0] ?? null;

  const confidence = assessConfidence(recommended, epField, comparison);

  return {
    recommended,
    safest,
    differentiator,
    candidates: ranked,
    risk,
    confidence,
    fieldPicks,
    fieldExpectedPoints: epField,
    reason: "",
  };
}

/**
 * Confidence is descriptive, not calibrated: it reads high when the
 * distribution is concentrated (a clear favorite, a modal scoreline that
 * stands out) and when the pick's expected points sit well clear of the
 * field's. A genuine coin flip reads low no matter what the pick is.
 */
export function assessConfidence(
  recommended: RankedPick,
  epField: number,
  comparison: ComparisonDistribution,
): ConfidenceReport {
  const concentration = comparison.cells.reduce(
    (max, cell) => Math.max(max, cell.probability),
    0,
  );
  const outcomeConcentration = Math.max(
    comparison.outcome.home,
    comparison.outcome.draw,
    comparison.outcome.away,
  );
  const epLead = recommended.expectedPoints - epField;

  const oneSidedness = clamp01((outcomeConcentration - 0.34) / 0.4);
  const modalStrength = clamp01((concentration - 0.09) / 0.09);
  const leadStrength = clamp01(epLead / 0.5);
  const score = 0.45 * oneSidedness + 0.3 * modalStrength + 0.25 * leadStrength;

  const level = score >= 0.6 ? "high" : score >= 0.3 ? "medium" : "low";
  return { level, concentration, outcomeConcentration, epLead };
}
