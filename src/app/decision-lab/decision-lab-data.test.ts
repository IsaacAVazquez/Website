import { evaluateDecision, getDecisionPresetMetrics } from "./decision-lab-data";

describe("decision-lab-data", () => {
  it("scores onboarding-refresh as ship", () => {
    const evaluation = evaluateDecision(getDecisionPresetMetrics("onboarding-refresh"));

    expect(evaluation.recommendation).toBe("ship");
    expect(evaluation.weightedScore).toBe(72.2);
    expect(evaluation.strongestPositiveAxis).toBe("reversibility");
    expect(evaluation.strongestRiskAxis).toBe("effort");
    expect(evaluation.rationale).toBe(
      "I would ship this. The blast radius is contained, so the team still has room to learn without overcommitting. The delivery cost is still heavy for the likely return, which pushes me toward caution."
    );
  });

  it("scores support-copilot as test", () => {
    const evaluation = evaluateDecision(getDecisionPresetMetrics("support-copilot"));

    expect(evaluation.recommendation).toBe("test");
    expect(evaluation.weightedScore).toBe(59.9);
    expect(evaluation.strongestPositiveAxis).toBe("impact");
    expect(evaluation.strongestRiskAxis).toBe("effort");
  });

  it("scores notification-rewrite as hold", () => {
    const evaluation = evaluateDecision(getDecisionPresetMetrics("notification-rewrite"));

    expect(evaluation.recommendation).toBe("hold");
    expect(evaluation.weightedScore).toBe(33.8);
    expect(evaluation.strongestPositiveAxis).toBe("impact");
    expect(evaluation.strongestRiskAxis).toBe("effort");
  });

  it("lets an override flip a preset from ship to test", () => {
    const evaluation = evaluateDecision({
      ...getDecisionPresetMetrics("onboarding-refresh"),
      confidence: 52,
    });

    expect(evaluation.recommendation).toBe("test");
    expect(evaluation.weightedScore).toBe(66.9);
    expect(evaluation.strongestPositiveAxis).toBe("reversibility");
    expect(evaluation.strongestRiskAxis).toBe("confidence");
  });
});
