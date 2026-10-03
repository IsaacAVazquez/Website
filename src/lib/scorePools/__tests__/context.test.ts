import { applyContextAdjustments, suggestContextFlags } from "../context";
import { DEFAULT_CONTEXT_PARAMS } from "../defaults";
import type { CalibrationTargets, ContextParams } from "../types";

// Round numbers so each expected value can be worked out by hand.
const PARAMS: ContextParams = {
  drawSuitsBothDrawBoost: 2,
  drawSuitsBothTotalFactor: 0.5,
  deadRubberTotalFactor: 0.8,
  deadRubberGapFactor: 0.5,
  deadRubberDrawBoost: 1,
  mustWinTotalFactor: 1.5,
  mustWinDrawFactor: 0.5,
  mustWinSideBoost: 2,
  rotationSideFactor: 0.5,
  rotationTotalFactor: 0.9,
};

const threeWay = (): CalibrationTargets => ({
  outcome: { home: 0.5, draw: 0.25, away: 0.25 },
  totals: { line: 2.5, pOver: 0.5 },
});

function sum(outcome: { home: number; draw?: number; away: number }): number {
  return outcome.home + (outcome.draw ?? 0) + outcome.away;
}

describe("applyContextAdjustments", () => {
  it("returns the targets untouched when no flags are passed", () => {
    const targets = threeWay();
    const result = applyContextAdjustments(targets, undefined, PARAMS);
    expect(result).toEqual({ targets, totalFactor: 1, applied: [], audit: [] });
    expect(result.targets).toBe(targets);
  });

  it("treats an object of false flags as no flags", () => {
    const targets = threeWay();
    const result = applyContextAdjustments(
      targets,
      { deadRubber: false, mustWinHome: false },
      PARAMS,
    );
    expect(result.targets).toBe(targets);
    expect(result.totalFactor).toBe(1);
    expect(result.applied).toEqual([]);
  });

  it("dead rubber flattens the favorite's edge and lowers the total", () => {
    const result = applyContextAdjustments(threeWay(), { deadRubber: true }, PARAMS);
    // mid 0.375; home 0.375 + 0.125*0.5 = 0.4375, away 0.3125, draw 0.25; sum 1.
    expect(result.targets.outcome.home).toBeCloseTo(0.4375, 10);
    expect(result.targets.outcome.away).toBeCloseTo(0.3125, 10);
    expect(result.targets.outcome.draw).toBeCloseTo(0.25, 10);
    expect(result.totalFactor).toBeCloseTo(0.8, 10);
    expect(result.applied).toEqual(["deadRubber"]);
    expect(result.audit[0]).toMatch(/Dead rubber/);
    expect(result.targets.totals).toEqual({ line: 2.5, pOver: 0.5 });
  });

  it("draw suits both boosts the draw and renormalizes", () => {
    const result = applyContextAdjustments(threeWay(), { drawSuitsBoth: true }, PARAMS);
    // draw 0.5, sum 1.25.
    expect(result.targets.outcome.draw).toBeCloseTo(0.4, 10);
    expect(result.targets.outcome.home).toBeCloseTo(0.4, 10);
    expect(result.targets.outcome.away).toBeCloseTo(0.2, 10);
    expect(result.totalFactor).toBeCloseTo(0.5, 10);
    expect(result.audit[0]).toMatch(/Draw suits both/);
  });

  it("ignores draw suits both on a two-way market", () => {
    const targets: CalibrationTargets = { outcome: { home: 0.6, away: 0.4 } };
    const result = applyContextAdjustments(targets, { drawSuitsBoth: true }, PARAMS);
    expect(result.targets).toBe(targets);
    expect(result.applied).toEqual([]);
    expect(result.totalFactor).toBe(1);
  });

  it("must-win boosts the named side and trims the draw", () => {
    const home = applyContextAdjustments(threeWay(), { mustWinHome: true }, PARAMS);
    // home 1.0, draw 0.125, away 0.25; sum 1.375.
    expect(home.targets.outcome.home).toBeCloseTo(1 / 1.375, 10);
    expect(home.targets.outcome.draw).toBeCloseTo(0.125 / 1.375, 10);
    expect(home.totalFactor).toBeCloseTo(1.5, 10);
    expect(home.audit[0]).toMatch(/home side/);

    const away = applyContextAdjustments(threeWay(), { mustWinAway: true }, PARAMS);
    // home 0.5, draw 0.125, away 0.5; sum 1.125.
    expect(away.targets.outcome.away).toBeCloseTo(0.5 / 1.125, 10);
    expect(away.targets.outcome.home).toBeCloseTo(0.5 / 1.125, 10);
    expect(away.audit[0]).toMatch(/away side/);
  });

  it("must-win on a two-way market leaves the draw absent", () => {
    const result = applyContextAdjustments(
      { outcome: { home: 0.5, away: 0.5 } },
      { mustWinAway: true },
      PARAMS,
    );
    expect(result.targets.outcome.draw).toBeUndefined();
    expect(result.targets.outcome.away).toBeCloseTo(2 / 3, 10);
  });

  it("dead rubber and home must-win on a two-way market never invent a draw", () => {
    const result = applyContextAdjustments(
      { outcome: { home: 0.6, away: 0.4 } },
      { deadRubber: true, mustWinHome: true },
      PARAMS,
    );
    // Dead rubber: mid 0.5 -> home 0.55, away 0.45; must-win home -> 1.1 vs 0.45.
    expect(result.targets.outcome.draw).toBeUndefined();
    expect(result.targets.outcome.home).toBeCloseTo(1.1 / 1.55, 10);
    expect(result.applied).toEqual(["deadRubber", "mustWinHome"]);
  });

  it("rotation risk weakens the named side", () => {
    const home = applyContextAdjustments(threeWay(), { rotationRiskHome: true }, PARAMS);
    // home 0.25, draw 0.25, away 0.25.
    expect(home.targets.outcome.home).toBeCloseTo(1 / 3, 10);
    expect(home.totalFactor).toBeCloseTo(0.9, 10);
    expect(home.audit[0]).toMatch(/Rotation risk for the home side/);

    const away = applyContextAdjustments(threeWay(), { rotationRiskAway: true }, PARAMS);
    // home 0.5, draw 0.25, away 0.125; sum 0.875.
    expect(away.targets.outcome.away).toBeCloseTo(0.125 / 0.875, 10);
    expect(away.audit[0]).toMatch(/Rotation risk for the away side/);
  });

  it("composes every flag multiplicatively, in a stable order, with one audit line each", () => {
    const result = applyContextAdjustments(
      threeWay(),
      {
        deadRubber: true,
        drawSuitsBoth: true,
        mustWinHome: true,
        mustWinAway: true,
        rotationRiskHome: true,
        rotationRiskAway: true,
      },
      PARAMS,
    );
    expect(result.applied).toEqual([
      "deadRubber",
      "drawSuitsBoth",
      "mustWinHome",
      "mustWinAway",
      "rotationRiskHome",
      "rotationRiskAway",
    ]);
    expect(result.audit).toHaveLength(6);
    expect(result.totalFactor).toBeCloseTo(0.8 * 0.5 * 1.5 * 1.5 * 0.9 * 0.9, 10);
    expect(sum(result.targets.outcome)).toBeCloseTo(1, 10);
  });

  it("folds the total factor into an expected-total override instead of returning it", () => {
    const result = applyContextAdjustments(
      { outcome: { home: 0.5, draw: 0.25, away: 0.25 }, expectedTotalOverride: 3 },
      { deadRubber: true },
      PARAMS,
    );
    expect(result.targets.expectedTotalOverride).toBeCloseTo(2.4, 10);
    expect(result.totalFactor).toBe(1);
  });

  it("does not touch an override when the flags leave the total alone", () => {
    const params = { ...PARAMS, rotationTotalFactor: 1 };
    const result = applyContextAdjustments(
      { outcome: { home: 0.5, draw: 0.25, away: 0.25 }, expectedTotalOverride: 3 },
      { rotationRiskHome: true },
      params,
    );
    expect(result.targets.expectedTotalOverride).toBe(3);
    expect(result.totalFactor).toBe(1);
  });

  it("keeps the default parameters modest", () => {
    const result = applyContextAdjustments(threeWay(), { deadRubber: true }, DEFAULT_CONTEXT_PARAMS);
    expect(result.totalFactor).toBe(DEFAULT_CONTEXT_PARAMS.deadRubberTotalFactor);
    expect(Math.abs(result.targets.outcome.home - 0.5)).toBeLessThan(0.05);
  });
});

describe("suggestContextFlags", () => {
  it("suggests nothing without standings", () => {
    expect(suggestContextFlags("Alpha", "Beta", undefined)).toEqual([]);
    expect(suggestContextFlags("Alpha", "Beta", [])).toEqual([]);
  });

  it("suggests nothing when either team is missing from the table", () => {
    expect(
      suggestContextFlags("Alpha", "Beta", [{ team: "Alpha", qualified: true }]),
    ).toEqual([]);
  });

  it("suggests a dead rubber and draw-suits-both when both are through, matching names case-insensitively", () => {
    const suggestions = suggestContextFlags("alpha", "BETA", [
      { team: "Alpha", qualified: true },
      { team: "Beta", qualified: true },
    ]);
    expect(suggestions.map((s) => s.flag)).toEqual(["deadRubber", "drawSuitsBoth"]);
    expect(suggestions.every((s) => s.source === "standings")).toBe(true);
  });

  it("suggests only a dead rubber when both are out", () => {
    const suggestions = suggestContextFlags("Alpha", "Beta", [
      { team: "Alpha", eliminated: true },
      { team: "Beta", eliminated: true },
    ]);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].flag).toBe("deadRubber");
    expect(suggestions[0].reason).toMatch(/already out/);
  });

  it("suggests nothing when only one side is settled or the state is unknown", () => {
    expect(
      suggestContextFlags("Alpha", "Beta", [
        { team: "Alpha", qualified: true },
        { team: "Beta", qualified: null },
      ]),
    ).toEqual([]);
    expect(
      suggestContextFlags("Alpha", "Beta", [
        { team: "Alpha", qualified: true },
        { team: "Beta", eliminated: true },
      ]),
    ).toEqual([]);
  });
});
