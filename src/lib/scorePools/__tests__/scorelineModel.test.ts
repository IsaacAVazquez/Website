import {
  buildComparisonDistribution,
  buildGrid,
  calibrateDistribution,
  devigMoneyline,
  devigTotals,
  expectedTotalOfGrid,
  outcomeMasses,
  pOverLine,
  rhoBounds,
  DEFAULT_EXTRA_TIME,
  type CalibrationConfig,
} from "../index";
import { poissonPmf } from "../poisson";

const CONFIG: CalibrationConfig = {
  maxGoals: 7,
  defaultRho: -0.1,
  defaultExpectedTotal: 2.6,
};

function gridSum(grid: number[][]): number {
  return grid.reduce((sum, row) => sum + row.reduce((a, b) => a + b, 0), 0);
}

describe("Dixon-Coles grid", () => {
  it("normalizes to one", () => {
    expect(gridSum(buildGrid(1.5, 1.2, -0.1, 7))).toBeCloseTo(1, 12);
    expect(gridSum(buildGrid(0.4, 3.1, 0.05, 7))).toBeCloseTo(1, 12);
  });

  it("reduces to independent Poisson at rho = 0", () => {
    const grid = buildGrid(1.5, 1.2, 0, 7);
    // Compare against the truncated-and-renormalized product directly.
    let truncated = 0;
    for (let h = 0; h <= 7; h++) {
      for (let a = 0; a <= 7; a++) truncated += poissonPmf(h, 1.5) * poissonPmf(a, 1.2);
    }
    expect(grid[1][0]).toBeCloseTo((poissonPmf(1, 1.5) * poissonPmf(0, 1.2)) / truncated, 12);
    expect(grid[2][2]).toBeCloseTo((poissonPmf(2, 1.5) * poissonPmf(2, 1.2)) / truncated, 12);
  });

  it("negative rho lifts 0-0 and 1-1 and dampens 1-0 and 0-1", () => {
    const independent = buildGrid(1.5, 1.2, 0, 7);
    const corrected = buildGrid(1.5, 1.2, -0.12, 7);
    expect(corrected[0][0]).toBeGreaterThan(independent[0][0]);
    expect(corrected[1][1]).toBeGreaterThan(independent[1][1]);
    expect(corrected[1][0]).toBeLessThan(independent[1][0]);
    expect(corrected[0][1]).toBeLessThan(independent[0][1]);
  });

  it("keeps every cell a probability even for out-of-range rho", () => {
    const grid = buildGrid(2.5, 2.4, 0.9, 7);
    for (const row of grid) for (const p of row) expect(p).toBeGreaterThanOrEqual(0);
    expect(gridSum(grid)).toBeCloseTo(1, 12);
  });

  it("computes the valid rho range", () => {
    const bounds = rhoBounds(1.5, 1.2);
    // The binding lower constraint comes from the larger lambda.
    expect(bounds.lower).toBeCloseTo(-1 / 1.5, 10);
    expect(bounds.upper).toBeCloseTo(1 / (1.5 * 1.2), 10);
  });
});

describe("calibration to market targets", () => {
  it("recovers the generating parameters from a known grid (mean-total anchor)", () => {
    const lambdaHome = 1.45;
    const lambdaAway = 1.15;
    const rho = -0.08;
    const source = buildGrid(lambdaHome, lambdaAway, rho, CONFIG.maxGoals);
    const outcome = outcomeMasses(source);

    const calibrated = calibrateDistribution(
      {
        outcome: { home: outcome.home, draw: outcome.draw, away: outcome.away },
        expectedTotalOverride: expectedTotalOfGrid(source),
      },
      CONFIG,
    );

    expect(calibrated.lambdaHome).toBeCloseTo(lambdaHome, 2);
    expect(calibrated.lambdaAway).toBeCloseTo(lambdaAway, 2);
    expect(calibrated.rho).toBeCloseTo(rho, 2);
    expect(calibrated.outcome.home).toBeCloseTo(outcome.home, 4);
    expect(calibrated.outcome.draw).toBeCloseTo(outcome.draw, 4);
    expect(calibrated.diagnostics.converged).toBe(true);
    expect(calibrated.diagnostics.rhoClamped).toBe(false);
  });

  it("recovers the generating parameters from a priced totals line (quantile anchor)", () => {
    const source = buildGrid(1.7, 0.9, -0.1, CONFIG.maxGoals);
    const outcome = outcomeMasses(source);
    const pOver = pOverLine(source, 2.5);

    const calibrated = calibrateDistribution(
      {
        outcome: { home: outcome.home, draw: outcome.draw, away: outcome.away },
        totals: { line: 2.5, pOver },
      },
      CONFIG,
    );

    expect(calibrated.lambdaHome).toBeCloseTo(1.7, 2);
    expect(calibrated.lambdaAway).toBeCloseTo(0.9, 2);
    expect(pOverLine(calibrated.grid, 2.5)).toBeCloseTo(pOver, 4);
  });

  it("matches a de-vigged market end to end", () => {
    const { probabilities } = devigMoneyline({ home: 2.1, draw: 3.4, away: 3.6 });
    const pOver = devigTotals(1.95, 1.87) as number;
    const calibrated = calibrateDistribution(
      { outcome: probabilities, totals: { line: 2.5, pOver } },
      CONFIG,
    );
    expect(calibrated.outcome.home).toBeCloseTo(probabilities.home, 3);
    expect(calibrated.outcome.draw).toBeCloseTo(probabilities.draw as number, 3);
    expect(calibrated.outcome.away).toBeCloseTo(probabilities.away, 3);
    expect(pOverLine(calibrated.grid, 2.5)).toBeCloseTo(pOver, 3);
  });

  it("treats a bare half-goal line as a fair 50/50 split", () => {
    const calibrated = calibrateDistribution(
      { outcome: { home: 0.4, draw: 0.28, away: 0.32 }, totals: { line: 2.5 } },
      CONFIG,
    );
    expect(pOverLine(calibrated.grid, 2.5)).toBeCloseTo(0.5, 3);
    expect(calibrated.diagnostics.totalsMode).toBe("quantile");
  });

  it("falls back to the default expected total without a totals market", () => {
    const calibrated = calibrateDistribution(
      { outcome: { home: 0.45, draw: 0.27, away: 0.28 } },
      CONFIG,
    );
    expect(calibrated.expectedTotal).toBeCloseTo(CONFIG.defaultExpectedTotal, 3);
    expect(calibrated.diagnostics.totalsMode).toBe("default");
    expect(calibrated.diagnostics.notes.join(" ")).toMatch(/default expected total/i);
  });

  it("clamps rho and reports it when the draw target is unreachable", () => {
    const calibrated = calibrateDistribution(
      // No plausible soccer market prices a 60% draw; the model can't reach
      // it inside the valid correction range and should say so.
      { outcome: { home: 0.25, draw: 0.6, away: 0.15 }, expectedTotalOverride: 2.6 },
      CONFIG,
    );
    expect(calibrated.diagnostics.rhoClamped).toBe(true);
    expect(calibrated.diagnostics.converged).toBe(false);
    // The home/away balance survives even when the draw mass compromises.
    const ratio = calibrated.outcome.home / calibrated.outcome.away;
    expect(ratio).toBeCloseTo(0.25 / 0.15, 1);
  });

  it("calibrates a two-way market against decisive outcomes only", () => {
    const calibrated = calibrateDistribution(
      { outcome: { home: 0.62, away: 0.38 }, expectedTotalOverride: 5.6 },
      { ...CONFIG, maxGoals: 10 },
    );
    const decisive = calibrated.outcome.home + calibrated.outcome.away;
    expect(calibrated.outcome.home / decisive).toBeCloseTo(0.62, 2);
    expect(calibrated.rho).toBe(CONFIG.defaultRho);
    expect(calibrated.expectedTotal).toBeCloseTo(5.6, 2);
  });
});

describe("the comparison distribution (what the pool scores)", () => {
  const dist = calibrateDistribution(
    { outcome: { home: 0.36, draw: 0.31, away: 0.33 }, expectedTotalOverride: 2.2 },
    CONFIG,
  );

  it("is the 90-minute grid under 90-minute scoring, draws intact", () => {
    const comparison = buildComparisonDistribution(dist, {
      basis: "ninetyMinutes",
      knockout: true,
      penaltiesCountAsWin: false,
      extraTime: DEFAULT_EXTRA_TIME,
    });
    const total = comparison.cells.reduce((sum, cell) => sum + cell.probability, 0);
    expect(total).toBeCloseTo(1, 10);
    // The draw-after-90 mass survives even though someone will win the tie —
    // this is exactly what makes draw picks live in 90-minute knockout pools.
    expect(comparison.outcome.draw).toBeCloseTo(dist.outcome.draw, 10);
    expect(comparison.pExtraTime).toBeCloseTo(dist.outcome.draw, 10);
  });

  it("extends draws through extra time under final-result scoring", () => {
    const comparison = buildComparisonDistribution(dist, {
      basis: "finalResult",
      knockout: true,
      penaltiesCountAsWin: false,
      extraTime: DEFAULT_EXTRA_TIME,
    });
    const total = comparison.cells.reduce((sum, cell) => sum + cell.probability, 0);
    expect(total).toBeCloseTo(1, 10);
    // Only games still level after extra time stay draws.
    expect(comparison.outcome.draw).toBeLessThan(dist.outcome.draw);
    expect(comparison.outcome.draw).toBeCloseTo(comparison.pPenalties, 10);
    expect(comparison.pExtraTime).toBeCloseTo(dist.outcome.draw, 10);
    // Extra-time goals push some mass beyond the 90-minute score.
    expect(comparison.outcome.home).toBeGreaterThan(dist.outcome.home);
  });

  it("splits still-level games by the shootout when penalties count as a win", () => {
    const comparison = buildComparisonDistribution(dist, {
      basis: "finalResult",
      knockout: true,
      penaltiesCountAsWin: true,
      extraTime: DEFAULT_EXTRA_TIME,
    });
    expect(comparison.outcome.draw).toBeCloseTo(0, 10);
    expect(comparison.outcome.home + comparison.outcome.away).toBeCloseTo(1, 10);
    // A level score can now carry a win outcome.
    const levelWinCell = comparison.cells.find(
      (cell) => cell.score.home === cell.score.away && cell.outcome === "home",
    );
    expect(levelWinCell).toBeDefined();
  });

  it("ignores the basis distinction outside knockouts", () => {
    const league = buildComparisonDistribution(dist, {
      basis: "finalResult",
      knockout: false,
      penaltiesCountAsWin: false,
      extraTime: DEFAULT_EXTRA_TIME,
    });
    expect(league.outcome.draw).toBeCloseTo(dist.outcome.draw, 10);
    expect(league.pExtraTime).toBe(0);
    expect(league.pPenalties).toBe(0);
  });
});
