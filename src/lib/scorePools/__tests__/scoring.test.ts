import { scorePick, DEFAULT_SCORING_RULES, type MatchResultInput, type ScoringRules } from "../index";

const rules90: ScoringRules = { ...DEFAULT_SCORING_RULES };
const rulesFinal: ScoringRules = { ...DEFAULT_SCORING_RULES, basis: "finalResult" };

describe("scoring a league game (3-1 home win)", () => {
  const result: MatchResultInput = { ninetyMinutes: { home: 3, away: 1 } };

  it("pays the exact score", () => {
    expect(scorePick({ home: 3, away: 1 }, result, rules90)).toEqual({
      points: 5,
      component: "exact",
    });
  });

  it("pays winner plus goal difference without the exact score", () => {
    expect(scorePick({ home: 2, away: 0 }, result, rules90)).toEqual({
      points: 3,
      component: "difference",
    });
  });

  it("pays the outcome alone when the difference misses", () => {
    expect(scorePick({ home: 1, away: 0 }, result, rules90)).toEqual({
      points: 2,
      component: "outcome",
    });
  });

  it("pays nothing for the wrong outcome", () => {
    expect(scorePick({ home: 1, away: 2 }, result, rules90).points).toBe(0);
    expect(scorePick({ home: 1, away: 1 }, result, rules90).points).toBe(0);
  });
});

describe("scoring draws", () => {
  const result: MatchResultInput = { ninetyMinutes: { home: 2, away: 2 } };

  it("a draw pick collects the difference tier on every draw, not only the exact one", () => {
    expect(scorePick({ home: 2, away: 2 }, result, rules90).points).toBe(5);
    expect(scorePick({ home: 1, away: 1 }, result, rules90).points).toBe(3);
    expect(scorePick({ home: 0, away: 0 }, result, rules90).points).toBe(3);
    expect(scorePick({ home: 3, away: 3 }, result, rules90).points).toBe(3);
  });

  it("a win pick earns nothing on a draw", () => {
    expect(scorePick({ home: 1, away: 0 }, result, rules90).points).toBe(0);
  });
});

describe("the 90-minute vs final-result basis (the knockout case)", () => {
  // 1-1 after 90 and after extra time, home side wins the shootout — the
  // game that kept scoring favorite picks zero all tournament.
  const decidedOnPens: MatchResultInput = {
    ninetyMinutes: { home: 1, away: 1 },
    afterExtraTime: { home: 1, away: 1 },
    penaltyWinner: "home",
  };

  it("under 90-minute scoring the game is a 1-1 draw, full stop", () => {
    expect(scorePick({ home: 1, away: 1 }, decidedOnPens, rules90).points).toBe(5);
    expect(scorePick({ home: 0, away: 0 }, decidedOnPens, rules90).points).toBe(3);
    // The favorite pick scores zero even though that team lifted the trophy.
    expect(scorePick({ home: 2, away: 1 }, decidedOnPens, rules90).points).toBe(0);
    expect(scorePick({ home: 1, away: 0 }, decidedOnPens, rules90).points).toBe(0);
  });

  it("under final-result scoring with penalties not counted, it is still a 1-1 draw", () => {
    expect(scorePick({ home: 1, away: 1 }, decidedOnPens, rulesFinal).points).toBe(5);
    expect(scorePick({ home: 2, away: 1 }, decidedOnPens, rulesFinal).points).toBe(0);
  });

  it("counting the shootout winner as the winner changes only the outcome tier", () => {
    const pensAsWin: ScoringRules = { ...rulesFinal, penaltiesCountAsWin: true };
    // Exact-score points still compare against the after-extra-time score.
    expect(scorePick({ home: 1, away: 1 }, decidedOnPens, pensAsWin).points).toBe(5);
    // A winner pick now collects the outcome tier via the shootout.
    expect(scorePick({ home: 2, away: 1 }, decidedOnPens, pensAsWin)).toEqual({
      points: 2,
      component: "outcome",
    });
    // Other draw picks lose the draw outcome, so they get nothing.
    expect(scorePick({ home: 0, away: 0 }, decidedOnPens, pensAsWin).points).toBe(0);
    // The wrong side of the shootout gets nothing.
    expect(scorePick({ home: 0, away: 1 }, decidedOnPens, pensAsWin).points).toBe(0);
  });

  it("a game decided in extra time splits by basis", () => {
    const decidedInEt: MatchResultInput = {
      ninetyMinutes: { home: 1, away: 1 },
      afterExtraTime: { home: 2, away: 1 },
    };
    // 90-minute pools score it as the 1-1 it was at the whistle.
    expect(scorePick({ home: 1, away: 1 }, decidedInEt, rules90).points).toBe(5);
    expect(scorePick({ home: 2, away: 1 }, decidedInEt, rules90).points).toBe(0);
    // Final-result pools compare against the 2-1 after extra time.
    expect(scorePick({ home: 2, away: 1 }, decidedInEt, rulesFinal).points).toBe(5);
    expect(scorePick({ home: 1, away: 0 }, decidedInEt, rulesFinal).points).toBe(3);
    expect(scorePick({ home: 3, away: 1 }, decidedInEt, rulesFinal).points).toBe(2);
    expect(scorePick({ home: 1, away: 1 }, decidedInEt, rulesFinal).points).toBe(0);
  });
});

describe("configurable point values", () => {
  it("honors custom tiers", () => {
    const custom: ScoringRules = {
      exact: 10,
      correctDifference: 4,
      correctOutcome: 1,
      basis: "ninetyMinutes",
      penaltiesCountAsWin: false,
    };
    const result: MatchResultInput = { ninetyMinutes: { home: 2, away: 0 } };
    expect(scorePick({ home: 2, away: 0 }, result, custom).points).toBe(10);
    expect(scorePick({ home: 3, away: 1 }, result, custom).points).toBe(4);
    expect(scorePick({ home: 1, away: 0 }, result, custom).points).toBe(1);
    expect(scorePick({ home: 0, away: 0 }, result, custom).points).toBe(0);
  });
});
