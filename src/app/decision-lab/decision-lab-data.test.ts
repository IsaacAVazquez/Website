import { evaluateDecision, getDecisionPresetMetrics } from "./decision-lab-data";

describe("decision-lab-data", () => {
  it("scores onboarding-refresh as ship", () => {
    const evaluation = evaluateDecision(getDecisionPresetMetrics("onboarding-refresh"));

    expect(evaluation.recommendation).toBe("ship");
    expect(evaluation.weightedScore).toBe(72.2);
    expect(evaluation.strongestPositiveAxis).toBe("reversibility");
    expect(evaluation.strongestRiskAxis).toBe("effort");
    expect(evaluation.rationale).toBe(
      "I would ship this. The blast radius is contained, so the team still has room to learn without overcommitting. No single risk stands out at these levels."
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
    // The exact total is 66.95.
    expect(evaluation.weightedScore).toBe(67);
    expect(evaluation.strongestPositiveAxis).toBe("reversibility");
    expect(evaluation.strongestRiskAxis).toBe("confidence");
  });

  it("rounds a total that ends on a half up to the next tenth", () => {
    // 24.85 + 14.5 + 7 + 6.9 is 53.25, which the float sum holds just under.
    expect(evaluateDecision(getDecisionPresetMetrics("enterprise-permissions")).weightedScore).toBe(53.3);
  });

  it("gives two states with the same total and the same gates the same verdict", () => {
    // Both total 67.95 with impact and confidence past the ship gates.
    const first = evaluateDecision({ impact: 65, confidence: 60, effort: 2, reversibility: 38 });
    const second = evaluateDecision({ impact: 66, confidence: 60, effort: 1, reversibility: 34 });

    expect(first.weightedScore).toBe(68);
    expect(second.weightedScore).toBe(68);
    expect(first.recommendation).toBe("ship");
    expect(second.recommendation).toBe("ship");
  });

  it("does not call the best axis strong when every axis is weak", () => {
    // Impact wins the positive pick here at 44, under a hold.
    const { rationale } = evaluateDecision(getDecisionPresetMetrics("notification-rewrite"));

    expect(rationale).toBe(
      "I would hold this for now. None of the four axes is strong enough yet to carry the bet on its own. The delivery cost is still heavy for the likely return, which pushes me toward caution."
    );
  });

  it("never praises and faults the same axis in one rationale", () => {
    // With every slider level, impact wins both picks on the tie.
    const { rationale } = evaluateDecision({ impact: 50, confidence: 50, effort: 50, reversibility: 50 });

    expect(rationale).not.toContain("The upside is strong enough");
    expect(rationale).toContain("The expected upside still looks too shallow");
  });
});
