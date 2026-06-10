import {
  buildMarchMadnessHref,
  DEFAULT_MARCH_MADNESS_STATE,
  normalizeMarchMadnessState,
} from "../march-madness-state";

describe("march-madness-state", () => {
  it("normalizes invalid route values to defaults", () => {
    expect(
      normalizeMarchMadnessState({
        view: "scoreboard",
        region: "north",
        analytics: "odds",
      })
    ).toEqual(DEFAULT_MARCH_MADNESS_STATE);
  });

  it("preserves valid view, region, and analytics params", () => {
    expect(
      normalizeMarchMadnessState({
        view: "analytics",
        region: "midwest",
        analytics: "s-curve",
      })
    ).toEqual({
      view: "analytics",
      region: "midwest",
      analytics: "s-curve",
    });
  });

  it("omits defaults and appends hash fragments when building hrefs", () => {
    expect(buildMarchMadnessHref()).toBe("/march-madness-2026");
    expect(
      buildMarchMadnessHref({
        view: "analytics",
        region: "west",
        analytics: "injuries",
        hash: "analysis-workspace",
      })
    ).toBe(
      "/march-madness-2026?view=analytics&region=west&analytics=injuries#analysis-workspace"
    );
  });
});
