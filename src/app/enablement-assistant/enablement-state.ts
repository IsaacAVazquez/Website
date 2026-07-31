import {
  DEFAULT_TEAM_INTAKE,
  type TeamIntake,
  type TestLayer,
} from "./enablement-data";

export const INTAKE_STEP_COUNT = 3;

export type IntakeStep = 0 | 1 | 2;

export function clampIntakeStep(step: number): IntakeStep {
  return Math.max(0, Math.min(INTAKE_STEP_COUNT - 1, Math.round(step))) as IntakeStep;
}

export function moveIntakeStep(step: IntakeStep, direction: -1 | 1): IntakeStep {
  return clampIntakeStep(step + direction);
}

export function updateIntake<K extends keyof TeamIntake>(
  intake: TeamIntake,
  key: K,
  value: TeamIntake[K]
): TeamIntake {
  return { ...intake, [key]: value };
}

export function toggleTestLayer(intake: TeamIntake, layer: TestLayer): TeamIntake {
  const hasLayer = intake.layers.includes(layer);
  const layers = hasLayer
    ? intake.layers.filter((candidate) => candidate !== layer)
    : [...intake.layers, layer];
  return { ...intake, layers };
}

export function resetTeamIntake(): TeamIntake {
  return {
    ...DEFAULT_TEAM_INTAKE,
    layers: [...DEFAULT_TEAM_INTAKE.layers],
  };
}
