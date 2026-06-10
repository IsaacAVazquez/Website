import {
  buildEarthquakeHref,
  DEFAULT_EARTHQUAKE_STATE,
  normalizeEarthquakeState,
} from "../earthquake-state";

describe("earthquake-state", () => {
  it("normalizes invalid values back to the default route state", () => {
    expect(
      normalizeEarthquakeState({
        view: "bad-view",
        quake: "not a valid id!",
      })
    ).toEqual(DEFAULT_EARTHQUAKE_STATE);
  });

  it("preserves valid view and quake values", () => {
    expect(
      normalizeEarthquakeState({
        view: "significant",
        quake: "us7000n7yz",
      })
    ).toEqual({
      view: "significant",
      quake: "us7000n7yz",
    });
  });

  it("builds clean hrefs while preserving unrelated query params", () => {
    expect(
      buildEarthquakeHref(
        {
          view: "regions",
          quake: "ci40123456",
        },
        new URLSearchParams("ref=portfolio")
      )
    ).toBe("/earthquake-pulse?ref=portfolio&view=regions&quake=ci40123456");

    // The default view drops the `view` param; a null quake drops `quake`.
    expect(
      buildEarthquakeHref(
        DEFAULT_EARTHQUAKE_STATE,
        new URLSearchParams("ref=portfolio&view=regions&quake=ci40123456")
      )
    ).toBe("/earthquake-pulse?ref=portfolio");
  });
});
