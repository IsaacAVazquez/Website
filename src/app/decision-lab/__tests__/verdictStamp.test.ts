import { evaluateDecision, getDecisionPresetMetrics } from "../decision-lab-data";
import { DEFAULT_DECISION_LAB_STATE } from "../decision-lab-state";
import { verdictContributions, verdictStamp } from "../verdictStamp";

describe("verdictStamp", () => {
  it("maps each recommendation to its stamp word", () => {
    expect(verdictStamp("ship").word).toBe("SHIP");
    expect(verdictStamp("test").word).toBe("TEST");
    expect(verdictStamp("hold").word).toBe("HOLD");
  });
});

describe("verdictContributions", () => {
  function summedScore(metrics: Parameters<typeof verdictContributions>[0]): number {
    const total = verdictContributions(metrics).reduce((sum, row) => sum + row.contribution, 0);
    return Number(total.toFixed(1));
  }

  it("prints the four rows in impact, confidence, effort, reversibility order", () => {
    const rows = verdictContributions({ impact: 1, confidence: 2, effort: 3, reversibility: 4 });
    expect(rows.map((row) => row.axis)).toEqual(["impact", "confidence", "effort", "reversibility"]);
  });

  it("sums to evaluateDecision's weighted score for the default state", () => {
    expect(summedScore(DEFAULT_DECISION_LAB_STATE)).toBe(
      evaluateDecision(DEFAULT_DECISION_LAB_STATE).weightedScore
    );
  });

  it("sums to evaluateDecision's weighted score for a preset that ships", () => {
    const metrics = getDecisionPresetMetrics("onboarding-refresh");
    expect(summedScore(metrics)).toBe(evaluateDecision(metrics).weightedScore);
  });

  it("sums to evaluateDecision's weighted score for a preset that holds", () => {
    const metrics = getDecisionPresetMetrics("notification-rewrite");
    expect(summedScore(metrics)).toBe(evaluateDecision(metrics).weightedScore);
  });

  it("inverts effort so a lower build cost reads as a higher raw score", () => {
    const rows = verdictContributions({ impact: 50, confidence: 50, effort: 30, reversibility: 50 });
    const effort = rows.find((row) => row.axis === "effort")!;
    expect(effort.raw).toBe(70);
    expect(effort.contribution).toBeCloseTo(70 * 0.25);
  });

  it("handles the all-zero edge case, where only inverted effort contributes", () => {
    const rows = verdictContributions({ impact: 0, confidence: 0, effort: 0, reversibility: 0 });
    const effort = rows.find((row) => row.axis === "effort")!;
    expect(effort.raw).toBe(100);
    const total = rows.reduce((sum, row) => sum + row.contribution, 0);
    expect(total).toBeCloseTo(25);
  });

  it("handles the all-maxed edge case, where inverted effort drops to zero", () => {
    const rows = verdictContributions({ impact: 100, confidence: 100, effort: 100, reversibility: 100 });
    const effort = rows.find((row) => row.axis === "effort")!;
    expect(effort.raw).toBe(0);
    expect(effort.contribution).toBe(0);
    const total = rows.reduce((sum, row) => sum + row.contribution, 0);
    expect(total).toBeCloseTo(75);
  });
});
