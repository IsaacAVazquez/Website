import {
  SCORE_POOLS_INTERFACE_UPDATED_AT,
  getScorePoolsModifiedDate,
} from "../score-pools-metadata";

describe("score pools freshness metadata", () => {
  it("uses the interface update when the snapshot is older", () => {
    expect(getScorePoolsModifiedDate("2026-07-20T06:27:09.599Z")).toBe(
      SCORE_POOLS_INTERFACE_UPDATED_AT
    );
  });

  it("uses a newer snapshot date when the data advances", () => {
    expect(getScorePoolsModifiedDate("2026-07-24T06:27:09.599Z")).toBe(
      "2026-07-24"
    );
  });
});
