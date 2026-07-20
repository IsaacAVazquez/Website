import {
  buildComparisonDistribution,
  calibrateDistribution,
  devigMoneyline,
  devigTotals,
  evaluateCandidate,
  evaluateCandidates,
  DEFAULT_EXTRA_TIME,
  DEFAULT_SCORING_RULES,
  type CalibrationConfig,
  type ComparisonDistribution,
} from "../index";

const RULES = DEFAULT_SCORING_RULES;
const CONFIG: CalibrationConfig = {
  maxGoals: 7,
  defaultRho: -0.1,
  defaultExpectedTotal: 2.6,
};

describe("expected points on a handcrafted distribution (exact arithmetic)", () => {
  // Five cells, hand-checkable: EP(pick) = Σ P(actual) · points(pick, actual).
  const comparison: ComparisonDistribution = {
    basis: "ninetyMinutes",
    cells: [
      { score: { home: 0, away: 0 }, outcome: "draw", probability: 0.2 },
      { score: { home: 1, away: 1 }, outcome: "draw", probability: 0.15 },
      { score: { home: 1, away: 0 }, outcome: "home", probability: 0.3 },
      { score: { home: 2, away: 1 }, outcome: "home", probability: 0.2 },
      { score: { home: 0, away: 1 }, outcome: "away", probability: 0.15 },
    ],
    outcome: { home: 0.5, draw: 0.35, away: 0.15 },
    pExtraTime: 0,
    pPenalties: 0,
  };

  it("computes each candidate's expected points exactly", () => {
    // 1-0: 5(.3) exact + 3(.2) via 2-1 sharing winner and difference = 2.1
    expect(
      evaluateCandidate({ home: 1, away: 0 }, comparison, RULES).expectedPoints,
    ).toBeCloseTo(2.1, 12);
    // 2-1: 5(.2) + 3(.3) = 1.9
    expect(
      evaluateCandidate({ home: 2, away: 1 }, comparison, RULES).expectedPoints,
    ).toBeCloseTo(1.9, 12);
    // 0-0: 5(.2) + 3(.15) = 1.45
    expect(
      evaluateCandidate({ home: 0, away: 0 }, comparison, RULES).expectedPoints,
    ).toBeCloseTo(1.45, 12);
    // 1-1: 5(.15) + 3(.2) = 1.35
    expect(
      evaluateCandidate({ home: 1, away: 1 }, comparison, RULES).expectedPoints,
    ).toBeCloseTo(1.35, 12);
    // 0-1: 5(.15) = 0.75, nothing else shares the away outcome
    expect(
      evaluateCandidate({ home: 0, away: 1 }, comparison, RULES).expectedPoints,
    ).toBeCloseTo(0.75, 12);
    // 2-0: no exact, no difference match, outcome tier on every home win = 2(.5) = 1.0
    expect(
      evaluateCandidate({ home: 2, away: 0 }, comparison, RULES).expectedPoints,
    ).toBeCloseTo(1.0, 12);
  });

  it("computes variance and floor exactly", () => {
    const pick = evaluateCandidate({ home: 0, away: 1 }, comparison, RULES);
    // Points are 5 with p=.15 else 0: Var = 25(.15) − 0.75² = 3.1875.
    expect(pick.variance).toBeCloseTo(3.1875, 12);
    expect(pick.pAnyPoints).toBeCloseTo(0.15, 12);
    expect(pick.pZero).toBeCloseTo(0.85, 12);

    const draw = evaluateCandidate({ home: 1, away: 1 }, comparison, RULES);
    expect(draw.pExact).toBeCloseTo(0.15, 12);
    expect(draw.pDifference).toBeCloseTo(0.2, 12);
    expect(draw.pAnyPoints).toBeCloseTo(0.35, 12);
  });

  it("ranks candidates by expected points", () => {
    const ranked = evaluateCandidates(comparison, RULES);
    expect(ranked[0].score).toEqual({ home: 1, away: 0 });
    expect(ranked[0].expectedPoints).toBeCloseTo(2.1, 12);
  });
});

describe("the draw-beats-favorite behavior (the regression that matters)", () => {
  // A tight, lowish-total game: home favorite at 2.60, draw at 3.00.
  // The favorite is genuinely likelier to win than the game is to draw —
  // and the draw pick still wins on expected points, because it collects
  // the difference tier on every draw while 1-0 only collects on
  // one-goal home wins.
  const { probabilities } = devigMoneyline({ home: 2.6, draw: 3.0, away: 3.05 });
  const pOver = devigTotals(2.2, 1.7) as number;
  const dist = calibrateDistribution(
    { outcome: probabilities, totals: { line: 2.5, pOver } },
    CONFIG,
  );

  it("the favorite is likelier to win than the game is to draw", () => {
    expect(dist.outcome.home).toBeGreaterThan(dist.outcome.draw);
    expect(dist.outcome.home).toBeGreaterThan(dist.outcome.away);
  });

  it("yet the draw pick tops expected points under 90-minute scoring", () => {
    const comparison = buildComparisonDistribution(dist, {
      basis: "ninetyMinutes",
      knockout: false,
      penaltiesCountAsWin: false,
      extraTime: DEFAULT_EXTRA_TIME,
    });
    const ranked = evaluateCandidates(comparison, RULES);
    expect(ranked[0].score).toEqual({ home: 1, away: 1 });

    const ep = (home: number, away: number) =>
      ranked.find((c) => c.score.home === home && c.score.away === away)!.expectedPoints;
    expect(ep(1, 1)).toBeGreaterThan(ep(1, 0));
    expect(ep(1, 1)).toBeGreaterThan(ep(2, 1));
  });

  it("the scoring basis genuinely changes the recommended pick in a knockout", () => {
    const under90 = buildComparisonDistribution(dist, {
      basis: "ninetyMinutes",
      knockout: true,
      penaltiesCountAsWin: false,
      extraTime: DEFAULT_EXTRA_TIME,
    });
    const underFinal = buildComparisonDistribution(dist, {
      basis: "finalResult",
      knockout: true,
      penaltiesCountAsWin: false,
      extraTime: DEFAULT_EXTRA_TIME,
    });
    const top90 = evaluateCandidates(under90, RULES)[0];
    const topFinal = evaluateCandidates(underFinal, RULES)[0];

    // Under 90-minute scoring the draw-after-90 mass makes 1-1 the play.
    expect(top90.score.home).toBe(top90.score.away);
    // Under final-result scoring most draws resolve in extra time, so the
    // sharp play moves off the draw.
    expect(topFinal.score.home).not.toBe(topFinal.score.away);
  });

  it("a heavy favorite stays the pick when the game isn't tight", () => {
    const heavy = devigMoneyline({ home: 1.25, draw: 6.0, away: 11.0 });
    const heavyDist = calibrateDistribution(
      { outcome: heavy.probabilities, totals: { line: 2.5 } },
      CONFIG,
    );
    const comparison = buildComparisonDistribution(heavyDist, {
      basis: "ninetyMinutes",
      knockout: false,
      penaltiesCountAsWin: false,
      extraTime: DEFAULT_EXTRA_TIME,
    });
    const top = evaluateCandidates(comparison, RULES)[0];
    expect(top.score.home).toBeGreaterThan(top.score.away);
  });
});

describe("custom candidate lists", () => {
  it("evaluates only the candidates it is given", () => {
    const comparison: ComparisonDistribution = {
      basis: "ninetyMinutes",
      cells: [
        { score: { home: 1, away: 0 }, outcome: "home", probability: 0.6 },
        { score: { home: 0, away: 0 }, outcome: "draw", probability: 0.4 },
      ],
      outcome: { home: 0.6, draw: 0.4, away: 0 },
      pExtraTime: 0,
      pPenalties: 0,
    };
    const ranked = evaluateCandidates(comparison, RULES, [
      { home: 0, away: 0 },
      { home: 2, away: 0 },
    ]);
    expect(ranked).toHaveLength(2);
    expect(ranked[0].score).toEqual({ home: 0, away: 0 });
    // 0-0: 5(.4) = 2.0; 2-0: outcome tier only, 2(.6) = 1.2.
    expect(ranked[0].expectedPoints).toBeCloseTo(2.0, 12);
    expect(ranked[1].expectedPoints).toBeCloseTo(1.2, 12);
  });
});
