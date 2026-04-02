import {
  buildMissionControlHref,
  DEFAULT_MISSION_CONTROL_STATE,
  normalizeMissionControlState,
} from "./spacex-mission-control-state";

describe("spacex-mission-control-state", () => {
  it("normalizes invalid values back to defaults", () => {
    expect(
      normalizeMissionControlState({
        status: "bad",
        panel: "wrong",
        launch: "not-a-real-id",
      })
    ).toEqual(DEFAULT_MISSION_CONTROL_STATE);
  });

  it("preserves valid status, panel, and launch values", () => {
    expect(
      normalizeMissionControlState({
        status: "past",
        panel: "payloads",
        launch: "5eb87d46ffd86e000604b388",
      })
    ).toEqual({
      status: "past",
      panel: "payloads",
      launch: "5eb87d46ffd86e000604b388",
    });
  });

  it("omits default values when building hrefs and preserves explicit state", () => {
    expect(buildMissionControlHref(DEFAULT_MISSION_CONTROL_STATE)).toBe(
      "/spacex-mission-control"
    );
    expect(
      buildMissionControlHref({
        status: "past",
        launch: "5eb87d46ffd86e000604b388",
        panel: "links",
      })
    ).toBe(
      "/spacex-mission-control?status=past&launch=5eb87d46ffd86e000604b388&panel=links"
    );
  });
});
