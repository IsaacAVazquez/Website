import { targetStatus } from "../best-ball-build-panel";

describe("targetStatus", () => {
  it("reads a position's count against its range in words", () => {
    expect(targetStatus(0, 2, 3)).toEqual({ word: "2 short", tone: "ffb-muted" });
    expect(targetStatus(2, 2, 3)).toEqual({ word: "in range", tone: "ffb-good" });
    expect(targetStatus(3, 2, 3)).toEqual({ word: "in range", tone: "ffb-good" });
    expect(targetStatus(4, 2, 3)).toEqual({ word: "over by 1", tone: "ffb-bad" });
  });

  it("says nothing where the range has closed on the count", () => {
    // Late in a draft the model narrows the range onto what the roster holds.
    expect(targetStatus(7, 7, 7)).toBeNull();
    // A closed range the count has not reached still reads as short.
    expect(targetStatus(6, 7, 7)).toEqual({ word: "1 short", tone: "ffb-muted" });
  });
});
