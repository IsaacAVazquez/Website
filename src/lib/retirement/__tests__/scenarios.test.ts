import { createDefaultPlan } from "../defaults";
import {
  compareRetirementScenarios,
  parseRetirementScenarios,
  changedPlanGroups,
} from "../scenarios";

const scenario = (id: string, extra = {}) => ({
  id,
  name: id,
  savedAt: "2026-10-26T12:00:00Z",
  plan: createDefaultPlan(),
  ...extra,
});

it("rejects damaged records, deduplicates identities, and bounds saved plans", () => {
  const rows = Array.from({ length: 24 }, (_, i) => scenario(`plan-${i}`));
  const parsed = parseRetirementScenarios(
    JSON.stringify([null, scenario("bad", { plan: {} }), ...rows, rows[0]]),
  );
  expect(parsed).toHaveLength(20);
  expect(new Set(parsed.map((row) => row.id)).size).toBe(20);
  expect(parseRetirementScenarios("broken")).toEqual([]);
});

it("recalculates selected plans without changing their saved assumptions", () => {
  const first = scenario("first");
  first.plan.assumptions.simulations = 100;
  const second = scenario("second", {
    plan: { ...first.plan, desiredAnnualSpend: 20000 },
  });
  const before = JSON.stringify([first, second]);
  const result = compareRetirementScenarios([first, second], 2026);
  expect(result).toHaveLength(2);
  expect(result[1].result!.monteCarlo.successRate).toBeGreaterThanOrEqual(
    result[0].result!.monteCarlo.successRate,
  );
  expect(JSON.stringify([first, second])).toBe(before);
  expect(changedPlanGroups(first.plan, second.plan)).toEqual([
    "Annual spending",
  ]);
  expect(compareRetirementScenarios(Array(6).fill(first), 2026)).toHaveLength(
    4,
  );
});
