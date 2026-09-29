import {
  auditCuratedDatasets,
  closedExhibitions,
  evaluateCuratedDataset,
  formatAuditReport,
} from "../auditCuratedData";

const NOW = new Date("2026-09-27T12:00:00Z");

function dataset(overrides: Partial<Parameters<typeof evaluateCuratedDataset>[0]> = {}) {
  return {
    surface: "travel-deals",
    asOf: "2026-09-01",
    verified: false,
    maxAgeDays: 30,
    issues: [],
    ...overrides,
  };
}

describe("evaluateCuratedDataset", () => {
  it("passes an unverified dataset that is inside its window and structurally sound", () => {
    expect(evaluateCuratedDataset(dataset(), NOW)).toMatchObject({
      verified: false,
      ageDays: 26,
      maxAgeDays: 30,
      status: "ok",
      needsReview: false,
    });
  });

  it("fails a dataset that is past its window", () => {
    expect(evaluateCuratedDataset(dataset({ asOf: "2026-08-01" }), NOW)).toMatchObject({
      ageDays: 57,
      status: "overdue",
      needsReview: true,
    });
  });

  it("fails a dataset with a structural issue even when it is fresh and verified", () => {
    expect(
      evaluateCuratedDataset(dataset({ verified: true, issues: ["duplicate region ids: a"] }), NOW)
    ).toMatchObject({ status: "invalid", needsReview: true });
  });

  it("fails a dataset whose as-of date cannot be read", () => {
    const result = evaluateCuratedDataset(dataset({ asOf: "last spring" }), NOW);
    expect(result).toMatchObject({ ageDays: null, status: "invalid", needsReview: true });
    expect(result.issues).toEqual(['as-of date "last spring" is not a date']);
  });

  it("reads a year and month as-of date from the first of that month", () => {
    expect(evaluateCuratedDataset(dataset({ asOf: "2026-06", maxAgeDays: 400 }), NOW)).toMatchObject({
      ageDays: 118,
      status: "ok",
    });
  });

  it("reports a finished event as archived however old it is", () => {
    expect(
      evaluateCuratedDataset(dataset({ asOf: "2026-03-17", verified: null, maxAgeDays: null }), NOW)
    ).toMatchObject({ ageDays: 194, maxAgeDays: null, status: "archived", needsReview: false });
  });
});

describe("closedExhibitions", () => {
  const exhibit = (id: string, startDate: string, endDate: string | null) => ({
    id,
    title: id,
    startDate,
    endDate,
    blurb: "",
    ticketed: false,
  });
  const snapshot = {
    generatedAt: "2026-04-28T06:00:00Z",
    museums: [
      {
        id: "m-a",
        exhibits: [
          exhibit("ran-at-review", "2026-04-21", "2026-08-03"),
          exhibit("upcoming-at-review", "2026-05-10", "2026-06-30"),
          exhibit("over-before-review", "2025-10-13", "2026-01-26"),
          exhibit("still-running", "2026-03-20", "2026-12-01"),
          exhibit("permanent", "2020-01-01", null),
        ],
      },
    ],
  };

  it("names the exhibitions that closed after the catalog was last reviewed", () => {
    expect(closedExhibitions(snapshot, NOW)).toEqual([
      "m-a/ran-at-review (closed 2026-08-03)",
      "m-a/upcoming-at-review (closed 2026-06-30)",
    ]);
  });

  it("finds nothing on the review date itself", () => {
    expect(closedExhibitions(snapshot, new Date("2026-04-28T23:00:00Z"))).toEqual([]);
  });
});

describe("auditCuratedDatasets", () => {
  it("covers the six curated surfaces and the three datasets kept outside the freshness policy", () => {
    expect(auditCuratedDatasets(NOW).map((result) => result.surface)).toEqual([
      "frontier-models",
      "tech-startups",
      "ai-dev-tools",
      "museum-log",
      "travel-deals",
      "food-map",
      "capital-market-assumptions",
      "rent-vs-buy-tax-constants",
      "march-madness-2026",
    ]);
  });

  it("never fails a dataset for being unverified", () => {
    for (const result of auditCuratedDatasets(NOW)) {
      const overdue =
        result.ageDays !== null && result.maxAgeDays !== null && result.ageDays > result.maxAgeDays;
      expect([result.surface, result.needsReview]).toEqual([
        result.surface,
        overdue || result.issues.length > 0,
      ]);
    }
  });

  it("keeps March Madness archived long after the tournament", () => {
    const result = auditCuratedDatasets(new Date("2030-01-01T00:00:00Z")).find(
      (entry) => entry.surface === "march-madness-2026"
    );
    expect(result).toMatchObject({ status: "archived", needsReview: false });
  });
});

describe("formatAuditReport", () => {
  const results = [
    evaluateCuratedDataset(dataset(), NOW),
    evaluateCuratedDataset(
      dataset({ surface: "museum-log", asOf: "2026-04-28T06:00:00Z", issues: ["no museums"] }),
      NOW
    ),
    evaluateCuratedDataset(
      dataset({ surface: "march-madness-2026", asOf: "2026-03-17", verified: null, maxAgeDays: null }),
      NOW
    ),
  ];

  it("prints one table row per dataset, the issues, and a summary", () => {
    expect(formatAuditReport(results, NOW)).toBe(
      [
        "## Curated data review, 2026-09-27",
        "",
        "| Dataset | As of | Age in days | Window in days | Status | Verified |",
        "| --- | --- | --- | --- | --- | --- |",
        "| travel-deals | 2026-09-01 | 26 | 30 | ok | no |",
        "| museum-log | 2026-04-28 | 152 | 30 | overdue, invalid | no |",
        "| march-madness-2026 | 2026-03-17 | 194 | none | archived | not tracked |",
        "",
        "### Issues",
        "",
        "- museum-log: no museums",
        "",
        "Review needed for 1 of 3: museum-log. A dataset fails on age or structure, and the Verified column is a label that never fails it.",
      ].join("\n")
    );
  });

  it("leaves out the issues section and the names when nothing needs review", () => {
    const report = formatAuditReport([results[0]], NOW);
    expect(report).toContain("Review needed for 0 of 1. A dataset fails");
    expect(report).not.toContain("### Issues");
  });
});
