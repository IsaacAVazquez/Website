import {
  evaluateDecision,
  isDecisionPresetId,
  type DecisionAxis,
  type DecisionMetrics,
  type DecisionRecommendation,
} from "./decision-lab-data";
import type { DecisionLabState } from "./decision-lab-state";

export const SAVED_BETS_KEY = "decision-lab-bets-v1";
export const DECISION_AXES: DecisionAxis[] = [
  "impact",
  "confidence",
  "effort",
  "reversibility",
];
export interface SavedBet extends DecisionLabState {
  id: string;
  name: string;
}

export function saveBet(
  latest: SavedBet[],
  draft: SavedBet,
  original?: SavedBet,
): SavedBet[] {
  const current = latest.find((bet) => bet.id === draft.id);
  if (original && !current) return latest;
  const next = { ...draft };
  if (original && current) {
    for (const field of ["name", "preset", ...DECISION_AXES] as const) {
      if (draft[field] === original[field])
        Object.assign(next, { [field]: current[field] });
    }
  }
  if (current) return latest.map((bet) => (bet.id === draft.id ? next : bet));
  return latest.length < 20 ? [...latest, next] : latest;
}

export function parseSavedBets(raw: string): SavedBet[] {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    return value
      .filter((entry): entry is SavedBet => {
        if (
          !entry ||
          typeof entry !== "object" ||
          typeof entry.id !== "string" ||
          !entry.id ||
          entry.id.length > 100 ||
          seen.has(entry.id) ||
          typeof entry.name !== "string" ||
          !entry.name.trim() ||
          entry.name.length > 80 ||
          !isDecisionPresetId(entry.preset)
        )
          return false;
        if (
          !DECISION_AXES.every(
            (axis) =>
              typeof entry[axis] === "number" &&
              Number.isFinite(entry[axis]) &&
              entry[axis] >= 0 &&
              entry[axis] <= 100,
          )
        )
          return false;
        seen.add(entry.id);
        return true;
      })
      .slice(0, 20)
      .map(
        ({ id, name, preset, impact, confidence, effort, reversibility }) => ({
          id,
          name: name.trim(),
          preset,
          impact,
          confidence,
          effort,
          reversibility,
        }),
      );
  } catch {
    return [];
  }
}

/** Search the same integer input scale as the sliders using the actual verdict gates. */
export function verdictChanges(metrics: DecisionMetrics) {
  const current = evaluateDecision(metrics).recommendation;
  const changes: {
    axis: DecisionAxis;
    to: number;
    verdict: DecisionRecommendation;
  }[] = [];
  for (const axis of DECISION_AXES) {
    const from = metrics[axis];
    // Walk outward one step at a time, lower value first on a tie, and stop at the first flip.
    search: for (let step = 1; step <= 100; step++) {
      for (const to of [from - step, from + step]) {
        if (to < 0 || to > 100) continue;
        const verdict = evaluateDecision({ ...metrics, [axis]: to }).recommendation;
        if (verdict !== current) {
          changes.push({ axis, to, verdict });
          break search;
        }
      }
    }
  }
  return changes;
}
