import {
  emptyProgress,
  formatUnits,
  parseBlackjackProgress,
  percent,
  recordCountCheck,
  recordDecision,
  recordResults,
} from "../progress";

const now = new Date("2026-11-10T12:00:00.000Z");

describe("blackjack progress", () => {
  it("starts empty and falls back to empty on a malformed save", () => {
    expect(parseBlackjackProgress(null)).toEqual(emptyProgress());
    expect(parseBlackjackProgress("{not json")).toEqual(emptyProgress());
    expect(parseBlackjackProgress("[1,2]")).toEqual(emptyProgress());
  });

  it("repairs a save field by field", () => {
    const restored = parseBlackjackProgress(
      JSON.stringify({
        decisions: 10,
        correct: 99,
        hands: -4,
        wins: "3",
        losses: 2.9,
        netUnits: 1.26,
        countChecks: 4,
        countCorrect: 9,
        rulesId: "made-up",
        mistakes: [
          { situation: "Hard 16 against 10", chose: "stand", best: "surrender", count: 3, lastAt: "2026-11-01T00:00:00.000Z" },
          { situation: "Hard 12 against 2", chose: "stand", best: "hit", count: 5, lastAt: "bad date" },
          { situation: "", chose: "stand", best: "hit", count: 1 },
          { situation: "Soft 18 against 9", chose: "fold", best: "hit", count: 1 },
          { situation: "Hard 20 against 6", chose: "stand", best: "stand", count: 1 },
          "junk",
        ],
      }),
    );
    expect(restored.decisions).toBe(10);
    expect(restored.correct).toBe(10);
    expect(restored.hands).toBe(0);
    expect(restored.wins).toBe(0);
    expect(restored.losses).toBe(2);
    expect(restored.netUnits).toBe(1.3);
    expect(restored.countCorrect).toBe(4);
    expect(restored.rulesId).toBe("s17-3to2");
    expect(restored.mistakes.map((mistake) => mistake.situation)).toEqual([
      "Hard 12 against 2",
      "Hard 16 against 10",
    ]);
  });

  it("counts a correct decision without filing a mistake", () => {
    const next = recordDecision(emptyProgress(), { situation: "Hard 20 against 6", chose: "stand", best: "stand" }, now);
    expect(next).toMatchObject({ decisions: 1, correct: 1, mistakes: [] });
  });

  it("files a repeated mistake once and counts it", () => {
    const decision = { situation: "Hard 16 against 10", chose: "stand", best: "surrender" } as const;
    let progress = recordDecision(emptyProgress(), decision, now);
    progress = recordDecision(progress, decision, new Date("2026-11-11T12:00:00.000Z"));
    progress = recordDecision(progress, { situation: "Hard 12 against 2", chose: "stand", best: "hit" }, now);
    expect(progress).toMatchObject({ decisions: 3, correct: 0 });
    expect(progress.mistakes).toEqual([
      { ...decision, count: 2, lastAt: "2026-11-11T12:00:00.000Z" },
      { situation: "Hard 12 against 2", chose: "stand", best: "hit", count: 1, lastAt: now.toISOString() },
    ]);
  });

  it("keeps the thirty most repeated mistakes", () => {
    let progress = emptyProgress();
    for (let i = 0; i < 40; i += 1) {
      progress = recordDecision(progress, { situation: `Hard ${i} against 10`, chose: "stand", best: "hit" }, now);
    }
    expect(progress.mistakes).toHaveLength(30);
  });

  it("adds a settled round to the hand record in units", () => {
    const progress = recordResults(emptyProgress(), [
      { outcome: "blackjack", units: 1.5 },
      { outcome: "surrender", units: -0.5 },
      { outcome: "push", units: 0 },
      { outcome: "bust", units: -2 },
    ]);
    expect(progress).toMatchObject({ hands: 4, wins: 1, losses: 2, pushes: 1, netUnits: -1 });
  });

  it("counts counting checks and formats the readouts", () => {
    const progress = recordCountCheck(recordCountCheck(emptyProgress(), true), false);
    expect(progress).toMatchObject({ countChecks: 2, countCorrect: 1 });
    expect(percent(1, 2)).toBe(50);
    expect(percent(0, 0)).toBeNull();
    expect([formatUnits(2.5), formatUnits(0), formatUnits(-1.5)]).toEqual(["+2.5", "0", "-1.5"]);
  });
});
