import { DEFAULT_TEAM_INTAKE } from "./enablement-data";
import {
  clampIntakeStep,
  moveIntakeStep,
  resetTeamIntake,
  toggleTestLayer,
  updateIntake,
} from "./enablement-state";

describe("enablement intake state", () => {
  it("keeps step navigation inside the three-step intake", () => {
    expect(clampIntakeStep(-4)).toBe(0);
    expect(clampIntakeStep(9)).toBe(2);
    expect(moveIntakeStep(1, 1)).toBe(2);
    expect(moveIntakeStep(0, -1)).toBe(0);
  });

  it("updates scalar answers without dropping the remaining intake", () => {
    const updated = updateIntake(DEFAULT_TEAM_INTAKE, "surface", "backend");

    expect(updated.surface).toBe("backend");
    expect(updated.ci).toBe(DEFAULT_TEAM_INTAKE.ci);
    expect(updated.layers).toEqual(DEFAULT_TEAM_INTAKE.layers);
  });

  it("adds and removes test layers without mutating the original", () => {
    const withoutUnit = toggleTestLayer(DEFAULT_TEAM_INTAKE, "unit");
    const withPerformance = toggleTestLayer(DEFAULT_TEAM_INTAKE, "performance");

    expect(withoutUnit.layers).not.toContain("unit");
    expect(withPerformance.layers).toContain("performance");
    expect(DEFAULT_TEAM_INTAKE.layers).toContain("unit");
  });

  it("returns a fresh copy of the default layer array", () => {
    const first = resetTeamIntake();
    const second = resetTeamIntake();

    expect(first).toEqual(DEFAULT_TEAM_INTAKE);
    expect(first.layers).not.toBe(second.layers);
  });
});
