import { starBars, languageShares } from "../star-log";

const repo = (
  id: string,
  weeklyStars: number,
  language: string | null = "TypeScript",
  weeklyStarsStatus = "measured"
) => ({ id, fullName: id, weeklyStars, language, weeklyStarsStatus }) as never;

it("scales bars to the biggest week and floors small positive ones", () => {
  const [big, small] = starBars([repo("big", 50000), repo("small", 300)]);
  expect(big.share).toBe(1);
  expect(small.share).toBeGreaterThanOrEqual(0.02);
});

it("gives no bar to flat or negative weeks", () => {
  expect(
    starBars([repo("a", 10), repo("flat", 0), repo("neg", -5)]).map((b) => b.share)
  ).toEqual([1, 0, 0]);
});

it("shares the week's stars by language and folds unknowns into Other", () => {
  expect(languageShares([repo("a", 30, "Go"), repo("b", 10, null)])).toEqual([
    { language: "Go", share: 0.75 },
    { language: "Other", share: 0.25 },
  ]);
});

it("handles an empty snapshot", () => {
  expect(starBars([])).toEqual([]);
  expect(languageShares([])).toEqual([]);
});
