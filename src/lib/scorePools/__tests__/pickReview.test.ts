import {
  capturePickReview,
  decodePickReview,
  scoreReviewedPick,
} from "../pickReview";
import { analyzePoolFixtures } from "../poolAnalysis";
import { createPool, decodeScorePoolsStore } from "../persistence";
import {
  fixture,
  league,
} from "@/app/score-pools/__tests__/fixtures/scorePoolsTestData";

it("keeps the save-time recommendation, odds, and rules when later settings change", () => {
  const pool = createPool("test-league", "My pool");
  const game = fixture();
  const item = analyzePoolFixtures(
    [game],
    league(),
    pool,
    new Date().toISOString(),
  ).analyzed[0];
  const review = capturePickReview(item, pool, league().generatedAt)!;
  expect(review.odds!.moneyline.home).toBe(2.1);
  pool.rules.exact = 99;
  const pick = review.recommended.score;
  expect(scoreReviewedPick(pick, { ninetyMinutes: pick }, review).chosen).toBe(
    5,
  );
  expect(decodePickReview(JSON.parse(JSON.stringify(review)))).toEqual(review);
  const store = decodeScorePoolsStore({
    version: 1,
    activePoolId: pool.id,
    pools: [
      {
        ...pool,
        submissions: {
          [game.id]: { score: pick, submittedAt: review.recordedAt, review },
        },
      },
    ],
  });
  expect(store!.pools[0].submissions[game.id].review).toEqual(review);
});

it("does not invent a pre-match reading for late or legacy picks", () => {
  const pool = createPool("test-league", "My pool");
  const game = fixture({
    status: "finished",
    result: {
      ninetyMinutes: { home: 1, away: 0 },
      afterExtraTime: null,
      penaltyWinner: null,
    },
  });
  const item = analyzePoolFixtures(
    [game],
    league(),
    pool,
    new Date().toISOString(),
  ).analyzed[0];
  expect(capturePickReview(item, pool, league().generatedAt)).toBeUndefined();
  expect(decodePickReview({ rules: {}, recommended: {} })).toBeUndefined();
  expect(decodePickReview(undefined)).toBeUndefined();
  expect(
    capturePickReview(
      { ...item, fixture: { ...game, status: "scheduled", result: null } },
      pool,
      league().generatedAt,
      item.analysis.locksAt,
    ),
  ).toBeUndefined();
});
