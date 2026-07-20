import {
  buildComparisonDistribution,
  buildFieldPicks,
  calibrateDistribution,
  deriveRiskProfile,
  devigMoneyline,
  devigTotals,
  evaluateCandidates,
  recommendPick,
  DEFAULT_EXTRA_TIME,
  DEFAULT_FIELD_CONFIG,
  DEFAULT_RISK_PARAMS,
  DEFAULT_SCORING_RULES,
  type CalibrationConfig,
  type StandingContext,
} from "../index";

const RULES = DEFAULT_SCORING_RULES;
const CONFIG: CalibrationConfig = {
  maxGoals: 7,
  defaultRho: -0.1,
  defaultExpectedTotal: 2.6,
};

function standing(overrides: Partial<StandingContext>): StandingContext {
  return {
    myPoints: 50,
    nearestAbovePoints: null,
    nearestBelowPoints: null,
    poolSize: 10,
    gamesRemaining: 5,
    posture: "auto",
    ...overrides,
  };
}

// The tight game from the optimizer tests: home favorite, live draw.
const tight = calibrateDistribution(
  {
    outcome: devigMoneyline({ home: 2.6, draw: 3.0, away: 3.05 }).probabilities,
    totals: { line: 2.5, pOver: devigTotals(2.2, 1.7) as number },
  },
  CONFIG,
);
const tightComparison = buildComparisonDistribution(tight, {
  basis: "ninetyMinutes",
  knockout: false,
  penaltiesCountAsWin: false,
  extraTime: DEFAULT_EXTRA_TIME,
});
const tightCandidates = evaluateCandidates(tightComparison, RULES);
const tightField = buildFieldPicks(tight, DEFAULT_FIELD_CONFIG);

describe("field model", () => {
  it("concentrates the room on the favorite's modal scoreline", () => {
    const heavy = calibrateDistribution(
      {
        outcome: devigMoneyline({ home: 1.25, draw: 6.0, away: 11.0 }).probabilities,
        totals: { line: 2.5 },
      },
      CONFIG,
    );
    const field = buildFieldPicks(heavy, DEFAULT_FIELD_CONFIG);
    expect(field[0].share).toBeCloseTo(DEFAULT_FIELD_CONFIG.modalShare, 10);
    expect(field[0].score.home).toBeGreaterThan(field[0].score.away);
    expect(field.reduce((sum, pick) => sum + pick.share, 0)).toBeCloseTo(1, 10);
  });

  it("puts a visible slice on 1-1 in a tight game", () => {
    const drawPick = tightField.find(
      (pick) => pick.score.home === 1 && pick.score.away === 1,
    );
    expect(drawPick).toBeDefined();
    expect((drawPick as { share: number }).share).toBeGreaterThan(0.05);
  });

  it("known rival picks replace the heuristic wholesale", () => {
    const field = buildFieldPicks(tight, {
      ...DEFAULT_FIELD_CONFIG,
      overrides: [
        { score: { home: 2, away: 1 }, share: 7 },
        { score: { home: 1, away: 1 }, share: 3 },
      ],
    });
    expect(field).toHaveLength(2);
    expect(field[0].share).toBeCloseTo(0.7, 10);
    expect(field[1].share).toBeCloseTo(0.3, 10);
  });
});

describe("risk profile from the standing", () => {
  it("a slim lead late means strong variance aversion", () => {
    const profile = deriveRiskProfile(
      standing({ nearestBelowPoints: 49, gamesRemaining: 2 }),
      RULES,
      DEFAULT_RISK_PARAMS,
    );
    expect(profile.derivedPosture).toBe("protect");
    expect(profile.k).toBeLessThan(-0.4);
  });

  it("a ten-point lead with ten to play protects far less than one point with two", () => {
    const slim = deriveRiskProfile(
      standing({ nearestBelowPoints: 49, gamesRemaining: 2 }),
      RULES,
      DEFAULT_RISK_PARAMS,
    );
    const comfortable = deriveRiskProfile(
      standing({ myPoints: 60, nearestBelowPoints: 50, gamesRemaining: 10 }),
      RULES,
      DEFAULT_RISK_PARAMS,
    );
    expect(slim.k).toBeLessThan(comfortable.k);
    expect(comfortable.k).toBeLessThan(0);
  });

  it("an uncatchable lead frees the pick back to expected points", () => {
    const profile = deriveRiskProfile(
      standing({ myPoints: 80, nearestBelowPoints: 40, gamesRemaining: 3 }),
      RULES,
      DEFAULT_RISK_PARAMS,
    );
    expect(profile.derivedPosture).toBe("neutral");
    expect(Math.abs(profile.k)).toBeLessThan(0.05);
  });

  it("trailing turns the appetite positive, scaled by the deficit", () => {
    const smallDeficit = deriveRiskProfile(
      standing({ nearestAbovePoints: 52, gamesRemaining: 8 }),
      RULES,
      DEFAULT_RISK_PARAMS,
    );
    const bigDeficit = deriveRiskProfile(
      standing({ nearestAbovePoints: 58, gamesRemaining: 2 }),
      RULES,
      DEFAULT_RISK_PARAMS,
    );
    expect(smallDeficit.k).toBeGreaterThan(0);
    expect(bigDeficit.k).toBeGreaterThan(smallDeficit.k);
  });

  it("mid-pack pressures roughly cancel", () => {
    const profile = deriveRiskProfile(
      standing({ nearestAbovePoints: 52, nearestBelowPoints: 48, gamesRemaining: 5 }),
      RULES,
      DEFAULT_RISK_PARAMS,
    );
    expect(Math.abs(profile.k)).toBeLessThan(0.15);
  });

  it("forced postures override the derivation", () => {
    expect(
      deriveRiskProfile(standing({ posture: "neutral", nearestBelowPoints: 49 }), RULES, DEFAULT_RISK_PARAMS).k,
    ).toBe(0);
    expect(
      deriveRiskProfile(
        standing({ posture: "chase", nearestAbovePoints: null }),
        RULES,
        DEFAULT_RISK_PARAMS,
      ).k,
    ).toBeGreaterThan(0);
  });
});

describe("standing-aware recommendation", () => {
  it("neutral posture takes the raw expected-points winner (the draw)", () => {
    const rec = recommendPick(
      tightCandidates,
      tightField,
      tightComparison,
      RULES,
      standing({ posture: "neutral" }),
      DEFAULT_RISK_PARAMS,
    );
    expect(rec.recommended.score).toEqual({ home: 1, away: 1 });
  });

  it("protecting a slim lead moves the pick to the field's chalk", () => {
    const rec = recommendPick(
      tightCandidates,
      tightField,
      tightComparison,
      RULES,
      standing({ posture: "protect", nearestBelowPoints: 49, gamesRemaining: 2 }),
      DEFAULT_RISK_PARAMS,
    );
    expect(rec.recommended.score).toEqual(tightField[0].score);
    // Moving with the room collapses the variance of the points gap.
    expect(rec.recommended.relative.standardDeviation).toBeLessThan(
      rec.candidates.find(
        (pick) => pick.score.home === 1 && pick.score.away === 1,
      )!.relative.standardDeviation,
    );
  });

  it("chasing surfaces a real differentiator with low field ownership", () => {
    const rec = recommendPick(
      tightCandidates,
      tightField,
      tightComparison,
      RULES,
      standing({ posture: "chase", nearestAbovePoints: 58, gamesRemaining: 2 }),
      DEFAULT_RISK_PARAMS,
    );
    expect(rec.differentiator).not.toBeNull();
    const diff = rec.differentiator!;
    expect(diff.fieldShare).toBeLessThanOrEqual(DEFAULT_RISK_PARAMS.diffMaxFieldShare);
    // A differentiator has to be competitive on expected points, not a punt.
    const topEp = Math.max(...rec.candidates.map((pick) => pick.expectedPoints));
    expect(diff.expectedPoints).toBeGreaterThanOrEqual(topEp - DEFAULT_RISK_PARAMS.diffEpWindow);
  });

  it("the safest pick prefers expected points among equal floors, not a shadow scoreline", () => {
    // Every home-win pick banks on every home win, so their floors tie
    // exactly; a 7-6 must never beat the real chalk on float noise.
    const rec = recommendPick(
      tightCandidates,
      tightField,
      tightComparison,
      RULES,
      standing({ posture: "neutral" }),
      DEFAULT_RISK_PARAMS,
    );
    expect(rec.safest.score).toEqual({ home: 1, away: 0 });
  });

  it("the safest pick maximizes the chance of banking something", () => {
    const rec = recommendPick(
      tightCandidates,
      tightField,
      tightComparison,
      RULES,
      standing({}),
      DEFAULT_RISK_PARAMS,
    );
    const topEp = Math.max(...rec.candidates.map((pick) => pick.expectedPoints));
    expect(rec.safest.expectedPoints).toBeGreaterThanOrEqual(
      topEp - DEFAULT_RISK_PARAMS.safetyEpWindow,
    );
    // Nothing in the near-top band should have a better floor.
    for (const pick of rec.candidates) {
      if (pick.expectedPoints >= topEp - DEFAULT_RISK_PARAMS.safetyEpWindow) {
        expect(rec.safest.pAnyPoints).toBeGreaterThanOrEqual(pick.pAnyPoints - 1e-12);
      }
    }
  });
});

describe("confidence", () => {
  it("a heavy favorite reads high and a spread coin flip reads low", () => {
    const heavy = calibrateDistribution(
      {
        outcome: devigMoneyline({ home: 1.22, draw: 6.5, away: 12.0 }).probabilities,
        totals: { line: 2.5 },
      },
      CONFIG,
    );
    const heavyComparison = buildComparisonDistribution(heavy, {
      basis: "ninetyMinutes",
      knockout: false,
      penaltiesCountAsWin: false,
      extraTime: DEFAULT_EXTRA_TIME,
    });
    const heavyRec = recommendPick(
      evaluateCandidates(heavyComparison, RULES),
      buildFieldPicks(heavy, DEFAULT_FIELD_CONFIG),
      heavyComparison,
      RULES,
      standing({}),
      DEFAULT_RISK_PARAMS,
    );
    expect(heavyRec.confidence.level).toBe("high");

    const flip = calibrateDistribution(
      {
        outcome: devigMoneyline({ home: 2.9, draw: 3.15, away: 2.9 }).probabilities,
        totals: { line: 3.5, pOver: 0.52 },
      },
      CONFIG,
    );
    const flipComparison = buildComparisonDistribution(flip, {
      basis: "ninetyMinutes",
      knockout: false,
      penaltiesCountAsWin: false,
      extraTime: DEFAULT_EXTRA_TIME,
    });
    const flipRec = recommendPick(
      evaluateCandidates(flipComparison, RULES),
      buildFieldPicks(flip, DEFAULT_FIELD_CONFIG),
      flipComparison,
      RULES,
      standing({}),
      DEFAULT_RISK_PARAMS,
    );
    expect(flipRec.confidence.level).toBe("low");
    expect(flipRec.confidence.outcomeConcentration).toBeLessThan(
      heavyRec.confidence.outcomeConcentration,
    );
  });
});
