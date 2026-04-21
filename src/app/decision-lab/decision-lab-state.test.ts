import {
  buildDecisionLabHref,
  DEFAULT_DECISION_LAB_STATE,
  normalizeDecisionLabState,
} from "./decision-lab-state";

describe("decision-lab-state", () => {
  it("returns the default support-copilot state when params are empty", () => {
    expect(normalizeDecisionLabState({})).toEqual(DEFAULT_DECISION_LAB_STATE);
  });

  it("falls back to the default preset and clamps integer overrides", () => {
    expect(
      normalizeDecisionLabState({
        preset: "bad",
        impact: "140",
        confidence: "-4",
        effort: "not-a-number",
        reversibility: "101",
      })
    ).toEqual({
      preset: "support-copilot",
      impact: 100,
      confidence: 0,
      effort: 64,
      reversibility: 100,
    });
  });

  it("uses preset defaults and only applies valid overrides on top", () => {
    expect(
      normalizeDecisionLabState({
        preset: "onboarding-refresh",
        confidence: "52",
      })
    ).toEqual({
      preset: "onboarding-refresh",
      impact: 76,
      confidence: 52,
      effort: 38,
      reversibility: 79,
    });
  });

  it("omits default params and only serializes preset-specific overrides", () => {
    expect(buildDecisionLabHref(DEFAULT_DECISION_LAB_STATE)).toBe("/decision-lab");
    expect(
      buildDecisionLabHref({
        preset: "onboarding-refresh",
        impact: 76,
        confidence: 73,
        effort: 38,
        reversibility: 79,
      })
    ).toBe("/decision-lab?preset=onboarding-refresh");
    expect(
      buildDecisionLabHref({
        preset: "onboarding-refresh",
        impact: 76,
        confidence: 52,
        effort: 38,
        reversibility: 79,
      })
    ).toBe("/decision-lab?preset=onboarding-refresh&confidence=52");
  });
});
