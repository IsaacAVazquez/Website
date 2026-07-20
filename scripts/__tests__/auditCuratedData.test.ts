import { auditCuratedDatasets } from "../auditCuratedData";

describe("auditCuratedDatasets", () => {
  it("keeps unverified or overdue editorial datasets in review", () => {
    const results = auditCuratedDatasets(new Date("2026-07-20T00:00:00Z"));
    expect(results.map((result) => result.surface)).toEqual([
      "frontier-models",
      "tech-startups",
      "ai-dev-tools",
      "museum-log",
      "travel-deals",
      "food-map",
    ]);
    expect(results.every((result) => result.needsReview)).toBe(true);
    expect(results.every((result) => result.issues.length === 0)).toBe(true);
  });
});
