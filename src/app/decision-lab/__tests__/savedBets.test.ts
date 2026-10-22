import { parseSavedBets, saveBet, verdictChanges } from "../decisionSaved";
import { DECISION_PRESETS, evaluateDecision } from "../decision-lab-data";

it("rejects invalid persisted metrics, duplicate ids, and blank names", () => {
  const bet = {
    ...DECISION_PRESETS[0],
    id: "one",
    name: "My bet",
    preset: DECISION_PRESETS[0].id,
  };
  expect(
    parseSavedBets(
      JSON.stringify([
        bet,
        bet,
        { ...bet, id: "two", impact: 101 },
        { ...bet, id: "three", name: " " },
      ]),
    ),
  ).toHaveLength(1);
  expect(parseSavedBets("null")).toEqual([]);
});

it("preserves independent edits and removals from another tab", () => {
  const original = {
    ...DECISION_PRESETS[0],
    id: "one",
    name: "My bet",
    preset: DECISION_PRESETS[0].id,
  };
  const newer = { ...original, name: "Renamed elsewhere", impact: 90 };
  const saved = saveBet([newer], { ...original, confidence: 70 }, original)[0];
  expect(saved).toMatchObject({ name: newer.name, impact: 90, confidence: 70 });
  expect(saveBet([], original, original)).toEqual([]);
});

it("finds actual nearest single-input verdict changes", () => {
  for (const preset of DECISION_PRESETS) {
    for (const change of verdictChanges(preset)) {
      expect(
        evaluateDecision({ ...preset, [change.axis]: change.to })
          .recommendation,
      ).toBe(change.verdict);
      expect(change.verdict).not.toBe(evaluateDecision(preset).recommendation);
      for (
        let delta = 1;
        delta < Math.abs(change.to - preset[change.axis]);
        delta++
      ) {
        for (const direction of [-1, 1]) {
          const value = preset[change.axis] + delta * direction;
          if (value >= 0 && value <= 100)
            expect(
              evaluateDecision({ ...preset, [change.axis]: value })
                .recommendation,
            ).toBe(evaluateDecision(preset).recommendation);
        }
      }
    }
  }
});
