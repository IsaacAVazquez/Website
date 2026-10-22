import {
  CI_OPTIONS,
  LANGUAGE_OPTIONS,
  MATURITY_OPTIONS,
  SURFACE_OPTIONS,
  TEAM_SIZE_OPTIONS,
  TEST_LAYER_OPTIONS,
  type TeamIntake,
} from "./enablement-data";
import { generateOnboardingPlan } from "./enablement-engine";

export const TEAM_RECORDS_KEY = "enablement-teams-v1";

export function setTeamProgress(latest: TeamRecord[], id: string, intake: TeamIntake, stepId: string, checked: boolean): TeamRecord[] {
  return latest.map((team) => {
    if (team.id !== id || JSON.stringify(team.intake) !== JSON.stringify(intake) || !generateOnboardingPlan(team.intake).some((step) => step.id === stepId)) return team;
    return { ...team, completedSteps: checked ? [...new Set([...team.completedSteps, stepId])] : team.completedSteps.filter((step) => step !== stepId) };
  });
}
export interface TeamRecord {
  id: string;
  name: string;
  intake: TeamIntake;
  standardStatus: "standard" | "partial" | "drift";
  resolvedQuestions: number;
  escalatedQuestions: number;
  completedSteps: string[];
}
export function parseTeamRecords(raw: string): TeamRecord[] {
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const result: TeamRecord[] = [];
    const seen = new Set<string>();
    for (const team of data.slice(0, 100)) {
      if (
        !team ||
        typeof team.id !== "string" ||
        !team.id ||
        team.id.length > 100 ||
        seen.has(team.id) ||
        typeof team.name !== "string" ||
        !team.name.trim() ||
        team.name.length > 80
      )
        continue;
      const intake = team.intake;
      if (
        !intake ||
        !SURFACE_OPTIONS.some((o) => o.value === intake.surface) ||
        !LANGUAGE_OPTIONS.some((o) => o.value === intake.language) ||
        !CI_OPTIONS.some((o) => o.value === intake.ci) ||
        !MATURITY_OPTIONS.some((o) => o.value === intake.maturity) ||
        !TEAM_SIZE_OPTIONS.some((o) => o.value === intake.teamSize) ||
        typeof intake.hasQualityEngineer !== "boolean" ||
        !Array.isArray(intake.layers) ||
        !intake.layers.every((layer: unknown) =>
          TEST_LAYER_OPTIONS.some((o) => o.value === layer),
        )
      )
        continue;
      if (
        !["standard", "partial", "drift"].includes(team.standardStatus) ||
        ![team.resolvedQuestions, team.escalatedQuestions].every(
          (count) =>
            Number.isInteger(count) && count >= 0 && count <= 1_000_000,
        )
      )
        continue;
      const cleanIntake: TeamIntake = {
        surface: intake.surface,
        language: intake.language,
        ci: intake.ci,
        maturity: intake.maturity,
        teamSize: intake.teamSize,
        hasQualityEngineer: intake.hasQualityEngineer,
        layers: [...new Set<TeamIntake["layers"][number]>(intake.layers)],
      };
      const steps = new Set(
        generateOnboardingPlan(cleanIntake).map((step) => step.id),
      );
      result.push({
        id: team.id,
        name: team.name.trim(),
        intake: cleanIntake,
        standardStatus: team.standardStatus,
        resolvedQuestions: team.resolvedQuestions,
        escalatedQuestions: team.escalatedQuestions,
        completedSteps: Array.isArray(team.completedSteps)
          ? [
              ...new Set<string>(
                team.completedSteps.filter(
                  (id: unknown): id is string =>
                    typeof id === "string" && steps.has(id),
                ),
              ),
            ]
          : [],
      });
      seen.add(team.id);
      if (result.length === 50) break;
    }
    return result;
  } catch {
    return [];
  }
}
export function saveTeamRecord(
  latest: TeamRecord[],
  draft: TeamRecord,
  original?: TeamRecord,
): TeamRecord[] {
  const previous = latest.find((team) => team.id === draft.id);
  if (original && !previous) return latest;
  const merged = { ...draft, intake: { ...draft.intake } };
  if (previous && original) {
    for (const field of [
      "name",
      "standardStatus",
      "resolvedQuestions",
      "escalatedQuestions",
    ] as const) {
      if (draft[field] === original[field])
        Object.assign(merged, { [field]: previous[field] });
    }
    for (const field of Object.keys(original.intake) as (keyof TeamIntake)[]) {
      if (
        JSON.stringify(draft.intake[field]) ===
        JSON.stringify(original.intake[field])
      )
        Object.assign(merged.intake, { [field]: previous.intake[field] });
    }
  }
  const sameIntake =
    previous &&
    JSON.stringify(previous.intake) === JSON.stringify(merged.intake);
  const next = {
    ...merged,
    completedSteps: sameIntake ? previous.completedSteps : [],
  };
  return previous
    ? latest.map((team) => (team.id === next.id ? next : team))
    : [...latest, next].slice(0, 50);
}
